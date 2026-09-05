import { ethers } from "ethers";
import contractConfig from "../config/contractConfig.json";

const TARGET_CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || contractConfig.chainId || "31337", 10);
const TARGET_HEX_CHAIN_ID = "0x" + TARGET_CHAIN_ID.toString(16);

/**
 * Connect to MetaMask browser wallet.
 */
export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("MetaMask extension is not installed in your browser. Please install MetaMask to continue.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  
  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts authorized in MetaMask.");
  }

  const network = await provider.getNetwork();
  const currentChainId = Number(network.chainId);

  // Check target network (Hardhat 31337)
  if (currentChainId !== TARGET_CHAIN_ID) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: TARGET_HEX_CHAIN_ID }],
      });
    } catch (switchError) {
      // If network is missing, attempt to add local hardhat network
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: TARGET_HEX_CHAIN_ID,
              chainName: "Hardhat Local Host",
              rpcUrls: [import.meta.env.VITE_BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545"],
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            },
          ],
        });
      } else {
        throw new Error(`Please switch your MetaMask network to Chain ID ${TARGET_CHAIN_ID}`);
      }
    }
  }

  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return {
    provider,
    signer,
    address,
    chainId: TARGET_CHAIN_ID,
  };
}

/**
 * Signs EIP-712 Batch Approval structured data message.
 */
export async function signBatchApproval({ batchId, institutionId, merkleRoot, role }) {
  const { signer, address } = await connectWallet();
  const timestamp = Math.floor(Date.now() / 1000);

  const domain = {
    name: "AcademicCertificateRegistry",
    version: "1",
    chainId: TARGET_CHAIN_ID,
    verifyingContract: import.meta.env.VITE_CONTRACT_ADDRESS || contractConfig.address || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
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

  let formattedRoot = merkleRoot;
  if (!formattedRoot.startsWith("0x")) {
    formattedRoot = "0x" + formattedRoot;
  }

  const value = {
    batchId: String(batchId),
    institutionId: String(institutionId),
    merkleRoot: formattedRoot,
    role: String(role),
    timestamp: BigInt(timestamp),
  };

  const signature = await signer.signTypedData(domain, types, value);

  return {
    signature,
    walletAddress: address,
    timestamp,
    domain,
    value,
  };
}
