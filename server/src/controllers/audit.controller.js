const AuditLog = require("../models/AuditLog");

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate("userId", "name email role")
      .populate("institutionId", "name code")
      .sort({ createdAt: -1 })
      .limit(200);

    return res.status(200).json({ success: true, logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
