import { expect } from "chai";
import { ethers } from "hardhat";

describe("Voting System Tests", function () {
    let contractNationalID: any;
    let contractVotingStation: any;
    let goodCandidate: "Alice";
    let badCandidate: "Mickey Mouse";
    let candidateList: string[];
    let user: any;
    let hacker: any;
    let otherUser: any;
    let list5Users: any[];
    let allSigners: any[];

    // This runs before every test to give a fresh start
    beforeEach(async function () {
        allSigners = await ethers.getSigners();
        user = allSigners[0];
        hacker = allSigners[1];
        otherUser = allSigners[2];

        list5Users = allSigners.slice(3, 8);
        
        // Get Contract Factories
        const FactoryNationalID = await ethers.getContractFactory("NationalID");
        const FactoryVotingStation = await ethers.getContractFactory("VotingStation");

        // Deploy National ID
        contractNationalID = await FactoryNationalID.deploy(user.address); 
        await contractNationalID.waitForDeployment();

        goodCandidate = "Alice";
        badCandidate = "Mickey Mouse";
        candidateList = [goodCandidate];
        contractVotingStation = await FactoryVotingStation.deploy(contractNationalID.target, candidateList);
        await contractVotingStation.waitForDeployment();
    });

    // vote for invalid candidate
    it("Should fail to vote for an invalid candidate", async function () {
        // mint the National ID first
        await contractNationalID.safeMint(user.address);

        // Verify we have the ID
        expect(await contractNationalID.balanceOf(user.address)).to.equal(1n);

        // try to vote for an invalid candidate
        await expect(
            contractVotingStation.vote(badCandidate)
        ).to.be.revertedWith("Invalid candidate!");
    });

  
    // hacker trying to vote without national ID
    it("Should fail if a user without National ID tries to vote", async function () {
        // hacker tries to vote without national ID
        await expect(
            contractVotingStation.connect(hacker).vote(goodCandidate)
        ).to.be.revertedWith("Must have National ID to vote!");
    });
    


    // trying to vote twice
    it("Should fail if user tries to vote twice", async function () {
        // give user national id first
        await contractNationalID.safeMint(user.address);
        await contractVotingStation.vote(goodCandidate);
        // verify that user has voted
        expect(await contractVotingStation.hasVoted(user.address)).to.equal(true);

        // try voting again
        await expect(
            contractVotingStation.vote(goodCandidate)
        ).to.be.revertedWith("You have already voted!");
    });

    // check that if vote is counted
    it("Should successfully count a valid vote", async function () {
        // mint the National ID first
        await contractNationalID.safeMint(user.address);
        await contractVotingStation.vote(goodCandidate);

        // Verify that the vote count for the candidate increased
        const votes = await contractVotingStation.votesReceived(goodCandidate);
        expect(votes).to.equal(1n);

        // check that the other user can vote too
        await contractNationalID.safeMint(otherUser.address);
        await contractVotingStation.connect(otherUser).vote(goodCandidate);
        const updatedVotes = await contractVotingStation.votesReceived(goodCandidate);
        expect(updatedVotes).to.equal(2n);
    });

    // check that after 5 votes, a winner is declared
    it("Should declare the correct winner after multiple votes", async function () {
        // mint National IDs and vote for the good candidate
        for (const voter of [...list5Users]) {
            await contractNationalID.safeMint(voter.address);
            await contractVotingStation.connect(voter).vote(goodCandidate);
        }
        // Now check the winner
        const winner = await contractVotingStation.winner();
        expect(winner).to.equal(goodCandidate);
    });

    // check that after declaring winner, no more votes can be cast
    it("Should not allow voting after winner is declared", async function () {
        // mint National IDs and vote for the good candidate
        for (const voter of list5Users) {
            await contractNationalID.safeMint(voter.address);
            await contractVotingStation.connect(voter).vote(goodCandidate);
        }
        // Declare the winner
        const winner = await contractVotingStation.winner();
        // Now try to vote again with the original user

        await contractNationalID.safeMint(user.address);

        await expect(
            contractVotingStation.vote(goodCandidate)
        ).to.be.revertedWith("Voting has ended!");
    });

});