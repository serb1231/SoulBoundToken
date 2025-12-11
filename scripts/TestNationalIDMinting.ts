import { ethers } from "hardhat";

async function main() {

    // contract address
    const NATIONAL_ID_ADDR = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

    // Connect to the contract
    const [user] = await ethers.getSigners();
    console.log(`   Using the user (us): ${user.address}`);
    const contract = await ethers.getContractAt("NationalID", NATIONAL_ID_ADDR, user);


    // try to mint a new token
    console.log("\n\n\n------------------------------------------------------\n");
    console.log("            Testing Mint Function\n");
    console.log("------------------------------------------------------\n");
    
    try {
        console.log("   Minting token to your address", user.address);
        
        // safeMint is the function
        const mintTx = await contract.safeMint(user.address);
        console.log(`   Transaction Sent: ${mintTx.hash}`);
        
        // Wait for the block to be mined
        await mintTx.wait();
        console.log("GOOD: Mint Successful!");
        // Check new balance (the number of tokens owned)
        const balance = await contract.balanceOf(user.address);
        console.log(`GOOD: New Balance: ${balance.toString()} Token(s)`);

    } catch (error: any) {
        console.error("BAD: Mint Failed:", error.shortMessage || error.message);
    }

    // Test that a citizen cannot mint 2 national IDs
    console.log("\n\n\n------------------------------------------------------\n");
    console.log("        Minting Multiple National ID's\n");
    console.log("------------------------------------------------------\n");

    try {
        console.log("   Minting ANOTHER National ID token to your address", user.address);
        
        // safeMint is the function
        const mintTx = await contract.safeMint(user.address);
        console.log(`   Transaction Sent: ${mintTx.hash}`);
        
        // Wait for the block to be mined
        await mintTx.wait();
        console.log("BAD: Mint Successful, altough we already have a token!");

        // Check new balance (the number of tokens owned)
        const balance = await contract.balanceOf(user.address);
        console.log(`BAD: New Balance: ${balance.toString()} Token(s). This should not happen!`);

    } catch (error: any) {
        // if it contains: Identity: User already has a token!
        if (error.message.includes("Identity: User already has a token")) {
            console.log("GOOD: Mint Failed as expected. User cannot have multiple National ID's.");
        } else {
            console.error("BAD: Mint Failed, but for an unexpected reason:");
            console.error(error.shortMessage || error.message);
        }
    }



    // Test that the token is Soulbound; try to transfer it
    console.log("\n\n\n------------------------------------------------------\n");
    console.log("        Testing Transfer (Expect Failure)\n");
    console.log("------------------------------------------------------\n");

    // We need a random address to try sending it to
    const randomReceiver = "0x000000000000000000000000000000000000dead"; 
    
    try {
        // each contract has a balance (internal function), so find
        // the balance of our account
        const balance = await contract.balanceOf(user.address);
        
        if (Number(balance) == 0) {
        console.log("Interesting: There are no tokens. Cannot test transfer.");
        return;
        }
        
        // get one of the tokens of the user (they should have exactly 1)
        // they shouldn't have multiple, as therough the contract we
        // permit them to have only 1 Soulbound token. Get the token
        // and try to transfer it.
        const tokenId = await contract.tokenOfOwnerByIndex(user.address, balance - 1n);
        console.log(`   Attempting to transfer Token ID: ${tokenId.toString()}`);
        console.log(`   From: ${user.address}`);
        console.log(`   To:   ${randomReceiver}`);

        // transfer. Believe this should be SafeTransferFrom; look further into
        const transferTx = await contract.transferFrom(user.address, randomReceiver, tokenId);
        
        console.log("   Waiting for confirmation");
        await transferTx.wait();
        
        // print a message if it didn't fail; that means that it got transferred
        console.log("BAD: Transfer SUCCEEDED! (Soulbound token got transferred!)");

    } catch (error: any) {
        // there are some errors that we expect, others not. We expect a soulbound transfer to fail
        // and revert the transaction.
        if (error.message.includes("Soulbound: Transfer failed") || error.message.includes("reverted")) {
            console.log("GOOD: Transfer failed as expected!");
            console.log(`   Reason: "${error.shortMessage || 'Transaction Reverted'}"`);
        } else {
            console.log("BAD: Transfer failed, but for an unexpected reason:");
            console.log(error);
        }
    }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});