const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");

const {
  createSession,
  getMySessions,
  updateSessionStatus,
  getChatSessions
} = require("../controllers/sessionController");

router.post("/", authMiddleware, createSession);

router.get("/my", authMiddleware, getMySessions);

router.put("/:id", authMiddleware, updateSessionStatus);

router.get("/chat/:userId", authMiddleware, getChatSessions);

module.exports = router;