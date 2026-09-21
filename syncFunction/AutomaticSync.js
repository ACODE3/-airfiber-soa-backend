const cron = require("node-cron");
const express = require("express");

const {
  verifyToken,
  authorizeRoles,
} = require("../middleware/Middleware");

const { runTrackedSync, isSyncRunning } = require("./runTrackedSync");

const router = express.Router();

const CRON_EXPRESSION = "*/7 * * * *";

// Stores the cron task
let automaticSyncTask = null;

// Is the automatic schedule currently active?
let isScheduleActive = false;


// Runs the actual Google Sheets → MongoDB sync and records it in history
async function runSync() {
  if (isSyncRunning()) {
    console.log("A synchronization is already running. Skipping...");
    return;
  }

  try {
    console.log("Running automatic client sync...");

    await runTrackedSync({ trigger: "automatic", triggeredBy: "cron" });

    console.log("Automatic sync completed.");
  } catch (error) {
    console.error("Automatic sync failed:", error);
  }
}


// Starts or resumes the automatic sync
function startAutomaticSync() {
  if (isScheduleActive) {
    return false;
  }

  // Create the task only once
  if (!automaticSyncTask) {
    automaticSyncTask = cron.schedule(
      CRON_EXPRESSION,
      runSync
    );

    console.log("Automatic sync schedule created.");
  } else {
    // Resume an existing stopped task
    automaticSyncTask.start();

    console.log("Automatic sync schedule resumed.");
  }

  isScheduleActive = true;
  return true;
}


// Pauses the task but keeps it available
function stopSync() {
  if (!automaticSyncTask || !isScheduleActive) {
    return false;
  }

  automaticSyncTask.stop();
  isScheduleActive = false;

  console.log("Automatic sync schedule stopped.");

  return true;
}


// Permanently removes the task
function destroySync() {
  if (!automaticSyncTask) {
    return false;
  }

  automaticSyncTask.destroy();

  automaticSyncTask = null;
  isScheduleActive = false;

  console.log("Automatic sync schedule destroyed.");

  return true;
}


// Current schedule state, used by the dashboard status endpoint
function getAutoStatus() {
  return {
    active: isScheduleActive,
    cron: CRON_EXPRESSION,
  };
}


// START
router.post(
  "/api/automatic/sync-clients",
  verifyToken,
  authorizeRoles("admin"),
  (req, res) => {
    const started = startAutomaticSync();

    if (!started) {
      return res.status(409).json({
        message: "Automatic synchronization is already active",
      });
    }

    return res.status(200).json({
      message: "Automatic synchronization started",
    });
  }
);


// STOP
router.post(
  "/api/automatic/sync-clients/stop",
  verifyToken,
  authorizeRoles("admin"),
  (req, res) => {
    const stopped = stopSync();

    if (!stopped) {
      return res.status(409).json({
        message: "Automatic synchronization is not running",
      });
    }

    return res.status(200).json({
      message: "Automatic synchronization stopped",
    });
  }
);


// DESTROY
router.post(
  "/api/automatic/sync-clients/destroy",
  verifyToken,
  authorizeRoles("admin"),
  (req, res) => {
    const destroyed = destroySync();

    if (!destroyed) {
      return res.status(409).json({
        message: "No automatic synchronization task exists",
      });
    }

    return res.status(200).json({
      message: "Automatic synchronization destroyed",
    });
  }
);


module.exports = {
  router,
  startAutomaticSync,
  stopSync,
  destroySync,
  getAutoStatus,
};
