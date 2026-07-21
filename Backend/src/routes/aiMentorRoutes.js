const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { getMentorResponse } = require("../controllers/aiMentorController");

// POST /api/ai-mentor/chat — protected route (requires valid JWT)
router.post("/chat", authMiddleware, getMentorResponse);

module.exports = router;
