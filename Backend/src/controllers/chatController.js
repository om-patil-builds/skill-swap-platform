const Chat = require("../models/chat.model");
const mongoose = require("mongoose");

async function saveMessage(req, res) {
  try {
    const sender = req.user.id;
    const { receiver, message } = req.body;

    if (sender === receiver) {
      return res.status(400).json({
        message: "You cannot send message to yourself",
      });
    }

    const chat = await Chat.create({
      sender,
      receiver,
      message,
    });

    res.json({
      message: "Message saved",
      chat,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}



const getChatHistory = async (
  req,
  res
) => {

  try {

    const currentUserId =
      req.user.id;

    const { userId } =
      req.params;

    // 🔥 validation
    if (
      !mongoose.Types.ObjectId.isValid(
        userId
      )
    ) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const chats = await Chat.find({

      $or: [
        {
          sender: currentUserId,
          receiver: userId,
        },
        {
          sender: userId,
          receiver: currentUserId,
        },
      ],

      // 🔥 hide deleted messages
      deletedFor: {
        $nin: [currentUserId],
      },

    })
      .populate(
        "sender",
        "username"
      )
      .sort({ createdAt: 1 });

    res.json({
      chats,
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

async function getChatList(req, res) {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const chats = await Chat.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      {
        $sort: { createdAt: -1 }, // latest first
      },
      {
        $addFields: {
          chatUser: {
            $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"],
          },
        },
      },
      {
        $group: {
          _id: "$chatUser",
          lastMessage: { $first: "$message" },
          createdAt: { $first: "$createdAt" },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    res.json({
      count: chats.length,
      chats,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

// DELETE FOR ME

const deleteMessageForMe = async (
  req,
  res
) => {

  try {

    const userId = req.user.id;
    const { messageId } = req.params;

    // 🔥 VALIDATION
    if (
      !mongoose.Types.ObjectId.isValid(
        messageId
      )
    ) {
      return res.status(400).json({
        message: "Invalid message ID",
      });
    }

    const msg =
      await Chat.findById(
        messageId
      );

    if (!msg) {
      return res.status(404).json({
        message:
          "Message not found",
      });
    }

    // already deleted
    if (
      msg.deletedFor.includes(
        userId
      )
    ) {
      return res.json({
        message:
          "Already deleted",
      });
    }

    msg.deletedFor.push(userId);

    await msg.save();

    res.json({
      message:
        "Deleted for me",
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// DELETE FOR EVERYONE

const deleteMessageForEveryone = async (req, res) => {
  try {

    const userId = req.user.id;
    const { messageId } = req.params;

    // 🔥 IMPORTANT VALIDATION
    if (
      !mongoose.Types.ObjectId.isValid(
        messageId
      )
    ) {
      return res.status(400).json({
        message: "Invalid message ID",
      });
    }

    const msg = await Chat.findById(
      messageId
    );

    if (!msg) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    // 🔥 only sender can delete
    if (
      String(msg.sender) !==
      String(userId)
    ) {
      return res.status(403).json({
        message: "Not allowed",
      });
    }

    // 🔥 soft delete
    msg.message =
      "This message was deleted";

    msg.isDeleted = true;

    await msg.save();

    res.json({
      message:
        "Deleted for everyone",
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  saveMessage,
  getChatHistory,
  getChatList,
  deleteMessageForMe,
  deleteMessageForEveryone,
};
