import { expect } from "chai";
import { ethers } from "hardhat";

describe("Driving License System Tests", function () {
    let contractNationalID: any;
    let contractDrivingLicense: any;
    let user: any;
    let hacker: any;

    // This runs before every test to give a fresh start
    beforeEach(async function () {
        [user, hacker] = await ethers.getSigners();
        
        // Get Contract Factories
        const FactoryNationalID = await ethers.getContractFactory("NationalID");
        const FactoryDrivingLicense = await ethers.getContractFactory("DrivingLicense");

        // Deploy National ID
        contractNationalID = await FactoryNationalID.deploy(user.address); 
        await contractNationalID.waitForDeployment();

        contractDrivingLicense = await FactoryDrivingLicense.deploy(contractNationalID.target);
        await contractDrivingLicense.waitForDeployment();
    });

    // mint without national ID
    it("Should fail to mint a License if user has no National ID", async function () {
        // check that user has no National ID
        const idBalance = await contractNationalID.balanceOf(user.address);
        expect(idBalance).to.equal(0n);

        // try to mint the Driving License
        await expect(
            contractDrivingLicense.mintLicense()
        ).to.be.revertedWith("Must have National ID first!");
    });

  
    // mint with national ID
    it("Should successfully mint a License after acquiring National ID", async function () {
        // mint the National ID first
        await contractNationalID.safeMint(user.address);
        
        // Verify we have the ID
        expect(await contractNationalID.balanceOf(user.address)).to.equal(1n);

        // mint the Driving License
        await expect(contractDrivingLicense.mintLicense())
            .to.emit(contractDrivingLicense, "Transfer")
            .withArgs(ethers.ZeroAddress, user.address, 0);

        // Verify final balance
        const licenseBalance = await contractDrivingLicense.balanceOf(user.address);
        expect(licenseBalance).to.equal(1n);
    });

    // minting multiple times
    it("Should fail if user tries to mint a second License", async function () {
        // give user national id first
        await contractNationalID.safeMint(user.address);
        await contractDrivingLicense.mintLicense();

        // verify that user has one license
        expect(await contractDrivingLicense.balanceOf(user.address)).to.equal(1n);

        // try minting another license
        await expect(
            contractDrivingLicense.mintLicense()
        ).to.be.revertedWith("Already have a license");
    });
});