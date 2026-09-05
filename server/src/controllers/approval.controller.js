const CertificateBatch = require("../models/CertificateBatch");
const Approval = require("../models/Approval");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const { verifyApprovalSignature } = require("../services/eip712.service");
const { commitBatchToBlockchain } = require("../services/blockchain.service");

exports.getApprovals = async (req, res) => {
  try {
    const approvals = await Approval.find({ batchId: req.params.batchId })
      .populate("approverId", "name email role walletAddress")
      .sort({ timestamp: 1 });

    return res.status(200).json({ success: true, approvals });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.submitSignature = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { signature, walletAddress, timestamp } = req.body;

    if (!signature || !walletAddress || !timestamp) {
      return res.status(400).json({
        success: false,
        message: "Signature, walletAddress, and timestamp are required.",
      });
    }

    const batch = await CertificateBatch.findOne({ batchId }).populate("institutionId");
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found." });
    }

    const userRole = req.user.role;
    if (userRole !== "CONTROLLER_OF_EXAMINATIONS" && userRole !== "REGISTRAR") {
      return res.status(403).json({
        success: false,
        message: "Only Controller of Examinations or Registrar can submit approval signatures.",
      });
    }

    // State machine check
    if (userRole === "CONTROLLER_OF_EXAMINATIONS" && batch.status !== "PENDING_COE_APPROVAL") {
      return res.status(400).json({
        success: false,
        message: `Batch is in status '${batch.status}', expected 'PENDING_COE_APPROVAL'`,
      });
    }

    if (userRole === "REGISTRAR" && batch.status !== "PENDING_REGISTRAR_APPROVAL") {
      return res.status(400).json({
        success: false,
        message: `Batch is in status '${batch.status}', expected 'PENDING_REGISTRAR_APPROVAL'`,
      });
    }

    // Verify wallet address registered for user
    const dbUser = await User.findById(req.user.id);
    if (!dbUser.walletAddress) {
      dbUser.walletAddress = walletAddress.toLowerCase().trim();
      await dbUser.save();
    } else if (dbUser.walletAddress.toLowerCase() !== walletAddress.toLowerCase().trim()) {
      return res.status(400).json({
        success: false,
        message: `Connected wallet '${walletAddress}' does not match registered wallet '${dbUser.walletAddress}' for user ${dbUser.email}`,
      });
    }

    // Verify EIP-712 signature
    const verification = verifyApprovalSignature({
      batchId: batch.batchId,
      institutionId: batch.institutionId.code || batch.institutionId._id.toString(),
      merkleRoot: batch.merkleRoot,
      role: userRole,
      timestamp,
      signature,
      expectedWalletAddress: walletAddress,
    });

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: "Invalid EIP-712 signature. Signature verification failed.",
        details: verification,
      });
    }

    // Save Approval record
    const approval = await Approval.create({
      batchId: batch.batchId,
      approverId: req.user.id,
      role: userRole,
      walletAddress: walletAddress.toLowerCase().trim(),
      signature: signature,
      status: "APPROVED",
      timestamp: new Date(Number(timestamp) * 1000),
    });

    // Update batch status machine
    let nextStatus = batch.status;
    let blockchainResult = null;

    if (userRole === "CONTROLLER_OF_EXAMINATIONS") {
      nextStatus = "PENDING_REGISTRAR_APPROVAL";
      batch.status = nextStatus;
      await batch.save();
    } else if (userRole === "REGISTRAR") {
      batch.status = "FULLY_APPROVED";
      await batch.save();

      // Trigger Final Blockchain Commitment
      try {
        batch.status = "BLOCKCHAIN_PENDING";
        await batch.save();

        const instIdentifier = batch.institutionId.code || batch.institutionId._id.toString();
        
        // Idempotency check: verify if Merkle root is already registered on-chain
        const { getBatchFromBlockchain } = require("../services/blockchain.service");
        const existingOnChain = await getBatchFromBlockchain(batch.merkleRoot);

        if (existingOnChain.exists) {
          console.log(`Merkle root ${batch.merkleRoot} already registered on-chain. Marking confirmed.`);
          blockchainResult = {
            success: true,
            txHash: "0x_existing_on_chain",
            blockNumber: 1,
            timestamp: new Date(existingOnChain.timestamp * 1000),
            status: "CONFIRMED",
          };
        } else {
          blockchainResult = await commitBatchToBlockchain(
            batch.batchId,
            instIdentifier,
            batch.merkleRoot
          );
        }

        batch.status = "BLOCKCHAIN_CONFIRMED";
        batch.blockchainTxHash = blockchainResult.txHash;
        batch.blockNumber = blockchainResult.blockNumber;
        batch.blockchainTimestamp = blockchainResult.timestamp;
        await batch.save();

        // Mark all certificates in batch as AVAILABLE for student download
        const Certificate = require("../models/Certificate");
        await Certificate.updateMany({ batchId: batch.batchId }, { status: "AVAILABLE" });
      } catch (bcError) {
        console.error("Blockchain commitment error:", bcError);
        batch.status = "FAILED";
        batch.rejectionReason = `Blockchain commit failed: ${bcError.message}`;
        await batch.save();
      }
    }

    await AuditLog.create({
      userId: req.user.id,
      institutionId: batch.institutionId._id,
      action: `APPROVAL_SUBMITTED_${userRole}`,
      entityType: "BATCH",
      entityId: batch._id.toString(),
      metadata: { batchId: batch.batchId, role: userRole, txHash: batch.blockchainTxHash },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `Approval signature by ${userRole} verified successfully. Batch status updated to '${batch.status}'.`,
      approval,
      batchStatus: batch.status,
      blockchainTxHash: batch.blockchainTxHash,
      blockchainResult,
    });
  } catch (err) {
    console.error("Submit Signature Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
