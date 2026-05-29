/**
 * Database Configuration
 * 
 * Connects to MongoDB using Mongoose.
 * Uses the MONGODB_URI from environment variables.
 * Retries on failure instead of crashing (important for cloud deployments).
 */

const mongoose = require('mongoose');

const connectDB = async (retries = 5) => {
  const User = require('../models/User');
  for (let i = 0; i < retries; i++) {
    try {
      // Attempt to connect to MongoDB
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      
      // Seed default demo user if it doesn't exist
      try {
        const demoEmail = 'demo@smarttax.com';
        const demoUser = await User.findOne({ email: demoEmail });
        if (!demoUser) {
          console.log('🌱 Seeding default demo user...');
          await User.create({
            name: 'Demo User',
            email: demoEmail,
            password: 'demouser123', // plain text, pre-save hook will hash it
            pan: 'ABCDE1234F',
          });
          console.log('✅ Demo user seeded successfully!');
        }
      } catch (seedErr) {
        console.error('❌ Database seeding failed:', seedErr.message);
      }
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
