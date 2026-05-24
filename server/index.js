/**
 * SmartTax Server — Main Entry Point
 * 
 * This is the Express server that powers the SmartTax API.
 * It handles:
 * - User authentication (register, login)
 * - ITR filing data
 * - Document storage
 * - Deductions tracking
 * - Notice management
 * - Challan generation
 * - AI chatbot (Gemini API proxy)
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables from .env file
dotenv.config();

// Create Express app
const app = express();

// --- MIDDLEWARE ---

// Enable CORS so the React frontend can talk to this API
app.use(cors());

// Parse JSON request bodies (for POST/PUT requests)
app.use(express.json({ limit: '10mb' })); // 10mb limit for base64 file uploads

// --- API ROUTES ---

// Auth routes (register, login)
app.use('/api/auth', require('./routes/auth'));

// User profile routes (get/update profile)
app.use('/api/user', require('./routes/user'));

// ITR filing routes (save/get filing data)
app.use('/api/itr', require('./routes/itr'));

// Document vault routes (upload/list/delete)
app.use('/api/documents', require('./routes/documents'));

// Deductions tracker routes (CRUD)
app.use('/api/deductions', require('./routes/deductions'));

// Notice tracker routes (CRUD)
app.use('/api/notices', require('./routes/notices'));

// Challan generator routes
app.use('/api/challan', require('./routes/challan'));

// AI chatbot route (Gemini API proxy)
app.use('/api/chat', require('./routes/chat'));

// --- HEALTH CHECK ---
// Simple route to verify the server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SmartTax API is running 🚀' });
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;

// Connect to MongoDB, then start listening for requests
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 SmartTax server running on port ${PORT}`);
  });
});
