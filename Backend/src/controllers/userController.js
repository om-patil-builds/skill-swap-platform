const User = require("../models/user.model");


async function updateProfile(req, res) {
  try {
    const userId = req.user.id;

    const { bio, skillsHave, skillsWant } = req.body;

    const updateData = {
      bio,
      skillsHave,
      skillsWant
    };

    // 🔥 image save
    if (req.file) {
      updateData.profileImage = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true
    }).select("-password");

    res.json({
      message: "Profile updated",
      user
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

// 💥 MATCHING API
async function getMatches(req, res) {
  try {
    const currentUserId = req.user.id;

  
    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    
    const wantedSkills = Array.isArray(currentUser.skillsWant)
      ? currentUser.skillsWant
      : [];

    
    if (wantedSkills.length === 0) {
      return res.json({
        message: "No skills added in skillsWant",
        count: 0,
        matches: []
      });
    }

    
    const matches = await User.find({
      _id: { $ne: currentUserId }, 
      skillsHave: { $in: wantedSkills } 
    }).select("-password -__v");

    return res.status(200).json({
      message: "Matching users found",
      count: matches.length,
      matches
    });

  } catch (error) {
    console.error("MATCH ERROR:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
}

// 💥 MUTUAL MATCHING API
async function getMutualMatches(req, res) {
  try {
    const currentUserId = req.user.id;

    // 🔹 current user
    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔹 safe arrays
    const mySkillsHave = Array.isArray(currentUser.skillsHave)
      ? currentUser.skillsHave
      : [];

    const mySkillsWant = Array.isArray(currentUser.skillsWant)
      ? currentUser.skillsWant
      : [];

    // 🔹 agar koi skill hi nahi hai
    if (mySkillsHave.length === 0 || mySkillsWant.length === 0) {
      return res.json({
        message: "Add skills for better matching",
        count: 0,
        matches: []
      });
    }

    // 🔥 MUTUAL LOGIC
    const matches = await User.find({
      _id: { $ne: currentUserId },

      // wo mujhe jo chahiye wo de sakta hai
      skillsHave: { $in: mySkillsWant },

      // aur use jo chahiye wo mere paas hai
      skillsWant: { $in: mySkillsHave }
    }).select("-password -__v");

    res.status(200).json({
      message: "Mutual matches found",
      count: matches.length,
      matches
    });

  } catch (error) {
    console.error("MUTUAL MATCH ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
}

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("username");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};




module.exports = { updateProfile ,   getMatches ,   getMutualMatches , getUserById
 };