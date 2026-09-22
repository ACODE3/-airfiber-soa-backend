const SyncRun = require("../models/syncRun");
const syncClients = require("../services/syncClient");

// Single lock shared by both the manual button and the automatic cron job,
// so the two can never stomp on each other's Google Sheets read.
let isSyncing = false;

function isSyncRunning() {
  return isSyncing;
}

// Runs syncClients() and records the outcome (success or failure) as a
// SyncRun document, so the dashboard can show sync history.
async function runTrackedSync({ trigger, triggeredBy }) {
  if (isSyncing) {
    const error = new Error("A synchronization is already running.");
    error.code = "SYNC_IN_PROGRESS";
    throw error;
  }

  isSyncing = true;
  const startedAt = new Date();
  let run = null;

  // Everything - including creating the history record - lives inside this
  // try/finally, so the lock always releases even if MongoDB itself is
  // unreachable right at the start. A lock that can get stuck `true` forever
  // (until a manual server restart) is worse than a sync that fails cleanly.
  try {
    run = await SyncRun.create({
      trigger,
      triggeredBy: triggeredBy || "",
      status: "running",
      startedAt,
    });

    const result = await syncClients();
    const finishedAt = new Date();

    run.status = result.errorCount > 0 ? "error" : "success";
    run.finishedAt = finishedAt;
    run.durationMs = finishedAt - startedAt;
    run.saved = result.saved;
    run.skipped = result.skipped;
    run.errorCount = result.errorCount;
    run.sampleErrors = result.sampleErrors;
    run.staleInDb = result.staleInDb;
    run.totalRows = result.totalRows;
    await run.save();

    return run;
  } catch (error) {
    const finishedAt = new Date();

    // If SyncRun.create() itself is what failed, there's no document to
    // record the failure on - swallow a failed save here so the original
    // error (not a secondary DB error) is what the caller sees.
    if (run) {
      run.status = "error";
      run.finishedAt = finishedAt;
      run.durationMs = finishedAt - startedAt;
      run.failureMessage = error.message;
      await run.save().catch(() => {});
    }

    throw error;
  } finally {
    isSyncing = false;
  }
}

module.exports = { runTrackedSync, isSyncRunning };
