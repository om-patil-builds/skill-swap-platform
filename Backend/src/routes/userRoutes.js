const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

const {
  updateProfile,
  getMatches,
  getMutualMatches,
  getUserById // 🔥 add this
} = require("../controllers/userController");

const User = require("../models/user.model");


// 🔐 GET FULL PROFILE (logged-in user)
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile fetched successfully",
      user
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// 🔐 UPDATE PROFILE
router.put("/profile", authMiddleware, updateProfile);


// 🔥 MATCH ROUTES
router.get("/matches", authMiddleware, getMatches);
router.get("/mutual-matches", authMiddleware, getMutualMatches);


// 🔥 GET USER BY ID (VERY IMPORTANT FOR CHAT)
// ⚠️ ALWAYS KEEP THIS LAST
router.get("/:id", authMiddleware, getUserById);

router.put("/profile", authMiddleware, upload.single("profileImage"), updateProfile);


module.exports = router;