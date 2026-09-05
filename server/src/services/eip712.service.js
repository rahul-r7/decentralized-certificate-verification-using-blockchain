const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Load contract config if available
let contractConfig = {};
const configPath = path.join(__dirname, "../config/contractConfig.json");
if (fs.existsSync(configPath)) {
  try {
    contractConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (err) {
    console.warn("Could not parse contractConfig.json:", err.message);
  }
}

function getEIP712Domain() {
  const chainId = parseInt(process.env.BLOCKCHAIN_CHAIN_ID || contractConfig.chainId || "31337", 10);
  const verifyingContract = process.env.CONTRACT_ADDRESS || contractConfig.address || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  return {
    name: "AcademicCertificateRegistry",
    version: "1",
    chainId: chainId,
    verifyingContract: verifyingContract,
  };
}

const EIP712_TYPES = {
  BatchApproval: [
    { name: "batchId", type: "string" },
    { name: "institutionId", type: "string" },
    { name: "merkleRoot", type: "bytes32" },
    { name: "role", type: "string" },
    { name: "timestamp", type: "uint256" },
  ],
};

/**
 * Verifies an EIP-712 approval signature.
 * Returns { valid: boolean, recoveredAddress: string, error?: string }
 */
function verifyApprovalSignature({
  batchId,
  institutionId,
  merkleRoot,
  role,
  timestamp,
  signature,
  expectedWalletAddress,
}) {
  try {
    const domain = getEIP712Domain();
    
    // Ensure merkleRoot is 0x-prefixed 32-byte hex
    let formattedRoot = merkleRoot;
    if (!formattedRoot.startsWith("0x")) {
      formattedRoot = "0x" + formattedRoot;
    }

    const value = {
      batchId: String(batchId),
      institutionId: String(institutionId),
      merkleRoot: formattedRoot,
      role: String(role),
      timestamp: Number(timestamp),
    };

    const recoveredAddress = ethers.verifyTypedData(domain, EIP712_TYPES, value, signature);

    const isMatch = recoveredAddress.toLowerCase() === expectedWalletAddress.toLowerCase();

    return {
      valid: isMatch,
      recoveredAddress,
      expectedWalletAddress,
      domain,
      value,
    };
  } catch (err) {
    return {
      valid: false,
      recoveredAddress: null,
      error: err.message,
    };
  }
}

module.exports = {
  getEIP712Domain,
  EIP712_TYPES,
  verifyApprovalSignature,
};
