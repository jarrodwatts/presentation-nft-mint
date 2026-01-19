// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {PresentationPaymaster} from "../src/PresentationPaymaster.sol";
import {PresentationNFT} from "../src/PresentationNFT.sol";
import {Transaction, ExecutionResult} from "../src/interfaces/IPaymaster.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

contract PresentationPaymasterTest is Test {
    PresentationPaymaster public paymaster;
    PresentationNFT public nft;
    
    address public owner = makeAddr("owner");
    address public alice = makeAddr("alice");
    
    uint256 public constant ONE_HOUR = 3600;

    function setUp() public {
        vm.startPrank(owner);
        nft = new PresentationNFT("", owner);
        paymaster = new PresentationPaymaster(owner, address(nft));
        
        nft.createPresentation(
            "Test",
            "Test presentation",
            "ipfs://test",
            block.timestamp,
            block.timestamp + ONE_HOUR,
            0
        );
        vm.stopPrank();

        vm.deal(address(paymaster), 10 ether);
    }

    function test_InitialState() public view {
        assertTrue(paymaster.hasRole(paymaster.ADMIN_ROLE(), owner));
        assertTrue(paymaster.hasRole(paymaster.DEFAULT_ADMIN_ROLE(), owner));
        assertEq(paymaster.nftContract(), address(nft));
        assertTrue(paymaster.isActive());
        assertEq(paymaster.maxGasPrice(), 1 gwei);
        assertTrue(paymaster.withdrawers(owner));
    }

    function test_SetNFTContract() public {
        address newNft = makeAddr("newNft");
        
        vm.prank(owner);
        paymaster.setNFTContract(newNft);
        
        assertEq(paymaster.nftContract(), newNft);
    }

    function test_SetNFTContract_OnlyAdmin() public {
        vm.prank(alice);
        vm.expectRevert();
        paymaster.setNFTContract(makeAddr("newNft"));
    }

    function test_SetActive() public {
        vm.prank(owner);
        paymaster.setActive(false);
        assertFalse(paymaster.isActive());

        vm.prank(owner);
        paymaster.setActive(true);
        assertTrue(paymaster.isActive());
    }

    function test_SetActive_OnlyAdmin() public {
        vm.prank(alice);
        vm.expectRevert();
        paymaster.setActive(false);
    }

    function test_SetMaxGasPrice() public {
        vm.prank(owner);
        paymaster.setMaxGasPrice(5 gwei);
        
        assertEq(paymaster.maxGasPrice(), 5 gwei);
    }

    function test_SetMaxGasPrice_OnlyAdmin() public {
        vm.prank(alice);
        vm.expectRevert();
        paymaster.setMaxGasPrice(5 gwei);
    }

    function test_SetWithdrawer() public {
        assertFalse(paymaster.withdrawers(alice));
        
        vm.prank(owner);
        paymaster.setWithdrawer(alice, true);
        
        assertTrue(paymaster.withdrawers(alice));

        vm.prank(owner);
        paymaster.setWithdrawer(alice, false);
        
        assertFalse(paymaster.withdrawers(alice));
    }

    function test_SetWithdrawer_OnlyAdmin() public {
        vm.prank(alice);
        vm.expectRevert();
        paymaster.setWithdrawer(alice, true);
    }

    function test_Withdraw() public {
        uint256 initialBalance = address(paymaster).balance;
        uint256 withdrawAmount = 1 ether;
        
        vm.prank(owner);
        paymaster.withdraw(owner, withdrawAmount);
        
        assertEq(address(paymaster).balance, initialBalance - withdrawAmount);
    }

    function test_Withdraw_NotWithdrawer() public {
        vm.prank(alice);
        vm.expectRevert(PresentationPaymaster.NotWithdrawer.selector);
        paymaster.withdraw(alice, 1 ether);
    }

    function test_Withdraw_InsufficientBalance() public {
        vm.prank(owner);
        vm.expectRevert(PresentationPaymaster.InsufficientBalance.selector);
        paymaster.withdraw(owner, 100 ether);
    }

    function test_Withdraw_AuthorizedWithdrawer() public {
        vm.prank(owner);
        paymaster.setWithdrawer(alice, true);

        uint256 aliceBalanceBefore = alice.balance;
        
        vm.prank(alice);
        paymaster.withdraw(alice, 1 ether);
        
        assertEq(alice.balance, aliceBalanceBefore + 1 ether);
    }

    function test_ReceiveEth() public {
        uint256 initialBalance = address(paymaster).balance;
        
        vm.deal(alice, 5 ether);
        vm.prank(alice);
        (bool success,) = address(paymaster).call{value: 1 ether}("");
        
        assertTrue(success);
        assertEq(address(paymaster).balance, initialBalance + 1 ether);
    }

    function test_MintSelector() public view {
        bytes4 expectedSelector = bytes4(keccak256("mint(uint256)"));
        assertEq(paymaster.MINT_SELECTOR(), expectedSelector);
    }

    function test_PaymasterValidationMagic() public view {
        bytes4 expectedMagic = PresentationPaymaster.validateAndPayForPaymasterTransaction.selector;
        assertEq(paymaster.PAYMASTER_VALIDATION_SUCCESS_MAGIC(), expectedMagic);
    }

    function test_ValidatePaymaster_OnlyBootloader() public {
        Transaction memory txn = _createMockTransaction(address(nft), 0);
        
        vm.prank(alice);
        vm.expectRevert("Only bootloader");
        paymaster.validateAndPayForPaymasterTransaction(bytes32(0), bytes32(0), txn);
    }

    function test_PostTransaction_OnlyBootloader() public {
        Transaction memory txn = _createMockTransaction(address(nft), 0);
        
        vm.prank(alice);
        vm.expectRevert("Only bootloader");
        paymaster.postTransaction("", txn, bytes32(0), bytes32(0), ExecutionResult.Success, 0);
    }

    function _createMockTransaction(address to, uint256 tokenId) internal pure returns (Transaction memory) {
        bytes memory data = abi.encodeWithSelector(bytes4(keccak256("mint(uint256)")), tokenId);
        
        return Transaction({
            txType: 113,
            from: uint256(uint160(address(0x1234))),
            to: uint256(uint160(to)),
            gasLimit: 100000,
            gasPerPubdataByteLimit: 800,
            maxFeePerGas: 0.5 gwei,
            maxPriorityFeePerGas: 0,
            paymaster: 0,
            nonce: 0,
            value: 0,
            reserved: [uint256(0), uint256(0), uint256(0), uint256(0)],
            data: data,
            signature: "",
            factoryDeps: new bytes32[](0),
            paymasterInput: "",
            reservedDynamic: ""
        });
    }
}

