const Certificate = require("../models/Certificate");
const CertificateBatch = require("../models/CertificateBatch");
const Institution = require("../models/Institution");
const VerificationLog = require("../models/VerificationLog");
const {
  createCanonicalString,
  createLeafHash,
  sha256,
  verifyMerkleProof,
} = require("../services/merkle.service");
const {
  getBatchFromBlockchain,
  verifyLeafOnBlockchain,
} = require("../services/blockchain.service");

/**
 * Public Verification Handler (No Login Required).
 */
exports.verifyByRegistrationNumber = async (req, res) => {
  const regNo = req.params.registrationNumber ? req.params.registrationNumber.trim().toUpperCase() : "";
  const verifierIp = req.ip;
  const method = req.query.method === "QR" ? "QR" : "REGISTRATION_NUMBER";

  try {
    if (!regNo) {
      return res.status(400).json({
        valid: false,
        code: "INVALID_INPUT",
        message: "Registration number is required.",
      });
    }

    // 1. Fetch certificate from database
    const cert = await Certificate.findOne({ registrationNumber: regNo })
      .populate("institutionId");

    if (!cert) {
      await VerificationLog.create({
        registrationNumber: regNo,
        method,
        result: "NOT_FOUND",
        verifierIp,
        details: "Registration number not found in registry",
      });

      return res.status(404).json({
        valid: false,
        code: "NOT_FOUND",
        message: `No certificate found for registration number '${regNo}'.`,
      });
    }

    // 2. Fetch associated batch
    const batch = await CertificateBatch.findOne({ batchId: cert.batchId });
    if (!batch) {
      await VerificationLog.create({
        registrationNumber: regNo,
        method,
        result: "INVALID",
        verifierIp,
        details: "Batch record missing",
      });

      return res.status(400).json({
        valid: false,
        code: "BATCH_NOT_FOUND",
        message: "Certificate batch record is missing.",
      });
    }

    if (batch.status !== "BLOCKCHAIN_CONFIRMED") {
      await VerificationLog.create({
        registrationNumber: regNo,
        method,
        result: "INVALID",
        verifierIp,
        details: `Batch status is '${batch.status}', not confirmed on blockchain`,
      });

      return res.status(400).json({
        valid: false,
        code: "BATCH_UNCOMMITTED",
        message: `Certificate batch is currently in status '${batch.status}' and has not been committed to the Ethereum blockchain.`,
      });
    }

    // 3. Cryptographic Verification Step A: Compute canonical leaf hash from certificate metadata
    const canonicalStr = cert.canonicalData || createCanonicalString(cert);
    const expectedLeafHash = sha256(canonicalStr);

    if (expectedLeafHash.toLowerCase() !== cert.leafHash.replace(/^0x/, "").toLowerCase()) {
      await VerificationLog.create({
        registrationNumber: regNo,
        method,
        result: "TAMPERED",
        verifierIp,
        details: "Certificate metadata hash mismatch (tampered)",
      });

      return res.status(400).json({
        valid: false,
        code: "TAMPERED_METADATA",
        message: "Certificate metadata integrity check failed. The record appears to be modified or tampered with.",
      });
    }

    // 4. Cryptographic Verification Step B: Verify Merkle Proof against stored Merkle Root
    const isMerkleProofValid = verifyMerkleProof(cert.leafHash, cert.merkleProof, batch.merkleRoot);
    if (!isMerkleProofValid) {
      await VerificationLog.create({
        registrationNumber: regNo,
        method,
        result: "TAMPERED",
        verifierIp,
        details: "Merkle proof verification failed",
      });

      return res.status(400).json({
        valid: false,
        code: "INVALID_MERKLE_PROOF",
        message: "Merkle proof verification failed. Certificate hash does not belong to the batch Merkle Tree.",
      });
    }

    // 5. Cryptographic Verification Step C: Fetch On-Chain Merkle Root from Ethereum Smart Contract
    const onChainBatch = await getBatchFromBlockchain(batch.merkleRoot);

    if (!onChainBatch.exists) {
      await VerificationLog.create({
        registrationNumber: regNo,
        method,
        result: "INVALID",
        verifierIp,
        details: "Merkle root not found on Ethereum smart contract",
      });

      return res.status(400).json({
        valid: false,
        code: "NOT_ON_BLOCKCHAIN",
        message: "The Merkle Root for this certificate batch was not found on the Ethereum smart contract.",
      });
    }

    if (onChainBatch.revoked) {
      await VerificationLog.create({
        registrationNumber: regNo,
        method,
        result: "INVALID",
        verifierIp,
        details: "Certificate batch revoked on blockchain",
      });

      return res.status(400).json({
        valid: false,
        code: "REVOKED",
        message: "This certificate batch has been officially REVOKED by the institution.",
      });
    }

    // 6. Cryptographic Verification Step D: Run Pure Smart Contract Verification (`verifyLeaf`)
    const isOnChainLeafValid = await verifyLeafOnBlockchain(cert.leafHash, cert.merkleProof, batch.merkleRoot);
    if (!isOnChainLeafValid) {
      await VerificationLog.create({
        registrationNumber: regNo,
        method,
        result: "TAMPERED",
        verifierIp,
        details: "Smart contract on-chain leaf verification failed",
      });

      return res.status(400).json({
        valid: false,
        code: "ONCHAIN_PROOF_FAILED",
        message: "Smart contract on-chain leaf proof verification failed.",
      });
    }

    // All cryptographic checks passed!
    await VerificationLog.create({
      registrationNumber: regNo,
      method,
      result: "VALID",
      verifierIp,
      details: "Full cryptographic & blockchain verification succeeded",
    });

    return res.status(200).json({
      valid: true,
      message: "Certificate verified successfully on Ethereum blockchain.",
      verification: {
        registrationNumber: cert.registrationNumber,
        studentName: cert.studentName,
        programme: cert.programme,
        semester: cert.semester,
        grade: cert.academicData?.grade || "N/A",
        issueDate: cert.academicData?.issueDate || cert.createdAt,
        certificateType: cert.academicData?.certificateType || "Degree",
        institution: {
          name: cert.institutionId ? cert.institutionId.name : "Academic Institution",
          code: cert.institutionId ? cert.institutionId.code : "INST",
          email: cert.institutionId ? cert.institutionId.email : null,
        },
        batchId: cert.batchId,
        merkleRoot: batch.merkleRoot,
        leafHash: cert.leafHash,
        ipfsCid: cert.ipfsCid,
        blockchainTxHash: batch.blockchainTxHash,
        blockNumber: batch.blockNumber,
        blockchainTimestamp: batch.blockchainTimestamp || onChainBatch.timestamp,
        verifiedAt: new Date(),
      },
    });
  } catch (err) {
    console.error("Verification error:", err);
    return res.status(500).json({
      valid: false,
      code: "SERVER_ERROR",
      message: `Verification process error: ${err.message}`,
    });
  }
};

