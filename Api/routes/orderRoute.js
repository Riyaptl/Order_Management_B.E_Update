const express = require("express");
const router = express.Router();

const authenticateUser = require("../middlewares/JwtAuth");
const checkRole = require("../middlewares/RoleAuth");

const {
  createOrder,
  getOrdersByArea,
  softDeleteOrder,
  csvExportOrder,
  dailyReport,
  getSalesReport,
  getOrdersBySR,
  getOrdersByDate,
  dailyCallsReport,
} = require("../controllers/orderController");


// router.post("/fix", fixTotals);

// Daily report
router.post("/report", authenticateUser, checkRole("admin", "sr", "tl"), dailyReport);

// Calls report
router.post("/calls/report", authenticateUser, checkRole("admin", "sr", "tl"), dailyCallsReport);

// 1. Create an order
router.post("/", authenticateUser, checkRole("admin", "sr", "distributor", "tl"), createOrder);

// 2. Read Orders by Area (Admin, Dist access)
router.post("/all/area", authenticateUser, checkRole("admin", "sr", "distributor", "tl"), getOrdersByArea);

// 2. Read Orders by SR (Admin, Dist access)
router.post("/all/sr", authenticateUser, checkRole("admin", "sr", "tl"), getOrdersBySR);

// Read Orders by Date (Admin, Dist access)
router.post("/all/date", authenticateUser, checkRole("admin", "sr", "distributor", "tl"), getOrdersByDate);

// 3. Soft Delete Order (Admin access)
router.post("/remove/:id", authenticateUser, checkRole("admin"), softDeleteOrder);

// Get sales report (Admin, Dist access)
router.post("/sales/report", authenticateUser, checkRole("admin", "sr", "distributor", "tl"), getSalesReport);

// 4. CSV Export
router.post("/csv/export", authenticateUser, checkRole("admin", "sr", "distributor", "tl"), csvExportOrder);

module.exports = router;
