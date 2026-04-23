const express = require("express");
const {
  createArea,
  updateAreaName,
  deleteArea,
  getAllAreas,
  getAreas,
  csvExportArea
} = require("../controllers/areaController");

const authenticateUser = require("../middlewares/JwtAuth");
const checkRole = require("../middlewares/RoleAuth"); 

const router = express.Router();

// Admin-only
router.post("/admin", authenticateUser, checkRole("admin", "tl"), getAreas);
router.post("/", authenticateUser, checkRole("admin", "tl"), createArea);
router.post("/:id", authenticateUser, checkRole("admin", "tl"), updateAreaName);
router.post("/delete/one/:id", authenticateUser, checkRole("admin", "tl"), deleteArea);

// Public (or authenticated)
router.post("/names/all", authenticateUser, getAllAreas);

// CSV Export
router.post("/csv/export", authenticateUser, checkRole("admin", "tl"), csvExportArea);



module.exports = router;
