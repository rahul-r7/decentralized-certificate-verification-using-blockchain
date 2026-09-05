/**
 * Role-Based Access Control Middleware.
 * Enforces allowed roles for protected backend routes.
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: No user role identified.",
        code: "FORBIDDEN",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of roles: [${allowedRoles.join(", ")}], but user is '${req.user.role}'`,
        code: "ROLE_NOT_AUTHORIZED",
      });
    }

    next();
  };
}

module.exports = {
  authorizeRoles,
};
