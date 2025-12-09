import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const IdentitySystemModule = buildModule("IdentitySystem", (m) => {
  const deployer = m.getAccount(0);

  // deploy the nationalId contract first
  const nationalID = m.contract("NationalID", [deployer]);

  // deploy the driving license contract, passing the nationalId address
  const drivingLicense = m.contract("DrivingLicense", [nationalID]);

  // deploy the voting station contract, together with the national ID
  // and the list of candidates
  const votingStation = m.contract("VotingStation", [
    nationalID,
    ["Alice", "Bob"],
  ]);

  return { nationalID, drivingLicense, votingStation };
});

export default IdentitySystemModule;