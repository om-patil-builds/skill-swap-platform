const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");

const {
  getNotifications,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController");

router.get("/", authMiddleware, getNotifications);

router.put("/read-all", authMiddleware, markAllAsRead);

router.put("/:id/read", authMiddleware, markAsRead);

module.exports = router;