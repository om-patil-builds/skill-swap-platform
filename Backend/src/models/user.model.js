const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    },
    bio: {
      type: String,
      default: ""
    },
    profileImage: {
      type: String,
      default: ""
    },
    skillsHave: {
    type: [String],
    default: []
  },

  skillsWant: {
    type: [String],
    default: []
  }
  },
  { timestamps: true }
);

const userModel = mongoose.model("User", userSchema);

module.exports = userModel