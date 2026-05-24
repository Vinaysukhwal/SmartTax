/**
 * AI Tax Chatbot Component
 * 
 * A floating chat bubble that appears on every page (bottom-right).
 * Powered by Google Gemini API through the backend proxy.
 * 
 * Features:
 * - Floating chat button with pulse animation
 * - Expandable chat window
 * - Chat history (in component state — resets on refresh)
 * - Quick question suggestions
 * - Typing indicator animation
 * - Mobile-responsive (full-width on small screens)
 */

import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../config/api';
import { HiOutlineChatAlt2, HiOutlineX, HiOutlinePaperAirplane } from 'react-icons/hi';

const ChatBot = () => {
  const location = useLocation();

  // Hide floating chatbot on the dedicated chatbot page
  if (location.pathname === '/chatbot') {
    return null;
  }

  // Is the chat window open?
  const [isOpen, setIsOpen] = useState(false);

  // Chat messages array: { role: 'user' | 'bot', text: string }
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "Hi! I'm SmartTax AI 🤖\n\nI can help you with Indian income tax questions — ITR forms, deductions, tax slabs, and more. Ask me anything!",
    },
  ]);

  // Current input text
  const [input, setInput] = useState('');

  // Is the bot typing?
  const [isTyping, setIsTyping] = useState(false);

  // Ref to auto-scroll to the latest message
  const messagesEndRef = useRef(null);

  /**
   * Quick question suggestions
   */
  const quickQuestions = [
    'Which ITR should I file?',
    'What is 80C deduction?',
    'Old vs new tax regime?',
    'When is ITR due date?',
  ];

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /**
   * Send a message to the AI chatbot
   */
  const sendMessage = async (text) => {
    if (!text.trim()) return;

    // Add user message to chat
    const userMessage = { role: 'user', text: text.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Build history for Gemini API (convert our format to Gemini's format)
      const history = messages
        .filter((m) => m.role !== 'bot' || messages.indexOf(m) !== 0) // Skip welcome message
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }],
        }));

      // Send to our backend API (which proxies to Gemini)
      const response = await API.post('/chat', {
        message: text.trim(),
        history,
      });

      // Add bot response
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: response.data.response },
      ]);
    } catch (error) {
      // Show error message in chat
      const errorMsg = error.response?.data?.message || 'Sorry, I had trouble answering that. Please try again.';
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: `⚠️ ${errorMsg}` },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  /**
   * Handle quick question click
   */
  const handleQuickQuestion = (question) => {
    sendMessage(question);
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 w-[calc(100%-2rem)] sm:w-96 h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 animate-slideUp">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary-500 text-white rounded-t-2xl">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-sm">🤖</span>
              </div>
              <div>
                <h3 className="font-semibold text-sm">SmartTax AI</h3>
                <p className="text-xs text-blue-200">Tax Assistant • FY 2025-26</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-primary-500 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex space-x-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce-dot" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce-dot" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce-dot" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}

            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions (show only when there are few messages) */}
          {messages.length <= 2 && !isTyping && (
            <div className="px-4 py-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-1.5">
                {quickQuestions.map((q, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(q)}
                    className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full hover:bg-primary-50 hover:text-primary-600 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-gray-100">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a tax question..."
                className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 border border-gray-200"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="bg-primary-500 text-white p-2.5 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiOutlinePaperAirplane className="w-5 h-5 transform rotate-90" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-50 ${
          isOpen
            ? 'bg-gray-600 hover:bg-gray-700'
            : 'bg-primary-500 hover:bg-primary-600'
        }`}
        style={!isOpen ? { animation: 'pulse-ring 2s infinite' } : {}}
      >
        {isOpen ? (
          <HiOutlineX className="w-6 h-6 text-white" />
        ) : (
          <HiOutlineChatAlt2 className="w-6 h-6 text-white" />
        )}
      </button>
    </>
  );
};

export default ChatBot;
