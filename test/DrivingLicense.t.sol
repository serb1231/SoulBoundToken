// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Test.sol";
import "../contracts/DrivingLicense.sol"; 
import "../contracts/NationalID.sol";

contract DrivingLicenseAdvancedTest is Test {
    DrivingLicense drivingLicense;
    NationalID nationalID;
    
    address owner = address(0x123);

    function setUp() public {
        vm.prank(owner);
        nationalID = new NationalID(owner);
        // Driving License needs the address of the NationalID contract
        drivingLicense = new DrivingLicense(address(nationalID));
    }

    // test that a user with an ID can successfully mint a license (Happy Path)
    function testFuzz_MintSuccess(address user) public {
        vm.assume(user != address(0));
        vm.assume(user != address(drivingLicense));
        vm.assume(user != address(nationalID));

        // get National ID first
        vm.prank(owner);
        nationalID.safeMint(user);

        // mint Driving License
        vm.prank(user);
        drivingLicense.mintLicense();

        // verify balance
        assertEq(drivingLicense.balanceOf(user), 1);
    }

    // test that we cannot mint a driving license without a national ID
    function testFuzz_CannotMintWithoutID(address user) public {
        vm.assume(user != address(0));
        
        // ensure user has 0 ID balance
        if (nationalID.balanceOf(user) == 0) {
            vm.prank(user);
            vm.expectRevert("Must have National ID first!");
            drivingLicense.mintLicense();
        }
    }

    // test that we cannot mint a Driving License twice
    function testFuzz_DrivingLicense_CannotMintTwice(address user) public {
        vm.assume(user != address(0));
        vm.assume(user != address(drivingLicense));
        vm.assume(user != address(nationalID));

        // get National ID
        vm.prank(owner);
        nationalID.safeMint(user);

        // mint Driving License first time
        vm.prank(user);
        drivingLicense.mintLicense();

        // mint Driving License second time (Should Fail)
        vm.prank(user);
        vm.expectRevert("Already have a license");
        drivingLicense.mintLicense();
    }

    // test that we cannot mint a National ID twice (System Integrity)
    function testFuzz_NationalID_CannotMintTwice(address user) public {
        vm.assume(user != address(0));
        vm.assume(user != address(nationalID));

        // mint ID once
        vm.prank(owner);
        nationalID.safeMint(user);

        // mint ID second time (Should Fail)
        vm.prank(owner);
        vm.expectRevert("Identity: User already has a token!");
        nationalID.safeMint(user);
    }

    // test that transfers of National ID are blocked (Soulbound check)
    function testFuzz_NationalID_TransfersBlocked(address user, address receiver) public {
        vm.assume(user != address(0) && receiver != address(0));
        vm.assume(user != receiver);
        
        // mint ID
        vm.prank(owner);
        uint256 tokenId = nationalID.safeMint(user);

        // try to transfer ID
        vm.startPrank(user);
        vm.expectRevert("Soulbound: Transfer failed");
        nationalID.transferFrom(user, receiver, tokenId);
        vm.stopPrank();
    }
}