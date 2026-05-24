/**
 * Database Configuration
 * 
 * Connects to MongoDB using Mongoose.
 * Uses the MONGODB_URI from environment variables.
 * Logs success or exits the process on failure.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Attempt to connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // Log the error and exit — the server can't work without a database
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
