const express = require("express");
const {
  updateCity,
  getAllCities,
  createCity,
  getCitiesDrop,
  getCitySalesDrop
} = require("../controllers/cityController");

const authenticateUser = require("../middlewares/JwtAuth");
const checkRole = require("../middlewares/RoleAuth"); 
const checkDepartment = require("../middlewares/DepartmentAuth"); 

const router = express.Router();

// Create city
router.post("/", authenticateUser, checkDepartment("Admin", "HR"), createCity);

// Update city
router.post("/:id", authenticateUser, checkDepartment("Admin", "HR"), updateCity);

// Get cities [state filter and access control]
router.get("/", authenticateUser, getAllCities);

// Get cities drop [move to getAreasDrop]
router.get("/names/all", authenticateUser, getCitiesDrop);

// Get sales user within passed city - dropdown
router.post("/sales/all", authenticateUser,  checkDepartment("Admin", "HR", "Sales"), getCitySalesDrop);


module.exports = router;
