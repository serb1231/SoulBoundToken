// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract VotingStation {
    // predefined candidates
    string[] candidates;

    // addresses that have voted
    mapping(address => bool) public hasVoted;

    // keep track of votes received
    mapping(string => uint256) public votesReceived;

    // bool to denote that voting is active
    bool public votingActive = true;

    // the winner
    string public winner = "";

    // store the address of the national ID contract
    // in order to verify identity
    IERC721 constant public nationalIdContract;

    // set the address of the National ID contract
    constructor(address _nationalIdAddress, string[] memory _candidates) {
        nationalIdContract = IERC721(_nationalIdAddress);
        candidates = _candidates;
    }

    function vote(string memory candidate) public {
        
        // check that the voter has a national ID
        require(nationalIdContract.balanceOf(msg.sender) > 0, "Must have National ID to vote!");
        // check that the voter has not already voted
        require(!hasVoted[msg.sender], "You have already voted!");
        // check that voting is still active
        require(votingActive, "Voting has ended!");

        // check that the candidate is valid
        bool validCandidate = false;
        uint256 candidateLength = candidate.length;
        for (uint256 i = 0; i < candidateLength; i++) {
            // solidity doesn't know how to compare strings, hence pack it as a set of bytes, and compare
            // the hash of those bytes
            if (keccak256(abi.encodePacked(candidates[i])) == keccak256(abi.encodePacked(candidate))) {
                validCandidate = true;
                break;
            }
        }
        require(validCandidate, "Invalid candidate!");

        // record the vote
        votesReceived[candidate] += 1;
        hasVoted[msg.sender] = true;

        // when we reach a number of votes, no longer let voting, and display the winner
        if (votesReceived[candidate] >= 5) {
            votingActive = false;
            winner = candidate;
        }
    }
}