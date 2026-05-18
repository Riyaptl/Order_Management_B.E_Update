const express = require("express");

const authenticateUser = require("../middlewares/JwtAuth"); 
const checkDepartment = require("../middlewares/DepartmentAuth");
const { getWorkingReport } = require("../controllers/workingReportController");

const router = express.Router();

// Get performance report
router.post("/", authenticateUser, checkDepartment("Admin", "HR", "Sales"), getWorkingReport);

module.exports = router;


