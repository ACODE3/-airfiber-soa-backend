const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/userModel");

const { loginLimiter } = require("../middleware/Middleware");

const router = express.Router();

// Login
router.post("/api/auth/login", loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    //Note: AI fixed needs check
    if (username.length > 50 || password.length > 200) {
    return res.status(400).json({
      message: "Invalid username or password",
    });
  }

    // Note: Ai Fixed Needs to be checked 
    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Valid username and password are required",
      });
    }

    // Find the user in MongoDB
    const user = await User.findOne({
      username: username.trim(),
    });

    // Use a generic message for security
    if (!user) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    // I don't know how this fully works 
    // Compare entered password with stored bcrypt hash
    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    // I dont understand how this works 
    // Create the JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;