/**
 * Extract structured text blocks and metadata from raw PDF buffer.
 * Decodes FlateDecode streams, TJ arrays, hex tokens (<...>), and literal string chunks ((...)).
 */
function extractPdfMetadataFromBuffer(pdfBuffer, originalFilename = "") {
  const zlib = require("zlib");
  const allBlocks = [];
  let pos = 0;

  while (pos < pdfBuffer.length) {
    const streamStart = pdfBuffer.indexOf("stream", pos);
    if (streamStart === -1) break;

    let contentStart = streamStart + 6;
    if (pdfBuffer[contentStart] === 0x0d && pdfBuffer[contentStart + 1] === 0x0a) {
      contentStart += 2;
    } else if (pdfBuffer[contentStart] === 0x0a || pdfBuffer[contentStart] === 0x0d) {
      contentStart += 1;
    }

    const streamEnd = pdfBuffer.indexOf("endstream", contentStart);
    if (streamEnd === -1) break;

    const rawChunk = pdfBuffer.slice(contentStart, streamEnd);
    let decompressed = "";
    try {
      decompressed = zlib.inflateSync(rawChunk).toString("latin1");
    } catch (e) {
      try {
        decompressed = zlib.inflateRawSync(rawChunk).toString("latin1");
      } catch (e2) {
        decompressed = rawChunk.toString("latin1");
      }
    }

    // Parse TJ arrays: [ <hex> num <hex> ... ] TJ
    const tjMatches = decompressed.matchAll(/\[([\s\S]*?)\]\s*TJ/g);
    for (const tj of tjMatches) {
      const inner = tj[1];
      let tjText = "";
      const hexList = inner.matchAll(/<([0-9a-fA-F]+)>/g);
      for (const h of hexList) {
        try {
          tjText += Buffer.from(h[1], "hex").toString("utf8");
        } catch (_) {}
      }
      const litList = inner.matchAll(/\(([^)]+)\)/g);
      for (const l of litList) {
        tjText += l[1];
      }
      if (tjText.trim()) allBlocks.push(tjText.trim());
    }

    // Parse standalone Tj: (text) Tj or <hex> Tj
    const singleTjMatches = decompressed.matchAll(/(?:\(([^)]+)\)|<([0-9a-fA-F]+)>)\s*Tj/g);
    for (const stj of singleTjMatches) {
      if (stj[1] && stj[1].trim()) allBlocks.push(stj[1].trim());
      else if (stj[2]) {
        try {
          const dec = Buffer.from(stj[2], "hex").toString("utf8").trim();
          if (dec) allBlocks.push(dec);
        } catch (_) {}
      }
    }

    pos = streamEnd + 9;
  }

  let studentName = null;
  let regNo = null;
  let programme = null;

  // Extract fields sequentially based on certificate layout structure
  for (let i = 0; i < allBlocks.length; i++) {
    const block = allBlocks[i];
    if (/This is to certify that/i.test(block) && i + 1 < allBlocks.length) {
      studentName = allBlocks[i + 1].trim();
    }
    if (/bearing Registration Number/i.test(block) && i + 1 < allBlocks.length) {
      regNo = allBlocks[i + 1].trim().toUpperCase();
    }
    if (/has successfully completed the prescribed course/i.test(block) && i + 1 < allBlocks.length) {
      programme = allBlocks[i + 1].trim();
    }
  }

  const fullText = allBlocks.join(" ");

  // Fallback pattern matching for studentName if layout differed
  if (!studentName) {
    const nameMatch = fullText.match(/c\s*e\s*r\s*t\s*i\s*f\s*y\s*t\s*h\s*a\s*t\s+([\s\S]*?)\s+b\s*e\s*a\s*r\s*i\s*n\s*g/i);
    if (nameMatch && nameMatch[1]) {
      studentName = nameMatch[1].replace(/\s+/g, " ").trim();
    }
  }

  // Fallback pattern matching for registration number
  if (!regNo) {
    const regPatterns = [
      /R\s*e\s*g\s*i\s*s\s*t\s*r\s*a\s*t\s*i\s*o\s*n\s*N\s*u\s*m\s*b\s*e\s*r\s*[:\s]*([A-Za-z0-9_-]+)/i,
      /b\s*e\s*a\s*r\s*i\s*n\s*g[\s\S]*?N\s*u\s*m\s*b\s*e\s*r\s*([A-Za-z0-9_-]+)/i,
      /verify\/([A-Za-z0-9%_-]+)/i,
      /(REG[-_][A-Za-z0-9]+[-_][A-Za-z0-9]+)/i,
      /([A-Za-z]{2,4}[-_][0-9]{4}[-_][A-Za-z0-9]{2,})/i,
    ];
    for (const p of regPatterns) {
      const match = fullText.match(p);
      if (match && match[1]) {
        regNo = decodeURIComponent(match[1].trim()).toUpperCase();
        break;
      }
    }
  }

  // Strategy 3: Fallback from filename
  if (!regNo && originalFilename) {
    const fnMatch = originalFilename.match(/^([a-zA-Z0-9_-]+?)(?:_certificate)?(?:\.pdf)?$/i);
    if (fnMatch && fnMatch[1]) {
      regNo = fnMatch[1].toUpperCase();
    }
  }

  return { studentName, regNo, programme, allBlocks, fullText };
}

