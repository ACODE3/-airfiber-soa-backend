const mongoose = require("mongoose");

const syncRunSchema = new mongoose.Schema(
  {
    trigger: {
      type: String,
      enum: ["manual", "automatic"],
      required: true,
    },
    triggeredBy: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["running", "success", "error"],
      default: "running",
    },
    startedAt: {
      type: Date,
      required: true,
    },
    finishedAt: Date,
    durationMs: Number,
    saved: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    sampleErrors: { type: [String], default: [] },
    staleInDb: { type: Number, default: 0 },
    totalRows: { type: Number, default: 0 },
    failureMessage: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("SyncRun", syncRunSchema);
