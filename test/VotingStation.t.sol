// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Test.sol";
import "../contracts/VotingStation.sol";
import "../contracts/NationalID.sol"; 

contract VotingStationTest is Test {
    VotingStation votingStation;
    NationalID nationalID;
    
    address owner = address(0x123);
    
    // candidates
    string[] candidates;
    string validCandidate = "Alice";
    string anotherCandidate = "Bob";

    function setUp() public {
        // have to set up both contracts
        vm.prank(owner);
        nationalID = new NationalID(owner);

        // set up candidates
        candidates.push(validCandidate);
        candidates.push(anotherCandidate);

        // deploy voting station
        votingStation = new VotingStation(address(nationalID), candidates);
    }

    function test_VoteSuccess() public {
        address voter = address(0x1);
        
        // mint ID first (required)
        vm.prank(owner);
        nationalID.safeMint(voter);

        // cast vote
        vm.prank(voter);
        votingStation.vote(validCandidate);

        // check state
        assertEq(votingStation.votesReceived(validCandidate), 1);
        assertTrue(votingStation.hasVoted(voter));
    }

    // fuzz test: random users without ID should always be rejected
    function testFuzz_NoIdCannotVote(address randomVoter) public {
        vm.assume(randomVoter != address(0));
        
        // ensure this random address really doesn't have an ID
        // (Foundry might pick the same address twice, so we verify)
        if (nationalID.balanceOf(randomVoter) == 0) {
            vm.prank(randomVoter);
            vm.expectRevert("Must have National ID to vote!");
            votingStation.vote(validCandidate);
        }
    }

    // test that user cannot vote twice
    function test_DoubleVotingReverts() public {
        address voter = address(0x2);

        // mint ID
        vm.prank(owner);
        nationalID.safeMint(voter);

        // Vote 1
        vm.prank(voter);
        votingStation.vote(validCandidate);

        // vote 2 should revert
        vm.prank(voter);
        vm.expectRevert("You have already voted!");
        votingStation.vote(validCandidate);
    }

    // fuzz test: try to vote for random strings
    function testFuzz_InvalidCandidate(string memory fakeCandidate) public {
        // filter out the actual valid candidates from the random strings
        // to avoid false positives
        bytes32 fakeHash = keccak256(bytes(fakeCandidate));
        bytes32 validHash = keccak256(bytes(validCandidate));
        bytes32 anotherHash = keccak256(bytes(anotherCandidate));

        vm.assume(fakeHash != validHash && fakeHash != anotherHash);

        // create a valid voter
        address voter = address(0x3);
        vm.prank(owner);
        nationalID.safeMint(voter);

        // try to vote for the garbage string
        vm.prank(voter);
        vm.expectRevert("Invalid candidate!");
        votingStation.vote(fakeCandidate);
    }

    // test that winning condition triggers correctly
    function test_WinningConditionTriggers() public {
        // we need 5 distinct voters to trigger the limit
        for(uint160 i = 1; i <= 5; i++) {
            address voter = address(i); 
            
            // mint an id for them
            vm.prank(owner);
            nationalID.safeMint(voter);

            // have them vote
            vm.prank(voter);
            votingStation.vote(validCandidate);
        }

        // check winner logic
        assertEq(votingStation.votesReceived(validCandidate), 5);
        assertEq(votingStation.winner(), validCandidate);
        assertEq(votingStation.votingActive(), false);

        // test: 6th voter tries to vote AFTER winner is declared
        address lateVoter = address(0x6);
        vm.prank(owner);
        nationalID.safeMint(lateVoter);

        vm.prank(lateVoter);
        vm.expectRevert("Voting has ended!");
        votingStation.vote(validCandidate);
    }
}