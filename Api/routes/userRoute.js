const express = require("express");
const router = express.Router();
const { getSRDetails, getAllSRs, getAllDists, createPartner, getDists, editDists, statusDists, createUser, setDepartmentRole, assignUsers, getUsers, assignUsersWithoutSub, assignOrphans, promoteUser, demoteUser, getPartner, editPartner } = require("../controllers/userController");
const authenticateUser = require("../middlewares/JwtAuth");
const checkDepartment = require("../middlewares/DepartmentAuth");
const checkRole = require("../middlewares/RoleAuth");

// Create user
router.post("/", authenticateUser, checkDepartment("Admin", "HR"), createUser);

// Read users - complete
router.post("/users/:id", authenticateUser, getUsers);

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



// Partners page
// Create Partner
router.post("/partner", authenticateUser, checkDepartment("Admin", "HR", "Sales"), checkRole("Admin", "HR Head", "NSM", "RSM", "ASM", "SM"), createPartner);

// Read Partners
router.post("/partner/read", authenticateUser, checkDepartment("Admin", "HR", "Sales"), getPartner);  

// update distributors
router.post("/partner/edit/:id", authenticateUser, checkDepartment("Admin", "HR"," Sales"), editPartner);

// activate / inactivate distributor
router.post("/dist/status/:id", authenticateUser, checkRole("admin"), statusDists);

// Update partner assignment

// Only admin should access this
router.post("/srDetails", authenticateUser, checkRole("admin", "tl"), getSRDetails);

// Only admin should access this
router.get("/srs", authenticateUser, checkRole("admin", "tl"), getAllSRs);

// Only admin should access this
router.get("/dists", authenticateUser, checkRole("admin", "tl", "sr"), getAllDists);


module.exports = router;
