const express = require("express");
const router = express.Router();
const institutionController = require("../controllers/institution.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

// Public onboarding / registration
router.post("/onboard", institutionController.onboardRequest);

// Protected routes
router.get("/", authenticateToken, institutionController.getInstitutions);
router.get("/:id", authenticateToken, institutionController.getInstitutionById);

module.exports = router;
