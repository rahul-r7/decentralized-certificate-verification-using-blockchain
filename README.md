# Decentralized Academic Certificate Verification System Using Blockchain

Production-quality academic certificate issuance, approval, IPFS storage, and public verification platform for universities.

Built with **React (Vite)**, **Tailwind CSS**, **Node.js (Express)**, **MongoDB**, **Solidity**, **Hardhat**, **Ethers.js v6**, **IPFS**, and **MetaMask (EIP-712)**.

---

## 🌟 Key Features

- **SRS University Roles**: Examination Staff, Controller of Examinations (CoE), Registrar, and Public Verifier.
- **CSV Data Batching**: Complete validation, whitespace normalization, and duplicate detection.
- **Non-Circular Certificate PDF Generator**: Generates PDFs with embedded QR code pointing to `/verify/:registrationNumber` without circular IPFS CID dependency.
- **Deterministic SHA-256 Merkle Trees**: Computes canonical leaf hashes and constructs Merkle trees with odd-leaf node duplication handling.
- **Dual IPFS Storage**: Direct IPFS HTTP node upload with automatic local store fallback.
- **EIP-712 Multi-Signatory Off-Chain Approvals**: Sequential off-chain MetaMask signing by CoE and Registrar to save gas.
- **Automated Ethereum Commitment**: Registrar signature automatically commits the 32-byte Merkle Root to the `AcademicCertificateRegistry` smart contract.
- **Public Verification Portal (No Login Required)**: Instant verification via Registration Number, QR Scan, or PDF Drag-and-Drop file upload.
- **Tampering Demonstration**: Modifying any certificate field invalidates the SHA-256 leaf hash and fails on-chain Merkle proof verification.
- **Audit Logging**: Immutable system audit activity logs.

---

## 🏗️ Project Architecture Overview

```
c:\Users\Rahul\Desktop\Mini Project File
├── blockchain/        # Hardhat project, Solidity contract, deploy scripts & tests
├── server/            # Express REST API backend, MongoDB models, crypto & IPFS services
├── client/            # Vite + React + Tailwind CSS frontend application
├── docs/              # Architecture, API, Merkle Tree, and Deployment documentation
└── docker-compose.yml # Multi-container orchestration config
```

---

## 🚀 Quick Start Guide (Local Setup)

### Prerequisites

- **Node.js**: v18.x or higher
- **MongoDB**: Running locally at `mongodb://localhost:27017` or via Docker
- **MetaMask Browser Extension**: Connected to Localhost RPC `http://127.0.0.1:8545` (Chain ID `31337`)

---

### Step 1: Install Dependencies

Run from the project root:

```bash
npm run install:all
```

---

### Step 2: Start Local Hardhat Blockchain Node & Deploy Contract

In Terminal 1:

```bash
cd blockchain
npx hardhat node
```

In Terminal 2 (Deploy Contract):

```bash
cd blockchain
npm run deploy
```

> **Note**: The deployment script automatically exports the contract address and ABI to `server/src/config/contractConfig.json` and `client/src/config/contractConfig.json`.

---

### Step 3: Seed Database with Demo Accounts & CSV

In Terminal 3:

```bash
cd server
npm run seed
```

This seeds MongoDB with:
- **Demo Institution**: `National Institute of Technology` (`NIT-001`)
- **Examination Staff**: `staff@nit.ac.in` / `Staff@123456`
- **CoE (MetaMask Account #1)**: `coe@nit.ac.in` / `Coe@123456` (Wallet: `0xFCC5dF5390bAa26Cd78eE53600e43e117f10CFb4`)
- **Registrar (MetaMask Account #2)**: `registrar@nit.ac.in` / `Registrar@123456` (Wallet: `0x5bF84eE8E9D4Ef8087616461A775dD27a2BD934A`)
- **Sample CSV**: `server/src/assets/demo_students.csv`

---

### Step 4: Run Backend & Frontend Servers

In Terminal 4 (Backend API Server - Port 5000):

```bash
cd server
npm run dev
```

In Terminal 5 (Vite React Client - Port 5173):

```bash
cd client
npm run dev
```

Or run everything concurrently from root:

```bash
npm run dev
```

Visit: `http://localhost:5173`

---

## 🎬 Complete Demo Walkthrough

1. **Examination Staff CSV Upload**:
   - Log in as `staff@nit.ac.in` (`Staff@123456`).
   - Go to CSV Upload tab. Upload `server/src/assets/demo_students.csv`.
   - The system generates PDF certificates, computes SHA-256 leaf hashes, builds the Merkle Tree, uploads PDFs to IPFS, and sets status to `PENDING_COE_APPROVAL`.

2. **Controller of Examinations Signature**:
   - Log in as `coe@nit.ac.in` (`Coe@123456`).
   - Connect MetaMask (Account #1: `0xFCC5dF5390bAa26Cd78eE53600e43e117f10CFb4`).
   - Click "Sign Approval" -> Approves EIP-712 typed structured message.
   - Batch advances to `PENDING_REGISTRAR_APPROVAL`.

3. **Registrar Final Signature & Blockchain Commit**:
   - Log in as `registrar@nit.ac.in` (`Registrar@123456`).
   - Connect MetaMask (Account #2: `0x5bF84eE8E9D4Ef8087616461A775dD27a2BD934A`).
   - Click "Sign & Commit to Blockchain" -> Approves EIP-712 message.
   - Server automatically commits `registerBatch(batchId, institutionId, merkleRoot)` to the Hardhat smart contract.
   - Status updates to `BLOCKCHAIN_CONFIRMED` with transaction hash.

4. **Public Verification (Success Case)**:
   - Open `/verify` (No login required).
   - Search Registration Number `REG-2026-CS001` or upload the generated certificate PDF.
   - System displays `✓ Certificate Verified` with student details, IPFS CID, Merkle Root, and Ethereum Transaction Hash.

5. **Tampering Demonstration (Failure Case)**:
   - Search `REG-TAMPER-TEST` or upload a modified certificate.
   - SHA-256 leaf hash changes -> Merkle proof fails -> System displays `✕ Certificate Could Not Be Verified (TAMPERED)`.

---

## 🧪 Running Tests

### Smart Contract Tests (Hardhat):
```bash
cd blockchain
npx hardhat test
```

### Backend Cryptographic & Merkle Service Unit Tests (Jest):
```bash
cd server
npm run test
```

---

## 📜 License

MIT
