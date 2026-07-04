// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/BlitzWalletFactory.sol";
import "../src/BlitzEscrow.sol";
import "../src/BlitzPaymentRouter.sol";

contract DeployBlitz is Script {
    function run() external {
        vm.startBroadcast();

        BlitzWalletFactory factory = new BlitzWalletFactory();
        BlitzEscrow escrow = new BlitzEscrow();
        BlitzPaymentRouter router = new BlitzPaymentRouter();

        vm.stopBroadcast();

        console.log("BlitzWalletFactory deployed at:", address(factory));
        console.log("BlitzEscrow deployed at:", address(escrow));
        console.log("BlitzPaymentRouter deployed at:", address(router));
    }
}
