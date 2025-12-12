import { ethers } from "hardhat";

async function main() {

    const NATIONAL_ID_ADDR = "0xaAAdbB70a236C8603C925FcD82cf3664307e2B32";
    // const VOTING_ADDR      = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
    
    // candidates to test with
    const VALID_CANDIDATE   = "Alice"; 
    const INVALID_CANDIDATE = "Mickey Mouse";

    const [citizen] = await ethers.getSigners();
    console.log(`Testing with Main User (Citizen): ${citizen.address}`);

    // Connect to contracts
    const NationalID = await ethers.getContractAt("NationalID", NATIONAL_ID_ADDR, citizen);
    // const Voting     = await ethers.getContractAt("VotingStation", VOTING_ADDR, citizen);


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
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});