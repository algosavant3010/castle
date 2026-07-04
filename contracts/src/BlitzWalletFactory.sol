// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./BlitzWallet.sol";

/**
 * @title BlitzWalletFactory
 * @notice Deploys BlitzWallet instances and maintains a registry of all deployed wallets.
 */
contract BlitzWalletFactory {
    // --- State ---
    mapping(address => address[]) public ownerWallets;
    address[] public allWallets;

    // --- Events ---
    event WalletDeployed(address indexed owner, address indexed wallet);

    // --- Functions ---

    /**
     * @notice Deploy a new BlitzWallet for the caller.
     * @return wallet The address of the newly deployed BlitzWallet
     */
    function deployWallet() external returns (address wallet) {
        BlitzWallet newWallet = new BlitzWallet(msg.sender);
        wallet = address(newWallet);

        ownerWallets[msg.sender].push(wallet);
        allWallets.push(wallet);

        emit WalletDeployed(msg.sender, wallet);
    }

    /**
     * @notice Get all wallets deployed by a specific owner.
     * @param owner The address of the owner
     * @return An array of wallet addresses
     */
    function getWallets(address owner) external view returns (address[] memory) {
        return ownerWallets[owner];
    }

    /**
     * @notice Get the number of wallets deployed by a specific owner.
     * @param owner The address of the owner
     * @return The count of wallets
     */
    function getWalletCount(address owner) external view returns (uint256) {
        return ownerWallets[owner].length;
    }

    /**
     * @notice Get all wallets ever deployed through this factory.
     * @return An array of all wallet addresses
     */
    function getAllWallets() external view returns (address[] memory) {
        return allWallets;
    }

    /**
     * @notice Get the total number of wallets deployed.
     * @return The total count
     */
    function getTotalWalletCount() external view returns (uint256) {
        return allWallets.length;
    }
}
