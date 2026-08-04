const cron = require("node-cron");
const express = require("express");

const syncClients = require("../services/syncClient");

const {
  verifyToken,
  authorizeRoles,
} = require("../middleware/Middleware");

const router = express.Router();

// Stores the cron task
let automaticSyncTask = null;

// Is the automatic schedule currently active?
let isScheduleActive = false;

// Prevents two syncs from running at the same time
let isSyncing = false;


// Runs the actual Google Sheets → MongoDB sync
async function runSync() {
  if (isSyncing) {
    console.log("A synchronization is already running. Skipping...");
    return;
  }

  isSyncing = true;

  try {
    console.log("Running automatic client sync...");

    await syncClients();

    console.log("Automatic sync completed.");
  } catch (error) {
    console.error("Automatic sync failed:", error);
  } finally {
    isSyncing = false;
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
      "*/7 * * * *",
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
};