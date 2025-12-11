import { expect } from "chai";
import { ethers } from "hardhat";

describe("NationalID System Tests", function () {
  let contract: any;
  let user: any;
  let hacker: any;

  // This runs before every test to give a fresh start
  beforeEach(async function () {
    [user, hacker] = await ethers.getSigners();
    
    // deploy the contract
    const Factory = await ethers.getContractFactory("NationalID");
    contract = await Factory.deploy(user.address);
    await contract.waitForDeployment();
  });

  // test that we can mint a National ID
  it("Should successfully mint a National ID", async function () {
    console.log("   Minting token to:", user.address);
    
    await contract.safeMint(user.address);
    
    // check that the balance is now 1
    const balance = await contract.balanceOf(user.address);
    expect(balance).to.equal(1n);
  });

  // test that a user cannot mint multiple National IDs
  it("Should fail if user tries to mint a second ID", async function () {
    // First mint
    await contract.safeMint(user.address);

    // Second mint. It should revert
    await expect(
      contract.safeMint(user.address)
    ).to.be.revertedWith("Identity: User already has a token!");
  });

  // test that a user cannot transfer the token
  it("Should fail if user tries to transfer the token", async function () {
    // Mint first
    await contract.safeMint(user.address);
    
    const randomReceiver = "0x000000000000000000000000000000000000dead";
    const tokenId = 0; // The first token is always ID 0

    // Attempt Transfer
    await expect(
      contract.transferFrom(user.address, randomReceiver, tokenId)
    ).to.be.revertedWith("Soulbound: Transfer failed");
  });
});