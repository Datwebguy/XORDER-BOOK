// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {XOrdersHook} from "../src/XOrdersHook.sol";
import {IERC20Minimal} from "../src/IERC20Minimal.sol";

interface IWOKB is IERC20Minimal {
    function deposit() external payable;
}

contract PlaceWokbOrder is Script {
    uint256 internal constant Q96 = 1 << 96;

    function run() external returns (uint256 orderId) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address hookAddress = vm.envAddress("XORDERS_HOOK");
        address token0 = vm.envAddress("TOKEN0");
        address token1 = vm.envAddress("TOKEN1");
        uint24 fee = uint24(vm.envUint("POOL_FEE"));
        int24 tickSpacing = int24(vm.envInt("TICK_SPACING"));

        uint256 amountIn = vm.envOr("ORDER_AMOUNT_WEI", uint256(0.001 ether));
        uint256 triggerUsd = vm.envOr("ORDER_TRIGGER_USD", uint256(80));

        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: fee,
            tickSpacing: tickSpacing,
            hooks: IHooks(hookAddress)
        });

        uint160 triggerPriceX96 = uint160((Q96 * 1e12) / triggerUsd);

        vm.startBroadcast(deployerKey);
        IWOKB(token1).deposit{value: amountIn}();
        IWOKB(token1).approve(hookAddress, amountIn);
        orderId = XOrdersHook(hookAddress).placeOrder(
            key,
            XOrdersHook.OrderKind.StopLoss,
            false,
            uint128(amountIn),
            triggerPriceX96,
            2_500,
            0
        );
        vm.stopBroadcast();

        console2.log("Placed real WOKB stop-loss order");
        console2.log("orderId:", orderId);
        console2.log("amountIn:", amountIn);
        console2.log("trigger USDT per WOKB:", triggerUsd);
        console2.log("trigger priceX96:", triggerPriceX96);
    }
}
