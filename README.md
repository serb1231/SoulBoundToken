# Decentralized Identity & Voting Protocol

This project demonstrates a **Composable Identity System** using Soulbound Tokens (SBT). A verified digital identity unlocks permissioned applications such as Driving Licenses and Decentralized Voting, all without relying on centralized databases.

---

## 🏗 Project Architecture

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

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone <YOUR_REPO_URL>
cd <YOUR_PROJECT_FOLDER>
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file (see `.env.example`):

```ini
SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/..."
PRIVATE_KEY="0x..."
```

---

## 🧪 Running Tests

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

## 🚀 Local Deployment & Interaction

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

## ⚠️ Local Node State Persistence

If `npx hardhat node` is running, the blockchain state persists.

To reset:

* Stop the node (`Ctrl+C`)
* Restart it

This prevents errors (or residue infomration regarding the soulbound status of users) like:

* "User already has an ID"
* "User already voted"

---

## 🌐 Deploying to Sepolia Testnet

```bash
npx hardhat ignition deploy ignition/modules/DeployEverything.ts --network sepolia
```

---

## 📄 License

MIT License — Feel free to use, modify, and build on this project.

---

## 🤝 Contributions

Pull requests, issues, and feature suggestions are welcome!

---

## ⭐ Support

If this project helps you, consider giving it a star on GitHub!
