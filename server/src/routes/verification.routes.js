const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const verificationController = require("../controllers/verification.controller");

const uploadDir = path.join(__dirname, "../../uploads/temp");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

// NO LOGIN REQUIRED for public verification routes!
router.get("/registration/:registrationNumber", verificationController.verifyByRegistrationNumber);
router.get("/qr/:registrationNumber", verificationController.verifyByRegistrationNumber);
router.post("/pdf", upload.single("certificatePdf"), verificationController.verifyPdfUpload);
router.get("/:registrationNumber", verificationController.verifyByRegistrationNumber);

module.exports = router;
