const fs = require("fs");
const path = require("path");
const csvParser = require("csv-parser");
const CertificateBatch = require("../models/CertificateBatch");
const Certificate = require("../models/Certificate");
const Institution = require("../models/Institution");
const AuditLog = require("../models/AuditLog");
const {
  createCanonicalString,
  createLeafHash,
  buildMerkleTree,
  getMerkleRoot,
  getMerkleProof,
} = require("../services/merkle.service");
const { generateCertificatePdf } = require("../services/pdf.service");
const { uploadCertificate } = require("../services/ipfs.service");

/**
 * Validates and processes a CSV file uploaded by Examination Staff.
 */
exports.uploadCsvBatch = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No CSV file uploaded." });
    }

    const institutionId = req.user.institutionId;
    if (!institutionId) {
      return res.status(400).json({ success: false, message: "User is not associated with an institution." });
    }

    const institution = await Institution.findById(institutionId);
    if (!institution || institution.status !== "APPROVED") {
      return res.status(403).json({ success: false, message: "Institution is not active/approved for issuance." });
    }

    const rawRecords = [];
    const filePath = req.file.path;

    // Parse CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on("data", (data) => rawRecords.push(data))
        .on("end", resolve)
        .on("error", reject);
    });

    // Cleanup temp uploaded CSV file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    if (rawRecords.length === 0) {
      return res.status(400).json({ success: false, message: "CSV file is empty." });
    }

    // Validation checks
    const validRecords = [];
    const invalidRecords = [];
    const seenRegNos = new Set();

    for (let i = 0; i < rawRecords.length; i++) {
      const row = rawRecords[i];
      const rowNum = i + 1;

      const regNo = String(row.registrationNumber || row.regNo || "").trim();
      const studentName = String(row.studentName || row.name || "").trim();
      const programme = String(row.programme || row.course || "").trim();
      const semester = String(row.semester || "").trim();
      const grade = String(row.grade || row.cgpa || "A").trim();
      const issueDate = String(row.issueDate || new Date().toISOString().split("T")[0]).trim();
      const certificateType = String(row.certificateType || "Degree").trim();

      const errors = [];

      if (!regNo) errors.push("Missing registrationNumber");
      if (!studentName) errors.push("Missing studentName");
      if (!programme) errors.push("Missing programme");

      // Check duplicates within CSV
      if (regNo && seenRegNos.has(regNo.toUpperCase())) {
        errors.push(`Duplicate registrationNumber '${regNo}' in CSV`);
      } else if (regNo) {
        seenRegNos.add(regNo.toUpperCase());
      }

      // Check existing database records
      if (regNo) {
        const existingInDb = await Certificate.findOne({ registrationNumber: regNo.toUpperCase() });
        if (existingInDb) {
          errors.push(`Registration number '${regNo}' already exists in database`);
        }
      }

      if (errors.length > 0) {
        invalidRecords.push({ rowNum, row, errors });
      } else {
        validRecords.push({
          registrationNumber: regNo.toUpperCase(),
          studentName,
          programme,
          semester,
          grade,
          issueDate,
          certificateType,
          institutionId: institution._id.toString(),
          institutionCode: institution.code,
        });
      }
    }

    // Reject if any validation errors
    if (invalidRecords.length > 0) {
      return res.status(422).json({
        success: false,
        message: "CSV validation failed with errors.",
        report: {
          totalRecords: rawRecords.length,
          validCount: validRecords.length,
          invalidCount: invalidRecords.length,
          invalidRecords,
        },
      });
    }

    // Generate unique batch ID
    const batchId = `BATCH-${institution.code}-${Date.now().toString().slice(-6)}`;

    // Compute canonical string and leaf hash for each record
    const processedCertificates = [];
    const leafHashes = [];

    for (const certData of validRecords) {
      const canonicalData = createCanonicalString(certData);
      const leafHash = createLeafHash(certData);

      // Generate PDF with embedded QR verification URL
      const { pdfBuffer, filePath: certPdfPath, verificationUrl, qrDataUrl } = await generateCertificatePdf(
        certData,
        institution.name
      );

      // Upload final generated PDF to IPFS
      const ipfsCid = await uploadCertificate(pdfBuffer);

      processedCertificates.push({
        registrationNumber: certData.registrationNumber,
        studentName: certData.studentName,
        programme: certData.programme,
        semester: certData.semester,
        academicData: {
          grade: certData.grade,
          issueDate: certData.issueDate,
          certificateType: certData.certificateType,
        },
        institutionId: institution._id,
        batchId: batchId,
        canonicalData: canonicalData,
        leafHash: leafHash,
        ipfsCid: ipfsCid,
        verificationUrl: verificationUrl,
        qrData: qrDataUrl,
        certificatePdfPath: certPdfPath,
        status: "PENDING_APPROVAL",
      });

      leafHashes.push(leafHash);
    }

    // Build Merkle Tree
    const merkleTree = buildMerkleTree(leafHashes);
    const merkleRoot = getMerkleRoot(merkleTree);

    // Assign Merkle Proofs to individual certificate records
    processedCertificates.forEach((cert, idx) => {
      cert.merkleProof = getMerkleProof(merkleTree, idx);
    });

    // Create CertificateBatch record
    const batch = await CertificateBatch.create({
      batchId,
      institutionId: institution._id,
      uploadedBy: req.user.id,
      totalCertificates: processedCertificates.length,
      merkleRoot: merkleRoot,
      status: "PENDING_COE_APPROVAL",
    });

    // Bulk save certificates
    await Certificate.insertMany(processedCertificates);

    await AuditLog.create({
      userId: req.user.id,
      institutionId: institution._id,
      action: "BATCH_CREATED",
      entityType: "BATCH",
      entityId: batch._id.toString(),
      metadata: { batchId, totalCertificates: processedCertificates.length, merkleRoot },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: `Batch '${batchId}' created successfully with ${processedCertificates.length} certificates. Awaiting CoE approval.`,
      batch,
    });
  } catch (err) {
    console.error("CSV Upload Processing Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBatches = async (req, res) => {
  try {
    const filter = {};
    if (req.user.institutionId) {
      filter.institutionId = req.user.institutionId;
    }

    const batches = await CertificateBatch.find(filter)
      .populate("institutionId")
      .populate("uploadedBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, batches });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBatchByBatchId = async (req, res) => {
  try {
    const batch = await CertificateBatch.findOne({ batchId: req.params.batchId })
      .populate("institutionId")
      .populate("uploadedBy", "name email role");

    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found." });
    }

    const certificates = await Certificate.find({ batchId: batch.batchId });
    const Approval = require("../models/Approval");
    const approvals = await Approval.find({ batchId: batch.batchId }).populate("approverId", "name email role walletAddress");

    return res.status(200).json({
      success: true,
      batch,
      certificates,
      approvals,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.rejectBatch = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const batch = await CertificateBatch.findOne({ batchId: req.params.batchId });

    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found." });
    }

    if (batch.status === "BLOCKCHAIN_CONFIRMED") {
      return res.status(400).json({ success: false, message: "Cannot reject a batch that is already committed on blockchain." });
    }

    batch.status = "REJECTED";
    batch.rejectionReason = rejectionReason || "Rejected by authority";
    await batch.save();

    // Mark all certificates in batch as REJECTED
    await Certificate.updateMany({ batchId: batch.batchId }, { status: "REJECTED" });

    await AuditLog.create({
      userId: req.user.id,
      institutionId: batch.institutionId,
      action: "BATCH_REJECTED",
      entityType: "BATCH",
      entityId: batch._id.toString(),
      metadata: { batchId: batch.batchId, reason: batch.rejectionReason },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `Batch '${batch.batchId}' has been rejected.`,
      batch,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
