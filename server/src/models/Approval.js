const mongoose = require("mongoose");

const approvalSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      index: true,
    },
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["CONTROLLER_OF_EXAMINATIONS", "REGISTRAR"],
      required: true,
    },
    walletAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    signature: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["APPROVED", "REJECTED"],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Approval", approvalSchema);
