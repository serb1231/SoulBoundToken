import { ethers } from "hardhat";

async function main() {

    const NATIONAL_ID_ADDR = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const VOTING_ADDR      = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
    
    // candidates to test with
    const VALID_CANDIDATE   = "Alice"; 
    const INVALID_CANDIDATE = "Mickey Mouse";

    const [citizen] = await ethers.getSigners();
    console.log(`Testing with Main User (Citizen): ${citizen.address}`);

    // Connect to contracts
    const NationalID = await ethers.getContractAt("NationalID", NATIONAL_ID_ADDR, citizen);
    const Voting     = await ethers.getContractAt("VotingStation", VOTING_ADDR, citizen);


    // be sure citizen has a National ID
    console.log("\n    Verifying National ID");
    const balance = await NationalID.balanceOf(citizen.address);
    if (balance == 0n) {
        console.log("    Main user needs an ID first. Minting");
        await (await NationalID.safeMint(citizen.address)).wait();
        console.log("Good: ID Minted.");
    } else {
        console.log("Good: User already has a National ID. Ready to vote.");
    }


    // trying to vote for invalid candidate
    console.log("\n\n------------------------------------------------------");
    console.log("      Voting for Invalid Candidate (Mickey Mouse)");
    console.log("------------------------------------------------------");

    try {
        console.log(`   Attempting to vote for: "${INVALID_CANDIDATE}"`);
        const tx = await Voting.vote(INVALID_CANDIDATE);
        await tx.wait();
        console.log("BAD: Vote Succeeded? (Logic is broken, should only allow valid candidates!)");
    } catch (error: any) {
        if (error.message.includes("Invalid candidate")) {
            console.log("GOOD: Blocked as expected.");
            console.log("      Reason: Candidate is not in the official list.");
        } else {
            if (error.message.includes("You have already voted")) {
                console.log("NOTE: You have already voted in a previous run, so cannot test invalid candidate voting. If you are sure you haven't, please reset the contracts and try again.");
            } else {
                console.log("BAD: Failed for unexpected reason:", error.shortMessage);
            }
        }
    }


    // vote without a National ID
    console.log("\n\n------------------------------------------------------");
    console.log("      Hacker trying to vote without ID");
    console.log("------------------------------------------------------");

    // create a random temporary wallet (The Hacker)
    const HACKER_PRIVATE_KEY = "0xea6c44ac03bff858b476bba40716402b03e41b8e97e276d1baec7c37d42484a0";
    const hacker = new ethers.Wallet(HACKER_PRIVATE_KEY, ethers.provider);

    console.log(`   Using Hacker Wallet: ${hacker.address}`);
    
    // Connect the contract as the hacker
    const hackerVoting = Voting.connect(hacker);

    try {
        console.log(`   Hacker attempting to vote for: "${VALID_CANDIDATE}"`);
        // This should fail because hacker has 0 balance in NationalID contract
        const tx = await hackerVoting.vote(VALID_CANDIDATE); 
        await tx.wait();
        console.log("BAD: Hacker Voted successfully! (Security failed!)");
    } catch (error: any) {
        if (error.message.includes("Must have National ID")) {
            console.log("GOOD: Blocked as expected.");
            console.log("      Reason: Hacker does not hold a Soulbound Token.");
        } else {
            console.log("BAD: Failed for unexpected reason:", error.shortMessage);
        }
    }


    // successful voting
    console.log("\n\n------------------------------------------------------");
    console.log("      Valid Citizen Voting for Valid Candidate");
    console.log("------------------------------------------------------");

    try {
        // Check if we already voted in a previous run
        const alreadyVoted = await Voting.hasVoted(citizen.address);
        
        if (alreadyVoted) {
            console.log("    Skipping: You have already voted in a previous run.");
        } else {
            console.log(`   Voting for: "${VALID_CANDIDATE}"`);
            const tx = await Voting.vote(VALID_CANDIDATE);
            console.log(`   Tx Sent: ${tx.hash}`);
            await tx.wait();
            console.log("GOOD: Vote Cast Successfully!");
            
            // Verify count
            const votes = await Voting.votesReceived(VALID_CANDIDATE);
            console.log(`   Current Votes for ${VALID_CANDIDATE}: ${votes.toString()}`);
        }

    } catch (error: any) {
        console.log("BAD: Vote Failed:", error.shortMessage || error.message);
    }


    // test double voting
    console.log("\n\n------------------------------------------------------");
    console.log("      Trying to Vote TWICE");
    console.log("------------------------------------------------------");

    try {
        console.log(`   Attempting to vote AGAIN for: "${VALID_CANDIDATE}"`);
        const tx = await Voting.vote(VALID_CANDIDATE);
        await tx.wait();
        console.log("BAD: Double Vote Succeeded! (Logic is broken)");
    } catch (error: any) {
        if (error.message.includes("You have already voted")) {
            console.log("GOOD: Blocked as expected.");
            console.log("      Reason: Address is marked as 'hasVoted'.");
        } else {
            console.log("BAD: Failed for unexpected reason:", error.shortMessage);
        }
    }

    // try testing to see if, after multiple people are voting, the counts are correct, and a winner can be determined.
    console.log("\n\n------------------------------------------------------");
    console.log("      MULTI-VOTER TESTING");
    console.log("------------------------------------------------------");

    const ADDITIONAL_ACCOUNT = [
        "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
        "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
        "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
        "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"
    ];
    // comment to tell users that if they run the test 2 times, the voters will have already voted.
    console.log("\n\n   Note: If you run this test multiple times, the voters will not be able to vote again, and you will get BAD messages");
    for (const pk of ADDITIONAL_ACCOUNT) {
        const voter = new ethers.Wallet(pk, ethers.provider);
        const voterID = NationalID.connect(voter);
        const voterVoting = Voting.connect(voter);
        console.log(`\n   New Voter: ${voter.address}`);

        try {
            // ensure they have an ID
            const idBalance = await voterID.balanceOf(voter.address);
            if (idBalance == 0n) {
                console.log("   No National ID found. Minting one.");
                await (await NationalID.safeMint(voter.address)).wait();
                console.log("GOOD: ID Minted.");
            }
        } catch (error: any) {
            console.log("BAD: Error during ID check/mint:", error.shortMessage || error.message);
        }

        // try to vote
        try {
            console.log(`   Voting for: "${VALID_CANDIDATE}"`);
            const tx = await voterVoting.vote(VALID_CANDIDATE);
            console.log(`   Tx Sent: ${tx.hash}`);
            await tx.wait();
            console.log("GOOD: Vote Cast Successfully!");
        } catch (error: any) {
            console.log("BAD: Vote Failed:", error.shortMessage || error.message);
        }

        // check current votes
        try {
            const votes = await Voting.votesReceived(VALID_CANDIDATE);
            console.log(`   Current Votes for ${VALID_CANDIDATE}: ${votes.toString()}`);
            // count that the votes are at least equal to number of voters so far

        } catch (error: any) {
            console.log("BAD: Could not retrieve vote count:", error.shortMessage || error.message);
        }
    }

    // check for winner
    console.log("\n   Checking for Winner");
    try {
        const winner = await Voting.winner();
        if (winner === VALID_CANDIDATE) {
            console.log(`GOOD: Winner is correctly set to "${winner}" after reaching vote threshold.`);
        } else {
            console.log(`BAD: Winner is set to "${winner}", expected "${VALID_CANDIDATE}".`);
        }
    } catch (error: any) {
        console.log("BAD: Could not retrieve winner:", error.shortMessage || error.message);
    }

    // test voting after winner declared
    console.log("\n\n------------------------------------------------------");
    console.log("      Attempting to Vote After Winner Declared");
    console.log("------------------------------------------------------");

    // try to vote one more time after winner declared. This should fail.
    const LATE_VOTER_PK = "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e";
    const lateVoter = new ethers.Wallet(LATE_VOTER_PK, ethers.provider);
    const lateVoterID = NationalID.connect(lateVoter);
    const lateVoterVoting = Voting.connect(lateVoter);
    console.log("\n   Late Voter Attempting to Vote After Winner Declared");

    try {
        // ensure they have an ID
        const idBalance = await lateVoterID.balanceOf(lateVoter.address);
        if (idBalance == 0n) {
            console.log("   No National ID found. Minting one.");
            await (await NationalID.safeMint(lateVoter.address)).wait();
            console.log("GOOD: ID Minted.");
        }
        console.log(`   Late Voter attempting to vote for: "${VALID_CANDIDATE}"`);
        const tx = await lateVoterVoting.vote(VALID_CANDIDATE);
        await tx.wait();
        console.log("BAD: Late Vote Succeeded! (Logic is broken)");
    } catch (error: any) {
        if (error.message.includes("Voting has ended")) {
            console.log("GOOD: Blocked as expected.");
            console.log("      Reason: Voting has been closed after winner declaration.");
        } else {
            console.log("BAD: Failed for unexpected reason:", error.shortMessage);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});