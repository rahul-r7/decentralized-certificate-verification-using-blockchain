const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const batchController = require("../controllers/batch.controller");
const { authenticateToken } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/rbac.middleware");

// Multer storage configuration for temporary CSV uploads
const uploadDir = path.join(__dirname, "../../uploads/temp");
const fs = require("fs");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `csv_${Date.now()}_${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed!"), false);
    }
  },
});

router.use(authenticateToken);

router.post("/upload", authorizeRoles("EXAMINATION_STAFF"), upload.single("file"), batchController.uploadCsvBatch);
router.get("/", batchController.getBatches);
router.get("/:batchId", batchController.getBatchByBatchId);
router.post("/:batchId/reject", authorizeRoles("CONTROLLER_OF_EXAMINATIONS", "REGISTRAR"), batchController.rejectBatch);

module.exports = router;
