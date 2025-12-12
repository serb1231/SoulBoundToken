import { ethers } from "hardhat";

async function main() {

    const NATIONAL_ID_ADDR = "0xaAAdbB70a236C8603C925FcD82cf3664307e2B32";
    const VOTING_ADDR      = "0x0E7116EBc11461C523Fe9511f19636d8290fa09D";
    
    // candidates to test with
    const VALID_CANDIDATE   = "Alice"; 
    const INVALID_CANDIDATE = "Mickey Mouse";

    const [citizen] = await ethers.getSigners();
    console.log(`Testing with Main User (Citizen): ${citizen.address}`);

    // Connect to contracts
    const NationalID = await ethers.getContractAt("NationalID", NATIONAL_ID_ADDR, citizen);
    const Voting     = await ethers.getContractAt("VotingStation", VOTING_ADDR, citizen);

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
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});