require("dotenv").config();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const PORT = process.env.PORT || 3000;

const requiredEnv = ["MONGO_URI", "JWT_SECRET", "FRONTEND_URL"];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const connectToDb = require("./config/database");
const app = require("./app");
const { initializeSocket } = require("./socket");
const http = require("http");

const server = http.createServer(app);

initializeSocket(server, FRONTEND_URL);

connectToDb().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Frontend URL: ${FRONTEND_URL}`);
  });
}).catch((err) => {
  console.error("Failed to connect to database:", err);
  process.exit(1);
});