/**
 * PDF File Upload Public Verification Handler.
 * Extracts the Registration Number AND validates the document text integrity (e.g. Student Name, Programme)
 * against the cryptographic leaf hash and Ethereum blockchain registry.
 */
exports.verifyPdfUpload = async (req, res) => {
  const fs = require("fs");
  const verifierIp = req.ip;

  try {
    if (!req.file) {
      return res.status(400).json({ valid: false, message: "No PDF certificate file provided." });
    }

    // 1. Read and parse the uploaded PDF file
    const pdfBuffer = fs.readFileSync(req.file.path);
    const pdfMeta = extractPdfMetadataFromBuffer(pdfBuffer, req.file.originalname);

    // Cleanup temp uploaded file
    try {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (_) {}

    const regNo = pdfMeta.regNo;
    if (!regNo) {
      return res.status(400).json({
        valid: false,
        code: "EXTRACTION_FAILED",
        message: "Could not extract the Registration Number from the uploaded PDF. Please ensure the uploaded file is a valid certificate or verify using the Registration Number tab.",
      });
    }

    console.log(`[PDF Verification] Extracted RegNo: '${regNo}', Student Name on PDF: '${pdfMeta.studentName || "N/A"}'`);

    // 2. Fetch certificate from database
    const cert = await Certificate.findOne({ registrationNumber: regNo }).populate("institutionId");

    if (!cert) {
      await VerificationLog.create({
        registrationNumber: regNo,
        method: "PDF",
        result: "NOT_FOUND",
        verifierIp,
        details: `PDF contains registration number '${regNo}' which is not in the registry`,
      });

      return res.status(404).json({
        valid: false,
        code: "NOT_FOUND",
        message: `No certificate found in the official registry for registration number '${regNo}'.`,
      });
    }

    // 3. TAMPER DETECTION: Verify that studentName on the PDF matches the registered record
    if (pdfMeta.studentName) {
      const cleanPdfName = pdfMeta.studentName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      const cleanCertName = cert.studentName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

      if (cleanPdfName !== cleanCertName) {
        await VerificationLog.create({
          registrationNumber: regNo,
          method: "PDF",
          result: "TAMPERED",
          verifierIp,
          details: `PDF student name mismatch: '${pdfMeta.studentName}' vs registered '${cert.studentName}' (Tampered PDF)`,
        });

        return res.status(400).json({
          valid: false,
          code: "TAMPERED_CERTIFICATE",
          message: `Certificate Content Mismatch (Tampering Detected): The student name on the uploaded document ('${pdfMeta.studentName}') does not match the blockchain-registered student name ('${cert.studentName}'). This document has been altered.`,
        });
      }
    }

    // 4. TAMPER DETECTION: Verify Programme if present
    if (pdfMeta.programme) {
      const cleanPdfProg = pdfMeta.programme.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      const cleanCertProg = cert.programme.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

      if (cleanPdfProg !== cleanCertProg) {
        await VerificationLog.create({
          registrationNumber: regNo,
          method: "PDF",
          result: "TAMPERED",
          verifierIp,
          details: `PDF programme mismatch: '${pdfMeta.programme}' vs registered '${cert.programme}' (Tampered PDF)`,
        });

        return res.status(400).json({
          valid: false,
          code: "TAMPERED_CERTIFICATE",
          message: `Certificate Content Mismatch (Tampering Detected): The programme on the uploaded document ('${pdfMeta.programme}') does not match the blockchain-registered programme ('${cert.programme}'). This document has been altered.`,
        });
      }
    }

    // 5. Forward to registration number & blockchain Merkle proof verification engine
    req.params.registrationNumber = regNo;
    req.query.method = "PDF";
    return exports.verifyByRegistrationNumber(req, res);
  } catch (err) {
    if (req.file && req.file.path) {
      try {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (_) {}
    }
    console.error("PDF upload verification error:", err);
    return res.status(500).json({ valid: false, message: err.message });
  }
};
