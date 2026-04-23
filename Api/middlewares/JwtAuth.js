const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  // Check if token exists and is in the correct format
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json("Unauthorized: No token provided");
  }

  const token = authHeader.split(" ")[1];
  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.SECRET);

    // Attach user to request
    req.user = {
      _id: decoded._id,
      username: decoded.username,
      role: decoded.role,
      department: decoded.department
    };

    next();
  } catch (error) {
    return res.status(401).json("Unauthorized: Invalid token");
  }
};

module.exports = authenticateUser;
