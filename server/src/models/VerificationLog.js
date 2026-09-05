const mongoose = require("mongoose");

const verificationLogSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: true,
      index: true,
    },
    method: {
      type: String,
      enum: ["PDF", "QR", "REGISTRATION_NUMBER"],
      required: true,
    },
    result: {
      type: String,
      enum: ["VALID", "INVALID", "TAMPERED", "NOT_FOUND"],
      required: true,
    },
    verifierIp: {
      type: String,
      default: null,
    },
    details: {
      type: String,
      default: null,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("VerificationLog", verificationLogSchema);
