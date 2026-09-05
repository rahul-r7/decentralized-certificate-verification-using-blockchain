const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const Institution = require("../models/Institution");
const User = require("../models/User");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/certificate_verification_db";

async function seed() {
  console.log("Starting database seeding process...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Clear existing collections
  await User.deleteMany({});
  await Institution.deleteMany({});
  console.log("Cleared existing User and Institution collections.");

  // 1. Create Demo Institution
  const demoInst = await Institution.create({
    name: "National Institute of Technology",
    code: "NIT-001",
    email: "contact@nit.ac.in",
    address: "Campus Rd, Knowledge City, IN",
    contactInfo: {
      phone: "+91 9876543210",
      website: "https://nit.ac.in",
    },
    status: "APPROVED",
  });
  console.log(`Created Demo Institution: ${demoInst.name} (${demoInst.code})`);

  // 2. Create Examination Staff
  const staffPassword = await User.hashPassword("Staff@123456");
  const staffUser = await User.create({
    name: "Dr. A. Sharma (Exam Staff)",
    email: "staff@nit.ac.in",
    passwordHash: staffPassword,
    role: "EXAMINATION_STAFF",
    institutionId: demoInst._id,
    isActive: true,
  });
  console.log(`Created Examination Staff: ${staffUser.email}`);

  // 3. Create Controller of Examinations (Hardhat Account #1 Wallet)
  const coePassword = await User.hashPassword("Coe@123456");
  const coeUser = await User.create({
    name: "Prof. R. V. Raman (CoE)",
    email: "coe@nit.ac.in",
    passwordHash: coePassword,
    role: "CONTROLLER_OF_EXAMINATIONS",
    institutionId: demoInst._id,
    walletAddress: "0xFCC5dF5390bAa26Cd78eE53600e43e117f10CFb4".toLowerCase(),
    isActive: true,
  });
  console.log(`Created Controller of Examinations: ${coeUser.email}`);

  // 4. Create Registrar (Hardhat Account #2 Wallet)
  const regPassword = await User.hashPassword("Registrar@123456");
  const regUser = await User.create({
    name: "Dr. S. K. Gupta (Registrar)",
    email: "registrar@nit.ac.in",
    passwordHash: regPassword,
    role: "REGISTRAR",
    institutionId: demoInst._id,
    walletAddress: "0x5bF84eE8E9D4Ef8087616461A775dD27a2BD934A".toLowerCase(),
    isActive: true,
  });
  console.log(`Created Registrar: ${regUser.email}`);

  // Create demo CSV file in assets directory
  const assetsDir = path.join(__dirname, "../assets");
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const csvContent = `registrationNumber,studentName,programme,semester,grade,issueDate,certificateType
REG-2026-CS001,Aarav Patel,Bachelor of Technology in Computer Science & Engineering,Semester VIII,A+,2026-05-30,Degree
REG-2026-CS002,Ananya Verma,Bachelor of Technology in Computer Science & Engineering,Semester VIII,O,2026-05-30,Degree
REG-2026-CS003,Rohan Mehta,Bachelor of Technology in Data Science & AI,Semester VIII,A,2026-05-30,Degree
REG-2026-EE004,Priya Sundaram,Bachelor of Technology in Electrical Engineering,Semester VIII,A+,2026-05-30,Degree
REG-2026-ME005,Vikram Singh,Bachelor of Technology in Mechanical Engineering,Semester VIII,B+,2026-05-30,Degree`;

  fs.writeFileSync(path.join(assetsDir, "demo_students.csv"), csvContent);
  console.log("Created sample CSV file at server/src/assets/demo_students.csv");

  console.log("\n=======================================================");
  console.log("SEEDING COMPLETED SUCCESSFULLY!");
  console.log("=======================================================");
  console.log("Demo Credentials:");
  console.log("Exam Staff:  staff@nit.ac.in         / Staff@123456");
  console.log("CoE:         coe@nit.ac.in           / Coe@123456 (Wallet: 0xFCC5dF5390bAa26Cd78eE53600e43e117f10CFb4)");
  console.log("Registrar:   registrar@nit.ac.in     / Registrar@123456 (Wallet: 0x5bF84eE8E9D4Ef8087616461A775dD27a2BD934A)");
  console.log("=======================================================\n");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
