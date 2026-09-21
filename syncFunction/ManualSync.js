const express = require("express");
const router = express.Router();
const { runTrackedSync } = require("./runTrackedSync");

const {
  authorizeRoles,
  verifyToken,
} = require("../middleware/Middleware");



router.post("/api/manual/sync-clients", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const run = await runTrackedSync({ trigger: "manual", triggeredBy: req.user.id });

    res.status(200).json({
      message: "Clients synchronized successfully",
      run,
    });
  } catch (error) {
    if (error.code === "SYNC_IN_PROGRESS") {
      return res.status(409).json({ message: error.message });
    }

    console.error("Manual sync failed:", error);

    res.status(500).json({
      message: "Client synchronization failed",
    });
  }
});

module.exports = router;