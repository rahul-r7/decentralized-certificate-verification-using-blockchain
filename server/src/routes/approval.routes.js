const express = require("express");
const router = express.Router();
const approvalController = require("../controllers/approval.controller");
const { authenticateToken } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/rbac.middleware");

router.use(authenticateToken);

router.get("/:batchId", approvalController.getApprovals);
router.post(
  "/:batchId/signature",
  authorizeRoles("CONTROLLER_OF_EXAMINATIONS", "REGISTRAR"),
  approvalController.submitSignature
);

module.exports = router;
