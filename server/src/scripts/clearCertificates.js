const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const Certificate = require("../models/Certificate");
const CertificateBatch = require("../models/CertificateBatch");
const Approval = require("../models/Approval");
const VerificationLog = require("../models/VerificationLog");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/certificate_verification_db";

async function clearStudentDatabase() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);

  const certResult = await Certificate.deleteMany({});
  const batchResult = await CertificateBatch.deleteMany({});
  const approvalResult = await Approval.deleteMany({});
  const logResult = await VerificationLog.deleteMany({});

  console.log("=======================================================");
  console.log("STUDENT CERTIFICATE DATABASE CLEARED SUCCESSFULLY!");
  console.log("=======================================================");
  console.log(`- Deleted Certificates: ${certResult.deletedCount}`);
  console.log(`- Deleted Certificate Batches: ${batchResult.deletedCount}`);
  console.log(`- Deleted Approval Records: ${approvalResult.deletedCount}`);
  console.log(`- Deleted Verification Logs: ${logResult.deletedCount}`);
  console.log("=======================================================");

  await mongoose.disconnect();
}

clearStudentDatabase().catch((err) => {
  console.error("Error clearing student database:", err);
  process.exit(1);
});
