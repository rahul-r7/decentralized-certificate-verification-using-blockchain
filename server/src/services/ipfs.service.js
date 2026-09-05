const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");

const IPFS_API_URL = process.env.IPFS_API_URL || null;
const IPFS_GATEWAY_URL = process.env.IPFS_GATEWAY_URL || "http://127.0.0.1:8080/ipfs";

// Ensure local fallback IPFS storage directory exists
const LOCAL_STORE_DIR = path.join(__dirname, "../../ipfs_local_store");
if (!fs.existsSync(LOCAL_STORE_DIR)) {
  fs.mkdirSync(LOCAL_STORE_DIR, { recursive: true });
}

/**
 * Upload certificate PDF file or buffer to IPFS (with automatic local fallback).
 * Returns IPFS CID string.
 */
async function uploadCertificate(fileBufferOrPath) {
  let buffer;
  if (typeof fileBufferOrPath === "string") {
    buffer = fs.readFileSync(fileBufferOrPath);
  } else {
    buffer = fileBufferOrPath;
  }

  // 1. Try external HTTP IPFS node if configured
  if (IPFS_API_URL) {
    try {
      const FormData = require("form-data");
      const form = new FormData();
      form.append("file", buffer, { filename: "certificate.pdf" });

      const response = await axios.post(`${IPFS_API_URL}/api/v0/add`, form, {
        headers: form.getHeaders(),
        timeout: 5000,
      });

      if (response.data && response.data.Hash) {
        return response.data.Hash;
      }
    } catch (err) {
      console.warn("External IPFS node upload failed, using local fallback storage:", err.message);
    }
  }

  // 2. Local Fallback IPFS storage: Generate deterministic CID-v0 style string from SHA-256
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  const cid = `QmCert${hash.substring(0, 42)}`;

  const destPath = path.join(LOCAL_STORE_DIR, `${cid}.pdf`);
  fs.writeFileSync(destPath, buffer);

  return cid;
}

/**
 * Get certificate file buffer by IPFS CID.
 */
async function getCertificate(cid) {
  // Check local fallback storage first
  const localPath = path.join(LOCAL_STORE_DIR, `${cid}.pdf`);
  if (fs.existsSync(localPath)) {
    return fs.readFileSync(localPath);
  }

  // Gateway fetch
  if (IPFS_GATEWAY_URL) {
    try {
      const response = await axios.get(`${IPFS_GATEWAY_URL}/${cid}`, {
        responseType: "arraybuffer",
        timeout: 5000,
      });
      return Buffer.from(response.data);
    } catch (err) {
      throw new Error(`Failed to fetch certificate from IPFS gateway: ${err.message}`);
    }
  }

  throw new Error(`Certificate CID ${cid} not found`);
}

module.exports = {
  uploadCertificate,
  getCertificate,
};
