import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const IdentitySystemModule = buildModule("IdentitySystem", (m) => {
  const deployer = m.getAccount(0);

  // deploy the nationalId contract first
  const nationalID = m.contract("MyToken", [deployer]);

  // deploy the driving license contract, passing the nationalId address
  const drivingLicense = m.contract("DrivingLicense", [nationalID]);

  return { nationalID, drivingLicense };
});

export default IdentitySystemModule;