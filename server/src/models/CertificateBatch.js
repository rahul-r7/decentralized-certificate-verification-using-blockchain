const mongoose = require("mongoose");

const certificateBatchSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    totalCertificates: {
      type: Number,
      required: true,
      default: 0,
    },
    merkleRoot: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "PENDING_COE_APPROVAL",
        "COE_APPROVED",
        "PENDING_REGISTRAR_APPROVAL",
        "FULLY_APPROVED",
        "REJECTED",
        "BLOCKCHAIN_PENDING",
        "BLOCKCHAIN_CONFIRMED",
        "FAILED",
      ],
      default: "DRAFT",
    },
    blockchainTxHash: {
      type: String,
      default: null,
    },
    blockchainTimestamp: {
      type: Date,
      default: null,
    },
    blockNumber: {
      type: Number,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CertificateBatch", certificateBatchSchema);
