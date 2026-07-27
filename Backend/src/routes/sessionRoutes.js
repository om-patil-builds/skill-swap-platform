const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");

const {
  createSession,
  getMySessions,
  getSessionById,
  updateSession,
  updateSessionStatus,
  getChatSessions,
} = require("../controllers/sessionController");

router.post("/", authMiddleware, createSession);

router.get("/my", authMiddleware, getMySessions);

router.get("/:id", authMiddleware, getSessionById);

router.put("/:id", authMiddleware, updateSession);

router.put("/:id/status", authMiddleware, updateSessionStatus);

router.get("/chat/:userId", authMiddleware, getChatSessions);

module.exports = router;