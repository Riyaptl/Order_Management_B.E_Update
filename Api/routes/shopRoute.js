const express = require("express");
const router = express.Router();
const fs = require('fs')
const {
  createShop,
  updateShop,
  deleteShop,
  getShopsByArea,
  getShopDetailes,
  getShopOrders,
  csvExportShop,
  shiftArea,
  csvImportShop,
  updateShopAreaNames,
  blacklistShop,
} = require("../controllers/shopController");
const authenticateUser = require("../middlewares/JwtAuth");
const checkRole = require("../middlewares/RoleAuth");
const checkDepartment = require("../middlewares/DepartmentAuth");
const multer = require('multer');
const path = require('path');

// Create uploads folder
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const upload = multer({ dest: uploadDir });


// Create shop
router.post("/", authenticateUser, createShop);

// Update shop
router.post("/:id", authenticateUser, updateShop);

// Delete shop
router.post("/delete/one", authenticateUser, checkDepartment("Admin", "HR", "Sales"), deleteShop);

// Blacklist shop
router.post("/blacklist/one", authenticateUser, checkDepartment("Admin", "HR", "Sales"), blacklistShop);

// Shift area
router.post("/shift/area", authenticateUser, checkDepartment("Admin", "HR", "Sales"), shiftArea);

// Read shops by area- after getAreaDrop
router.post("/route/all", authenticateUser, getShopsByArea);

// Read shop
router.get("/details/:id", authenticateUser, getShopDetailes);

// Read shop orders
router.get("/orders/:id", authenticateUser, getShopOrders);



// 4. CSV Export
router.post("/csv/export", authenticateUser, csvExportShop);

// 4. CSV Import
router.use(authenticateUser, checkRole("admin"))
router.post("/csv/import/:areaId", upload.single('file'), csvImportShop);
router.post("/area/name", updateShopAreaNames);


module.exports = router;
