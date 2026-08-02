require("dotenv").config();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const PORT = process.env.PORT || 5000;

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

function startServer(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    initializeSocket(server, FRONTEND_URL);

    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Frontend URL: ${FRONTEND_URL}`);
      resolve(server);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.warn(`Port ${port} in use, trying ${port + 1}...`);
        startServer(port + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

connectToDb()
  .then(() => startServer(PORT))
  .catch((err) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  });
