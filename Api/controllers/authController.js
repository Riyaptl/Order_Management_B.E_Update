const User = require("../models/User")
const jwt = require("jsonwebtoken")
const sendOTPEmail = require('../utils/email');
const bcrypt = require("bcrypt")

// Token
const generateToken = (user) => {
    return jwt.sign({
        _id: user._id,
        username: user.username,
        role: user.role_name,
        department: user.dept_name
    }, process.env.SECRET)
}

// Login
const loginAuth = async (req, res) => {
    const { username, password, loginLoc } = req.body;
    
    try {
        const usernameTrimmed = username.trim();
        const user = await User.login({ username: usernameTrimmed, password });

        const token = generateToken(user);
        await user.save()

        res.status(200).json({
            token,
            message: "Login successful",
            user: user.username,
            role: user.role_name,
            department: user.dept_name
        });

    } catch (error) {
      console.log(error);
      
        res.status(400).json(error.message);
    }
};

// Sign up
const signup = async (req, res) => {
  try {
    const {
      username,
      password,
      confirmPassword,
      role,
      address,
      contact,
    } = req.body;

    const usernameTrimmed = username.trim();
   
    const roleTrimmed = role.trim();

    // ✅ Password match check
    if (password !== confirmPassword) {
      return res.status(400).json("Passwords do not match");
    }

    // ✅ Username uniqueness
    const existingUserByUsername = await User.findOne({
      username: usernameTrimmed,
    });
    if (existingUserByUsername) {
      return res.status(400).json("Username already exists");
    }

    // ✅ Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ✅ Create user directly
    const user = new User({
      username: usernameTrimmed,
      role: roleTrimmed,
      password: hashedPassword,
      address,
      contact,
    });

    await user.save();

    // ✅ Generate token
    const token = generateToken(user);

    res.status(201).json({
      message: "Sign up successful",
      token,
      user: user.username,
      role: user.role_name,
      department: user.dept_name
    });

  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json(error.message);
  }
};

module.exports = {loginAuth, signup}