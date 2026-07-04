// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/CastleWalletFactory.sol";
import "../src/CastleEscrow.sol";
import "../src/CastlePaymentRouter.sol";

contract DeployCastle is Script {
    function run() external {
        vm.startBroadcast();

        CastleWalletFactory factory = new CastleWalletFactory();
        CastleEscrow escrow = new CastleEscrow();
        CastlePaymentRouter router = new CastlePaymentRouter();

        vm.stopBroadcast();

        console.log("CastleWalletFactory deployed at:", address(factory));
        console.log("CastleEscrow deployed at:", address(escrow));
        console.log("CastlePaymentRouter deployed at:", address(router));
    }
}
