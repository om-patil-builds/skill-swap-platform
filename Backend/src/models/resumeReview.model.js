const mongoose = require("mongoose");

const recommendedProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    techStack: { type: [String], default: [] },
  },
  { _id: false }
);

const resumeReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: "Resume Analysis",
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    missingTechnicalSkills: { type: [String], default: [] },
    missingSoftSkills: { type: [String], default: [] },
    atsSuggestions: { type: [String], default: [] },
    recommendedProjects: { type: [recommendedProjectSchema], default: [] },
    resumeTips: { type: [String], default: [] },
    suggestedRoles: { type: [String], default: [] },
  },
  { timestamps: true }
);

const ResumeReview = mongoose.model("ResumeReview", resumeReviewSchema);

module.exports = ResumeReview;
