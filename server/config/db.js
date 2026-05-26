/**
 * Database Configuration
 * 
 * Connects to MongoDB using Mongoose.
 * Uses the MONGODB_URI from environment variables.
 * Retries on failure instead of crashing (important for cloud deployments).
 */

const mongoose = require('mongoose');

const connectDB = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      // Attempt to connect to MongoDB
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`❌ MongoDB Connection Error (attempt ${i + 1}/${retries}): ${error.message}`);
      if (i < retries - 1) {
        console.log('⏳ Retrying in 5 seconds...');
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }
  console.error('❌ Failed to connect to MongoDB after all retries');
  process.exit(1);
};

module.exports = connectDB;
