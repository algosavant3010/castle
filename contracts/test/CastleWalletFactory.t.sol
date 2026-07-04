// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/CastleWalletFactory.sol";
import "../src/CastleWallet.sol";

contract CastleWalletFactoryTest is Test {
    CastleWalletFactory public factory;

    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");

    function setUp() public {
        factory = new CastleWalletFactory();
    }

    function test_DeployWallet() public {
        vm.prank(user1);
        address wallet = factory.deployWallet();

        assertTrue(wallet != address(0));
        assertEq(CastleWallet(payable(wallet)).owner(), user1);
        assertEq(factory.getWalletCount(user1), 1);
    }

    function test_DeployMultipleWallets() public {
        vm.prank(user1);
        address wallet1 = factory.deployWallet();

        vm.prank(user1);
        address wallet2 = factory.deployWallet();

        vm.prank(user1);
        address wallet3 = factory.deployWallet();

        assertEq(factory.getWalletCount(user1), 3);

        address[] memory wallets = factory.getWallets(user1);
        assertEq(wallets.length, 3);
        assertEq(wallets[0], wallet1);
        assertEq(wallets[1], wallet2);
        assertEq(wallets[2], wallet3);

        // Each wallet is unique
        assertTrue(wallet1 != wallet2);
        assertTrue(wallet2 != wallet3);
    }

    function test_DifferentUsersIndependent() public {
        vm.prank(user1);
        address wallet1 = factory.deployWallet();

        vm.prank(user2);
        address wallet2 = factory.deployWallet();

        // Each user has their own wallet list
        assertEq(factory.getWalletCount(user1), 1);
        assertEq(factory.getWalletCount(user2), 1);

        address[] memory user1Wallets = factory.getWallets(user1);
        address[] memory user2Wallets = factory.getWallets(user2);

        assertEq(user1Wallets[0], wallet1);
        assertEq(user2Wallets[0], wallet2);

        // Owner is correct
        assertEq(CastleWallet(payable(wallet1)).owner(), user1);
        assertEq(CastleWallet(payable(wallet2)).owner(), user2);
    }

    function test_GetAllWallets() public {
        vm.prank(user1);
        address wallet1 = factory.deployWallet();

        vm.prank(user2);
        address wallet2 = factory.deployWallet();

        vm.prank(user1);
        address wallet3 = factory.deployWallet();

        address[] memory all = factory.getAllWallets();
        assertEq(all.length, 3);
        assertEq(all[0], wallet1);
        assertEq(all[1], wallet2);
        assertEq(all[2], wallet3);
        assertEq(factory.getTotalWalletCount(), 3);
    }

    function test_EmptyWalletList() public view {
        address[] memory wallets = factory.getWallets(user1);
        assertEq(wallets.length, 0);
        assertEq(factory.getWalletCount(user1), 0);
    }

    function test_DeployedWalletIsFunctional() public {
        vm.deal(user1, 10 ether);

        vm.prank(user1);
        address wallet = factory.deployWallet();

        // Fund the wallet
        vm.prank(user1);
        (bool success,) = wallet.call{value: 5 ether}("");
        assertTrue(success);
        assertEq(wallet.balance, 5 ether);

        // Owner can emergency withdraw
        vm.prank(user1);
        CastleWallet(payable(wallet)).emergencyWithdraw(user1);
        assertEq(wallet.balance, 0);
    }

    function test_EmitsWalletDeployedEvent() public {
        vm.prank(user1);
        vm.expectEmit(true, false, false, false);
        emit CastleWalletFactory.WalletDeployed(user1, address(0)); // address unknown before deploy
        factory.deployWallet();
    }
}
