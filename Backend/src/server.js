require("dotenv").config();
const connectToDb = require("./config/database");
const app = require("./app");
const { initializeSocket } = require("./socket");
const http = require("http");

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

initializeSocket(server);

connectToDb().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
