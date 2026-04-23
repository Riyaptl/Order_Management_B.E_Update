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
  surveyShop,
} = require("../controllers/shopController");
const authenticateUser = require("../middlewares/JwtAuth");
const checkRole = require("../middlewares/RoleAuth");
const multer = require('multer');
const path = require('path');

// Create uploads folder
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const upload = multer({ dest: uploadDir });


// Admin-only access for create, update, delete
router.post("/", authenticateUser, createShop);
router.post("/:id", authenticateUser, updateShop);
router.post("/delete/one", authenticateUser, deleteShop);
router.post("/blacklist/one", authenticateUser, checkRole("admin", "sr", "distributor", "tl"), blacklistShop);
router.post("/survey/multiple", authenticateUser, checkRole("admin", "me"), surveyShop);
router.post("/shift/area", authenticateUser, checkRole('admin', 'sr', "tl"), shiftArea);

// Public or protected read
router.post("/route/all", authenticateUser, getShopsByArea);
router.get("/details/:id", authenticateUser, getShopDetailes);
router.get("/orders/:id", authenticateUser, getShopOrders);

// 4. CSV Export
router.post("/csv/export", authenticateUser, csvExportShop);

// 4. CSV Import
router.use(authenticateUser, checkRole("admin"))
router.post("/csv/import/:areaId", upload.single('file'), csvImportShop);

router.post("/area/name", updateShopAreaNames);
module.exports = router;
