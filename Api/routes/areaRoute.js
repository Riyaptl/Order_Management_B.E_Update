const express = require("express");
const {
  createArea,
  updateArea,
  deleteArea,
  getAllAreas,
  getAreas,
  csvExportArea,
  getAreasDrop
} = require("../controllers/areaController");

const authenticateUser = require("../middlewares/JwtAuth");
const checkRole = require("../middlewares/RoleAuth"); 
const checkDepartment = require("../middlewares/DepartmentAuth"); 

const router = express.Router();

// Create area
router.post("/", authenticateUser, createArea);

// Update area
router.post("/:id", authenticateUser, updateArea);

// Delet area
router.post("/delete/one/:id", authenticateUser, deleteArea);

// Read areas
router.post("/read", authenticateUser, getAreas);

// Get areas dropdown - city compulsory [move to getShopsList]
router.post("/names/all", authenticateUser, getAreasDrop);

// Public (or authenticated)
// router.post("/names/all", authenticateUser, getAllAreas);

// CSV Export
// router.post("/csv/export", authenticateUser, checkRole("admin", "tl"), csvExportArea);

module.exports = router;
