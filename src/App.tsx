import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Cat, Sparkles, Trash2, Github, ExternalLink, Moon, Sun, Menu, RefreshCw, Share2, X, CheckCircle2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { chatWithSiggy } from './services/siggyService';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

const SIGGY_PFP = "https://i.ibb.co.com/vCYNBvB1/Picsart-26-03-09-02-28-49-302.jpg";

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: "Ah. A new Ritualist arrives.\n\n(Siggy's ears twitch slightly.)\n\nHmm… interesting.\n\nIn timeline 12 you brought snacks.\n\nThis timeline is less generous.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Prepare history for Gemini
    const history = messages.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    // Pre-process text to ensure stage directions (...) are on separate lines
    const processSiggyText = (text: string) => {
      if (!text) return text;
      
      let processed = text;
      
      // 1. Find bracketed content that starts with a capital letter (likely a stage direction)
      // and ensure it has double newlines around it to become its own paragraph
      processed = processed
        .replace(/([^\n])\s*(\([A-Z][^)]+\))/g, '$1\n\n$2') 
        .replace(/(\([A-Z][^)]+\))\s*([^\n])/g, '$1\n\n$2');

      // 2. Find italicized blocks that look like actions (start with capital, end with period)
      // and ensure they are also separated and wrapped in parentheses if they aren't already
      // This helps catch cases where the model forgets the brackets but uses italics
      
      // Handle single action string
      processed = processed.replace(/^(\*[A-Z][^*]+\.\*)$/g, '($1)');
      
      // Handle start of string followed by more text
      processed = processed.replace(/^(\*[A-Z][^*]+\.\*)\s*([^\n])/g, '($1)\n\n$2');
      
      // Handle middle or end of string
      processed = processed.replace(/([^\n])\s*(\*[A-Z][^*]+\.\*)/g, (match, p1, p2) => {
        // If it's already in brackets, don't double wrap
        if (p1.trim().endsWith('(')) return match;
        return `${p1}\n\n(${p2})`;
      });

      return processed;
    };

    const responseText = await chatWithSiggy(input, history);
    const processedText = processSiggyText(responseText);

    const siggyMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: processedText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, siggyMessage]);
    setIsLoading(false);
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'model',
        text: "Altar cleared, Ritualist.\n\n(Siggy knocks the past off the table.)\n\nNew timeline.",
        timestamp: Date.now(),
      },
    ]);
    setIsMenuOpen(false);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText('https://siggy-bot.vercel.app/');
      setShowCopyToast(true);
      setIsMenuOpen(false);
      setTimeout(() => setShowCopyToast(false), 1500);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // Helper to highlight "Ritual" in red and force capitalization
  const highlightRitual = (text: string) => {
    if (typeof text !== 'string') return text;
    const parts = text.split(/(ritual)/gi);
    return parts.map((part, i) => 
      part.toLowerCase() === 'ritual' 
        ? <span key={i} className="text-[#FF3131] font-medium">Ritual</span> 
        : part
    );
  };

  // Custom renderer for Markdown to handle environment lines and Ritual highlighting
  const MarkdownComponents = {
    p: ({ children }: any) => {
      // Helper to extract all text content from nested React elements
      const extractText = (node: any): string => {
        if (!node) return '';
        if (typeof node === 'string') return node;
        if (Array.isArray(node)) return node.map(extractText).join('');
        if (typeof node === 'object' && node?.props?.children) return extractText(node.props.children);
        return '';
      };
      
      const fullText = extractText(children).trim();
      const isStageDirection = fullText.startsWith('(') && fullText.endsWith(')');
      
      // If it looks like a stage direction, style it aggressively
      if (isStageDirection) {
        return (
          <p className="text-[10px] italic opacity-70 my-3 font-mono tracking-wider leading-relaxed text-yellow-100/80 bg-white/5 px-3 py-1.5 rounded-lg border-l-2 border-yellow-100/20">
            {children}
          </p>
        );
      }

      return (
        <p className="mb-4 last:mb-0 leading-relaxed">
          {React.Children.map(children, child => 
            typeof child === 'string' ? highlightRitual(child) : child
          )}
        </p>
      );
    },
    em: ({ children }: any) => (
      <em className="italic">
        {React.Children.map(children, child => 
          typeof child === 'string' ? highlightRitual(child) : child
        )}
      </em>
    ),
    strong: ({ children }: any) => (
      <strong className="font-bold text-[#39FF14]">
        {React.Children.map(children, child => 
          typeof child === 'string' ? highlightRitual(child) : child
        )}
      </strong>
    ),
    li: ({ children }: any) => (
      <li className="mb-1">
        {React.Children.map(children, child => 
          typeof child === 'string' ? highlightRitual(child) : child
        )}
      </li>
    ),
  };

  return (
    <div className="h-screen bg-[#000000] text-white font-sans selection:bg-[#39FF14]/30 selection:text-white overflow-hidden flex flex-col">
      {/* Mystical Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#39FF14]/5 blur-[120px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#39FF14]/5 blur-[150px] opacity-20" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(57,255,20,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,20,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
      </div>

      {/* Fixed Header */}
      <header className="flex-none relative z-20 border-b border-[#39FF14]/20 backdrop-blur-md bg-black/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-black border border-[#39FF14]/40 overflow-hidden shadow-[0_0_10px_rgba(57,255,20,0.2)]">
            <img 
              src={SIGGY_PFP} 
              alt="Siggy" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              SiggyBai
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-[#39FF14] font-mono opacity-80">Ritual Familiar</p>
          </div>
        </div>
        <div className="flex items-center gap-4 relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-[#39FF14]/10 rounded-full transition-all text-[#39FF14]/60 hover:text-[#39FF14]"
          >
            <Menu size={24} />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 20 }}
                className="absolute right-0 top-12 bg-[#86EFAC] rounded-2xl p-2 flex flex-col gap-2 shadow-[0_0_20px_rgba(134,239,172,0.3)] z-50 min-w-[50px]"
              >
                <button 
                  onClick={handleRefresh}
                  className="p-3 hover:bg-black/10 rounded-xl transition-all text-black flex items-center justify-center"
                  title="Refresh"
                >
                  <RefreshCw size={24} strokeWidth={2.5} />
                </button>
                <button 
                  onClick={handleShare}
                  className="p-3 hover:bg-black/10 rounded-xl transition-all text-black flex items-center justify-center"
                  title="Share"
                >
                  <Share2 size={24} strokeWidth={2.5} />
                </button>
                <button 
                  onClick={clearChat}
                  className="p-3 hover:bg-black/10 rounded-xl transition-all text-black flex items-center justify-center"
                  title="Reset Ritual"
                >
                  <Trash2 size={24} strokeWidth={2.5} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Copy Toast */}
      <AnimatePresence>
        {showCopyToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#39FF14] text-black px-6 py-3 rounded-full font-mono text-xs font-bold shadow-[0_0_20px_rgba(57,255,20,0.4)] flex items-center gap-2"
          >
            <CheckCircle2 size={16} />
            LINK COPIED
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrolling Chat Area */}
      <main className="flex-1 overflow-y-auto relative z-10 px-4 py-8 md:px-0 scrollbar-thin scrollbar-thumb-[#39FF14]/20 scrollbar-track-transparent">
        <div className="max-w-3xl mx-auto space-y-10 pb-10">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start gap-3 max-w-[90%] md:max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse ml-auto' : 'flex-row'}`}>
                  {message.role === 'model' && (
                    <div className="flex-none w-8 h-8 rounded-full border-2 border-[#39FF14] overflow-hidden shadow-[0_0_10px_#39FF14/40] mt-1">
                      <img 
                        src={SIGGY_PFP} 
                        alt="Siggy" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <div 
                    className={`px-6 py-5 rounded-2xl transition-all ${
                      message.role === 'user' 
                        ? 'bg-[#39FF14]/5 border border-[#39FF14]/30 text-white shadow-[0_0_15px_rgba(57,255,20,0.05)]' 
                        : 'bg-black/60 border border-[#39FF14]/20 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)]'
                    }`}
                  >
                    <div className="text-sm font-light tracking-wide">
                      <Markdown components={MarkdownComponents}>{message.text}</Markdown>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-black/40 border border-[#39FF14]/20 backdrop-blur-sm px-6 py-4 rounded-2xl flex items-center gap-4 shadow-[0_0_15px_rgba(57,255,20,0.1)]">
                <div className="flex gap-1.5">
                  <motion.div 
                    animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }} 
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
                    className="w-2 h-2 rounded-full bg-[#39FF14] shadow-[0_0_8px_#39FF14]" 
                  />
                  <motion.div 
                    animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }} 
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
                    className="w-2 h-2 rounded-full bg-[#39FF14] shadow-[0_0_8px_#39FF14]" 
                  />
                  <motion.div 
                    animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }} 
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }}
                    className="w-2 h-2 rounded-full bg-[#39FF14] shadow-[0_0_8px_#39FF14]" 
                  />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Fixed Footer */}
      <footer className="flex-none relative z-20 p-8 bg-gradient-to-t from-black via-black to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Whisper your incantation..."
              className="w-full bg-black/80 border-2 border-[#39FF14]/40 rounded-2xl py-5 pl-8 pr-20 focus:outline-none focus:border-[#39FF14] focus:shadow-[0_0_25px_rgba(57,255,20,0.2)] transition-all placeholder:text-[#39FF14]/30 text-white font-light tracking-wide"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`absolute right-2 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                input.trim() && !isLoading 
                  ? 'bg-[#39FF14] text-black shadow-[0_0_20px_rgba(57,255,20,0.5)] hover:scale-105 active:scale-95' 
                  : 'bg-[#39FF14]/20 text-[#39FF14]/40'
              }`}
            >
              <Send size={22} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
