// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {PresentationNFT} from "../src/PresentationNFT.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

contract PresentationNFTTest is Test {
    PresentationNFT public nft;
    
    address public owner = makeAddr("owner");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    
    uint256 public constant ONE_HOUR = 3600;
    uint256 public constant ONE_DAY = 86400;

    function setUp() public {
        vm.prank(owner);
        nft = new PresentationNFT("", owner);
    }

    function test_InitialState() public view {
        assertTrue(nft.hasRole(nft.ADMIN_ROLE(), owner));
        assertTrue(nft.hasRole(nft.DEFAULT_ADMIN_ROLE(), owner));
        assertEq(nft.presentationCount(), 0);
    }

    function test_CreatePresentation() public {
        vm.prank(owner);
        uint256 tokenId = nft.createPresentation(
            "Abstract 101",
            "Learn the basics",
            "ipfs://image",
            block.timestamp,
            block.timestamp + ONE_HOUR,
            100
        );

        assertEq(tokenId, 0);
        assertEq(nft.presentationCount(), 1);

        PresentationNFT.Presentation memory pres = nft.getPresentation(0);
        assertEq(pres.name, "Abstract 101");
        assertEq(pres.description, "Learn the basics");
        assertEq(pres.imageUri, "ipfs://image");
        assertEq(pres.maxSupply, 100);
        assertTrue(pres.isActive);
    }

    function test_CreatePresentation_OnlyAdmin() public {
        vm.prank(alice);
        vm.expectRevert();
        nft.createPresentation(
            "Test",
            "Test",
            "ipfs://test",
            block.timestamp,
            block.timestamp + ONE_HOUR,
            0
        );
    }

    function test_CreatePresentation_InvalidTimeWindow() public {
        vm.prank(owner);
        vm.expectRevert(PresentationNFT.InvalidTimeWindow.selector);
        nft.createPresentation(
            "Test",
            "Test", 
            "ipfs://test",
            block.timestamp + ONE_HOUR,
            block.timestamp,
            0
        );
    }

    function test_Mint() public {
        _createActivePresentation();

        vm.prank(alice);
        nft.mint(0);

        assertEq(nft.balanceOf(alice, 0), 1);
        assertEq(nft.totalSupply(0), 1);
        assertTrue(nft.hasMinted(alice, 0));
    }

    function test_Mint_EmitsEvent() public {
        _createActivePresentation();

        vm.prank(alice);
        vm.expectEmit(true, true, false, false);
        emit PresentationNFT.NFTMinted(alice, 0);
        nft.mint(0);
    }

    function test_Mint_AlreadyMinted() public {
        _createActivePresentation();

        vm.startPrank(alice);
        nft.mint(0);
        
        vm.expectRevert(PresentationNFT.AlreadyMinted.selector);
        nft.mint(0);
        vm.stopPrank();
    }

    function test_Mint_InvalidPresentation() public {
        vm.prank(alice);
        vm.expectRevert(PresentationNFT.InvalidPresentation.selector);
        nft.mint(999);
    }

    function test_Mint_NotActive() public {
        _createActivePresentation();

        vm.prank(owner);
        nft.setMintingActive(0, false);

        vm.prank(alice);
        vm.expectRevert(PresentationNFT.MintingNotActive.selector);
        nft.mint(0);
    }

    function test_Mint_NotStarted() public {
        vm.prank(owner);
        nft.createPresentation(
            "Future",
            "Future event",
            "ipfs://future",
            block.timestamp + ONE_DAY,
            block.timestamp + ONE_DAY + ONE_HOUR,
            0
        );

        vm.prank(alice);
        vm.expectRevert(PresentationNFT.MintingNotStarted.selector);
        nft.mint(0);
    }

    function test_Mint_Ended() public {
        vm.prank(owner);
        nft.createPresentation(
            "Past",
            "Past event",
            "ipfs://past",
            block.timestamp,
            block.timestamp + ONE_HOUR,
            0
        );

        vm.warp(block.timestamp + ONE_HOUR + 1);

        vm.prank(alice);
        vm.expectRevert(PresentationNFT.MintingEnded.selector);
        nft.mint(0);
    }

    function test_Mint_MaxSupplyReached() public {
        vm.prank(owner);
        nft.createPresentation(
            "Limited",
            "Limited edition",
            "ipfs://limited",
            block.timestamp,
            block.timestamp + ONE_HOUR,
            2
        );

        vm.prank(alice);
        nft.mint(0);

        vm.prank(bob);
        nft.mint(0);

        address charlie = makeAddr("charlie");
        vm.prank(charlie);
        vm.expectRevert(PresentationNFT.MaxSupplyReached.selector);
        nft.mint(0);
    }

    function test_SetMintingActive() public {
        _createActivePresentation();

        vm.prank(owner);
        nft.setMintingActive(0, false);

        PresentationNFT.Presentation memory pres = nft.getPresentation(0);
        assertFalse(pres.isActive);

        vm.prank(owner);
        nft.setMintingActive(0, true);

        pres = nft.getPresentation(0);
        assertTrue(pres.isActive);
    }

    function test_SetMintingActive_OnlyAdmin() public {
        _createActivePresentation();

        vm.prank(alice);
        vm.expectRevert();
        nft.setMintingActive(0, false);
    }

    function test_UpdateTimeWindow() public {
        _createActivePresentation();

        uint256 newStart = block.timestamp + ONE_HOUR;
        uint256 newEnd = block.timestamp + ONE_DAY;

        vm.prank(owner);
        nft.updateTimeWindow(0, newStart, newEnd);

        PresentationNFT.Presentation memory pres = nft.getPresentation(0);
        assertEq(pres.startTime, newStart);
        assertEq(pres.endTime, newEnd);
    }

    function test_UpdateTimeWindow_InvalidWindow() public {
        _createActivePresentation();

        vm.prank(owner);
        vm.expectRevert(PresentationNFT.InvalidTimeWindow.selector);
        nft.updateTimeWindow(0, block.timestamp + ONE_HOUR, block.timestamp);
    }

    function test_CanMint() public {
        _createActivePresentation();

        assertTrue(nft.canMint(0, alice));

        vm.prank(alice);
        nft.mint(0);

        assertFalse(nft.canMint(0, alice));
        assertTrue(nft.canMint(0, bob));
    }

    function test_CanMint_InvalidPresentation() public view {
        assertFalse(nft.canMint(999, alice));
    }

    function test_GetActivePresentations() public {
        vm.startPrank(owner);
        nft.createPresentation("A", "A", "ipfs://a", block.timestamp, block.timestamp + ONE_HOUR, 0);
        nft.createPresentation("B", "B", "ipfs://b", block.timestamp, block.timestamp + ONE_HOUR, 0);
        nft.createPresentation("C", "C", "ipfs://c", block.timestamp, block.timestamp + ONE_HOUR, 0);
        
        nft.setMintingActive(1, false);
        vm.stopPrank();

        uint256[] memory active = nft.getActivePresentations();
        assertEq(active.length, 2);
        assertEq(active[0], 0);
        assertEq(active[1], 2);
    }

    function test_Uri_OnChainMetadata() public {
        _createActivePresentation();

        string memory uri = nft.uri(0);
        assertTrue(bytes(uri).length > 0);
        assertTrue(_startsWith(uri, "data:application/json;base64,"));
    }

    function test_Uri_BaseUri() public {
        vm.prank(owner);
        PresentationNFT nftWithBase = new PresentationNFT("https://api.example.com/metadata/", owner);

        vm.prank(owner);
        nftWithBase.createPresentation(
            "Test",
            "Test",
            "ipfs://test",
            block.timestamp,
            block.timestamp + ONE_HOUR,
            0
        );

        string memory uri = nftWithBase.uri(0);
        assertEq(uri, "https://api.example.com/metadata/0.json");
    }

    function test_MultiplePresentations() public {
        vm.startPrank(owner);
        nft.createPresentation("P1", "D1", "ipfs://1", block.timestamp, block.timestamp + ONE_HOUR, 0);
        nft.createPresentation("P2", "D2", "ipfs://2", block.timestamp, block.timestamp + ONE_HOUR, 0);
        vm.stopPrank();

        vm.prank(alice);
        nft.mint(0);

        vm.prank(alice);
        nft.mint(1);

        assertEq(nft.balanceOf(alice, 0), 1);
        assertEq(nft.balanceOf(alice, 1), 1);
        assertTrue(nft.hasMinted(alice, 0));
        assertTrue(nft.hasMinted(alice, 1));
    }

    function _createActivePresentation() internal {
        vm.prank(owner);
        nft.createPresentation(
            "Test Presentation",
            "A test presentation",
            "ipfs://test-image",
            block.timestamp,
            block.timestamp + ONE_HOUR,
            0
        );
    }

    function _startsWith(string memory str, string memory prefix) internal pure returns (bool) {
        bytes memory strBytes = bytes(str);
        bytes memory prefixBytes = bytes(prefix);
        
        if (strBytes.length < prefixBytes.length) return false;
        
        for (uint256 i = 0; i < prefixBytes.length; i++) {
            if (strBytes[i] != prefixBytes[i]) return false;
        }
        return true;
    }

    function testFuzz_Mint_DifferentUsers(address user) public {
        vm.assume(user != address(0));
        vm.assume(user != owner);
        vm.assume(uint160(user) > 0xFFFF);
        vm.assume(user.code.length == 0);
        
        _createActivePresentation();
        
        vm.prank(user);
        nft.mint(0);
        
        assertEq(nft.balanceOf(user, 0), 1);
        assertTrue(nft.hasMinted(user, 0));
    }

    function testFuzz_CreatePresentation_TimeWindow(uint256 startOffset, uint256 duration) public {
        startOffset = bound(startOffset, 0, 365 days);
        duration = bound(duration, 1, 365 days);
        
        uint256 startTime = block.timestamp + startOffset;
        uint256 endTime = startTime + duration;
        
        vm.prank(owner);
        uint256 tokenId = nft.createPresentation(
            "Fuzz Test",
            "Fuzz description",
            "ipfs://fuzz",
            startTime,
            endTime,
            0
        );
        
        PresentationNFT.Presentation memory pres = nft.getPresentation(tokenId);
        assertEq(pres.startTime, startTime);
        assertEq(pres.endTime, endTime);
    }

    function testFuzz_MaxSupply(uint256 maxSupply) public {
        maxSupply = bound(maxSupply, 1, 1000);
        
        vm.prank(owner);
        nft.createPresentation(
            "Limited",
            "Limited edition",
            "ipfs://limited",
            block.timestamp,
            block.timestamp + ONE_HOUR,
            maxSupply
        );
        
        PresentationNFT.Presentation memory pres = nft.getPresentation(0);
        assertEq(pres.maxSupply, maxSupply);
    }

    function test_Uri_NonExistentToken() public view {
        string memory uri = nft.uri(999);
        assertEq(uri, "");
    }

    function test_CanMint_AllConditions() public {
        _createActivePresentation();

        assertTrue(nft.canMint(0, alice));

        vm.prank(owner);
        nft.setMintingActive(0, false);
        assertFalse(nft.canMint(0, alice));

        vm.prank(owner);
        nft.setMintingActive(0, true);
        assertTrue(nft.canMint(0, alice));

        vm.prank(alice);
        nft.mint(0);
        assertFalse(nft.canMint(0, alice));
        assertTrue(nft.canMint(0, bob));
    }

    // ============ AccessControl Tests ============

    function test_HasAdminRole() public view {
        assertTrue(nft.hasRole(nft.ADMIN_ROLE(), owner));
    }

    function test_HasDefaultAdminRole() public view {
        assertTrue(nft.hasRole(nft.DEFAULT_ADMIN_ROLE(), owner));
    }

    function test_NonAdminDoesNotHaveRole() public view {
        assertFalse(nft.hasRole(nft.ADMIN_ROLE(), alice));
        assertFalse(nft.hasRole(nft.DEFAULT_ADMIN_ROLE(), alice));
    }

}
