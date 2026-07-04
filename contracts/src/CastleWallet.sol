// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CastleWallet
 * @notice A smart contract wallet that separates the human owner (Master Key) from
 *         AI agent signers (Session Keys) with on-chain policy enforcement.
 * @dev Session keys can only execute transactions within their policy bounds.
 *      The owner retains full control and can freeze/withdraw at any time.
 */
contract CastleWallet {
    // --- Types ---
    struct SessionPolicy {
        uint256 expiry;          // Unix timestamp after which the key is invalid
        uint256 dailyCap;        // Max spend per rolling 24h window (in wei)
        uint256 spentToday;      // Tracked usage in current window
        uint256 windowStart;     // Start of current rolling window
        address allowedTarget;   // The only contract this key may call
        bytes4[] allowedFns;     // Permitted function selectors
        bool active;             // Whether this key is currently active
    }

    // --- State ---
    address public owner;
    address[] public activeKeys;
    mapping(address => SessionPolicy) public sessionKeys;
    // Separate storage for the dynamic array in the struct
    mapping(address => bytes4[]) private _allowedFns;

    // --- Events ---
    event SessionKeyRegistered(address indexed key, uint256 expiry);
    event SessionKeyRevoked(address indexed key);
    event AgentFrozen(uint256 keysRevoked);
    event EmergencyWithdrawal(address indexed to, uint256 amount);
    event AgentExecution(address indexed key, address indexed target, uint256 value, bytes4 selector);

    // --- Modifiers ---
    modifier onlyOwner() {
        require(msg.sender == owner, "CastleWallet: not owner");
        _;
    }

    // --- Constructor ---
    constructor(address _owner) {
        require(_owner != address(0), "CastleWallet: zero owner");
        owner = _owner;
    }

    // --- Receive ---
    receive() external payable {}

    // --- Owner Functions ---

    /**
     * @notice Register a new session key with a policy. Only callable by owner.
     * @param key The address of the session key to register
     * @param expiry Unix timestamp when the key expires
     * @param dailyCap Maximum daily spend in wei
     * @param allowedTarget The only contract address this key may call
     * @param allowedFns Array of permitted function selectors
     */
    function registerSessionKey(
        address key,
        uint256 expiry,
        uint256 dailyCap,
        address allowedTarget,
        bytes4[] calldata allowedFns
    ) external onlyOwner {
        require(key != address(0), "CastleWallet: zero key");
        require(expiry > block.timestamp, "CastleWallet: expiry in past");
        require(allowedTarget != address(0), "CastleWallet: zero target");
        require(!sessionKeys[key].active, "CastleWallet: key already active");

        sessionKeys[key] = SessionPolicy({
            expiry: expiry,
            dailyCap: dailyCap,
            spentToday: 0,
            windowStart: block.timestamp,
            allowedTarget: allowedTarget,
            allowedFns: new bytes4[](0), // placeholder, stored separately
            active: true
        });

        // Store allowed functions separately (dynamic arrays in structs)
        delete _allowedFns[key];
        for (uint256 i = 0; i < allowedFns.length; i++) {
            _allowedFns[key].push(allowedFns[i]);
        }

        activeKeys.push(key);

        emit SessionKeyRegistered(key, expiry);
    }

    /**
     * @notice Revoke a single session key. Only callable by owner.
     * @param key The address of the session key to revoke
     */
    function revokeSessionKey(address key) external onlyOwner {
        require(sessionKeys[key].active, "CastleWallet: key not active");
        sessionKeys[key].active = false;

        // Remove from activeKeys array
        uint256 len = activeKeys.length;
        for (uint256 i = 0; i < len; i++) {
            if (activeKeys[i] == key) {
                activeKeys[i] = activeKeys[len - 1];
                activeKeys.pop();
                break;
            }
        }

        emit SessionKeyRevoked(key);
    }

    /**
     * @notice Instantly revoke all active session keys. Only callable by owner.
     */
    function freezeAgent() external onlyOwner {
        uint256 count = activeKeys.length;
        for (uint256 i = 0; i < count; i++) {
            sessionKeys[activeKeys[i]].active = false;
        }
        delete activeKeys;
        emit AgentFrozen(count);
    }

    /**
     * @notice Sweep the entire wallet balance to the specified address. Only callable by owner.
     * @param to The address to receive the funds (typically the owner's EOA)
     */
    function emergencyWithdraw(address to) external onlyOwner {
        require(to != address(0), "CastleWallet: zero recipient");
        uint256 amount = address(this).balance;
        require(amount > 0, "CastleWallet: no balance");

        (bool success, ) = to.call{value: amount}("");
        require(success, "CastleWallet: transfer failed");

        emit EmergencyWithdrawal(to, amount);
    }

    // --- Session Key Execution ---

    /**
     * @notice Execute a transaction as an agent. Validates against the caller's policy.
     * @dev Follows checks-effects-interactions: spentToday incremented BEFORE external call.
     * @param target The contract to call
     * @param value The MON value to send
     * @param data The calldata to execute
     */
    function executeAsAgent(
        address target,
        uint256 value,
        bytes calldata data
    ) external returns (bytes memory) {
        SessionPolicy storage policy = sessionKeys[msg.sender];

        // --- CHECKS ---
        require(policy.active, "CastleWallet: key not active");
        require(block.timestamp < policy.expiry, "CastleWallet: key expired");
        require(target == policy.allowedTarget, "CastleWallet: unauthorized target");

        // Validate function selector
        bytes4 selector = bytes4(data[:4]);
        require(_isSelectorAllowed(msg.sender, selector), "CastleWallet: unauthorized function");

        // Reset rolling window if 24h has passed
        if (block.timestamp >= policy.windowStart + 24 hours) {
            policy.spentToday = 0;
            policy.windowStart = block.timestamp;
        }

        // --- EFFECTS (before external call - CEI pattern) ---
        policy.spentToday += value;
        require(policy.spentToday <= policy.dailyCap, "CastleWallet: daily cap exceeded");

        // --- INTERACTIONS ---
        (bool success, bytes memory result) = target.call{value: value}(data);
        require(success, "CastleWallet: execution failed");

        emit AgentExecution(msg.sender, target, value, selector);

        return result;
    }

    // --- View Functions ---

    function getActiveKeys() external view returns (address[] memory) {
        return activeKeys;
    }

    function getSessionPolicy(address key) external view returns (
        uint256 expiry,
        uint256 dailyCap,
        uint256 spentToday,
        uint256 windowStart,
        address allowedTarget,
        bytes4[] memory allowedFns,
        bool active
    ) {
        SessionPolicy storage policy = sessionKeys[key];
        return (
            policy.expiry,
            policy.dailyCap,
            policy.spentToday,
            policy.windowStart,
            policy.allowedTarget,
            _allowedFns[key],
            policy.active
        );
    }

    function getActiveKeyCount() external view returns (uint256) {
        return activeKeys.length;
    }

    // --- Internal ---

    function _isSelectorAllowed(address key, bytes4 selector) internal view returns (bool) {
        bytes4[] storage fns = _allowedFns[key];
        for (uint256 i = 0; i < fns.length; i++) {
            if (fns[i] == selector) return true;
        }
        return false;
    }
}
