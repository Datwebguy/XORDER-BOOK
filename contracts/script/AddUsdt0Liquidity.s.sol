// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {TickMath} from "v4-core/src/libraries/TickMath.sol";
import {LiquidityAmounts} from "v4-core/test/utils/LiquidityAmounts.sol";
import {IPositionManager} from "v4-periphery/src/interfaces/IPositionManager.sol";
import {Actions} from "v4-periphery/src/libraries/Actions.sol";
import {IAllowanceTransfer} from "permit2/src/interfaces/IAllowanceTransfer.sol";
import {IERC20Minimal} from "../src/IERC20Minimal.sol";

interface IPositionManagerPermit2 {
    function permit2() external view returns (IAllowanceTransfer);
}

contract AddUsdt0Liquidity is Script {
    function run() external returns (uint128 liquidity) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address positionManager = vm.envAddress("POSITION_MANAGER");
        address hook = vm.envAddress("XORDERS_HOOK");
        address token0 = vm.envAddress("TOKEN0");
        address token1 = vm.envAddress("TOKEN1");
        uint24 fee = uint24(vm.envUint("POOL_FEE"));
        int24 tickSpacing = int24(vm.envInt("TICK_SPACING"));
        uint160 sqrtPriceX96 = uint160(vm.envUint("SQRT_PRICE_X96"));

        uint256 amount0Max = vm.envOr("LP_AMOUNT0_MAX", uint256(6_000_000));
        uint256 amount1Max = vm.envOr("LP_AMOUNT1_MAX", uint256(68_000_000_000_000_000));
        int24 tickLower = int24(vm.envOr("LP_TICK_LOWER", int256(228_000)));
        int24 tickUpper = int24(vm.envOr("LP_TICK_UPPER", int256(235_020)));

        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: fee,
            tickSpacing: tickSpacing,
            hooks: IHooks(hook)
        });

        liquidity = LiquidityAmounts.getLiquidityForAmounts(
            sqrtPriceX96,
            TickMath.getSqrtPriceAtTick(tickLower),
            TickMath.getSqrtPriceAtTick(tickUpper),
            amount0Max,
            amount1Max
        );
        require(liquidity > 0, "zero liquidity");

        address permit2 = address(IPositionManagerPermit2(positionManager).permit2());
        bytes memory actions = abi.encodePacked(bytes1(uint8(Actions.MINT_POSITION)), bytes1(uint8(Actions.SETTLE_PAIR)));
        bytes[] memory params = new bytes[](2);
        params[0] = abi.encode(key, tickLower, tickUpper, uint256(liquidity), uint128(amount0Max), uint128(amount1Max), msg.sender, bytes(""));
        params[1] = abi.encode(key.currency0, key.currency1);

        vm.startBroadcast(deployerKey);
        IERC20Minimal(token0).approve(permit2, amount0Max);
        IERC20Minimal(token1).approve(permit2, amount1Max);
        IAllowanceTransfer(permit2).approve(token0, positionManager, uint160(amount0Max), uint48(block.timestamp + 30 days));
        IAllowanceTransfer(permit2).approve(token1, positionManager, uint160(amount1Max), uint48(block.timestamp + 30 days));
        IPositionManager(positionManager).modifyLiquidities(abi.encode(actions, params), block.timestamp + 20 minutes);
        vm.stopBroadcast();

        console2.log("Minted WOKB/USDT0 v4 liquidity");
        console2.log("liquidity:", liquidity);
        console2.log("amount0 max:", amount0Max);
        console2.log("amount1 max:", amount1Max);
        console2.log("tickLower:", tickLower);
        console2.log("tickUpper:", tickUpper);
        console2.log("permit2:", permit2);
    }
}
