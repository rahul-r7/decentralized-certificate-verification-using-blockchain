const Certificate = require("../models/Certificate");
const CertificateBatch = require("../models/CertificateBatch");
const AuditLog = require("../models/AuditLog");
const { getCertificate } = require("../services/ipfs.service");

/**
 * Public Certificate Download Info Lookup API (No Auth Required).
 */
exports.getCertificateDownloadInfo = async (req, res) => {
  const rawRegNo = req.params.registrationNumber || req.body.registrationNumber || "";
  const regNo = String(rawRegNo).trim().toUpperCase();

  try {
    if (!regNo) {
      return res.status(400).json({
        available: false,
        code: "INVALID_INPUT",
        message: "Registration number is required.",
      });
    }

    const cert = await Certificate.findOne({ registrationNumber: regNo })
      .populate("institutionId");

    if (!cert) {
      return res.status(404).json({
        available: false,
        code: "NOT_FOUND",
        message: "Certificate not found.",
      });
    }

    const batch = await CertificateBatch.findOne({ batchId: cert.batchId });
    const isBlockchainConfirmed = batch && batch.status === "BLOCKCHAIN_CONFIRMED";
    const isAvailable = isBlockchainConfirmed && (cert.status === "AVAILABLE" || cert.status === "ISSUED");

    if (!isAvailable) {
      return res.status(200).json({
        available: false,
        code: "DOWNLOAD_UNAVAILABLE",
        message: "Certificate download is unavailable until the batch has completed full approval and Ethereum blockchain commitment.",
        status: cert.status,
        batchStatus: batch ? batch.status : "UNKNOWN",
        studentName: cert.studentName,
        registrationNumber: cert.registrationNumber,
        programme: cert.programme,
        institutionName: cert.institutionId ? cert.institutionId.name : "Academic Institution",
      });
    }

    // Audit log
    await AuditLog.create({
      action: "CERTIFICATE_LOOKUP",
      entityType: "CERTIFICATE",
      entityId: cert.registrationNumber,
      metadata: { registrationNumber: cert.registrationNumber, ipfsCid: cert.ipfsCid },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      available: true,
      status: "AVAILABLE",
      batchStatus: "BLOCKCHAIN_CONFIRMED",
      studentName: cert.studentName,
      registrationNumber: cert.registrationNumber,
      programme: cert.programme,
      semester: cert.semester,
      grade: cert.academicData?.grade || "N/A",
      issueDate: cert.academicData?.issueDate || cert.createdAt,
      certificateType: cert.academicData?.certificateType || "Degree",
      institutionName: cert.institutionId ? cert.institutionId.name : "Academic Institution",
      blockchainTxHash: batch.blockchainTxHash,
      viewUrl: `/api/certificates/view/${encodeURIComponent(cert.registrationNumber)}`,
      downloadUrl: `/api/certificates/download/${encodeURIComponent(cert.registrationNumber)}`,
    });
  } catch (err) {
    console.error("Download Info Lookup Error:", err);
    return res.status(500).json({
      available: false,
      code: "SERVER_ERROR",
      message: `Error retrieving certificate information: ${err.message}`,
    });
  }
};

/**
 * Public Inline PDF Viewer API (Streams PDF from IPFS).
 */
exports.viewCertificatePdf = async (req, res) => {
  const rawRegNo = req.params.registrationNumber || "";
  const regNo = String(rawRegNo).trim().toUpperCase();

  try {
    if (!regNo) {
      return res.status(400).send("Registration number is required.");
    }

    const cert = await Certificate.findOne({ registrationNumber: regNo });
    if (!cert) {
      return res.status(404).send("Certificate not found.");
    }

    const batch = await CertificateBatch.findOne({ batchId: cert.batchId });
    if (!batch || batch.status !== "BLOCKCHAIN_CONFIRMED") {
      return res.status(403).send("Certificate download is unavailable until the batch is confirmed on the blockchain.");
    }

    if (!cert.ipfsCid) {
      return res.status(500).send("IPFS document reference missing for this certificate.");
    }

    // Retrieve PDF buffer from IPFS
    const pdfBuffer = await getCertificate(cert.ipfsCid);

    // Audit log
    await AuditLog.create({
      action: "CERTIFICATE_VIEW",
      entityType: "CERTIFICATE",
      entityId: cert.registrationNumber,
      metadata: { registrationNumber: cert.registrationNumber, ipfsCid: cert.ipfsCid },
      ipAddress: req.ip,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="Certificate-${regNo}.pdf"`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error("View Certificate PDF Error:", err);
    return res.status(500).send(`Error retrieving certificate file: ${err.message}`);
  }
};

/**
 * Public PDF Attachment Download API (Streams PDF Attachment from IPFS).
 */
exports.downloadCertificatePdf = async (req, res) => {
  const rawRegNo = req.params.registrationNumber || "";
  const regNo = String(rawRegNo).trim().toUpperCase();

  try {
    if (!regNo) {
      return res.status(400).send("Registration number is required.");
    }

    const cert = await Certificate.findOne({ registrationNumber: regNo });
    if (!cert) {
      return res.status(404).send("Certificate not found.");
    }

    const batch = await CertificateBatch.findOne({ batchId: cert.batchId });
    if (!batch || batch.status !== "BLOCKCHAIN_CONFIRMED") {
      return res.status(403).send("Certificate download is unavailable until the batch is confirmed on the blockchain.");
    }

    if (!cert.ipfsCid) {
      return res.status(500).send("IPFS document reference missing for this certificate.");
    }

    // Retrieve PDF buffer from IPFS
    const pdfBuffer = await getCertificate(cert.ipfsCid);

    // Audit log
    await AuditLog.create({
      action: "CERTIFICATE_DOWNLOAD",
      entityType: "CERTIFICATE",
      entityId: cert.registrationNumber,
      metadata: { registrationNumber: cert.registrationNumber, ipfsCid: cert.ipfsCid },
      ipAddress: req.ip,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Certificate-${regNo}.pdf"`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error("Download Certificate PDF Error:", err);
    return res.status(500).send(`Error downloading certificate file: ${err.message}`);
  }
};
