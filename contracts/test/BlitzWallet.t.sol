// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/BlitzWallet.sol";

// Mock target contract for testing
contract MockEscrow {
    event TaskAccepted(uint256 taskId);
    event WorkSubmitted(uint256 taskId, string uri);

    function acceptTask(uint256 taskId) external payable {
        emit TaskAccepted(taskId);
    }

    function submitWork(uint256 taskId, string calldata uri) external {
        emit WorkSubmitted(taskId, uri);
    }

    function maliciousFunction() external {
        // This should never be callable by a scoped session key
    }
}

contract BlitzWalletTest is Test {
    BlitzWallet public wallet;
    MockEscrow public escrow;

    address public owner = makeAddr("owner");
    address public sessionKey = makeAddr("sessionKey");
    address public attacker = makeAddr("attacker");

    bytes4 public acceptTaskSelector = MockEscrow.acceptTask.selector;
    bytes4 public submitWorkSelector = MockEscrow.submitWork.selector;

    function setUp() public {
        vm.deal(owner, 100 ether);

        vm.prank(owner);
        wallet = new BlitzWallet(owner);

        escrow = new MockEscrow();

        // Fund the wallet
        vm.prank(owner);
        (bool success, ) = address(wallet).call{value: 50 ether}("");
        require(success);
    }

    // --- Registration Tests ---

    function test_RegisterSessionKey() public {
        bytes4[] memory fns = new bytes4[](2);
        fns[0] = acceptTaskSelector;
        fns[1] = submitWorkSelector;

        vm.prank(owner);
        wallet.registerSessionKey(
            sessionKey,
            block.timestamp + 24 hours,
            5 ether, // 5 MON daily cap
            address(escrow),
            fns
        );

        (uint256 expiry, uint256 dailyCap, , , address target, bytes4[] memory allowedFns, bool active) =
            wallet.getSessionPolicy(sessionKey);

        assertEq(expiry, block.timestamp + 24 hours);
        assertEq(dailyCap, 5 ether);
        assertEq(target, address(escrow));
        assertEq(allowedFns.length, 2);
        assertEq(allowedFns[0], acceptTaskSelector);
        assertEq(allowedFns[1], submitWorkSelector);
        assertTrue(active);
        assertEq(wallet.getActiveKeyCount(), 1);
    }

    function test_RegisterSessionKey_RevertNotOwner() public {
        bytes4[] memory fns = new bytes4[](1);
        fns[0] = acceptTaskSelector;

        vm.prank(attacker);
        vm.expectRevert("BlitzWallet: not owner");
        wallet.registerSessionKey(sessionKey, block.timestamp + 1 hours, 1 ether, address(escrow), fns);
    }

    function test_RegisterSessionKey_RevertZeroKey() public {
        bytes4[] memory fns = new bytes4[](1);
        fns[0] = acceptTaskSelector;

        vm.prank(owner);
        vm.expectRevert("BlitzWallet: zero key");
        wallet.registerSessionKey(address(0), block.timestamp + 1 hours, 1 ether, address(escrow), fns);
    }

    function test_RegisterSessionKey_RevertExpiredExpiry() public {
        bytes4[] memory fns = new bytes4[](1);
        fns[0] = acceptTaskSelector;

        vm.prank(owner);
        vm.expectRevert("BlitzWallet: expiry in past");
        wallet.registerSessionKey(sessionKey, block.timestamp - 1, 1 ether, address(escrow), fns);
    }

    function test_RegisterSessionKey_RevertDuplicateKey() public {
        bytes4[] memory fns = new bytes4[](1);
        fns[0] = acceptTaskSelector;

        vm.prank(owner);
        wallet.registerSessionKey(sessionKey, block.timestamp + 1 hours, 1 ether, address(escrow), fns);

        vm.prank(owner);
        vm.expectRevert("BlitzWallet: key already active");
        wallet.registerSessionKey(sessionKey, block.timestamp + 2 hours, 2 ether, address(escrow), fns);
    }

    // --- Execution Tests ---

    function test_ExecuteAsAgent_Success() public {
        _registerDefaultKey();

        bytes memory callData = abi.encodeWithSelector(acceptTaskSelector, uint256(1));

        vm.prank(sessionKey);
        wallet.executeAsAgent(address(escrow), 0, callData);
    }

    function test_ExecuteAsAgent_WithValue() public {
        _registerDefaultKey();

        bytes memory callData = abi.encodeWithSelector(acceptTaskSelector, uint256(1));

        vm.prank(sessionKey);
        wallet.executeAsAgent(address(escrow), 1 ether, callData);

        // Verify spend tracking
        (, , uint256 spentToday, , , , ) = wallet.getSessionPolicy(sessionKey);
        assertEq(spentToday, 1 ether);
    }

    function test_ExecuteAsAgent_RevertNotActive() public {
        bytes memory callData = abi.encodeWithSelector(acceptTaskSelector, uint256(1));

        vm.prank(sessionKey);
        vm.expectRevert("BlitzWallet: key not active");
        wallet.executeAsAgent(address(escrow), 0, callData);
    }

    function test_ExecuteAsAgent_RevertExpired() public {
        _registerDefaultKey();

        // Warp past expiry
        vm.warp(block.timestamp + 25 hours);

        bytes memory callData = abi.encodeWithSelector(acceptTaskSelector, uint256(1));

        vm.prank(sessionKey);
        vm.expectRevert("BlitzWallet: key expired");
        wallet.executeAsAgent(address(escrow), 0, callData);
    }

    function test_ExecuteAsAgent_RevertUnauthorizedTarget() public {
        _registerDefaultKey();

        address fakeTarget = makeAddr("fakeTarget");
        bytes memory callData = abi.encodeWithSelector(acceptTaskSelector, uint256(1));

        vm.prank(sessionKey);
        vm.expectRevert("BlitzWallet: unauthorized target");
        wallet.executeAsAgent(fakeTarget, 0, callData);
    }

    function test_ExecuteAsAgent_RevertUnauthorizedFunction() public {
        _registerDefaultKey();

        bytes memory callData = abi.encodeWithSelector(MockEscrow.maliciousFunction.selector);

        vm.prank(sessionKey);
        vm.expectRevert("BlitzWallet: unauthorized function");
        wallet.executeAsAgent(address(escrow), 0, callData);
    }

    function test_ExecuteAsAgent_RevertDailyCapExceeded() public {
        _registerDefaultKey();

        bytes memory callData = abi.encodeWithSelector(acceptTaskSelector, uint256(1));

        // First call uses 4 ether (under 5 cap)
        vm.prank(sessionKey);
        wallet.executeAsAgent(address(escrow), 4 ether, callData);

        // Second call tries 2 more ether (would total 6, over 5 cap)
        vm.prank(sessionKey);
        vm.expectRevert("BlitzWallet: daily cap exceeded");
        wallet.executeAsAgent(address(escrow), 2 ether, callData);
    }

    function test_ExecuteAsAgent_RollingWindowResets() public {
        // Register with a longer expiry so key is still valid after 25h warp
        bytes4[] memory fns = new bytes4[](2);
        fns[0] = acceptTaskSelector;
        fns[1] = submitWorkSelector;

        vm.prank(owner);
        wallet.registerSessionKey(
            sessionKey,
            block.timestamp + 48 hours, // longer expiry
            5 ether,
            address(escrow),
            fns
        );

        bytes memory callData = abi.encodeWithSelector(acceptTaskSelector, uint256(1));

        // Spend 4 ether
        vm.prank(sessionKey);
        wallet.executeAsAgent(address(escrow), 4 ether, callData);

        // Warp past 24h (but still within 48h expiry)
        vm.warp(block.timestamp + 25 hours);

        // Should be able to spend again (window reset)
        vm.prank(sessionKey);
        wallet.executeAsAgent(address(escrow), 4 ether, callData);

        (, , uint256 spentToday, , , , ) = wallet.getSessionPolicy(sessionKey);
        assertEq(spentToday, 4 ether); // Reset then spent 4
    }

    function test_ExecuteAsAgent_RevertNonRegisteredCaller() public {
        _registerDefaultKey();

        bytes memory callData = abi.encodeWithSelector(acceptTaskSelector, uint256(1));

        vm.prank(attacker);
        vm.expectRevert("BlitzWallet: key not active");
        wallet.executeAsAgent(address(escrow), 0, callData);
    }

    // --- Freeze Tests ---

    function test_FreezeAgent() public {
        _registerDefaultKey();

        // Register a second key
        address secondKey = makeAddr("secondKey");
        bytes4[] memory fns = new bytes4[](1);
        fns[0] = acceptTaskSelector;
        vm.prank(owner);
        wallet.registerSessionKey(secondKey, block.timestamp + 24 hours, 5 ether, address(escrow), fns);

        assertEq(wallet.getActiveKeyCount(), 2);

        // Freeze
        vm.prank(owner);
        wallet.freezeAgent();

        assertEq(wallet.getActiveKeyCount(), 0);

        // Both keys should be inactive
        (, , , , , , bool active1) = wallet.getSessionPolicy(sessionKey);
        (, , , , , , bool active2) = wallet.getSessionPolicy(secondKey);
        assertFalse(active1);
        assertFalse(active2);
    }

    function test_FreezeAgent_SubsequentCallsRevert() public {
        _registerDefaultKey();

        vm.prank(owner);
        wallet.freezeAgent();

        bytes memory callData = abi.encodeWithSelector(acceptTaskSelector, uint256(1));

        vm.prank(sessionKey);
        vm.expectRevert("BlitzWallet: key not active");
        wallet.executeAsAgent(address(escrow), 0, callData);
    }

    function test_FreezeAgent_RevertNotOwner() public {
        vm.prank(attacker);
        vm.expectRevert("BlitzWallet: not owner");
        wallet.freezeAgent();
    }

    // --- Emergency Withdraw Tests ---

    function test_EmergencyWithdraw() public {
        uint256 walletBalance = address(wallet).balance;
        uint256 ownerBalanceBefore = owner.balance;

        vm.prank(owner);
        wallet.emergencyWithdraw(owner);

        assertEq(address(wallet).balance, 0);
        assertEq(owner.balance, ownerBalanceBefore + walletBalance);
    }

    function test_EmergencyWithdraw_RevertNotOwner() public {
        vm.prank(attacker);
        vm.expectRevert("BlitzWallet: not owner");
        wallet.emergencyWithdraw(attacker);
    }

    function test_EmergencyWithdraw_RevertNoBalance() public {
        // Deploy a new empty wallet
        vm.prank(owner);
        BlitzWallet emptyWallet = new BlitzWallet(owner);

        vm.prank(owner);
        vm.expectRevert("BlitzWallet: no balance");
        emptyWallet.emergencyWithdraw(owner);
    }

    function test_EmergencyWithdraw_RevertZeroRecipient() public {
        vm.prank(owner);
        vm.expectRevert("BlitzWallet: zero recipient");
        wallet.emergencyWithdraw(address(0));
    }

    // --- Receive Tests ---

    function test_ReceiveETH() public {
        uint256 balanceBefore = address(wallet).balance;

        vm.prank(owner);
        (bool success, ) = address(wallet).call{value: 1 ether}("");
        assertTrue(success);

        assertEq(address(wallet).balance, balanceBefore + 1 ether);
    }

    // --- Helper ---

    function _registerDefaultKey() internal {
        bytes4[] memory fns = new bytes4[](2);
        fns[0] = acceptTaskSelector;
        fns[1] = submitWorkSelector;

        vm.prank(owner);
        wallet.registerSessionKey(
            sessionKey,
            block.timestamp + 24 hours,
            5 ether,
            address(escrow),
            fns
        );
    }
}
