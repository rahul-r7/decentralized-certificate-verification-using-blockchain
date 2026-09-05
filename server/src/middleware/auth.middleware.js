const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_change_in_production_2026";

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. No token provided.",
        code: "UNAUTHORIZED",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).populate("institutionId");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User account is inactive or no longer exists.",
        code: "INVALID_USER",
      });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId ? user.institutionId._id.toString() : null,
      institution: user.institutionId,
      walletAddress: user.walletAddress,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token.",
      code: "INVALID_TOKEN",
      details: err.message,
    });
  }
}

module.exports = {
  authenticateToken,
  JWT_SECRET,
};
