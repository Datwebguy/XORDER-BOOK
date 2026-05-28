// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {IUnlockCallback} from "v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {BalanceDelta} from "v4-core/src/types/BalanceDelta.sol";
import {TickMath} from "v4-core/src/libraries/TickMath.sol";
import {CurrencySettler} from "v4-core/test/utils/CurrencySettler.sol";
import {IERC20Minimal} from "../src/IERC20Minimal.sol";

contract ExecuteV4Swap is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        IPoolManager manager = IPoolManager(vm.envAddress("POOL_MANAGER"));
        address hook = vm.envAddress("XORDERS_HOOK");
        address token0 = vm.envAddress("TOKEN0");
        address token1 = vm.envAddress("TOKEN1");
        uint24 fee = uint24(vm.envUint("POOL_FEE"));
        int24 tickSpacing = int24(vm.envInt("TICK_SPACING"));
        uint256 amountIn = vm.envOr("SWAP_AMOUNT_IN", uint256(1_000_000_000_000_000));
        bool zeroForOne = vm.envOr("SWAP_ZERO_FOR_ONE", false);

        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: fee,
            tickSpacing: tickSpacing,
            hooks: IHooks(hook)
        });

        uint160 priceLimit = zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1;
        address input = zeroForOne ? token0 : token1;

        vm.startBroadcast(deployerKey);
        V4DirectSwap router = new V4DirectSwap(manager);
        IERC20Minimal(input).approve(address(router), amountIn);
        router.swap(key, IPoolManager.SwapParams({
            zeroForOne: zeroForOne,
            amountSpecified: -int256(amountIn),
            sqrtPriceLimitX96: priceLimit
        }));
        vm.stopBroadcast();

        console2.log("Executed v4 exact-input swap");
        console2.log("router:", address(router));
        console2.log("amountIn:", amountIn);
        console2.log("zeroForOne:", zeroForOne);
    }
}

contract V4DirectSwap is IUnlockCallback {
    using CurrencySettler for Currency;

    IPoolManager public immutable manager;

    struct CallbackData {
        address sender;
        PoolKey key;
        IPoolManager.SwapParams params;
    }

    constructor(IPoolManager _manager) {
        manager = _manager;
    }

    function swap(PoolKey memory key, IPoolManager.SwapParams memory params) external {
        manager.unlock(abi.encode(CallbackData(msg.sender, key, params)));
    }

    function unlockCallback(bytes calldata rawData) external returns (bytes memory) {
        require(msg.sender == address(manager), "not manager");

        CallbackData memory data = abi.decode(rawData, (CallbackData));
        BalanceDelta delta = manager.swap(data.key, data.params, "");

        if (data.params.zeroForOne) {
            data.key.currency0.settle(manager, data.sender, uint256(uint128(-delta.amount0())), false);
            data.key.currency1.take(manager, data.sender, uint256(uint128(delta.amount1())), false);
        } else {
            data.key.currency1.settle(manager, data.sender, uint256(uint128(-delta.amount1())), false);
            data.key.currency0.take(manager, data.sender, uint256(uint128(delta.amount0())), false);
        }

        return "";
    }
}
