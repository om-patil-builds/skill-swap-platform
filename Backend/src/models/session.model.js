const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    learner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    topic: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: String,
      required: true,
      trim: true,
    },

    time: {
      type: String,
      required: true,
      trim: true,
    },

    meetLink: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
      default: "pending",
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);