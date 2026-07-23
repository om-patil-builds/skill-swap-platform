const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const { checkAccess } = require("../controllers/requestController");

const {
  saveMessage,
  getChatHistory,
  getChatList,
  deleteMessageForMe,
  deleteMessageForEveryone,
} = require("../controllers/chatController");

const chatAccess = (req, res, next) => {
  req.params.otherUserId = req.params.userId;
  return checkAccess(req, res, next);
};

router.post("/send", authMiddleware, chatAccess, saveMessage);

router.get("/list", authMiddleware, getChatList);

router.get("/:userId", authMiddleware, chatAccess, getChatHistory);

router.delete("/message/:messageId/me", authMiddleware, deleteMessageForMe);

router.delete("/message/:messageId/everyone", authMiddleware, deleteMessageForEveryone);

module.exports = router;