contract PresentationPaymasterIntegrationTest is Test {
    PresentationPaymaster public paymaster;
    PresentationNFT public nft;
    
    address public owner = makeAddr("owner");
    
    uint256 public constant ONE_HOUR = 3600;

    function setUp() public {
        vm.startPrank(owner);
        nft = new PresentationNFT("", owner);
        paymaster = new PresentationPaymaster(owner, address(nft));
        
        nft.createPresentation(
            "Integration Test",
            "Testing paymaster + NFT",
            "ipfs://integration",
            block.timestamp,
            block.timestamp + ONE_HOUR,
            0
        );
        vm.stopPrank();

        vm.deal(address(paymaster), 10 ether);
    }

    function test_PaymasterPointsToCorrectNFT() public view {
        assertEq(paymaster.nftContract(), address(nft));
    }

    function test_UpdateNFTContractAndVerify() public {
        PresentationNFT newNft = new PresentationNFT("", owner);
        
        vm.prank(owner);
        paymaster.setNFTContract(address(newNft));
        
        assertEq(paymaster.nftContract(), address(newNft));
    }

    function test_TogglePaymasterDoesNotAffectNFT() public {
        address alice = makeAddr("alice");
        
        vm.prank(owner);
        paymaster.setActive(false);

        vm.prank(alice);
        nft.mint(0);
        
        assertEq(nft.balanceOf(alice, 0), 1);
    }

    function test_FullLifecycle() public {
        address alice = makeAddr("alice");
        address bob = makeAddr("bob");
        
        assertEq(nft.presentationCount(), 1);
        assertTrue(paymaster.isActive());
        assertGt(address(paymaster).balance, 0);

        vm.prank(alice);
        nft.mint(0);
        assertEq(nft.balanceOf(alice, 0), 1);

        vm.prank(bob);
        nft.mint(0);
        assertEq(nft.balanceOf(bob, 0), 1);

        assertEq(nft.totalSupply(0), 2);

        vm.prank(owner);
        nft.setMintingActive(0, false);

        address charlie = makeAddr("charlie");
        vm.prank(charlie);
        vm.expectRevert(PresentationNFT.MintingNotActive.selector);
        nft.mint(0);

        vm.prank(owner);
        uint256 newTokenId = nft.createPresentation(
            "Second Presentation",
            "Another one",
            "ipfs://second",
            block.timestamp,
            block.timestamp + ONE_HOUR,
            0
        );

        vm.prank(alice);
        nft.mint(newTokenId);
        
        assertEq(nft.balanceOf(alice, 0), 1);
        assertEq(nft.balanceOf(alice, newTokenId), 1);
    }
}
