const express = require("express");

const authenticateUser = require("../middlewares/JwtAuth"); 
const { createTarget, calculateSubTargetAchieved, getSubTargetAchieved } = require("../controllers/targetReportController");
const checkDepartment = require("../middlewares/DepartmentAuth")

const router = express.Router();

// Target assignment - create and update
router.post("/", authenticateUser, checkDepartment("Admin", "HR", "Sales"), createTarget);

// Get subordinate target for a month
router.post("/subTarget/month", authenticateUser, checkDepartment("Admin", "HR", "Sales") ,calculateSubTargetAchieved);

// Get complete subordinate target array
router.post("/subTarget", authenticateUser,  checkDepartment("Admin", "HR", "Sales"), getSubTargetAchieved);

module.exports = router;


