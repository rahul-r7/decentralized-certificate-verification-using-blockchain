const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { authenticateToken } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/rbac.middleware");

router.use(authenticateToken);

router.post("/", authorizeRoles("REGISTRAR"), userController.createUser);
router.get("/", userController.getUsers);
router.patch("/:id", authorizeRoles("REGISTRAR"), userController.updateUser);

module.exports = router;
