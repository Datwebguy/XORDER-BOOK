// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {XOrdersHook} from "../src/XOrdersHook.sol";
import {IERC20Minimal} from "../src/IERC20Minimal.sol";

contract SettleTriggeredOrder is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        XOrdersHook hook = XOrdersHook(vm.envAddress("XORDERS_HOOK"));
        address outputToken = vm.envAddress("TOKEN0");
        uint256 orderId = vm.envOr("SETTLE_ORDER_ID", uint256(3));
        uint128 inputAmount = uint128(vm.envOr("SETTLE_INPUT_AMOUNT", uint256(250_000_000_000_000)));
        uint256 outputAmount = vm.envOr("SETTLE_OUTPUT_AMOUNT", uint256(22_000));

        vm.startBroadcast(deployerKey);
        IERC20Minimal(outputToken).approve(address(hook), outputAmount);
        hook.settleTriggeredOrder(orderId, inputAmount, IERC20Minimal(outputToken), outputAmount);
        vm.stopBroadcast();

        console2.log("Settled triggered XOrder slice");
        console2.log("orderId:", orderId);
        console2.log("inputAmount:", inputAmount);
        console2.log("outputAmount:", outputAmount);
    }
}
