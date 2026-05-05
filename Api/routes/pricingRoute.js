const express = require("express");
const {
  createPricing,
  getAllPricing,
  getPricingMRPDrop,
  deletePricing
} = require("../controllers/pricingController");

const authenticateUser = require("../middlewares/JwtAuth");
const checkRole = require("../middlewares/RoleAuth"); 
const checkDepartment = require("../middlewares/DepartmentAuth"); 

const router = express.Router();

// Create pricing
router.post("/", authenticateUser, checkDepartment("Admin", "HR"), createPricing);

// Read pricing all
router.post("/read", authenticateUser, getAllPricing);

// Read pricing - dropdown
router.get("/names/all", authenticateUser, getPricingMRPDrop);

// Delete pricing slot
router.post("/remove/:id", authenticateUser, checkDepartment("Admin", "HR"), deletePricing);

module.exports = router;


