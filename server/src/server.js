const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/auth.routes");
const institutionRoutes = require("./routes/institution.routes");
const userRoutes = require("./routes/user.routes");
const batchRoutes = require("./routes/batch.routes");
const approvalRoutes = require("./routes/approval.routes");
const verificationRoutes = require("./routes/verification.routes");
const auditRoutes = require("./routes/audit.routes");
const certificateRoutes = require("./routes/certificate.routes");

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    frameguard: false, // Allows iframe embedding for certificate viewer modal
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: [corsOrigin, "http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Static route for accessing generated PDF certificates locally if needed
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// General API rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { success: false, message: "Too many requests from this IP, please try again later." },
});
app.use("/api/", limiter);

// Mount API Endpoints
app.use("/api/auth", authRoutes);
app.use("/api/institutions", institutionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/batches", approvalRoutes); // Mounted as /api/batches/:batchId/signature
app.use("/api/verify", verificationRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/certificates", certificateRoutes); // Mounted for student download & viewing

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "HEALTHY",
    service: "Decentralized Academic Certificate Verification API",
    timestamp: new Date(),
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    code: err.code || "INTERNAL_ERROR",
    details: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Sync on-chain batches on startup (ensures confirmed batches exist on local Hardhat after restarts)
async function syncOnChainBatches() {
  try {
    const CertificateBatch = require("./models/CertificateBatch");
    const { getBatchFromBlockchain, commitBatchToBlockchain } = require("./services/blockchain.service");

    const confirmedBatches = await CertificateBatch.find({ status: "BLOCKCHAIN_CONFIRMED" }).populate("institutionId");
    for (const batch of confirmedBatches) {
      if (!batch.merkleRoot) continue;
      try {
        const onChain = await getBatchFromBlockchain(batch.merkleRoot);
        if (!onChain.exists) {
          console.log(`[Blockchain Sync] Merkle Root ${batch.merkleRoot} for batch ${batch.batchId} missing on-chain. Auto-registering...`);
          const instCode = batch.institutionId?.code || "NIT-001";
          const res = await commitBatchToBlockchain(batch.batchId, instCode, batch.merkleRoot);
          if (res.txHash) {
            batch.blockchainTxHash = res.txHash;
            await batch.save();
          }
        }
      } catch (err) {
        console.warn(`[Blockchain Sync] Could not sync batch ${batch.batchId}:`, err.message);
      }
    }
  } catch (err) {
    console.warn("[Blockchain Sync] Startup sync skipped:", err.message);
  }
}

// Start Express Server & Connect MongoDB
if (process.env.NODE_ENV !== "test") {
  connectDB().then(async () => {
    app.listen(PORT, async () => {
      console.log(`=======================================================`);
      console.log(`Certificate Verification Backend Server running on port ${PORT}`);
      console.log(`API URL: http://localhost:${PORT}/api`);
      console.log(`=======================================================`);
      await syncOnChainBatches();
    });
  });
} else {
  connectDB();
}

module.exports = app;
