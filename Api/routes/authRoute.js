const express = require("express")
const router = express.Router()
const { loginAuth, signup } = require("../controllers/authController")

// Login
router.post('/login', loginAuth)

// Sign up
router.post('/signup', signup)

// // Logout
// router.post('/logout', logoutAuth)

module.exports = router