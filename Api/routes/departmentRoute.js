const express = require("express");
const authenticateUser = require("../middlewares/JwtAuth");
const checkRole = require("../middlewares/RoleAuth"); 
const { createDepartment, getDepartment } = require("../controllers/departmentController");

const router = express.Router();

// Create department
router.post("/", authenticateUser, checkRole("Admin", "HR"), createDepartment);

// Get department
router.get("/", authenticateUser, checkRole("Admin", "HR"), getDepartment);


module.exports = router;
