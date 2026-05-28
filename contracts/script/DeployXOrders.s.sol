// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {HookMiner} from "v4-periphery/test/shared/HookMiner.sol";
import {XOrdersHook} from "../src/XOrdersHook.sol";

contract DeployXOrders is Script {
    address internal constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

    function run() external returns (XOrdersHook hook) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        IPoolManager poolManager = IPoolManager(vm.envAddress("POOL_MANAGER"));

        uint160 flags = uint160(Hooks.AFTER_SWAP_FLAG);
        bytes memory constructorArgs = abi.encode(poolManager);
        bytes memory creationCode = abi.encodePacked(type(XOrdersHook).creationCode, constructorArgs);

        (address hookAddress, bytes32 salt) = HookMiner.find(
            CREATE2_DEPLOYER,
            flags,
            type(XOrdersHook).creationCode,
            constructorArgs
        );

        vm.startBroadcast(deployerKey);
        hook = new XOrdersHook{salt: salt}(poolManager);
        vm.stopBroadcast();

        require(address(hook) == hookAddress, "unexpected hook address");
        console2.log("XOrdersHook:", address(hook));
        console2.log("salt:");
        console2.logBytes32(salt);
        console2.logBytes(creationCode);
    }
}
