const express = require("express");
const {
  updateCity,
  getAllCities,
  createCity
} = require("../controllers/cityController");

const authenticateUser = require("../middlewares/JwtAuth");
const checkRole = require("../middlewares/RoleAuth"); 

const router = express.Router();

// Admin-only
router.post("/", authenticateUser, checkRole("admin"), createCity);
router.post("/:id", authenticateUser, checkRole("admin"), updateCity);

// Public (or authenticated)
router.get("/", authenticateUser, getAllCities);


module.exports = router;
