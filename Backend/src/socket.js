const { Server } = require("socket.io");
const Chat = require("./models/chat.model");

const onlineUsers = new Map();

function initializeSocket(server, frontendUrl) {
  const io = new Server(server, {
    cors: {
      origin: frontendUrl || "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.join(userId);

      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    });

    socket.on("sendMessage", async (message) => {
      try {
        const senderId = message.sender?._id || message.sender;
        const receiverId = message.receiver;

        if (!senderId || !receiverId) return;

        const savedMessage = await Chat.create({
          sender: senderId,
          receiver: receiverId,
          message: message.message,
        });

        const populatedMessage = await Chat.findById(savedMessage._id)
          .populate("sender", "username")
          .lean();

        io.to(receiverId).emit("receiveMessage", populatedMessage);
        io.to(senderId).emit("receiveMessage", populatedMessage);
      } catch (error) {
        console.error("Socket sendMessage error:", error);
      }
    });

    socket.on("typing", ({ sender, receiver }) => {
      io.to(receiver).emit("typing", { sender });
    });

    socket.on("stopTyping", ({ receiver }) => {
      io.to(receiver).emit("stopTyping");
    });

    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }

      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
}

module.exports = { initializeSocket };
