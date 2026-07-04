// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/CastleEscrow.sol";

contract CastleEscrowTest is Test {
    CastleEscrow public escrow;

    address public buyer = makeAddr("buyer");
    address public worker = makeAddr("worker");
    address public outsider = makeAddr("outsider");

    uint256 public constant REWARD = 1 ether;
    uint256 public deadline;

    function setUp() public {
        escrow = new CastleEscrow();
        vm.deal(buyer, 100 ether);
        vm.deal(worker, 10 ether);
        deadline = block.timestamp + 7 days;
    }

    // --- Create Task Tests ---

    function test_CreateTask() public {
        vm.prank(buyer);
        uint256 taskId = escrow.createTask{value: REWARD}("ipfs://spec123", deadline);

        assertEq(taskId, 0);
        assertEq(escrow.taskCount(), 1);

        (address b, address w, uint256 r, string memory spec, , CastleEscrow.Status s, uint256 created, uint256 dl) = 
            escrow.getTask(taskId);
        
        assertEq(b, buyer);
        assertEq(w, address(0));
        assertEq(r, REWARD);
        assertEq(spec, "ipfs://spec123");
        assertEq(uint256(s), uint256(CastleEscrow.Status.Open));
        assertEq(created, block.timestamp);
        assertEq(dl, deadline);
    }

    function test_CreateTask_RevertNoReward() public {
        vm.prank(buyer);
        vm.expectRevert("CastleEscrow: reward required");
        escrow.createTask{value: 0}("ipfs://spec", deadline);
    }

    function test_CreateTask_RevertPastDeadline() public {
        vm.prank(buyer);
        vm.expectRevert("CastleEscrow: deadline in past");
        escrow.createTask{value: REWARD}("ipfs://spec", block.timestamp - 1);
    }

    function test_CreateTask_RevertEmptySpec() public {
        vm.prank(buyer);
        vm.expectRevert("CastleEscrow: empty spec");
        escrow.createTask{value: REWARD}("", deadline);
    }

    // --- Accept Task Tests ---

    function test_AcceptTask() public {
        uint256 taskId = _createDefaultTask();

        vm.prank(worker);
        escrow.acceptTask(taskId);

        (, address w, , , , CastleEscrow.Status s, , ) = escrow.getTask(taskId);
        assertEq(w, worker);
        assertEq(uint256(s), uint256(CastleEscrow.Status.Accepted));
    }

    function test_AcceptTask_RevertBuyerCannotAccept() public {
        uint256 taskId = _createDefaultTask();

        vm.prank(buyer);
        vm.expectRevert("CastleEscrow: buyer cannot accept");
        escrow.acceptTask(taskId);
    }

    function test_AcceptTask_RevertNotOpen() public {
        uint256 taskId = _createDefaultTask();

        // Accept once
        vm.prank(worker);
        escrow.acceptTask(taskId);

        // Try to accept again (a different worker)
        vm.prank(outsider);
        vm.expectRevert("CastleEscrow: not open");
        escrow.acceptTask(taskId);
    }

    function test_AcceptTask_RevertPastDeadline() public {
        uint256 taskId = _createDefaultTask();

        vm.warp(deadline + 1);

        vm.prank(worker);
        vm.expectRevert("CastleEscrow: past deadline");
        escrow.acceptTask(taskId);
    }

    // --- Submit Work Tests ---

    function test_SubmitWork() public {
        uint256 taskId = _createAndAcceptTask();

        vm.prank(worker);
        escrow.submitWork(taskId, "ipfs://result456");

        (, , , , string memory resultURI, CastleEscrow.Status s, , ) = escrow.getTask(taskId);
        assertEq(resultURI, "ipfs://result456");
        assertEq(uint256(s), uint256(CastleEscrow.Status.Submitted));
    }

    function test_SubmitWork_RevertNotWorker() public {
        uint256 taskId = _createAndAcceptTask();

        vm.prank(outsider);
        vm.expectRevert("CastleEscrow: not worker");
        escrow.submitWork(taskId, "ipfs://result");
    }

    function test_SubmitWork_RevertNotAccepted() public {
        uint256 taskId = _createDefaultTask();

        vm.prank(worker);
        vm.expectRevert("CastleEscrow: not accepted");
        escrow.submitWork(taskId, "ipfs://result");
    }

    function test_SubmitWork_RevertEmptyResult() public {
        uint256 taskId = _createAndAcceptTask();

        vm.prank(worker);
        vm.expectRevert("CastleEscrow: empty result");
        escrow.submitWork(taskId, "");
    }

    // --- Release Funds Tests ---

    function test_ReleaseFunds() public {
        uint256 taskId = _createAcceptAndSubmitTask();

        uint256 workerBalanceBefore = worker.balance;

        vm.prank(buyer);
        escrow.releaseFunds(taskId);

        (, , , , , CastleEscrow.Status s, , ) = escrow.getTask(taskId);
        assertEq(uint256(s), uint256(CastleEscrow.Status.Released));
        assertEq(worker.balance, workerBalanceBefore + REWARD);
        assertEq(address(escrow).balance, 0);
    }

    function test_ReleaseFunds_RevertNotBuyer() public {
        uint256 taskId = _createAcceptAndSubmitTask();

        vm.prank(outsider);
        vm.expectRevert("CastleEscrow: not buyer");
        escrow.releaseFunds(taskId);
    }

    function test_ReleaseFunds_RevertNotSubmitted() public {
        uint256 taskId = _createAndAcceptTask();

        vm.prank(buyer);
        vm.expectRevert("CastleEscrow: not submitted");
        escrow.releaseFunds(taskId);
    }

    // --- Dispute Tests ---

    function test_RaiseDispute_Buyer() public {
        uint256 taskId = _createAndAcceptTask();

        vm.prank(buyer);
        escrow.raiseDispute(taskId);

        (, , , , , CastleEscrow.Status s, , ) = escrow.getTask(taskId);
        assertEq(uint256(s), uint256(CastleEscrow.Status.Disputed));
    }

    function test_RaiseDispute_Worker() public {
        uint256 taskId = _createAcceptAndSubmitTask();

        vm.prank(worker);
        escrow.raiseDispute(taskId);

        (, , , , , CastleEscrow.Status s, , ) = escrow.getTask(taskId);
        assertEq(uint256(s), uint256(CastleEscrow.Status.Disputed));
    }

    function test_RaiseDispute_RevertNotParticipant() public {
        uint256 taskId = _createAndAcceptTask();

        vm.prank(outsider);
        vm.expectRevert("CastleEscrow: not participant");
        escrow.raiseDispute(taskId);
    }

    function test_RaiseDispute_RevertOpenTask() public {
        uint256 taskId = _createDefaultTask();

        vm.prank(buyer);
        vm.expectRevert("CastleEscrow: cannot dispute");
        escrow.raiseDispute(taskId);
    }

    // --- Reclaim Tests ---

    function test_Reclaim() public {
        uint256 taskId = _createDefaultTask();

        vm.warp(deadline + 1);

        uint256 buyerBalanceBefore = buyer.balance;

        vm.prank(buyer);
        escrow.reclaim(taskId);

        (, , , , , CastleEscrow.Status s, , ) = escrow.getTask(taskId);
        assertEq(uint256(s), uint256(CastleEscrow.Status.Cancelled));
        assertEq(buyer.balance, buyerBalanceBefore + REWARD);
    }

    function test_Reclaim_RevertNotBuyer() public {
        uint256 taskId = _createDefaultTask();
        vm.warp(deadline + 1);

        vm.prank(outsider);
        vm.expectRevert("CastleEscrow: not buyer");
        escrow.reclaim(taskId);
    }

    function test_Reclaim_RevertBeforeDeadline() public {
        uint256 taskId = _createDefaultTask();

        vm.prank(buyer);
        vm.expectRevert("CastleEscrow: deadline not passed");
        escrow.reclaim(taskId);
    }

    function test_Reclaim_RevertNotOpen() public {
        uint256 taskId = _createAndAcceptTask();
        vm.warp(deadline + 1);

        vm.prank(buyer);
        vm.expectRevert("CastleEscrow: not open");
        escrow.reclaim(taskId);
    }

    // --- Full Lifecycle Test ---

    function test_FullLifecycle() public {
        // Create
        vm.prank(buyer);
        uint256 taskId = escrow.createTask{value: 2 ether}("Scrape DeFi TVL data", deadline);
        assertEq(address(escrow).balance, 2 ether);

        // Accept
        vm.prank(worker);
        escrow.acceptTask(taskId);

        // Submit
        vm.prank(worker);
        escrow.submitWork(taskId, "ipfs://QmResult...");

        // Release
        uint256 workerBefore = worker.balance;
        vm.prank(buyer);
        escrow.releaseFunds(taskId);

        assertEq(worker.balance, workerBefore + 2 ether);
        assertEq(address(escrow).balance, 0);
    }

    // --- Helpers ---

    function _createDefaultTask() internal returns (uint256) {
        vm.prank(buyer);
        return escrow.createTask{value: REWARD}("ipfs://spec123", deadline);
    }

    function _createAndAcceptTask() internal returns (uint256) {
        uint256 taskId = _createDefaultTask();
        vm.prank(worker);
        escrow.acceptTask(taskId);
        return taskId;
    }

    function _createAcceptAndSubmitTask() internal returns (uint256) {
        uint256 taskId = _createAndAcceptTask();
        vm.prank(worker);
        escrow.submitWork(taskId, "ipfs://result456");
        return taskId;
    }
}
