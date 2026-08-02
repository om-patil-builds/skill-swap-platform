const express = require("express");
const router = express.Router();
const multer = require("multer");

const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");
const multerUpload = require("../middlewares/multer");

const {
  updateProfile,
  getMatches,
  getMutualMatches,
  getUserById,
  uploadProfilePicture
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
router.put("/profile", authMiddleware, upload.single("profileImage"), updateProfile);


// 🔐 UPDATE PROFILE PICTURE (Cloudinary)
router.put(
  "/profile-picture",
  authMiddleware,
  (req, res, next) => {
    multerUpload.single("profileImage")(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ message: "File size limit exceeded. Max limit is 2MB." });
          }
          return res.status(400).json({ message: `Upload error: ${err.message}` });
        }
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  uploadProfilePicture
);


// 🔥 MATCH ROUTES
router.get("/matches", authMiddleware, getMatches);
router.get("/mutual-matches", authMiddleware, getMutualMatches);


// 🔥 GET USER BY ID (VERY IMPORTANT FOR CHAT)
// ⚠️ ALWAYS KEEP THIS LAST
router.get("/:id", authMiddleware, getUserById);


module.exports = router;