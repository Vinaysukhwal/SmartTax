/**
 * Chatbot.jsx — Premium Unified AI Chatbot Screen
 * 
 * Includes an interactive sidebar history, custom typing animations,
 * suggestion chips, file mock selectors, and direct integration
 * with the backend proxy /api/chat (Gemini AI).
 */

import { useState, useRef, useEffect } from 'react';
import API from '../config/api';
import toast from 'react-hot-toast';

const Chatbot = () => {
  // Mobile drawer open state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Chat message history: { role: 'user' | 'model', text: string }
  const [messages, setMessages] = useState([
    {
      role: 'model',
      text: "Hi! I am your SmartTax AI assistant. Ask me anything about ITR filing, deductions, or Indian tax laws.",
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Suggested quick prompts
  const quickChips = [
    'Which ITR form?',
    'What is 80C?',
    'Old vs New regime?',
    'HRA exemption?',
  ];

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Map messages to Gemini API format
  const formatHistoryForAPI = (msgList) => {
    return msgList
      .filter((m, index) => index > 0) // Skip first welcome model message to avoid confusing model
      .map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));
  };

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    // Add user message
    const userMsg = { role: 'user', text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const history = formatHistoryForAPI([...messages, userMsg]);
      const response = await API.post('/chat', {
        message: text.trim(),
        history,
      });

      // Add response
      if (response.data?.response) {
        setMessages((prev) => [
          ...prev,
          { role: 'model', text: response.data.response },
        ]);
      }
    } catch (error) {
      console.error('Chat API Error:', error);
      const errMsg = error.response?.data?.message || 'Failed to fetch response. Please check backend connection.';
      toast.error(errMsg);
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: `⚠️ Error: ${errMsg}` },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleAttachment = () => {
    toast.success('File attachments will be automatically parsed in future updates!', { id: 'file-toast' });
  };

  const handleVoice = () => {
    toast.success('Voice recognition initialized!', { id: 'voice-toast' });
  };

  return (
    <div className="bg-background flex h-screen text-[#e8dfee] bg-[#0f0f0f] antialiased font-sans relative">
      
      {/* Mesh Background */}
      <div className="absolute inset-0 -z-10 bg-mesh pointer-events-none"></div>
      <style>{`
        .bg-mesh {
          background-image: 
            radial-gradient(at 0% 0%, rgba(124, 58, 237, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(111, 0, 190, 0.1) 0px, transparent 50%);
        }
      `}</style>

      {/* Overlay for Mobile Drawer */}
      {isDrawerOpen && (
        <div
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 opacity-100"
        />
      )}

      {/* Navigation Drawer (History Sidebar) */}
      <aside
        className={`fixed left-0 top-0 h-full z-50 w-80 bg-[#15121b]/95 backdrop-blur-md border-r border-[#4a4455]/10 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/20 flex items-center justify-center border border-[#7c3aed]/30 shadow-lg">
                <span className="material-symbols-outlined text-[#d2bbff]" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
              </div>
              <span className="text-xl font-bold text-[#d2bbff] tracking-tight">SmartTax AI</span>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1 hover:bg-[#221e28]/50 rounded-full"
            >
              <span className="material-symbols-outlined text-[#ccc3d8]">close</span>
            </button>
          </div>

          <button
            onClick={() => {
              setMessages([{ role: 'model', text: 'Hi! I am your SmartTax AI assistant. Ask me anything about ITR filing, deductions, or Indian tax laws.' }]);
              setIsDrawerOpen(false);
              toast.success('Started a new conversation.');
            }}
            className="w-full h-12 bg-gradient-to-r from-[#7c3aed] to-[#ddb7ff] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#7c3aed]/20 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined">add</span>
            <span>New Chat</span>
          </button>
        </div>

        {/* History List */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          <p className="text-[#ccc3d8]/60 text-xs font-bold px-4 py-2 uppercase tracking-wider">Active Conversations</p>
          <a
            onClick={() => setIsDrawerOpen(false)}
            className="flex items-start gap-3 p-4 rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 text-[#d2bbff] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[#7c3aed] mt-1">history</span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold line-clamp-1">Current Tax Guidance</span>
              <span className="text-[10px] text-[#ccc3d8]/80">Active now</span>
            </div>
          </a>
        </nav>

        {/* User Footer inside Drawer */}
        <div className="p-4 border-t border-[#4a4455]/20 bg-[#100d16]/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#d2bbff] text-sm">person</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#e8dfee]">User Portal</span>
                <span className="text-[9px] uppercase font-bold text-[#7c3aed] tracking-wider">Access Granted</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Conversation Container */}
      <main className="flex-grow flex flex-col relative h-full">
        {/* Chat Title / Mobile Toggle Header */}
        <header className="fixed top-16 left-0 right-0 z-30 bg-[#0f0f0f]/80 backdrop-blur-xl border-b border-[#4a4455]/20 shadow-sm flex items-center justify-between px-6 h-16 w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 -ml-2 text-[#ccc3d8] hover:bg-[#221e28]/50 transition-colors rounded-full"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-[#7c3aed]/20 flex items-center justify-center border border-[#7c3aed]/30">
                <span className="material-symbols-outlined text-[#d2bbff] text-base" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0f0f0f] rounded-full animate-pulse"></div>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">SmartTax AI Assistant</h2>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                Gemini Engine Active
              </span>
            </div>
          </div>
        </header>

        {/* Conversation Stream */}
        <section className="flex-1 overflow-y-auto pt-36 pb-44 px-6 space-y-6 max-w-4xl mx-auto w-full">
          {messages.map((msg, index) => {
            const isBot = msg.role === 'model';
            return (
              <div
                key={index}
                className={`flex gap-4 animate-slideUp ${isBot ? '' : 'flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                  isBot ? 'bg-[#7c3aed]/20 border-[#7c3aed]/30' : 'bg-[#221e28] border-[#4a4455]/30'
                }`}>
                  <span className={`material-symbols-outlined text-sm ${isBot ? 'text-[#d2bbff]' : 'text-[#ccc3d8]'}`}>
                    {isBot ? 'smart_toy' : 'person'}
                  </span>
                </div>

                {/* Content Box */}
                <div className={`p-4 rounded-2xl max-w-[80%] whitespace-pre-wrap leading-relaxed border ${
                  isBot
                    ? 'glass-card rounded-tl-none border-[#4a4455]/20 text-[#e8dfee]'
                    : 'bg-[#7c3aed] text-white border-[#7c3aed] rounded-tr-none shadow-lg'
                }`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-4 animate-fadeIn">
              <div className="w-10 h-10 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#d2bbff] text-sm animate-pulse">smart_toy</span>
              </div>
              <div className="bg-[#221e28]/50 border border-[#4a4455]/10 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-[#d2bbff] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-1.5 h-1.5 bg-[#d2bbff] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 bg-[#d2bbff] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </section>

        {/* Input Docking Box */}
        <div className="fixed bottom-0 right-0 left-0 bg-[#0f0f0f]/90 backdrop-blur-2xl border-t border-[#4a4455]/20 px-6 pb-6 pt-4 z-20">
          {/* Quick suggestions */}
          <div className="max-w-4xl mx-auto mb-4 overflow-x-auto scrollbar-none flex items-center gap-3 py-1">
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                className="whitespace-nowrap px-4 py-2 rounded-full border border-[#7c3aed]/30 bg-[#7c3aed]/5 text-[#d2bbff] text-xs font-semibold hover:bg-[#7c3aed]/10 transition-all"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Send Input Bar */}
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-center bg-[#221e28]/50 rounded-2xl border border-[#4a4455]/30 focus-within:border-[#7c3aed]/50 focus-within:shadow-[0_0_20px_rgba(124,58,237,0.15)] transition-all duration-300">
              <button
                onClick={handleAttachment}
                className="p-3.5 text-[#ccc3d8] hover:text-[#d2bbff] transition-colors"
              >
                <span className="material-symbols-outlined text-xl">attach_file</span>
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about Indian income taxes..."
                className="flex-grow bg-transparent border-none focus:ring-0 text-[#e8dfee] placeholder:text-[#ccc3d8]/40 py-4 text-sm"
              />
              <div className="flex items-center gap-1 pr-3">
                <button
                  onClick={handleVoice}
                  className="p-2 text-[#ccc3d8] hover:text-[#d2bbff] transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">mic</span>
                </button>
                <button
                  onClick={() => handleSend()}
                  className="bg-[#7c3aed] text-white p-2.5 rounded-xl hover:shadow-[0_0_15px_rgba(124,58,237,0.5)] active:scale-95 transition-all flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chatbot;
