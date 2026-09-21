const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const ClientDB = require("../models/client");
const SyncRun = require("../models/syncRun");

const { verifyToken, authorizeRoles, clientLimiter } = require("../middleware/Middleware");
const { runTrackedSync, isSyncRunning } = require("./runTrackedSync");
const { startAutomaticSync, stopSync, getAutoStatus } = require("./AutomaticSync");

function isSheetsConfigured() {
  return Boolean(process.env.SPREADSHEET_ID && process.env.GOOGLE_CREDENTIALS_BASE64);
}

function isDbConfigured() {
  return mongoose.connection.readyState === 1;
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Overview: client count, last run, automatic schedule state.
router.get("/api/soa/status", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const [clientCount, lastRun] = await Promise.all([
      ClientDB.countDocuments({}),
      SyncRun.findOne({ status: { $ne: "running" } }).sort({ startedAt: -1 }),
    ]);

    return res.status(200).json({
      configured: {
        sheets: isSheetsConfigured(),
        db: isDbConfigured(),
      },
      totals: { clients: clientCount },
      lastRun,
      auto: getAutoStatus(),
      running: isSyncRunning(),
    });
  } catch (error) {
    console.error("SOA status failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Recent sync history, newest first.
router.get("/api/soa/runs", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 15, 50);
    const runs = await SyncRun.find({}).sort({ startedAt: -1 }).limit(limit);
    return res.status(200).json({ runs });
  } catch (error) {
    console.error("SOA runs failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Trigger a sync right now.
router.post("/api/soa/sync", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const run = await runTrackedSync({ trigger: "manual", triggeredBy: req.user.id });
    return res.status(200).json({ run });
  } catch (error) {
    if (error.code === "SYNC_IN_PROGRESS") {
      return res.status(409).json({ message: error.message });
    }

    console.error("Manual sync failed:", error);
    return res.status(500).json({ message: error.message || "Sync failed" });
  }
});

// Start / stop the automatic (cron) schedule.
router.post("/api/soa/auto/start", verifyToken, authorizeRoles("admin"), (req, res) => {
  const started = startAutomaticSync();

  if (!started) {
    return res.status(409).json({ message: "Automatic synchronization is already active" });
  }

  return res.status(200).json({ message: "Automatic synchronization started" });
});

router.post("/api/soa/auto/stop", verifyToken, authorizeRoles("admin"), (req, res) => {
  const stopped = stopSync();

  if (!stopped) {
    return res.status(409).json({ message: "Automatic synchronization is not running" });
  }

  return res.status(200).json({ message: "Automatic synchronization stopped" });
});

// Client list / search preview.
router.get("/api/soa/clients", verifyToken, authorizeRoles("admin"), clientLimiter, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const q = String(req.query.q || "").trim();

    const filter = q
      ? {
          $or: [
            { cno: new RegExp(escapeRegex(q), "i") },
            { name: new RegExp(escapeRegex(q), "i") },
          ],
        }
      : {};

    const clients = await ClientDB.find(filter)
      .select("cno name plan thisMonthDue")
      .sort({ cno: 1 })
      .limit(limit);

    return res.status(200).json({ clients });
  } catch (error) {
    console.error("SOA clients failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Single client, with full billing history.
router.get("/api/soa/clients/:cno", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const cno = String(req.params.cno || "").toUpperCase().trim();
    const client = await ClientDB.findOne({ cno });

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    return res.status(200).json({ client });
  } catch (error) {
    console.error("SOA client detail failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
