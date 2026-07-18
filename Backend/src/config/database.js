const mongoose = require("mongoose");
require("dotenv").config();

async function connectToDb() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected To MongoDB");
  } catch (error) {
  console.error("FULL ERROR:", error);
  process.exit(1);
}
}

module.exports = connectToDb;