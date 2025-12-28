// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {PresentationNFT} from "../src/PresentationNFT.sol";
import {PresentationPaymaster} from "../src/PresentationPaymaster.sol";

contract DeployScript is Script {
    function run() external {
        string memory baseUri = vm.envOr("NFT_BASE_URI", string(""));
        address owner = vm.envAddress("OWNER_ADDRESS");
        
        console.log("=== Abstract NFT Onboarding Deployment ===");
        console.log("Owner:", owner);
        console.log("Base URI:", bytes(baseUri).length > 0 ? baseUri : "(on-chain metadata)");
        console.log("");

        vm.startBroadcast();

        PresentationNFT nft = new PresentationNFT(baseUri, owner);
        console.log("PresentationNFT deployed:", address(nft));

        PresentationPaymaster paymaster = new PresentationPaymaster(owner, address(nft));
        console.log("PresentationPaymaster deployed:", address(paymaster));

        vm.stopBroadcast();

        console.log("");
        console.log("=== Deployment Complete ===");
        console.log("");
        console.log("Add to .env.local:");
        console.log("NEXT_PUBLIC_NFT_CONTRACT=%s", address(nft));
        console.log("NEXT_PUBLIC_PAYMASTER_CONTRACT=%s", address(paymaster));
        console.log("");
        console.log("Next steps:");
        console.log("1. Fund paymaster with ETH for gas sponsorship");
        console.log("2. Create your first presentation via admin dashboard or CLI");
    }
}

contract DeployNFTOnly is Script {
    function run() external {
        string memory baseUri = vm.envOr("NFT_BASE_URI", string(""));

        vm.startBroadcast();
        PresentationNFT nft = new PresentationNFT(baseUri, msg.sender);
        vm.stopBroadcast();

        console.log("PresentationNFT deployed:", address(nft));
    }
}

contract DeployPaymasterOnly is Script {
    function run() external {
        address nftContract = vm.envAddress("NFT_CONTRACT");

        vm.startBroadcast();
        PresentationPaymaster paymaster = new PresentationPaymaster(msg.sender, nftContract);
        vm.stopBroadcast();

        console.log("PresentationPaymaster deployed:", address(paymaster));
        console.log("Configured for NFT:", nftContract);
    }
}
