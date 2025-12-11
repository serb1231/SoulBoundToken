// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Test.sol";
import "../contracts/NationalID.sol"; 

contract NationalIDAdvancedTest is Test {
    NationalID nationalID;
    address owner = address(0x123);
    address attacker = address(0x666);

    function setUp() public {
        vm.prank(owner);
        nationalID = new NationalID(owner);
    }

    // test that nobody can transfer
    function testFuzz_TransfersAreBlocked(address user, address receiver) public {
        vm.assume(user != address(0) && receiver != address(0));
        vm.assume(user != receiver);
        
        // mint a token
        vm.prank(owner);
        uint256 tokenId = nationalID.safeMint(user);

        // try to transfer it
        vm.startPrank(user);
        
        // it should fail
        vm.expectRevert("Soulbound: Transfer failed");
        nationalID.transferFrom(user, receiver, tokenId);
        
        vm.stopPrank();
    }

    // test that a user cannot mint twice
    function testFuzz_CannotMintTwice(address user) public {
        vm.assume(user != address(0));
        vm.assume(user != address(nationalID));

        // mint once
        vm.prank(owner);
        nationalID.safeMint(user);

        // second mint must fail
        vm.prank(owner);
        vm.expectRevert("Identity: User already has a token!");
        nationalID.safeMint(user);
    }

    // test that only owner can mint
    function testFuzz_OnlyOwnerCanMint(address randomCaller, address victim) public {
        vm.assume(randomCaller != owner);
        vm.assume(victim != address(0));

        // Try to mint from a non-owner account
        vm.prank(randomCaller);
        
        // it should fail
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, randomCaller));
        nationalID.safeMint(victim);
    }

    // test that pausing prevents minting
    function test_PauseBlocksMinting() public {
        // pause the contract
        vm.prank(owner);
        nationalID.pause();

        // try to mint
        vm.prank(owner);
        
        // expect error
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        nationalID.safeMint(address(0xABC));
    }
}