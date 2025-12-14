import { ethers } from "hardhat";
import * as readline from "readline";
import { NationalID } from "../typechain-types";

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

        // get the admin wallet
        const allSigners = await ethers.getSigners();

        const adminWallet = allSigners[0];


        // display citizens
        console.log("Which citizen are you?");
        // w is the current wallet object, index is just the number "i".
        allSigners.forEach((w, index) => {
            // if it is the owner, display something extra
            const label = (index === 0) ? " (Admin/Deployer)" : "";
            console.log(` [${index}] ${w.address}${label}`);
        });

        // select the citizen
        const selectionStr = await ask("\nSelect number (0-5): ");
        const selectionIndex = parseInt(selectionStr);

        // would give error if we selected outside the interval
        if (isNaN(selectionIndex) || selectionIndex < 0 || selectionIndex >= allSigners.length) {
            throw new Error("Invalid selection. Please run the script again.");
        }

        // display nice message
        const citizen = allSigners[selectionIndex];
        console.log(`\n> Authenticating as: ${citizen.address}...`);

        const adminIDAccount = await ethers.getContractAt("NationalID", NATIONAL_ID_ADDR, adminWallet);

        const voterAccount = await ethers.getContractAt("VotingStation", VOTING_ADDR, citizen);

        // get the balance of the voter.
        var balance = await adminIDAccount.balanceOf(citizen.address);

        // display balance
        console.log(`\n> Verified Voter ID Tokens: ${balance.toString()}\n`);

        const tx = await adminIDAccount.safeMint(citizen.address);

        await tx.wait();
        balance = await adminIDAccount.balanceOf(citizen.address);
        console.log(`\n> Verified Voter ID Tokens: ${balance.toString()}\n`);
    }
     catch (err: any) {
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