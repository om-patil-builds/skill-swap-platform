const express = require("express");
const cors = require("cors");
const app = express();
app.use(express.json()); 
const cookieParser = require("cookie-parser");
const chatRoutes = require("./routes/chatRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const sessionRoutes = require("./routes/sessionRoutes");





app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const requestRoutes = require("./routes/requestRoutes")

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/requests",requestRoutes )
app.use("/api/chat", chatRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/notifications", notificationRoutes);
app.use("/api/sessions", sessionRoutes);
module.exports = app;