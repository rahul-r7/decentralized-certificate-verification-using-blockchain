const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || "mongodb://localhost:27017/certificate_verification_db";
    const conn = await mongoose.connect(connStr);
    console.log(`MongoDB Connected: ${conn.connection.host} [${conn.connection.name}]`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Non-fatal exit for optional local testing
  }
};

module.exports = connectDB;
