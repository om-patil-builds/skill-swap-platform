const mongoose = require("mongoose");

// ─── Weekly Plan Item ────────────────────────────────────────────────────────

const weeklyPlanSchema = new mongoose.Schema(
  {
    week: { type: Number, required: true },
    title: { type: String, required: true },
    topics: { type: [String], default: [] },
    hours: { type: Number, default: 10 },
  },
  { _id: false }
);

// ─── Mini Project ────────────────────────────────────────────────────────────

const miniProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    tech: { type: [String], default: [] },
  },
  { _id: false }
);

// ─── Final Project ───────────────────────────────────────────────────────────

const finalProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    features: { type: [String], default: [] },
  },
  { _id: false }
);

// ─── Resource ────────────────────────────────────────────────────────────────

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    url: { type: String, default: "" },
    type: {
      type: String,
      enum: ["video", "article", "docs", "course", "book", "other"],
      default: "other",
    },
  },
  { _id: false }
);

// ─── Roadmap ─────────────────────────────────────────────────────────────────

const roadmapSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    goal: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    objective: { type: String, default: "" },
    duration: { type: String, default: "" },
    weeklyPlan: { type: [weeklyPlanSchema], default: [] },
    miniProjects: { type: [miniProjectSchema], default: [] },
    finalProject: { type: finalProjectSchema, default: {} },
    interviewTips: { type: [String], default: [] },
    resources: { type: [resourceSchema], default: [] },
  },
  { timestamps: true }
);

const Roadmap = mongoose.model("Roadmap", roadmapSchema);

module.exports = Roadmap;
