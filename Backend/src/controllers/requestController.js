const Request = require("../models/request.model");
const Notification = require("../models/notification.model");
const User = require("../models/user.model");

async function sendRequest(req, res) {
  try {
    // 🔐 Check auth
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const senderId = req.user.id;
    const { receiverId } = req.body;

    // 🛑 Validate receiverId
    if (!receiverId) {
      return res.status(400).json({ message: "receiverId is required" });
    }

    // 🛑 Prevent self request
    if (String(senderId) === String(receiverId)) {
      return res.status(400).json({
        message: "You cannot send request to yourself",
      });
    }

    // 🔍 Check duplicate or reverse request
    const existing = await Request.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    if (existing) {
      return res.status(400).json({
        message: "Request already exists between users",
      });
    }

    // ✅ Create new request
    const request = await Request.create({
      sender: senderId,
      receiver: receiverId,
      status: "pending", // 🔥 explicitly set
    });

    // 🔔 Fetch sender's username to include in the notification
    const senderUser = await User.findById(senderId).select("username");
    const senderName = senderUser ? senderUser.username : "Someone";

    await Notification.create({
      user: receiverId,
      text: `${senderName} sent you a skill request 🤝`,
    });

    return res.status(201).json({
      message: "Request sent successfully",
      request,
    });
  } catch (error) {
    console.error("SendRequest Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// 🔥 Update Request Status (Accept / Reject)
async function updateRequest(req, res) {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    const userId = req.user.id;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // 🔥 ONLY receiver can accept/reject
    if (String(request.receiver) !== String(userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    request.status = status;
    await request.save();

    // 🔔 Fetch User B's (acting user's) username for the notification text
    const actingUser = await User.findById(userId).select("username");
    const actingUsername = actingUser ? actingUser.username : "Someone";

    // 🔔 Mark ALL of User B's unread notifications as read — they have acted
    await Notification.updateMany(
      { user: request.receiver, read: false },
      { read: true }
    );

    // 🔔 Create a NEW notification for User A (the original sender)
    const notificationText =
      status === "accepted"
        ? `${actingUsername} accepted your skill request ✅`
        : `${actingUsername} rejected your skill request ❌`;

    await Notification.create({
      user: request.sender, // 🔔 Notify User A
      text: notificationText,
    });

    res.json({
      message: `Request ${status}`,
      request,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

// 🔥 Get received requests
async function getMyRequests(req, res) {
  try {
    const userId = req.user.id;

    const requests = await Request.find({
      receiver: userId,
      status: "pending", // 🔥 only pending
    })
      .populate("sender", "username email skillsHave")
      .sort({ createdAt: -1 });

    res.json({
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

// 🔥 Check chat access (VERY IMPORTANT)
async function checkAccess(req, res) {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    const request = await Request.findOne({
      $or: [
        { sender: userId, receiver: otherUserId, status: "accepted" },
        { sender: otherUserId, receiver: userId, status: "accepted" },
      ],
    });

    res.json({
      allowed: !!request,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

// 🔥 Get connection status
async function getConnectionStatus(req, res) {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    const request = await Request.findOne({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    });

    if (!request) {
      return res.json({ status: "none" });
    }

    if (request.status === "accepted") {
      return res.json({ status: "accepted" });
    }

    if (request.status === "pending") {
      if (String(request.sender) === String(userId)) {
        return res.json({ status: "sent" }); // you sent
      } else {
        return res.json({ status: "received" }); // you received
      }
    }

    res.json({ status: "none" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

// 🔥 Get accepted connections
async function getAcceptedConnections(req, res) {
  try {
    const userId = req.user.id;

    const connections = await Request.find({
      $or: [
        { sender: userId, status: "accepted" },
        { receiver: userId, status: "accepted" },
      ],
    }).populate("sender receiver", "username email skillsHave");

    // 🔥 get other user (not current user)
    const users = connections.map((conn) => {
      if (String(conn.sender._id) === String(userId)) {
        return conn.receiver;
      } else {
        return conn.sender;
      }
    });

    res.json({
      count: users.length,
      users,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  sendRequest,
  updateRequest,
  getMyRequests,
  checkAccess,
  getConnectionStatus,
  getAcceptedConnections,
};
