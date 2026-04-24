const express = require("express");
const authenticateUser = require("../middlewares/JwtAuth");
const checkRole = require("../middlewares/RoleAuth");
const checkDepartment = require("../middlewares/DepartmentAuth");
const { createRole,
    getRole,
    updateRole,
    getNextLowerRole, } = require("../controllers/roleController");

const router = express.Router();

// Create role
router.post("/", authenticateUser, checkDepartment("Admin", "HR"), createRole);

// Get role
router.post("/read", authenticateUser, checkDepartment("Admin", "HR"), getRole);

// Update department in Role
router.post("/edit/:roleId", authenticateUser, checkDepartment("Admin", "HR"), updateRole);

// Get next role 
router.post("/next/:roleId", authenticateUser, checkDepartment("Admin", "HR"), getNextLowerRole);

module.exports = router;
