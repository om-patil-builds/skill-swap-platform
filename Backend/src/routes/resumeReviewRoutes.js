const express = require("express");
const router = express.Router();
const multer = require("multer");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  analyzeResume,
  saveResumeReview,
  getUserResumeReviews,
  getResumeReviewById,
  deleteResumeReview,
} = require("../controllers/resumeReviewController");

// Memory storage for file uploads (up to 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Protect all routes with JWT auth
router.use(authMiddleware);

// POST /api/resume-review/analyze - file upload or text payload
router.post("/analyze", upload.single("resumeFile"), analyzeResume);

// POST /api/resume-review/save - save analysis to MongoDB
router.post("/save", saveResumeReview);

// GET /api/resume-review - get list of saved reviews
router.get("/", getUserResumeReviews);

// GET /api/resume-review/:id - get single full review
router.get("/:id", getResumeReviewById);

// DELETE /api/resume-review/:id - delete a saved review
router.delete("/:id", deleteResumeReview);

module.exports = router;
