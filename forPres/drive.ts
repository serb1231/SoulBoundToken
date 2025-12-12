import { ethers } from "hardhat";

async function main() {

    // addresses of the contracts
    const NATIONAL_ID_ADDR = "0xaAAdbB70a236C8603C925FcD82cf3664307e2B32";
    const DRIVING_LICENSE_ADDR = "0x03228E284582De1a31e2C698Cf4035509345960d";

    // get the user signer
    const [user] = await ethers.getSigners();
    console.log(`   Address of the Testing USER: ${user.address}`);

    // Connect to both contracts
    const NationalID = await ethers.getContractAt("NationalID", NATIONAL_ID_ADDR, user);
    const DrivingLicense = await ethers.getContractAt("DrivingLicense", DRIVING_LICENSE_ADDR, user);


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
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});