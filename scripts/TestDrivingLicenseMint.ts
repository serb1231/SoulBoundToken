import { ethers } from "hardhat";

async function main() {

    // addresses of the contracts
    const NATIONAL_ID_ADDR = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const DRIVING_LICENSE_ADDR = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

    // get the user signer
    const [user] = await ethers.getSigners();
    console.log(`   Address of the Testing USER: ${user.address}`);

    // Connect to both contracts
    const NationalID = await ethers.getContractAt("NationalID", NATIONAL_ID_ADDR, user);
    const DrivingLicense = await ethers.getContractAt("DrivingLicense", DRIVING_LICENSE_ADDR, user);


    // test minting a driving licence without a national ID first
    console.log("------------------------------------------------------\n");
    console.log("    Try minting License WITHOUT ID");
    console.log("------------------------------------------------------\n");
    
    try {
        // verify that we don't have a national ID
        const idBalance = await NationalID.balanceOf(user.address);
        if (idBalance > 0n) {
            console.log("Interesting: User already has a National ID, cannot test minting without it.");
        } else {
            // mint license
            const tx = await DrivingLicense.mintLicense();
            await tx.wait();
            console.log("BAD: Mint succeeded, although we don't have a national ID!");
        }
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
        console.log(`   Minting ID... (Tx: ${tx.hash})`);
        await tx.wait();
        console.log("GOOD: National ID Acquired!");
    } else {
        console.log("Interesting: User already has an ID. Skipping mint.");
    }


    // try minting the License again, having the ID now
    console.log("-------------------------------------------------------\n");
    console.log("       Try minting License WITH ID");
    console.log("-------------------------------------------------------\n");

    try {
        // verify that we have a national ID, and don't have a license yet
        const idBalance = await NationalID.balanceOf(user.address);
        const licenseBalance = await DrivingLicense.balanceOf(user.address);
        // proceed only if we have an ID and no license
        if (idBalance == 0n) {
            console.log("BAD: User has no National ID, cannot proceed with license minting test.");
            return;
        } else {
            console.log("   User has a National ID, proceeding with license minting test.");
        }

        if (licenseBalance > 0n) {
            console.log("Interesting: User already has a Driving License, cannot test minting.");
            return;
        } else {
            console.log("   User has no Driving License, proceeding with minting.");
        }

        const tx = await DrivingLicense.mintLicense();
        console.log(`   Minting License... (Tx: ${tx.hash})`);
        
        await tx.wait();
        
        console.log("GOOD: LICENSE MINTED SUCCESSFULLY!");

        const licenseBal = await DrivingLicense.balanceOf(user.address);
        console.log(`   Final License Balance: ${licenseBal.toString()}`);

        if (licenseBal > 0n) {
            console.log("GOOD: We received our Driving License after having the National ID!");
        } else {
            console.log("BAD: Something went wrong. Transaction succeeded but balance is 0.");
        }

    } catch (error: any) {
        console.error("BAD: Mint failed even though we have an ID!");
        console.error(error.shortMessage || error.message);
    }

    // test for minting multiple driving licenses
    console.log("-------------------------------------------------------\n");
    console.log("       Try minting MULTIPLE Licenses");
    console.log("-------------------------------------------------------\n");

    try {
        // check that we already have a license
        const licenseBalance = await DrivingLicense.balanceOf(user.address);
        if (licenseBalance == 0n) {
            console.log("BAD: User has no Driving License, cannot test multiple minting.");
            return;
        }
        const tx = await DrivingLicense.mintLicense();
        console.log(`   Minting ANOTHER License... (Tx: ${tx.hash})`);
        await tx.wait();
        console.log("BAD: Minted multiple Driving Licenses, which should not be possible!");
    } catch (error: any) {
        // we expect this to fail
        if (error.message.includes("Already have a license")) {
        console.log("GOOD: Mint blocked as expected. User cannot have multiple Driving Licenses.");
        } else {
        console.log("BAD: Failed for unexpected reason:");
        console.log(error.shortMessage || error.message);
        }
    }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});