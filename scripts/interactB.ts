import { ethers } from "hardhat";

async function main() {

    // addresses of the contracts
    const NATIONAL_ID_ADDR = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const DRIVING_LICENSE_ADDR = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

    // get the user signer
    const [user] = await ethers.getSigners();
    console.log(`Address of the Testing USER: ${user.address}`);

    // Connect to both contracts
    const NationalID = await ethers.getContractAt("MyToken", NATIONAL_ID_ADDR, user);
    const DrivingLicense = await ethers.getContractAt("DrivingLicense", DRIVING_LICENSE_ADDR, user);


    // test minting a driving licence without a national ID first
    console.log("------------------------------------------------------\n");
    console.log("    Try minting License WITHOUT ID");
    console.log("------------------------------------------------------\n");
    
    try {
        // mint license
        const tx = await DrivingLicense.mintLicense();
        await tx.wait();
        console.log("BAD: Mint succeeded, although we don't have a national ID!");
    } catch (error: any) {
        // we expect this to fail
        if (error.message.includes("Must have National ID first")) {
        console.log("GOOD: Mint blocked as expected. User has no National ID.");
        } else {
        console.log("BAD: Failed for unexpected reason:");
        console.log(error.shortMessage || error.message);
        }
    }


    // now mint the National ID
    console.log("-------------------------------------------------------\n");
    console.log("       Minting the National ID first");
    console.log("-------------------------------------------------------\n");
    
    // check if there is already an ID
    const balance = await NationalID.balanceOf(user.address);
    
    // 0n as it's a BigInt
    if (balance == 0n) {
        const tx = await NationalID.safeMint(user.address);
        console.log(`Minting ID... (Tx: ${tx.hash})`);
        await tx.wait();
        console.log("GOOD: National ID Acquired!");
    } else {
        console.log("BAD: User already has an ID. Skipping mint.");
    }


    // try minting the License again, having the ID now
    console.log("-------------------------------------------------------\n");
    console.log("       Try minting License WITH ID");
    console.log("-------------------------------------------------------\n");

    try {
        const tx = await DrivingLicense.mintLicense();
        console.log(`Minting License... (Tx: ${tx.hash})`);
        
        await tx.wait();
        
        console.log("GOOD: LICENSE MINTED SUCCESSFULLY!");

        const licenseBal = await DrivingLicense.balanceOf(user.address);
        console.log(`Final License Balance: ${licenseBal.toString()}`);

        if (licenseBal > 0n) {
            console.log("GOOD: We received our Driving License after having the National ID!");
        } else {
            console.log("BAD: Something went wrong. Transaction succeeded but balance is 0.");
        }

    } catch (error: any) {
        console.error("BAD: Mint failed even though we have an ID!");
        console.error(error.shortMessage || error.message);
    }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});