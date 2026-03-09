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
      text: "Ah. A new Ritualist arrives. Hmm… interesting. In timeline 12 you brought snacks. This timeline is less generous. (twitching)",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

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

    // Pre-process text to handle dashes and basic cleanup
    const processSiggyText = (text: string) => {
      if (!text) return text;
      
      let processed = text;
      
      // Remove dashes (-) and em-dashes (—) as requested
      processed = processed.replace(/[—–-]/g, ',');

      return processed;
    };

    const responseText = await chatWithSiggy(input, history);
    const processedText = processSiggyText(responseText);

    // Split text into blocks if it's long
    const initialParagraphs = processedText.split(/\n\n+/).filter(p => p.trim());
    let blocks: string[] = [];

    initialParagraphs.forEach(para => {
      // If a paragraph is long (more than 2 sentences or > 150 chars), split it by sentences
      const sentences = para.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [para];
      
      if (sentences.length > 2 || para.length > 150) {
        // Group sentences into smaller chunks (1-2 sentences per block)
        for (let i = 0; i < sentences.length; i += 2) {
          const chunk = sentences.slice(i, i + 2).join(' ').trim();
          if (chunk) blocks.push(chunk);
        }
      } else {
        blocks.push(para);
      }
    });

    // Ensure the action tag (e.g. "(playful)") stays with the last block if it got separated
    if (blocks.length > 1) {
      const lastBlock = blocks[blocks.length - 1];
      const secondToLast = blocks[blocks.length - 2];
      
      // If the last block is JUST the action tag, merge it back
      if (lastBlock.trim().match(/^\([^)]+\)$/)) {
        blocks[blocks.length - 2] = secondToLast + " " + lastBlock;
        blocks.pop();
      }
    }

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      // Check for GIF tag
      let finalBlock = block;
      let gifUrl = '';
      const gifMatch = block.match(/\[GIF:\s*([^\]]+)\]/);
      if (gifMatch) {
        const searchTerm = gifMatch[1].toLowerCase();
        
        // Dynamic cat gifs for cat-related terms
        if (searchTerm.includes('cat') || searchTerm.includes('siggy') || searchTerm.includes('kitten') || searchTerm.includes('meow')) {
          gifUrl = `https://cataas.com/cat/gif?${Date.now()}`;
        } else {
          // A few different funny/reaction fallbacks to avoid repetition
          const fallbacks = [
            'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHBqZzRyeXN6ZzRyeXN6ZzRyeXN6ZzRyeXN6ZzRyeXN6JmVwPXYxX2dpZnNfc2VhcmNoJmN0PWc/3o7TKMGpxx877C1968/giphy.gif', // Laughing
            'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHBqZzRyeXN6ZzRyeXN6ZzRyeXN6ZzRyeXN6ZzRyeXN6JmVwPXYxX2dpZnNfc2VhcmNoJmN0PWc/26n6Gx9moCgs1pUuk/giphy.gif', // LOL
            'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHBqZzRyeXN6ZzRyeXN6ZzRyeXN6ZzRyeXN6ZzRyeXN6JmVwPXYxX2dpZnNfc2VhcmNoJmN0PWc/l378bu6yeTuYMhrDa/giphy.gif', // Wow
            'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHBqZzRyeXN6ZzRyeXN6ZzRyeXN6ZzRyeXN6ZzRyeXN6JmVwPXYxX2dpZnNfc2VhcmNoJmN0PWc/3o7TKVUn7iM8FMEU24/giphy.gif', // Thinking
          ];
          gifUrl = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }
        finalBlock = block.replace(gifMatch[0], '').trim();
      }

      const siggyMessage: Message = {
        id: (Date.now() + i).toString(),
        role: 'model',
        text: finalBlock,
        timestamp: Date.now(),
        // @ts-ignore - adding optional gif property
        gif: gifUrl
      };

      setMessages((prev) => [...prev, siggyMessage]);
      
      if (i < blocks.length - 1) {
        // Add a small delay between blocks to simulate typing
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1000));
      }
    }

    setIsLoading(false);
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'model',
        text: "Altar cleared, Ritualist. New timeline. (purring)",
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
      
      // Check if it ends with an action in parentheses like (laughing)
      const actionMatch = fullText.match(/\(([^)]+)\)$/);
      
      if (actionMatch) {
        const action = actionMatch[0];
        const mainText = fullText.substring(0, fullText.length - action.length).trim();
        
        return (
          <p className="mb-4 last:mb-0 leading-relaxed">
            {highlightRitual(mainText)}
            <span className="text-yellow-400 italic ml-2">{action}</span>
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
        <div className="flex items-center gap-4 relative" ref={menuRef}>
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
        <div className="max-w-3xl mx-auto space-y-10 pb-32">
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
                        ? 'bg-[#39FF14]/15 border-2 border-[#39FF14]/40 text-white shadow-[0_0_20px_rgba(57,255,20,0.1)]' 
                        : 'bg-[#39FF14]/10 border-2 border-[#39FF14]/30 backdrop-blur-xl shadow-[0_0_25px_rgba(0,0,0,0.6)]'
                    }`}
                  >
                    <div className="text-sm font-light tracking-wide">
                      <Markdown components={MarkdownComponents}>{message.text}</Markdown>
                    </div>
                    {/* @ts-ignore */}
                    {message.gif && (
                      <div className="mt-4 rounded-xl overflow-hidden border border-[#39FF14]/20 shadow-[0_0_15px_rgba(57,255,20,0.1)]">
                        {/* @ts-ignore */}
                        <img src={message.gif} alt="Siggy reaction" className="w-full max-h-60 object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
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

      {/* Floating Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 p-6 md:p-10 pointer-events-none">
        <div className="max-w-3xl mx-auto pointer-events-auto">
          <div className="relative flex items-center group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Whisper your incantation..."
              className="w-full bg-black/95 rounded-2xl py-5 pl-8 pr-20 focus:outline-none shadow-[0_0_30px_rgba(57,255,20,0.15),0_10px_50px_rgba(0,0,0,0.9)] focus:shadow-[0_0_50px_rgba(57,255,20,0.3),0_10px_60px_rgba(0,0,0,1)] transition-all placeholder:text-[#39FF14]/30 text-white font-light tracking-wide backdrop-blur-2xl"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`absolute right-2.5 w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                input.trim() && !isLoading 
                  ? 'bg-[#39FF14] text-black shadow-[0_0_20px_rgba(57,255,20,0.4)] hover:scale-105 active:scale-95' 
                  : 'bg-[#39FF14]/10 text-[#39FF14]/30'
              }`}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
