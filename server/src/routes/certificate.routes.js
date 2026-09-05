const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const certificateController = require("../controllers/certificate.controller");

// Strict rate limiting on public certificate viewing/downloading APIs
const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // Limit each IP to 60 downloads per 15 minutes
  message: {
    available: false,
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many certificate download requests from this IP. Please try again later.",
  },
});

// NO LOGIN REQUIRED for student certificate download routes!
router.get("/download-info/:registrationNumber", downloadLimiter, certificateController.getCertificateDownloadInfo);
router.post("/download-info", downloadLimiter, certificateController.getCertificateDownloadInfo);
router.get("/view/:registrationNumber", downloadLimiter, certificateController.viewCertificatePdf);
router.get("/download/:registrationNumber", downloadLimiter, certificateController.downloadCertificatePdf);

module.exports = router;
