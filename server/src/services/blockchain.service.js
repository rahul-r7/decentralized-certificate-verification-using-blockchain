const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

let contractConfig = null;
const configPath = path.join(__dirname, "../config/contractConfig.json");

function loadContractConfig() {
  if (fs.existsSync(configPath)) {
    try {
      contractConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (err) {
      console.warn("Unable to read contractConfig.json:", err.message);
    }
  }
}

loadContractConfig();

function getProvider() {
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
  return new ethers.JsonRpcProvider(rpcUrl);
}

function getAdminWallet() {
  const provider = getProvider();
  // Default Hardhat Account #0 private key
  const privateKey =
    process.env.BLOCKCHAIN_PRIVATE_KEY ||
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  return new ethers.Wallet(privateKey, provider);
}

function getContractInstance(signerOrProvider) {
  loadContractConfig();

  const contractAddress =
    process.env.CONTRACT_ADDRESS ||
    (contractConfig
      ? contractConfig.address
      : "0x5FbDB2315678afecb367f032d93F642f64180aa3");

  if (!contractConfig || !contractConfig.abi) {
    throw new Error(
      "Contract ABI not found. Please compile and deploy the smart contract first via `npm run deploy:contracts`",
    );
  }

  return new ethers.Contract(
    contractAddress,
    contractConfig.abi,
    signerOrProvider,
  );
}

/**
 * Commits an approved batch Merkle Root to the Ethereum blockchain.
 */
async function commitBatchToBlockchain(batchId, institutionId, merkleRoot) {
  try {
    const adminWallet = getAdminWallet();
    const contract = getContractInstance(adminWallet);

    let formattedRoot = merkleRoot;
    if (!formattedRoot.startsWith("0x")) {
      formattedRoot = "0x" + formattedRoot;
    }

    console.log(`Submitting registerBatch tx for batch ${batchId}...`);
    const tx = await contract.registerBatch(
      batchId,
      institutionId,
      formattedRoot,
    );
    const receipt = await tx.wait();

    console.log(
      `Batch ${batchId} committed to blockchain. TxHash: ${receipt.hash}`,
    );

    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      timestamp: new Date(),
      status: receipt.status === 1 ? "CONFIRMED" : "FAILED",
    };
  } catch (err) {
    console.error(`Blockchain commit error for batch ${batchId}:`, err.message);
    throw new Error(`Blockchain transaction failed: ${err.message}`);
  }
}

/**
 * Fetches batch record from Ethereum smart contract.
 */
async function getBatchFromBlockchain(merkleRoot) {
  try {
    const provider = getProvider();
    const contract = getContractInstance(provider);

    let formattedRoot = merkleRoot;
    if (!formattedRoot.startsWith("0x")) {
      formattedRoot = "0x" + formattedRoot;
    }

    const res = await contract.getBatch(formattedRoot);

    return {
      batchId: res.batchId,
      institutionId: res.institutionId,
      timestamp: Number(res.timestamp),
      exists: res.exists,
      revoked: res.revoked,
    };
  } catch (err) {
    console.error("Error fetching batch from blockchain:", err.message);
    return {
      exists: false,
      revoked: false,
      error: err.message,
    };
  }
}

/**
 * Runs pure leaf verification against the smart contract.
 */
async function verifyLeafOnBlockchain(leafHash, proof, merkleRoot) {
  try {
    const provider = getProvider();
    const contract = getContractInstance(provider);

    let formattedLeaf = leafHash.startsWith("0x") ? leafHash : "0x" + leafHash;
    let formattedRoot = merkleRoot.startsWith("0x")
      ? merkleRoot
      : "0x" + merkleRoot;
    const formattedProof = proof.map((p) =>
      p.startsWith("0x") ? p : "0x" + p,
    );

    const isValid = await contract.verifyLeaf(
      formattedLeaf,
      formattedProof,
      formattedRoot,
    );
    return isValid;
  } catch (err) {
    console.error("Blockchain leaf verification error:", err.message);
    return false;
  }
}

module.exports = {
  commitBatchToBlockchain,
  getBatchFromBlockchain,
  verifyLeafOnBlockchain,
  getContractInstance,
};
