const express = require("express");
const router = express.Router();

const authenticateUser = require("../middlewares/JwtAuth");
const checkRole = require("../middlewares/RoleAuth");
const checkDepartment = require("../middlewares/DepartmentAuth");

const {
  createOrder,
  getOrders,
  softDeleteOrder,
  csvExportOrder,
  getSalesReport,
} = require("../controllers/orderController");

// Orders part

// Create an order - calc orderValue on frontend
router.post("/", authenticateUser, checkDepartment("Admin", "Sales", "HR"), createOrder);

// Read Orders - City selection will open for area and SR drop, 
router.post("/all/area", authenticateUser, checkDepartment("Admin", "Sales", "HR"), getOrders);

// Soft Delete Order 
router.post("/remove/:id", authenticateUser, checkDepartment("Admin", "HR"), softDeleteOrder);

// Report part

// Get sales report (Admin, Dist access)
router.post("/sales/report", authenticateUser, checkRole("admin", "sr", "distributor", "tl"), getSalesReport);


// 4. CSV Export
router.post("/csv/export", authenticateUser, checkRole("admin", "sr", "distributor", "tl"), csvExportOrder);
// router.post("/fix", fixTotals);
module.exports = router;
