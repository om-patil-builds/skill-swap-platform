const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");

const {
  saveMessage,
  getChatHistory,
  getChatList,
  deleteMessageForMe,
  deleteMessageForEveryone,
} = require("../controllers/chatController");

// 🔥 Send message
router.post("/send", authMiddleware, saveMessage);

// 🔥 Get chat list (dashboard)
router.get("/list", authMiddleware, getChatList);

// 🔥 Get chat history with specific user
// ⚠️ Always keep this LAST (important)
router.get("/:userId", authMiddleware, getChatHistory);

router.delete("/message/:messageId/me", authMiddleware, deleteMessageForMe);

router.delete("/message/:messageId/everyone",authMiddleware,deleteMessageForEveryone,);

module.exports = router;
