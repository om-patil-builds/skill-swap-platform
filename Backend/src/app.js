const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const app = express();

const isProduction = process.env.NODE_ENV === "production";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(helmet());

// In development, allow any localhost Vite port (Vite auto-increments when port is busy)
const corsOrigin = isProduction
  ? FRONTEND_URL
  : (origin, callback) => {
      if (!origin || /^http:\/\/localhost:(5173|5174|5175)$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    };

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

if (isProduction) {
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { message: "Too many authentication attempts. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api/auth", authLimiter);

  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api", generalLimiter);
}

app.use(express.json());
app.use(cookieParser());

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const requestRoutes = require("./routes/requestRoutes");
const chatRoutes = require("./routes/chatRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const aiMentorRoutes = require("./routes/aiMentorRoutes");
const roadmapRoutes = require("./routes/roadmapRoutes");
const resumeReviewRoutes = require("./routes/resumeReviewRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/chat", chatRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/notifications", notificationRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/ai-mentor", aiMentorRoutes);
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/resume-review", resumeReviewRoutes);

module.exports = app;
