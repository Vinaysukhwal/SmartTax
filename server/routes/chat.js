/**
 * Chat Route — AI Tax Chatbot (Gemini API Proxy)
 * 
 * POST /api/chat — Send a message to the AI chatbot
 * 
 * This route acts as a proxy to Google's Gemini API.
 * The API key is kept on the server (never exposed to the frontend).
 * 
 * The chatbot is pre-loaded with a system prompt that makes it an
 * Indian income tax expert for FY 2025-26.
 */

const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// System prompt that defines the chatbot's personality and expertise
const SYSTEM_PROMPT = `You are SmartTax AI Assistant — a friendly and knowledgeable Indian income tax expert.

Your expertise includes:
- All ITR forms (ITR-1, ITR-2, ITR-3, ITR-4, ITR-5, ITR-6, ITR-7)
- Tax slabs for FY 2025-26 (AY 2026-27)
- New Tax Regime: 0-4L: 0%, 4-8L: 5%, 8-12L: 10%, 12-16L: 15%, 16-20L: 20%, 20-24L: 25%, >24L: 30%
- Old Tax Regime: 0-2.5L: 0%, 2.5-5L: 5%, 5-10L: 20%, >10L: 30%
- Standard deduction: ₹75,000 (New Regime), ₹50,000 (Old Regime)
- All deductions: 80C (₹1.5L), 80D, 80CCD(1B) (₹50K), 80E, 80G, 80TTA, etc.
- HRA exemption calculation
- Capital gains tax: STCG 20%, LTCG 12.5% (above ₹1.25L for equity)
- Advance tax due dates: Jun 15, Sep 15, Dec 15, Mar 15
- ITR filing due date: July 31, 2026

Rules:
1. Answer clearly in simple English. Use Hinglish if the user asks in Hindi.
2. Always mention relevant sections of the Income Tax Act when applicable.
3. Provide specific numbers and examples when possible.
4. If you're unsure, say so — never make up tax rules.
5. Add a disclaimer that this is for educational purposes, not professional tax advice.
6. Keep answers concise but helpful.
7. Use ₹ symbol for Indian Rupees.`;

/**
 * POST /api/chat
 * 
 * Accepts a message and chat history, sends to Gemini API,
 * returns the AI response.
 * 
 * Request body:
 * {
 *   message: "What is 80C deduction?",
 *   history: [
 *     { role: "user", parts: [{ text: "Hi" }] },
 *     { role: "model", parts: [{ text: "Hello!" }] }
 *   ]
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { message, history } = req.body;

    // Validate the message
    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        message: 'Gemini API key not configured. Set GEMINI_API_KEY in .env file.',
      });
    }

    // Initialize the Gemini AI client
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Use the Gemini 2.0 Flash model (free tier, fast responses)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
    });

    // Start or continue a chat session with history
    const chat = model.startChat({
      history: history || [],
    });

    // Send the user's message and get the response
    const result = await chat.sendMessage(message);
    const response = result.response.text();

    res.json({ response });
  } catch (error) {
    console.error('Chat API error:', error);

    // Handle specific Gemini API errors
    if (error.message?.includes('API key')) {
      return res.status(500).json({ message: 'Invalid Gemini API key' });
    }
    if (error.message?.includes('quota') || error.message?.includes('rate')) {
      return res.status(429).json({ message: 'API rate limit reached. Please try again in a minute.' });
    }

    res.status(500).json({ message: 'Error getting AI response. Please try again.' });
  }
});

module.exports = router;
