// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {PresentationNFT} from "../src/PresentationNFT.sol";
import {PresentationPaymaster} from "../src/PresentationPaymaster.sol";

contract DeployScript is Script {
    function run() external {
        string memory baseUri = vm.envOr("NFT_BASE_URI", string(""));
        string memory additionalAdminsStr = vm.envOr("ADDITIONAL_ADMIN_ADDRESSES", string(""));
        address admin = vm.envAddress("ADMIN_ADDRESS");

        console.log("=== Abstract NFT Onboarding Deployment ===");
        console.log("Base URI:", bytes(baseUri).length > 0 ? baseUri : "(on-chain metadata)");
        console.log("");

        vm.startBroadcast();

        console.log("Default Admin:", admin);

        PresentationNFT nft = new PresentationNFT(baseUri, admin);
        console.log("PresentationNFT deployed:", address(nft));

        PresentationPaymaster paymaster = new PresentationPaymaster(admin, address(nft));
        console.log("PresentationPaymaster deployed:", address(paymaster));

        if (bytes(additionalAdminsStr).length > 0) {
            address[] memory additionalAdmins = _parseAddresses(additionalAdminsStr);
            bytes32 adminRole = nft.ADMIN_ROLE();

            for (uint256 i = 0; i < additionalAdmins.length; i++) {
                nft.grantRole(adminRole, additionalAdmins[i]);
                paymaster.grantRole(adminRole, additionalAdmins[i]);
                console.log("Granted ADMIN_ROLE to:", additionalAdmins[i]);
            }
        }

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
        console.log("2. Create your first presentation via admin dashboard");
        console.log("3. To add more admins later, call grantRole(ADMIN_ROLE, address)");
    }

    function _parseAddresses(string memory csv) internal pure returns (address[] memory) {
        bytes memory b = bytes(csv);
        uint256 count = 1;
        for (uint256 i = 0; i < b.length; i++) {
            if (b[i] == ",") count++;
        }

        address[] memory addrs = new address[](count);
        uint256 start = 0;
        uint256 idx = 0;

        for (uint256 i = 0; i <= b.length; i++) {
            if (i == b.length || b[i] == ",") {
                bytes memory addrBytes = new bytes(i - start);
                for (uint256 j = start; j < i; j++) {
                    addrBytes[j - start] = b[j];
                }
                addrs[idx++] = _parseAddress(string(addrBytes));
                start = i + 1;
            }
        }

        return addrs;
    }

    function _parseAddress(string memory s) internal pure returns (address) {
        bytes memory b = bytes(s);
        uint256 result = 0;
        uint256 start = 0;

        if (b.length >= 2 && b[0] == "0" && (b[1] == "x" || b[1] == "X")) {
            start = 2;
        }

        for (uint256 i = start; i < b.length; i++) {
            uint8 c = uint8(b[i]);
            uint8 val;
            if (c >= 48 && c <= 57) val = c - 48;
            else if (c >= 65 && c <= 70) val = c - 55;
            else if (c >= 97 && c <= 102) val = c - 87;
            else continue;
            result = result * 16 + val;
        }

        return address(uint160(result));
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
