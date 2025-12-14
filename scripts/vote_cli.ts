import { ethers } from "hardhat";
import * as readline from "readline";

const NATIONAL_ID_ADDR = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const VOTING_ADDR      = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

async function main() {
    // read the input
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (query: string): Promise<string> => new Promise((resolve) => rl.question(query, resolve));

    
    try {
        console.log("\n============================================");
        console.log("      VOTING STATION CLI");
        console.log("============================================\n");

        // the admin "owner" is the first signer apparently
        const wallets = await ethers.getSigners();
        const adminSigner = wallets[0];


        // display citizens
        console.log("Which citizen are you?");
        // w is the current wallet object, index is just the number "i".
        wallets.forEach((w, index) => {
            // if it is the owner, display something extra
            const label = (index === 0) ? " (Admin/Deployer)" : "";
            console.log(` [${index}] ${w.address}${label}`);
        });

        // select the citizen
        const selectionStr = await ask("\nSelect number (0-19): ");
        const selectionIndex = parseInt(selectionStr);

        // would give error if we selected outside the interval
        if (isNaN(selectionIndex) || selectionIndex < 0 || selectionIndex >= wallets.length) {
            throw new Error("Invalid selection. Please run the script again.");
        }

        // display nice message
        const citizen = wallets[selectionIndex];
        console.log(`\n> Authenticating as: ${citizen.address}...`);

        // this means that we are connected as the admin on this specific instance of contract
        const adminIDContract = await ethers.getContractAt("NationalID", NATIONAL_ID_ADDR, adminSigner);

        // we are a citizen being connected to this contract, getting an ID
        const citizenIDContract = await ethers.getContractAt("NationalID", NATIONAL_ID_ADDR, citizen);

        // we are connected to the voting contract as the CITIZEN, NOT OWNER
        const citizenVoting = await ethers.getContractAt("VotingStation", VOTING_ADDR, citizen);

        // this is the function to call to get the number of soulbound tokens
        console.log("> Verifying National ID...");
        const balance = await citizenIDContract.balanceOf(citizen.address);
        
        // in case there is no id, mint one
        if (balance == 0n) {
            console.log("  No ID found. Requesting Admin to mint ID...");
            
            // as the admin, we pass the citizen public address in order to mint them a soulbound token
            try {
                // the minting logic. We have to wait for a response
                const mintTx = await adminIDContract.safeMint(citizen.address);
                await mintTx.wait();
                console.log("  GOOD: National ID Minted successfully by Admin.");
            } catch (err: any) {
                console.log("  BAD: Minting Failed. Are you sure account [0] is the contract owner?");
                throw err;
            }
        } else {
            console.log("  (ok) National ID Verified.");
        }

        // check that the account had not voted (in order to advice not to double vote)
        const hasVoted = await citizenVoting.hasVoted(citizen.address);
        if (hasVoted) {
            console.log("\nWARNING: This citizen has already voted.");
        }

        // ask the user which candidate they would like to vote
        const candidateName = await ask("\nWhich candidate would you like to vote for? (Alice OR Bob): ");
        if (!candidateName) {
            throw new Error("Candidate name cannot be empty.");
        }

        // execute the vote
        console.log(`\n> Casting vote for: "${candidateName}"...`);
        
        try {
            // Here we use the citizen's connection to vote
            const tx = await citizenVoting.vote(candidateName);
            console.log(`  Tx Sent: ${tx.hash}`);
            console.log("  Waiting for confirmation...");
            await tx.wait();
            
            console.log("\nSUCCESS: Vote has been cast!");
            
            const votes = await citizenVoting.votesReceived(candidateName);
            console.log(`  Total votes for ${candidateName}: ${votes.toString()}`);

        } catch (error: any) {
            let msg = error.message;
            if(msg.includes("Invalid candidate")) msg = "Candidate not allowed.";
            if(msg.includes("You have already voted")) msg = "You have already voted.";
            if(msg.includes("Voting has ended")) msg = "Voting is closed.";
            
            console.log("\nVOTE FAILED:", msg);
        }

    } catch (err: any) {
        console.error("\nERROR:", err.message || err);
    } finally {
        rl.close();
        // A small delay helps prevent the 'Assertion failed' error in some terminals
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});