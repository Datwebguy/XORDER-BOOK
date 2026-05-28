// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {BalanceDelta} from "v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "v4-core/src/types/BeforeSwapDelta.sol";
import {StateLibrary} from "v4-core/src/libraries/StateLibrary.sol";
import {Currency} from "v4-core/src/types/Currency.sol";

import {IERC20Minimal} from "./IERC20Minimal.sol";
import {TransferLib} from "./TransferLib.sol";

/// @title XOrdersHook
/// @notice Stop-loss, take-profit, and trailing-stop trigger layer for Uniswap v4 pools.
/// @dev afterSwap marks escrowed orders as executable when the observed pool price crosses thresholds.
contract XOrdersHook is IHooks {
    using PoolIdLibrary for PoolKey;
    using StateLibrary for IPoolManager;
    using TransferLib for IERC20Minimal;

    enum OrderKind {
        StopLoss,
        TakeProfit,
        TrailingStop
    }

    enum OrderStatus {
        Open,
        Triggered,
        Filled,
        Cancelled
    }

    struct Order {
        address owner;
        address inputToken;
        address outputToken;
        PoolId poolId;
        OrderKind kind;
        OrderStatus status;
        bool zeroForOne;
        uint128 amountIn;
        uint128 remainingIn;
        uint128 triggeredIn;
        uint160 triggerPriceX96;
        uint160 bestPriceX96;
        uint16 maxFillBps;
        uint16 trailingBps;
        uint40 createdAt;
        uint40 updatedAt;
    }

    uint16 public constant BPS = 10_000;
    uint16 public constant DEFAULT_MAX_FILL_BPS = 2_500;
    uint256 public constant MAX_SCAN_PER_SWAP = 12;

    uint256 public nextOrderId = 1;

    mapping(uint256 orderId => Order order) public orders;
    mapping(PoolId poolId => uint256[] orderIds) public poolOrderIds;
    mapping(PoolId poolId => uint256 cursor) public poolScanCursor;
    mapping(address owner => uint256[] orderIds) public ownerOrderIds;

    event OrderPlaced(
        uint256 indexed orderId,
        address indexed owner,
        PoolId indexed poolId,
        OrderKind kind,
        bool zeroForOne,
        address inputToken,
        address outputToken,
        uint128 amountIn,
        uint160 triggerPriceX96,
        uint16 maxFillBps,
        uint16 trailingBps
    );
    event OrderTriggered(
        uint256 indexed orderId,
        address indexed owner,
        PoolId indexed poolId,
        uint128 triggeredAmount,
        uint160 observedPriceX96
    );
    event OrderFilled(
        uint256 indexed orderId,
        address indexed filler,
        uint128 inputAmount,
        address outputToken,
        uint256 outputAmount
    );
    event OrderCancelled(uint256 indexed orderId, address indexed owner, uint128 refundedAmount);
    event TrailingOrderAdjusted(uint256 indexed orderId, uint160 bestPriceX96, uint160 nextTriggerPriceX96);

    error InvalidAmount();
    error InvalidTokenForDirection();
    error InvalidFillBps();
    error InvalidOrder();
    error InvalidCaller();
    error OrderNotOpen();
    error OrderNotTriggered();
    error FillTooLarge();
    error NativeCurrencyUnsupported();
    error OnlyPoolManager();
    error InvalidOutputToken();
    error InsufficientOutput();
    error InvalidHook();

    IPoolManager public immutable poolManager;
    uint256 private constant Q96 = 1 << 96;

    modifier onlyPoolManager() {
        if (msg.sender != address(poolManager)) revert OnlyPoolManager();
        _;
    }

    constructor(IPoolManager _poolManager) {
        poolManager = _poolManager;
        Hooks.validateHookPermissions(IHooks(address(this)), getHookPermissions());
    }

    function getHookPermissions() public pure returns (Hooks.Permissions memory permissions) {
        permissions = Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: false,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    function beforeInitialize(address, PoolKey calldata, uint160) external pure returns (bytes4) {
        return IHooks.beforeInitialize.selector;
    }

    function afterInitialize(address, PoolKey calldata, uint160, int24) external pure returns (bytes4) {
        return IHooks.afterInitialize.selector;
    }

    function beforeAddLiquidity(
        address,
        PoolKey calldata,
        IPoolManager.ModifyLiquidityParams calldata,
        bytes calldata
    ) external pure returns (bytes4) {
        return IHooks.beforeAddLiquidity.selector;
    }

    function afterAddLiquidity(
        address,
        PoolKey calldata,
        IPoolManager.ModifyLiquidityParams calldata,
        BalanceDelta,
        BalanceDelta,
        bytes calldata
    ) external pure returns (bytes4, BalanceDelta) {
        return (IHooks.afterAddLiquidity.selector, BalanceDelta.wrap(0));
    }

    function beforeRemoveLiquidity(
        address,
        PoolKey calldata,
        IPoolManager.ModifyLiquidityParams calldata,
        bytes calldata
    ) external pure returns (bytes4) {
        return IHooks.beforeRemoveLiquidity.selector;
    }

    function afterRemoveLiquidity(
        address,
        PoolKey calldata,
        IPoolManager.ModifyLiquidityParams calldata,
        BalanceDelta,
        BalanceDelta,
        bytes calldata
    ) external pure returns (bytes4, BalanceDelta) {
        return (IHooks.afterRemoveLiquidity.selector, BalanceDelta.wrap(0));
    }

    function beforeSwap(
        address,
        PoolKey calldata,
        IPoolManager.SwapParams calldata,
        bytes calldata
    ) external pure returns (bytes4, BeforeSwapDelta, uint24) {
        return (IHooks.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    function afterSwap(
        address sender,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata hookData
    ) external onlyPoolManager returns (bytes4, int128) {
        return _afterSwap(sender, key, params, delta, hookData);
    }

    function beforeDonate(address, PoolKey calldata, uint256, uint256, bytes calldata) external pure returns (bytes4) {
        return IHooks.beforeDonate.selector;
    }

    function afterDonate(address, PoolKey calldata, uint256, uint256, bytes calldata) external pure returns (bytes4) {
        return IHooks.afterDonate.selector;
    }

    function placeOrder(
        PoolKey calldata key,
        OrderKind kind,
        bool zeroForOne,
        uint128 amountIn,
        uint160 triggerPriceX96,
        uint16 maxFillBps,
        uint16 trailingBps
    ) external returns (uint256 orderId) {
        if (amountIn == 0 || triggerPriceX96 == 0) revert InvalidAmount();
        if (maxFillBps == 0) maxFillBps = DEFAULT_MAX_FILL_BPS;
        if (maxFillBps > BPS) revert InvalidFillBps();
        if (kind == OrderKind.TrailingStop && trailingBps == 0) revert InvalidFillBps();
        if (address(key.hooks) != address(this)) revert InvalidHook();

        address inputToken = _currencyAddress(zeroForOne ? key.currency0 : key.currency1);
        address outputToken = _currencyAddress(zeroForOne ? key.currency1 : key.currency0);
        if (inputToken == address(0) || outputToken == address(0)) revert NativeCurrencyUnsupported();

        PoolId poolId = key.toId();
        orderId = nextOrderId++;

        orders[orderId] = Order({
            owner: msg.sender,
            inputToken: inputToken,
            outputToken: outputToken,
            poolId: poolId,
            kind: kind,
            status: OrderStatus.Open,
            zeroForOne: zeroForOne,
            amountIn: amountIn,
            remainingIn: amountIn,
            triggeredIn: 0,
            triggerPriceX96: triggerPriceX96,
            bestPriceX96: triggerPriceX96,
            maxFillBps: maxFillBps,
            trailingBps: trailingBps,
            createdAt: uint40(block.timestamp),
            updatedAt: uint40(block.timestamp)
        });

        poolOrderIds[poolId].push(orderId);
        ownerOrderIds[msg.sender].push(orderId);

        IERC20Minimal(inputToken).safeTransferFrom(msg.sender, address(this), amountIn);

        emit OrderPlaced(
            orderId,
            msg.sender,
            poolId,
            kind,
            zeroForOne,
            inputToken,
            outputToken,
            amountIn,
            triggerPriceX96,
            maxFillBps,
            trailingBps
        );
    }

    function cancelOrder(uint256 orderId) external {
        Order storage order = orders[orderId];
        if (order.owner == address(0)) revert InvalidOrder();
        if (order.owner != msg.sender) revert InvalidCaller();
        if (order.status == OrderStatus.Filled || order.status == OrderStatus.Cancelled) revert OrderNotOpen();

        uint128 refund = order.remainingIn;
        order.remainingIn = 0;
        order.triggeredIn = 0;
        order.status = OrderStatus.Cancelled;
        order.updatedAt = uint40(block.timestamp);

        IERC20Minimal(order.inputToken).safeTransfer(msg.sender, refund);
        emit OrderCancelled(orderId, msg.sender, refund);
    }

    /// @notice Atomic RFQ-style settlement for triggered slices.
    /// @dev The filler pays output tokens to the owner and receives escrowed input tokens.
    function settleTriggeredOrder(
        uint256 orderId,
        uint128 inputAmount,
        IERC20Minimal outputToken,
        uint256 outputAmount
    ) external {
        Order storage order = orders[orderId];
        if (order.owner == address(0)) revert InvalidOrder();
        if (order.status != OrderStatus.Triggered) revert OrderNotTriggered();
        if (inputAmount == 0 || inputAmount > order.triggeredIn) revert FillTooLarge();
        if (address(outputToken) != order.outputToken) revert InvalidOutputToken();
        if (outputAmount < _minimumOutput(order, inputAmount)) revert InsufficientOutput();

        order.triggeredIn -= inputAmount;
        order.remainingIn -= inputAmount;
        order.updatedAt = uint40(block.timestamp);

        if (order.remainingIn == 0) {
            order.status = OrderStatus.Filled;
        } else if (order.triggeredIn == 0) {
            order.status = OrderStatus.Open;
        }

        outputToken.safeTransferFrom(msg.sender, order.owner, outputAmount);
        IERC20Minimal(order.inputToken).safeTransfer(msg.sender, inputAmount);

        emit OrderFilled(orderId, msg.sender, inputAmount, address(outputToken), outputAmount);
    }

    function getPoolOrderCount(PoolId poolId) external view returns (uint256) {
        return poolOrderIds[poolId].length;
    }

    function getOwnerOrderCount(address owner) external view returns (uint256) {
        return ownerOrderIds[owner].length;
    }

    function _afterSwap(
        address,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata,
        BalanceDelta,
        bytes calldata
    ) internal returns (bytes4, int128) {
        PoolId poolId = key.toId();
        (uint160 sqrtPriceX96,,,) = poolManager.getSlot0(poolId);
        uint160 observedPriceX96 = _sqrtPriceToPriceX96(sqrtPriceX96);
        _scanPool(poolId, observedPriceX96);
        return (IHooks.afterSwap.selector, 0);
    }

    function _scanPool(PoolId poolId, uint160 observedPriceX96) internal {
        uint256[] storage ids = poolOrderIds[poolId];
        uint256 length = ids.length;
        if (length == 0) return;

        uint256 cursor = poolScanCursor[poolId];
        uint256 scans = length < MAX_SCAN_PER_SWAP ? length : MAX_SCAN_PER_SWAP;

        for (uint256 i = 0; i < scans; i++) {
            uint256 index = (cursor + i) % length;
            _maybeTrigger(ids[index], observedPriceX96);
        }

        poolScanCursor[poolId] = (cursor + scans) % length;
    }

    function _maybeTrigger(uint256 orderId, uint160 observedPriceX96) internal {
        Order storage order = orders[orderId];
        if (order.status != OrderStatus.Open || order.remainingIn == 0) return;

        if (order.kind == OrderKind.TrailingStop) {
            _adjustTrailingOrder(order, orderId, observedPriceX96);
        }

        if (!_crossed(order, observedPriceX96)) return;

        uint128 slice = uint128((uint256(order.remainingIn) * order.maxFillBps) / BPS);
        if (slice == 0) slice = order.remainingIn;
        if (slice > order.remainingIn) slice = order.remainingIn;

        order.triggeredIn += slice;
        order.status = OrderStatus.Triggered;
        order.updatedAt = uint40(block.timestamp);

        emit OrderTriggered(orderId, order.owner, order.poolId, slice, observedPriceX96);
    }

    function _adjustTrailingOrder(Order storage order, uint256 orderId, uint160 observedPriceX96) internal {
        if (order.zeroForOne) {
            if (observedPriceX96 > order.bestPriceX96) {
                order.bestPriceX96 = observedPriceX96;
                order.triggerPriceX96 = uint160((uint256(observedPriceX96) * (BPS - order.trailingBps)) / BPS);
                emit TrailingOrderAdjusted(orderId, order.bestPriceX96, order.triggerPriceX96);
            }
        } else if (observedPriceX96 < order.bestPriceX96) {
            order.bestPriceX96 = observedPriceX96;
            order.triggerPriceX96 = uint160((uint256(observedPriceX96) * (BPS + order.trailingBps)) / BPS);
            emit TrailingOrderAdjusted(orderId, order.bestPriceX96, order.triggerPriceX96);
        }
    }

    function _crossed(Order storage order, uint160 observedPriceX96) internal view returns (bool) {
        if (order.kind == OrderKind.StopLoss || order.kind == OrderKind.TrailingStop) {
            return order.zeroForOne ? observedPriceX96 <= order.triggerPriceX96 : observedPriceX96 >= order.triggerPriceX96;
        }
        return order.zeroForOne ? observedPriceX96 >= order.triggerPriceX96 : observedPriceX96 <= order.triggerPriceX96;
    }

    function _sqrtPriceToPriceX96(uint160 sqrtPriceX96) internal pure returns (uint160) {
        return uint160((uint256(sqrtPriceX96) * uint256(sqrtPriceX96)) >> 96);
    }

    function _minimumOutput(Order storage order, uint128 inputAmount) internal view returns (uint256) {
        if (order.zeroForOne) {
            return (uint256(inputAmount) * uint256(order.triggerPriceX96)) / Q96;
        }
        return (uint256(inputAmount) * Q96) / uint256(order.triggerPriceX96);
    }

    function _currencyAddress(Currency currency) internal pure returns (address token) {
        token = Currency.unwrap(currency);
    }
}
