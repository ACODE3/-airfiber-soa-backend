const express = require("express");
const router = express.Router();


const {
  loginLimiter,
  verifyToken,
  authorizeRoles,
} = require("../middleware/Middleware");


// Only admin can access this router 
router.get("/api/admin", verifyToken, authorizeRoles("admin"), (req,res) => {
    return res.status(200).json({
      message: "Admin Access Granted",
      user: req.user,
    })
});

module.exports = router;