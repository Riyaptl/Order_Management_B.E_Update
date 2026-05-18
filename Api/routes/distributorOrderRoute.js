const express = require("express");
const {
  createDistributorOrder,
  updateDistributorOrder,
  readDistributorOrders,
  deleteDistributorOrder,
  updateDeliveryDetails,
  updatePaymentStatus,
  exportDistributorOrdersCSV,
  getDistributorOrderSummary,
  getDistributorOrderTrend
} = require("../controllers/distributorOrderController");

const authenticateUser = require("../middlewares/JwtAuth");
const checkRole = require("../middlewares/RoleAuth"); 
const checkDepartment = require("../middlewares/DepartmentAuth"); 

const router = express.Router();

// Create - Calculate order value on frontend
router.post("/", authenticateUser, checkDepartment("Admin", "Sales", "HR", "Partners"), createDistributorOrder);

// Read
router.post("/orders/read", authenticateUser, checkDepartment("Admin", "Sales", "HR", "Partners"), readDistributorOrders);

// Update 
router.post("/status", authenticateUser, checkDepartment("Admin", "Production"), updateDistributorOrder);

// Update order delivery details
router.post("/update", authenticateUser, checkDepartment("Admin", "HR"), updateDeliveryDetails);

// Update payment status
router.post("/payment", authenticateUser, checkDepartment("Admin", "Production"), updatePaymentStatus);

// Delete
router.post("/delete/:id", authenticateUser, checkDepartment("Admin", "HR"), deleteDistributorOrder);

// Read distributors performance - overall order value included
router.post("/amount/read", authenticateUser, checkDepartment("Admin", "Sales", "HR"), getDistributorOrderSummary);

// 12 months dist orders trend
router.post("/year/read", authenticateUser, checkDepartment("Admin", "Sales", "HR"), getDistributorOrderTrend);

router.get("/export/:id", exportDistributorOrdersCSV);

module.exports = router;
