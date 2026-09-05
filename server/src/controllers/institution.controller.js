const Institution = require("../models/Institution");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

exports.onboardRequest = async (req, res) => {
  try {
    const { name, code, email, address, phone, website, registrarName, registrarPassword } = req.body;

    if (!name || !code || !email || !address) {
      return res.status(400).json({
        success: false,
        message: "Institution Name, Code, Email, and Address are required.",
      });
    }

    const existingCode = await Institution.findOne({ code: code.toUpperCase().trim() });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: `Institution code '${code}' is already registered.`,
      });
    }

    // Auto-approve institution onboarding directly
    const institution = await Institution.create({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      email: email.toLowerCase().trim(),
      address: address.trim(),
      contactInfo: { phone, website },
      status: "APPROVED",
    });

    // Create initial Registrar User account for the university
    const regPassword = registrarPassword || "Registrar@123456";
    const passwordHash = await User.hashPassword(regPassword);
    
    const registrarUser = await User.create({
      name: registrarName ? registrarName.trim() : `Registrar (${institution.code})`,
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "REGISTRAR",
      institutionId: institution._id,
      isActive: true,
    });

    await AuditLog.create({
      userId: registrarUser._id,
      institutionId: institution._id,
      action: "INSTITUTION_REGISTERED",
      entityType: "INSTITUTION",
      entityId: institution._id.toString(),
      metadata: { name: institution.name, code: institution.code, registrarEmail: registrarUser.email },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: `Institution '${institution.name}' registered successfully! Registrar account created.`,
      institution,
      registrarAccount: {
        email: registrarUser.email,
        password: regPassword,
        role: "REGISTRAR",
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getInstitutions = async (req, res) => {
  try {
    const institutions = await Institution.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, institutions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getInstitutionById = async (req, res) => {
  try {
    const institution = await Institution.findById(req.params.id);
    if (!institution) {
      return res.status(404).json({ success: false, message: "Institution not found." });
    }
    return res.status(200).json({ success: true, institution });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
