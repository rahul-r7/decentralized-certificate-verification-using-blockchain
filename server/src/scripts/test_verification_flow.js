const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const axios = require("axios");
const { ethers } = require("ethers");

const API_BASE = "http://localhost:5000/api";

async function runE2EVerificationTest() {
  console.log("=== STARTING END-TO-END VERIFICATION FLOW TEST ===");

  // First clear previous test data
  const mongoose = require("mongoose");
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/certificate_verification_db";
  await mongoose.connect(MONGODB_URI);
  await mongoose.connection.collection("certificates").deleteMany({});
  await mongoose.connection.collection("certificatebatches").deleteMany({});
  await mongoose.connection.collection("approvals").deleteMany({});
  await mongoose.connection.collection("verificationlogs").deleteMany({});

  // Align User wallet addresses for automated testing with Hardhat accounts
  // Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
  // Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
  await mongoose.connection.collection("users").updateOne(
    { email: "coe@nit.ac.in" },
    { $set: { walletAddress: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8" } }
  );
  await mongoose.connection.collection("users").updateOne(
    { email: "registrar@nit.ac.in" },
    { $set: { walletAddress: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc" } }
  );
  await mongoose.disconnect();

  // 1. Login as Staff
  console.log("\n1. Logging in as Examination Staff...");
  const staffRes = await axios.post(`${API_BASE}/auth/login`, {
    email: "staff@nit.ac.in",
    password: "Staff@123456",
  });
  const staffToken = staffRes.data.token;
  console.log("Staff login successful.");

  // 2. Upload CSV
  console.log("\n2. Uploading CSV batch...");
  const csvPath = path.join(__dirname, "../assets/demo_students.csv");
  const form = new FormData();
  form.append("file", fs.createReadStream(csvPath));

  const uploadRes = await axios.post(`${API_BASE}/batches/upload`, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${staffToken}`,
    },
  });
  const batchId = uploadRes.data.batch.batchId;
  const merkleRoot = uploadRes.data.batch.merkleRoot;
  console.log(`CSV batch uploaded successfully. Batch ID: ${batchId}, Merkle Root: ${merkleRoot}`);

  // 3. Login as CoE & Approve
  console.log("\n3. Logging in as CoE & Signing EIP-712 approval...");
  const coeRes = await axios.post(`${API_BASE}/auth/login`, {
    email: "coe@nit.ac.in",
    password: "Coe@123456",
  });
  const coeToken = coeRes.data.token;

  // Sign EIP-712 with CoE Hardhat Account #1 private key
  const coeWallet = new ethers.Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");

  const domain = {
    name: "AcademicCertificateRegistry",
    version: "1",
    chainId: 31337,
    verifyingContract: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  };

  const types = {
    BatchApproval: [
      { name: "batchId", type: "string" },
      { name: "institutionId", type: "string" },
      { name: "merkleRoot", type: "bytes32" },
      { name: "role", type: "string" },
      { name: "timestamp", type: "uint256" },
    ],
  };

  const timestamp = Math.floor(Date.now() / 1000);
  const coeMessage = {
    batchId,
    institutionId: "NIT-001",
    merkleRoot,
    role: "CONTROLLER_OF_EXAMINATIONS",
    timestamp,
  };

  const coeSignature = await coeWallet.signTypedData(domain, types, coeMessage);

  const coeApproveRes = await axios.post(
    `${API_BASE}/batches/${batchId}/signature`,
    {
      signature: coeSignature,
      walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      timestamp,
    },
    { headers: { Authorization: `Bearer ${coeToken}` } }
  );
  console.log("CoE Approval successful:", coeApproveRes.data.message);

  // 4. Login as Registrar & Approve
  console.log("\n4. Logging in as Registrar & Signing EIP-712 approval...");
  const regRes = await axios.post(`${API_BASE}/auth/login`, {
    email: "registrar@nit.ac.in",
    password: "Registrar@123456",
  });
  const regToken = regRes.data.token;

  // Registrar Hardhat Account #2 private key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
  const regWallet = new ethers.Wallet("0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a");

  const regMessage = {
    batchId,
    institutionId: "NIT-001",
    merkleRoot,
    role: "REGISTRAR",
    timestamp,
  };

  const regSignature = await regWallet.signTypedData(domain, types, regMessage);

  const regApproveRes = await axios.post(
    `${API_BASE}/batches/${batchId}/signature`,
    {
      signature: regSignature,
      walletAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      timestamp,
    },
    { headers: { Authorization: `Bearer ${regToken}` } }
  );
  console.log("Registrar Approval successful & Committed on-chain! TxHash:", regApproveRes.data.blockchainTxHash);

  // 5. VERIFY CERTIFICATE via Public Verification Portal
  console.log("\n5. Calling Public Verification Portal for 'REG-2026-CS001'...");
  const verifyRes = await axios.get(`${API_BASE}/verify/registration/REG-2026-CS001`);
  console.log("\n--- VERIFICATION RESULT ---");
  console.log(JSON.stringify(verifyRes.data, null, 2));

  if (verifyRes.data.valid === true) {
    console.log("\n=======================================================");
    console.log("SUCCESS: VERIFICATION PORTAL WORKS 100% CLEANLY!");
    console.log("=======================================================");
  } else {
    console.error("\nFAILURE: Verification failed!");
  }
}

runE2EVerificationTest().catch((err) => {
  console.error("Test failed with error:", err.response ? err.response.data : err.message);
});
