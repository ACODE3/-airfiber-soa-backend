const express = require("express");
const router = express.Router();
const syncClients = require("../services/syncClient");

const {
  authorizeRoles,
  verifyToken,
  loginLimiter,
  clientLimiter,
} = require("../middleware/Middleware");



router.post("/api/manual/sync-clients", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    await syncClients();

    res.status(200).json({
      message: "Clients synchronized successfully",
    });
  } catch (error) {
    console.error("Manual sync failed:", error);

    res.status(500).json({
      message: "Client synchronization failed",
    });
  }
});

module.exports = router;