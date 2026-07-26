const mongoose = require("mongoose");
require("dotenv").config();

async function connectToDb() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected.");
    });

    mongoose.connection.on("close", () => {
      console.log("MongoDB connection closed.");
    });

    console.log("Connected To MongoDB");
  } catch (error) {
    console.error("FULL ERROR:", error);
    process.exit(1);
  }
}

module.exports = connectToDb;
