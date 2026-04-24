const express = require("express");
const router = express.Router();
const { createPartner, createUser, setDepartmentRole, assignUsers, assignAreas , getUsers, assignUsersWithoutSub, assignOrphans, promoteUser, demoteUser, getPartner, editPartner, editUser, statusPartner, partnerAssignment, getUserAreas, getSalesUsers } = require("../controllers/userController");
const authenticateUser = require("../middlewares/JwtAuth");
const checkDepartment = require("../middlewares/DepartmentAuth");
const checkRole = require("../middlewares/RoleAuth");

// Create user
router.post("/", authenticateUser, checkDepartment("Admin", "HR"), createUser);

// Update user
router.post("/edit/:id", authenticateUser, editUser);

// Update areas [add area included]
router.post("/routes/:id", authenticateUser, checkDepartment("Admin", "HR", "Sales"), assignAreas);

// Read users - complete
router.post("/user/:id", authenticateUser, getUsers);

// Assign role and department
router.post("/dept_role/:id", authenticateUser, checkDepartment("Admin", "HR"), setDepartmentRole);

// Assign users
router.post("/assign/:id", authenticateUser, checkDepartment("Admin", "HR"), assignUsers);

// Assign users - without subordinates
router.post("/assignNoSub/:id", authenticateUser, checkDepartment("Admin", "HR"), assignUsersWithoutSub);

// Assign Orphans
router.post("/assignOrphans/:id", authenticateUser, checkDepartment("Admin", "HR"), assignOrphans);

// Promote 
router.post("/promote/:id", authenticateUser, checkDepartment("Admin", "HR"), promoteUser);

// Demote 
router.post("/demote/:id", authenticateUser, checkDepartment("Admin", "HR"), demoteUser);

// Get sales users
router.post("/sales", authenticateUser, checkDepartment("Admin", "HR", "Sales"), getSalesUsers);



// Partners page
// Create Partner
router.post("/partner", authenticateUser, checkDepartment("Admin", "HR", "Sales"), checkRole("Admin", "HR Head", "NSM", "RSM", "ASM", "SM"), createPartner);

// Read Partners
router.post("/partner/read", authenticateUser, checkDepartment("Admin", "HR", "Sales"), getPartner);  

// update distributors
router.post("/partner/edit/:id", authenticateUser, checkDepartment("Admin", "HR", "Sales"), editPartner);

// activate / inactivate distributor
router.post("/partner/status/:id", authenticateUser, checkDepartment("Admin", "HR", "Sales"), checkRole("Admin", "HR Head", "NSM", "RSM", "ASM", "SM"), statusPartner);

// Update partner assignment
router.post("/partner/assign/:id", authenticateUser, checkDepartment("Admin", "HR", "Sales"), checkRole("Admin", "HR Head", "NSM", "RSM", "ASM", "SM"), partnerAssignment);

// Get user's details [Along with subordinates]
router.post("/details/:id", authenticateUser, checkDepartment("Admin", "HR", "Sales"), getUserAreas);

// Update areas [add area included] - Partners[Distributor]
router.post("/routes/:id", authenticateUser, checkDepartment("Admin", "HR", "Sales"), getUserAreas);

module.exports = router;
