// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";

contract CreatePool is Script {
    using PoolIdLibrary for PoolKey;

    error InvalidTokenOrder();

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        IPoolManager manager = IPoolManager(vm.envAddress("POOL_MANAGER"));
        address hook = vm.envAddress("XORDERS_HOOK");
        address token0 = vm.envAddress("TOKEN0");
        address token1 = vm.envAddress("TOKEN1");
        uint24 fee = uint24(vm.envUint("POOL_FEE"));
        int24 tickSpacing = int24(vm.envInt("TICK_SPACING"));
        uint160 sqrtPriceX96 = uint160(vm.envUint("SQRT_PRICE_X96"));

        if (token0 >= token1) revert InvalidTokenOrder();

        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: fee,
            tickSpacing: tickSpacing,
            hooks: IHooks(hook)
        });

        vm.startBroadcast(deployerKey);
        int24 tick = manager.initialize(key, sqrtPriceX96);
        vm.stopBroadcast();

        PoolId poolId = key.toId();
        console2.log("Pool initialized with XOrders hook");
        console2.log("token0:", token0);
        console2.log("token1:", token1);
        console2.log("hook:", hook);
        console2.log("initial tick:", tick);
        console2.log("pool id:");
        console2.logBytes32(PoolId.unwrap(poolId));
    }
}
