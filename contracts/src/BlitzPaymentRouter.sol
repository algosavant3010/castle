// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title BlitzPaymentRouter
 * @notice A minimal routing contract that enables BlitzWallet session keys to send
 *         native MON to any address. Since BlitzWallet's policy engine requires
 *         a target contract + function selector, this contract acts as the "allowed target"
 *         for general-purpose transfers.
 *
 * @dev Usage: The session key calls BlitzWallet.executeAsAgent(router, amount, abi.encodeWithSelector(send.selector, recipient))
 *      The wallet sends `amount` MON to this contract via the call, and this contract forwards it to `recipient`.
 */
contract BlitzPaymentRouter {
    // --- Events ---
    event PaymentRouted(address indexed from, address indexed to, uint256 amount);

    /**
     * @notice Forward incoming MON to the specified recipient.
     * @param to The address to receive the MON
     */
    function send(address payable to) external payable {
        require(to != address(0), "BlitzPaymentRouter: zero recipient");
        require(msg.value > 0, "BlitzPaymentRouter: zero value");

        (bool success, ) = to.call{value: msg.value}("");
        require(success, "BlitzPaymentRouter: transfer failed");

        emit PaymentRouted(msg.sender, to, msg.value);
    }

    /**
     * @notice Forward incoming MON to the specified recipient with a memo.
     *         Useful for tagging payments with context (e.g., invoice ID).
     * @param to The address to receive the MON
     * @param memo An arbitrary string for off-chain indexing
     */
    function sendWithMemo(address payable to, string calldata memo) external payable {
        require(to != address(0), "BlitzPaymentRouter: zero recipient");
        require(msg.value > 0, "BlitzPaymentRouter: zero value");

        (bool success, ) = to.call{value: msg.value}("");
        require(success, "BlitzPaymentRouter: transfer failed");

        emit PaymentRoutedWithMemo(msg.sender, to, msg.value, memo);
    }

    // --- Events ---
    event PaymentRoutedWithMemo(address indexed from, address indexed to, uint256 amount, string memo);
}
