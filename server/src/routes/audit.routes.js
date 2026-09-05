const express = require("express");
const router = express.Router();
const auditController = require("../controllers/audit.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

router.use(authenticateToken);

router.get("/", auditController.getAuditLogs);

module.exports = router;
