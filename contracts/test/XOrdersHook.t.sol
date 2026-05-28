// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {HookMiner} from "v4-periphery/test/shared/HookMiner.sol";
import {XOrdersHook} from "../src/XOrdersHook.sol";

contract XOrdersHookTest is Test {
    XOrdersHook internal hook;
    MockERC20 internal token0;
    MockERC20 internal token1;

    function setUp() public {
        bytes memory constructorArgs = abi.encode(IPoolManager(address(0xBEEF)));
        (address expectedHook, bytes32 salt) = HookMiner.find(
            address(this),
            uint160(Hooks.AFTER_SWAP_FLAG),
            type(XOrdersHook).creationCode,
            constructorArgs
        );

        hook = new XOrdersHook{salt: salt}(IPoolManager(address(0xBEEF)));
        assertEq(address(hook), expectedHook);

        MockERC20 first = new MockERC20("Token A", "TKA", 18);
        MockERC20 second = new MockERC20("Token B", "TKB", 18);
        (token0, token1) = address(first) < address(second) ? (first, second) : (second, first);
    }

    function testPlaceOrderEscrowsTokens() public {
        uint128 amountIn = 10 ether;
        token1.mint(address(this), amountIn);
        token1.approve(address(hook), amountIn);

        uint256 orderId = hook.placeOrder(poolKey(address(hook)), XOrdersHook.OrderKind.StopLoss, false, amountIn, uint160(80 << 96), 2_500, 0);

        assertEq(orderId, 1);
        assertEq(token1.balanceOf(address(hook)), amountIn);
        assertEq(hook.getOwnerOrderCount(address(this)), 1);
        assertEq(hook.getPoolOrderCount(poolKey(address(hook)).toId()), 1);

        (
            address owner,
            ,
            ,
            ,
            ,
            XOrdersHook.OrderStatus status,
            ,
            uint128 storedAmount,
            uint128 remaining,
            ,
            ,
            ,
            ,
            ,
            ,
        ) = hook.orders(orderId);
        assertEq(owner, address(this));
        assertEq(uint8(status), uint8(XOrdersHook.OrderStatus.Open));
        assertEq(storedAmount, amountIn);
        assertEq(remaining, amountIn);
    }

    function testPlaceOrderRejectsPoolKeyForDifferentHook() public {
        uint128 amountIn = 1 ether;
        token1.mint(address(this), amountIn);
        token1.approve(address(hook), amountIn);

        vm.expectRevert(XOrdersHook.InvalidHook.selector);
        hook.placeOrder(poolKey(address(0x4040)), XOrdersHook.OrderKind.StopLoss, false, amountIn, uint160(80 << 96), 2_500, 0);
    }

    function testCancelOrderRefundsRemainingEscrow() public {
        uint128 amountIn = 3 ether;
        token1.mint(address(this), amountIn);
        token1.approve(address(hook), amountIn);

        uint256 orderId = hook.placeOrder(poolKey(address(hook)), XOrdersHook.OrderKind.TakeProfit, false, amountIn, uint160(120 << 96), 5_000, 0);
        hook.cancelOrder(orderId);

        assertEq(token1.balanceOf(address(this)), amountIn);
        assertEq(token1.balanceOf(address(hook)), 0);

        (
            ,
            ,
            ,
            ,
            ,
            XOrdersHook.OrderStatus status,
            ,
            uint128 storedAmount,
            uint128 remaining,
            ,
            ,
            ,
            ,
            ,
            ,
        ) = hook.orders(orderId);
        assertEq(uint8(status), uint8(XOrdersHook.OrderStatus.Cancelled));
        assertEq(storedAmount, amountIn);
        assertEq(remaining, 0);
    }

    function poolKey(address hooks) internal view returns (PoolKey memory) {
        return PoolKey({
            currency0: Currency.wrap(address(token0)),
            currency1: Currency.wrap(address(token1)),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(hooks)
        });
    }
}

contract MockERC20 {
    string public name;
    string public symbol;
    uint8 public immutable decimals;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory name_, string memory symbol_, uint8 decimals_) {
        name = name_;
        symbol = symbol_;
        decimals = decimals_;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) allowance[from][msg.sender] = allowed - amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}
