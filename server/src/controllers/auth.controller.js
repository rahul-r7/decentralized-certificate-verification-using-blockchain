const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const { JWT_SECRET } = require("../middleware/auth.middleware");

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).populate("institutionId");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is deactivated. Please contact the administrator.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Generate JWT token
    const payload = {
      id: user._id,
      role: user.role,
      institutionId: user.institutionId ? user.institutionId._id : null,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Log audit action
    await AuditLog.create({
      userId: user._id,
      institutionId: user.institutionId ? user.institutionId._id : null,
      action: "USER_LOGIN",
      entityType: "USER",
      entityId: user._id.toString(),
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institutionId,
        walletAddress: user.walletAddress,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error during login.",
      details: err.message,
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("institutionId");
    if (!user) {
      return res.status(444).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institutionId,
        walletAddress: user.walletAddress,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect current password." });
    }

    user.passwordHash = await User.hashPassword(newPassword);
    await user.save();

    await AuditLog.create({
      userId: user._id,
      institutionId: user.institutionId,
      action: "CHANGE_PASSWORD",
      entityType: "USER",
      entityId: user._id.toString(),
      ipAddress: req.ip,
    });

    return res.status(200).json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
