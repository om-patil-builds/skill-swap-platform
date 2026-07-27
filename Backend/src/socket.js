const { Server } = require("socket.io");
const Chat = require("./models/chat.model");
const { setIO } = require("./services/socketService");

const onlineUsers = new Map();

function initializeSocket(server, frontendUrl) {
  const isProduction = process.env.NODE_ENV === "production";

  const corsOrigin = isProduction
    ? frontendUrl || "http://localhost:5173"
    : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5175"];

  const io = new Server(server, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
  });

  setIO(io);

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

    socket.on("typing", ({ senderId, receiverId }) => {
      // Emit ONLY to the receiver's personal room — sender never sees their own indicator
      io.to(receiverId).emit("typing", { senderId, receiverId });
    });

    socket.on("stopTyping", ({ senderId, receiverId }) => {
      io.to(receiverId).emit("stopTyping", { senderId, receiverId });
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
