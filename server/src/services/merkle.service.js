const crypto = require("crypto");

/**
 * SHA-256 Merkle Tree & Canonical Data Hashing Service
 */

/**
 * Creates a normalized canonical string representation of certificate data.
 * Format: registrationNumber|studentName|programme|semester|grade|institutionId|certificateType|issueDate
 */
function createCanonicalString(certData) {
  const regNo = String(certData.registrationNumber || "").trim().toUpperCase();
  const name = String(certData.studentName || "").trim();
  const programme = String(certData.programme || "").trim();
  const semester = String(certData.semester || "").trim();
  const grade = String(
    (certData.academicData && certData.academicData.grade) || certData.grade || ""
  ).trim();

  let instId = "";
  if (certData.institutionId) {
    if (typeof certData.institutionId === "object" && certData.institutionId._id) {
      instId = String(certData.institutionId._id).trim();
    } else {
      instId = String(certData.institutionId).trim();
    }
  }

  const certType = String(
    (certData.academicData && certData.academicData.certificateType) || certData.certificateType || "Degree"
  ).trim();
  const issueDate = String(
    (certData.academicData && certData.academicData.issueDate) || certData.issueDate || ""
  ).trim();

  return `${regNo}|${name}|${programme}|${semester}|${grade}|${instId}|${certType}|${issueDate}`;
}

/**
 * Hash a canonical string or buffer using SHA-256. Returns 64-char lowercase hex string.
 */
function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Hash two 32-byte hex hashes (left and right) in sorted deterministic order.
 * Format matches Solidity `sha256(abi.encodePacked(a, b))`.
 */
function hashPair(left, right) {
  const cleanLeft = left.replace(/^0x/, "").toLowerCase();
  const cleanRight = right.replace(/^0x/, "").toLowerCase();

  let first, second;
  if (cleanLeft <= cleanRight) {
    first = Buffer.from(cleanLeft, "hex");
    second = Buffer.from(cleanRight, "hex");
  } else {
    first = Buffer.from(cleanRight, "hex");
    second = Buffer.from(cleanLeft, "hex");
  }

  const combined = Buffer.concat([first, second]);
  return crypto.createHash("sha256").update(combined).digest("hex");
}

/**
 * Computes leaf hash for a certificate record.
 */
function createLeafHash(certData) {
  const canonicalStr = createCanonicalString(certData);
  return sha256(canonicalStr);
}

/**
 * Builds full Merkle Tree levels from an array of leaf hashes.
 * Duplicate the final node if a level has an odd count.
 */
function buildMerkleTree(leafHashes) {
  if (!leafHashes || leafHashes.length === 0) {
    throw new Error("Cannot build Merkle Tree from empty leaf hashes array");
  }

  // Clean leaves to hex strings
  let currentLevel = leafHashes.map((h) => h.replace(/^0x/, "").toLowerCase());
  const tree = [currentLevel];

  while (currentLevel.length > 1) {
    // Duplicate last leaf if odd length
    if (currentLevel.length % 2 !== 0) {
      currentLevel.push(currentLevel[currentLevel.length - 1]);
    }

    const nextLevel = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const parentHash = hashPair(currentLevel[i], currentLevel[i + 1]);
      nextLevel.push(parentHash);
    }

    tree.push(nextLevel);
    currentLevel = nextLevel;
  }

  return tree;
}

/**
 * Returns Merkle Root formatted as 0x-prefixed 32-byte hex string.
 */
function getMerkleRoot(tree) {
  if (!tree || tree.length === 0) return null;
  const topLevel = tree[tree.length - 1];
  return "0x" + topLevel[0];
}

/**
 * Returns Merkle Proof (array of sibling hashes) for a leaf at `leafIndex`.
 */
function getMerkleProof(tree, leafIndex) {
  if (!tree || tree.length === 0) return [];
  const proof = [];
  let index = leafIndex;

  for (let level = 0; level < tree.length - 1; level++) {
    const currentLevel = tree[level];

    // If level length was odd, it was duplicated in tree building logic
    const isEven = index % 2 === 0;
    const siblingIndex = isEven ? index + 1 : index - 1;

    if (siblingIndex < currentLevel.length) {
      proof.push("0x" + currentLevel[siblingIndex]);
    } else {
      // Sibling was the duplicated element
      proof.push("0x" + currentLevel[index]);
    }

    index = Math.floor(index / 2);
  }

  return proof;
}

/**
 * Verifies a leaf hash against a Merkle proof and root hash.
 */
function verifyMerkleProof(leafHash, proof, merkleRoot) {
  let current = leafHash.replace(/^0x/, "").toLowerCase();
  const targetRoot = merkleRoot.replace(/^0x/, "").toLowerCase();

  for (const sibling of proof) {
    const sib = sibling.replace(/^0x/, "").toLowerCase();
    current = hashPair(current, sib);
  }

  return current === targetRoot;
}

module.exports = {
  createCanonicalString,
  sha256,
  createLeafHash,
  buildMerkleTree,
  getMerkleRoot,
  getMerkleProof,
  verifyMerkleProof,
};
