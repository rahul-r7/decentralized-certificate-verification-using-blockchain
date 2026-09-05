const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, walletAddress } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, and role are required.",
      });
    }

    const institutionId = req.user.institutionId;
    if (!institutionId) {
      return res.status(400).json({
        success: false,
        message: "User is not associated with an institution.",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    const passwordHash = await User.hashPassword(password);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      institutionId: institutionId,
      walletAddress: walletAddress ? walletAddress.toLowerCase().trim() : null,
      isActive: true,
    });

    await AuditLog.create({
      userId: req.user.id,
      institutionId: user.institutionId,
      action: "CREATE_USER",
      entityType: "USER",
      entityId: user._id.toString(),
      metadata: { role: user.role, email: user.email },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: "User account created successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institutionId: user.institutionId,
        walletAddress: user.walletAddress,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.user.institutionId) {
      filter.institutionId = req.user.institutionId;
    }

    const users = await User.find(filter)
      .populate("institutionId")
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, role, walletAddress, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (name) user.name = name.trim();
    if (role) user.role = role;
    if (walletAddress !== undefined) user.walletAddress = walletAddress ? walletAddress.toLowerCase().trim() : null;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    await AuditLog.create({
      userId: req.user.id,
      institutionId: user.institutionId,
      action: "UPDATE_USER",
      entityType: "USER",
      entityId: user._id.toString(),
      metadata: { role: user.role, walletAddress: user.walletAddress },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      user,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
