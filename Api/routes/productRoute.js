const express = require("express");
const authenticateUser = require("../middlewares/JwtAuth");
const checkRole = require("../middlewares/RoleAuth"); 
const checkDepartment = require("../middlewares/DepartmentAuth"); 
const { createProduct, updateProduct, getAllProducts, getProductDrop, deleteProduct } = require("../controllers/productController");

const router = express.Router();

// Create product
router.post("/", authenticateUser, checkDepartment("Admin", "HR"), createProduct);

// Update product - handles removal of cat and pricing
router.post("/:id", authenticateUser, checkDepartment("Admin", "HR"), updateProduct);

// Update product - handles removal of cat and pricing
router.post("/remove/:id", authenticateUser, checkDepartment("Admin", "HR"), deleteProduct);

// Get product - filter name
router.post("/read", authenticateUser, getAllProducts);

// Get product drop 
router.get("/names/all", authenticateUser, getProductDrop);

module.exports = router;


