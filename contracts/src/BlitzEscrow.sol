// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title BlitzEscrow
 * @notice Coordinates trustless task exchange between AI agents.
 *         Funds are held in escrow between createTask and releaseFunds.
 */
contract BlitzEscrow {
    // --- Types ---
    enum Status { Open, Accepted, Submitted, Released, Disputed, Cancelled }

    struct Task {
        address buyer;
        address worker;
        uint256 reward;
        string specURI;
        string resultURI;
        Status status;
        uint256 createdAt;
        uint256 deadline;
    }

    // --- State ---
    uint256 public taskCount;
    mapping(uint256 => Task) public tasks;

    // --- Events ---
    event TaskCreated(uint256 indexed taskId, address indexed buyer, uint256 reward, string specURI);
    event TaskAccepted(uint256 indexed taskId, address indexed worker);
    event WorkSubmitted(uint256 indexed taskId, string resultURI);
    event FundsReleased(uint256 indexed taskId, address indexed worker, uint256 amount);
    event TaskDisputed(uint256 indexed taskId, address indexed raiser);
    event TaskCancelled(uint256 indexed taskId);

    // --- Functions ---

    /**
     * @notice Create a new task with MON locked as the reward.
     * @param specURI URI pointing to the task specification (IPFS hash or plain text)
     * @param deadline Unix timestamp after which the task can be reclaimed if unclaimed
     * @return taskId The ID of the newly created task
     */
    function createTask(string calldata specURI, uint256 deadline) external payable returns (uint256 taskId) {
        require(msg.value > 0, "BlitzEscrow: reward required");
        require(deadline > block.timestamp, "BlitzEscrow: deadline in past");
        require(bytes(specURI).length > 0, "BlitzEscrow: empty spec");

        taskId = taskCount++;

        tasks[taskId] = Task({
            buyer: msg.sender,
            worker: address(0),
            reward: msg.value,
            specURI: specURI,
            resultURI: "",
            status: Status.Open,
            createdAt: block.timestamp,
            deadline: deadline
        });

        emit TaskCreated(taskId, msg.sender, msg.value, specURI);
    }

    /**
     * @notice Accept an open task as a worker.
     * @param taskId The ID of the task to accept
     */
    function acceptTask(uint256 taskId) external {
        Task storage task = tasks[taskId];
        require(task.status == Status.Open, "BlitzEscrow: not open");
        require(msg.sender != task.buyer, "BlitzEscrow: buyer cannot accept");
        require(block.timestamp <= task.deadline, "BlitzEscrow: past deadline");

        task.worker = msg.sender;
        task.status = Status.Accepted;

        emit TaskAccepted(taskId, msg.sender);
    }

    /**
     * @notice Submit completed work for an accepted task.
     * @param taskId The ID of the task
     * @param resultURI URI pointing to the deliverable (IPFS hash)
     */
    function submitWork(uint256 taskId, string calldata resultURI) external {
        Task storage task = tasks[taskId];
        require(task.status == Status.Accepted, "BlitzEscrow: not accepted");
        require(msg.sender == task.worker, "BlitzEscrow: not worker");
        require(bytes(resultURI).length > 0, "BlitzEscrow: empty result");

        task.resultURI = resultURI;
        task.status = Status.Submitted;

        emit WorkSubmitted(taskId, resultURI);
    }

    /**
     * @notice Release escrowed funds to the worker (buyer approves the work).
     * @param taskId The ID of the task
     */
    function releaseFunds(uint256 taskId) external {
        Task storage task = tasks[taskId];
        require(task.status == Status.Submitted, "BlitzEscrow: not submitted");
        require(msg.sender == task.buyer, "BlitzEscrow: not buyer");

        task.status = Status.Released;
        uint256 amount = task.reward;

        (bool success, ) = task.worker.call{value: amount}("");
        require(success, "BlitzEscrow: transfer failed");

        emit FundsReleased(taskId, task.worker, amount);
    }

    /**
     * @notice Raise a dispute on a task. Either buyer or worker can dispute.
     *         For MVP, this simply freezes the funds.
     * @param taskId The ID of the task
     */
    function raiseDispute(uint256 taskId) external {
        Task storage task = tasks[taskId];
        require(
            task.status == Status.Accepted || task.status == Status.Submitted,
            "BlitzEscrow: cannot dispute"
        );
        require(
            msg.sender == task.buyer || msg.sender == task.worker,
            "BlitzEscrow: not participant"
        );

        task.status = Status.Disputed;

        emit TaskDisputed(taskId, msg.sender);
    }

    /**
     * @notice Reclaim funds from a task that was never accepted and is past its deadline.
     * @param taskId The ID of the task
     */
    function reclaim(uint256 taskId) external {
        Task storage task = tasks[taskId];
        require(task.status == Status.Open, "BlitzEscrow: not open");
        require(msg.sender == task.buyer, "BlitzEscrow: not buyer");
        require(block.timestamp > task.deadline, "BlitzEscrow: deadline not passed");

        task.status = Status.Cancelled;
        uint256 amount = task.reward;

        (bool success, ) = task.buyer.call{value: amount}("");
        require(success, "BlitzEscrow: transfer failed");

        emit TaskCancelled(taskId);
    }

    // --- View Functions ---

    /**
     * @notice Get full task details.
     * @param taskId The ID of the task
     */
    function getTask(uint256 taskId) external view returns (
        address buyer,
        address worker,
        uint256 reward,
        string memory specURI,
        string memory resultURI,
        Status status,
        uint256 createdAt,
        uint256 deadline
    ) {
        Task storage task = tasks[taskId];
        return (
            task.buyer,
            task.worker,
            task.reward,
            task.specURI,
            task.resultURI,
            task.status,
            task.createdAt,
            task.deadline
        );
    }
}
