const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const Request = require("../models/request.model");

const {
  saveMessage,
  getChatHistory,
  getChatList,
  deleteMessageForMe,
  deleteMessageForEveryone,
} = require("../controllers/chatController");

async function chatAccess(req, res, next) {
  try {
    const userId = req.user.id;
    const otherUserId = req.params.userId || req.params.otherUserId;

    if (!otherUserId) {
      return res.status(400).json({ message: "Missing user ID" });
    }

    const request = await Request.findOne({
      $or: [
        { sender: userId, receiver: otherUserId, status: "accepted" },
        { sender: otherUserId, receiver: userId, status: "accepted" },
      ],
    });

    if (!request) {
      return res.status(403).json({ message: "Not allowed to access chat" });
    }

    next();
  } catch (error) {
    console.error("Chat access error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

router.post("/send", authMiddleware, chatAccess, saveMessage);

router.get("/list", authMiddleware, getChatList);

router.get("/:userId", authMiddleware, chatAccess, getChatHistory);

router.delete("/message/:messageId/me", authMiddleware, deleteMessageForMe);

router.delete("/message/:messageId/everyone", authMiddleware, deleteMessageForEveryone);

module.exports = router;
