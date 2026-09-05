const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const Certificate = require("../models/Certificate");
const Institution = require("../models/Institution");
const { generateCertificatePdf } = require("../services/pdf.service");
const { uploadCertificate } = require("../services/ipfs.service");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/certificate_verification_db";

async function regeneratePdfs() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  const certs = await Certificate.find({}).populate("institutionId");
  console.log(`Found ${certs.length} certificates to regenerate.`);

  for (const cert of certs) {
    try {
      const institutionName = cert.institutionId ? cert.institutionId.name : "DEMO UNIVERSITY";
      
      const certData = {
        registrationNumber: cert.registrationNumber,
        studentName: cert.studentName,
        programme: cert.programme,
        semester: cert.semester,
        academicData: cert.academicData,
        grade: cert.academicData?.grade,
        issueDate: cert.academicData?.issueDate,
      };

      const { pdfBuffer, filePath } = await generateCertificatePdf(certData, institutionName);
      const newIpfsCid = await uploadCertificate(pdfBuffer);

      cert.ipfsCid = newIpfsCid;
      cert.certificatePdfPath = filePath;
      await cert.save();

      console.log(`✓ Regenerated PDF for ${cert.registrationNumber} -> IPFS CID: ${newIpfsCid}`);
    } catch (err) {
      console.error(`✗ Failed to regenerate ${cert.registrationNumber}:`, err.message);
    }
  }

  console.log("\n=== PDF REGENERATION COMPLETE ===");
  await mongoose.disconnect();
}

regeneratePdfs().catch((err) => {
  console.error("Regeneration error:", err);
  process.exit(1);
});
