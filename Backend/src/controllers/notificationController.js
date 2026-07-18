const Notification = require("../models/notification.model");

// GET MY UNREAD NOTIFICATIONS
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user.id,
      read: false,
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// MARK ONE NOTIFICATION AS READ
const markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, {
      read: true,
    });

    res.json({ message: "Notification read" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// MARK ALL UNREAD NOTIFICATIONS AS READ (batch)
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};