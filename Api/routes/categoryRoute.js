const express = require("express");
const authenticateUser = require("../middlewares/JwtAuth");
const checkRole = require("../middlewares/RoleAuth"); 
const checkDepartment = require("../middlewares/DepartmentAuth"); 
const { createCategory, getAllCategories, getCategoryDrop, deleteCategory, updateCategory } = require("../controllers/categoryController");

const router = express.Router();

// Create category
router.post("/", authenticateUser, checkDepartment("Admin", "HR"), createCategory);

// Update category - name only
router.post("/:id", authenticateUser, checkDepartment("Admin", "HR"), updateCategory);

// Read category all
router.post("/read", authenticateUser, getAllCategories);

// Read category - dropdown
router.get("/names/all", authenticateUser, getCategoryDrop);

// Delete category slot
router.post("/remove/:id", authenticateUser, checkDepartment("Admin", "HR"), deleteCategory);

module.exports = router;


