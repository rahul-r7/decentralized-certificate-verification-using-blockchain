const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    programme: {
      type: String,
      required: true,
      trim: true,
    },
    semester: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },
    academicData: {
      grade: String,
      issueDate: String,
      certificateType: String,
      additionalInfo: mongoose.Schema.Types.Mixed,
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },
    batchId: {
      type: String,
      required: true,
      ref: "CertificateBatch",
    },
    canonicalData: {
      type: String,
      required: true,
    },
    leafHash: {
      type: String,
      required: true,
    },
    merkleProof: [
      {
        type: String,
      },
    ],
    ipfsCid: {
      type: String,
      default: null,
    },
    verificationUrl: {
      type: String,
      required: true,
    },
    qrData: {
      type: String,
      required: true,
    },
    certificatePdfPath: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: [
        "GENERATED",
        "PENDING_APPROVAL",
        "APPROVED",
        "BLOCKCHAIN_PENDING",
        "AVAILABLE",
        "REJECTED",
      ],
      default: "PENDING_APPROVAL",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Certificate", certificateSchema);
