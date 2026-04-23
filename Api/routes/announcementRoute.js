const express = require("express")
const router = express.Router()

const authenticateUser = require("../middlewares/JwtAuth")
const checkRole = require("../middlewares/RoleAuth")
const { createAnnouncement, updateAnnouncement, getAnnouncement, deleteAnnouncement } = require("../controllers/announcementController")

// create 
router.post('/', authenticateUser, checkRole("admin"), createAnnouncement)

// replace
router.post('/replace/:id', authenticateUser, checkRole("admin"), updateAnnouncement)

// delete
router.post('/delete/:id', authenticateUser, checkRole("admin"), deleteAnnouncement)

// read 
router.get('/read', authenticateUser, getAnnouncement)


module.exports = router