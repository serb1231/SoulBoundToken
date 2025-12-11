# Decentralized Identity & Voting Protocol

This project demonstrates a **Composable Identity System** using Soulbound Tokens (SBT). A verified digital identity unlocks permissioned applications such as Driving Licenses and Decentralized Voting, all without relying on centralized databases.

## 1. Background & Motivation
In traditional blockchain systems, one user can generate thousands of wallets to rig a vote (Sybil Attack). 
This protocol solves this by introducing a **Chain of Trust**:
1.  **National ID (SBT):** A non-transferable token representing a unique human.
2.  **Dependent Assets:** A Driving License that can *only* be minted if the wallet holds a National ID.
3.  **Gated Voting:** A voting station that checks for the National ID before accepting a ballot.

## 2. Related Work & Originality
* **Related Work:** This concept draws inspiration from existing identity solutions like **Gitcoin Passport** and **Worldcoin**.
* **Originality:** While those protocols focus on verification methods (biometrics/socials), this protocol focuses on **on-chain dependency**: proving that Smart Contract B (License) can rely on the state of Smart Contract A (ID) to enforce real-world logic (you can't drive without an ID). This contract can become a default for gouvernments issuing ID's to their citizens.

---

## Project Architecture




The system consists of three interacting smart contracts:

### 1. **National ID (`NationalID.sol`)**

* Soulbound Token (non-transferable ERC721)
* Represents a verified human identity
* `onlyOwner` issuance
* Pausing functionality for security

### 2. **Driving License (`DrivingLicense.sol`)**

* Requires the user to hold a National ID before minting
* Example of a downstream "Composable Identity" use case

### 3. **Voting Station (`VotingStation.sol`)**

* Verifies identity using the National ID contract
* Prevents double-voting

---

## Automatic Execution (Testing)
The entire protocol (Deployment -> Minting ID -> Minting License -> Voting -> Winning) is automated in the test suite.

---

## Installation

### 1. Prerequisites
* Node.js & NPM
* Foundry (for fuzzing)

### 2. Clone the repository

```bash
git clone <YOUR_REPO_URL>
cd <YOUR_PROJECT_FOLDER>
```

### 3. Install dependencies

```bash
npm install
```

### 4. Environment Configuration

Create a `.env` file (see `.env.example`):

```ini
SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/..."
PRIVATE_KEY="0x..."
```

---

## Running Tests

### Unit Tests, Fuzzing & Invariants

```bash
npx hardhat test
```

### Static Analysis (Slither)
Static analysis should be done automatically on push on github. For using slither, install it using
```bash
pip install slither
```
And use it with
```bash
slither .
```

---

## Local Deployment & Interaction

### Terminal 1 — Start Local Blockchain

```bash
npx hardhat node
```

### Terminal 2 — Deploy the Protocol

Deploys National ID, Driving License, and Voting Station.

```bash
npx hardhat ignition deploy ./ignition/modules/DeployEverything.ts --network localhost
```

Copy deployed addresses for later use.

### Run Example Scripts

```bash
npx hardhat run scripts/TestNationalIDMinting.ts --network localhost
npx hardhat run scripts/TestVoting.ts --network localhost
npx hardhat run scripts/TestDrivingLicenseMint.ts --network localhost
npx hardhat run scripts/TestMintingMultipleCitizens.ts --network localhost
```

---

## Local Node State Persistence

If `npx hardhat node` is running, the blockchain state persists.

To reset:

* Stop the node (`Ctrl+C`)
* Restart it

This prevents errors (or residue infomration regarding the soulbound status of users) like:

* "User already has an ID"
* "User already voted"

---

## Deploying to Sepolia Testnet

```bash
npx hardhat ignition deploy ignition/modules/DeployEverything.ts --network sepolia
```

## To deploy manually

1.  Deploy `NationalID` (Owner: You).
2.  Deploy `DrivingLicense` (Pass `NationalID` address to constructor).
3.  Deploy `VotingStation` (Pass `NationalID` address + Candidates array).

---

## License

MIT License — Feel free to use, modify, and build on this project.