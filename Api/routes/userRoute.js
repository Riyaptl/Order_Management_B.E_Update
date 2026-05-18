const express = require("express");
const router = express.Router();
const { createPartner, createUser, setDepartmentRole, assignUsers, assignAreas , getUsers, assignUsersWithoutSub, assignOrphans, promoteUser, demoteUser, getPartner, editPartner, editUser, statusPartner, partnerAssignment, getUserAreas, assignAreasToPartner, updateUserCity, getUsersDrop, getDistributorsDrop, getOrphans } = require("../controllers/userController");
const authenticateUser = require("../middlewares/JwtAuth");
const checkDepartment = require("../middlewares/DepartmentAuth");
const checkRole = require("../middlewares/RoleAuth");

// Create user
router.post("/", authenticateUser, checkDepartment("Admin", "HR"), createUser);

// Update user
router.post("/edit/:id", authenticateUser, editUser);

// Update areas [add area included]
router.post("/routes/:id", authenticateUser, assignAreas);

// Read users - complete
router.post("/user/:id", authenticateUser, getUsers);

// Read users - orphans
router.post("/orphans", authenticateUser, getOrphans);

// Assign role and department
router.post("/dept_role/:id", authenticateUser, checkDepartment("Admin", "HR"), setDepartmentRole);

// Assign users
router.post("/assign/:id", authenticateUser, assignUsers);

// Assign users - without subordinates
router.post("/assignNoSub/:id", authenticateUser, assignUsersWithoutSub);

// Assign Orphans
router.post("/assignOrphans/:id", authenticateUser, assignOrphans);

// Promote 
router.post("/promote/:id", authenticateUser, checkDepartment("Admin", "HR"), promoteUser);

// Demote 
router.post("/demote/:id", authenticateUser, checkDepartment("Admin", "HR"), demoteUser);

// Get users - filtered on role
router.post("/sales", authenticateUser, getUsersDrop);

// Get user's details [Along with subordinates]
router.post("/details/:id", authenticateUser, getUserAreas);

// Make city updates - can overwrite city array
router.post("/city/:id", authenticateUser, updateUserCity);


// Partners page
// Create Partner
router.post("/partner", authenticateUser, checkDepartment("Admin", "HR"), createPartner);

// Read Partners 
router.post("/partner/read", authenticateUser, getPartner);  

// update partners - pass "city" only if city array is changed
router.post("/partner/edit/:id", authenticateUser, editPartner);

// activate / inactivate partners
router.post("/partner/status/:id", authenticateUser, statusPartner);

// Update partner assignment
router.post("/partner/assign/:id", authenticateUser, partnerAssignment);

// Update areas [add area included] - Partners[Distributor]
router.post("/partner/routes/:id", authenticateUser, assignAreasToPartner);

// Read distributors - drop
router.get("/distributors", authenticateUser, getDistributorsDrop);


module.exports = router;
