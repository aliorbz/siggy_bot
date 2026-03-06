import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Cat, Sparkles, Trash2, Github, ExternalLink, Moon, Sun } from 'lucide-react';
import Markdown from 'react-markdown';
import { chatWithSiggy } from './services/geminiService';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: "Ah. A new cultist arrives.\n\n\"*Siggy's ears twitch slightly.*\"\n\nHmm… interesting. In timeline 12 you brought snacks. This timeline is less generous.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

    const responseText = await chatWithSiggy(input, history);

    const siggyMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
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
        text: "The altar is cleared. \"*Siggy knocks the previous ritual off the table.*\" A new timeline begins, ritualist.",
        timestamp: Date.now(),
      },
    ]);
  };

  // Custom renderer for Markdown to handle environment lines
  const MarkdownComponents = {
    p: ({ children }: any) => {
      const childrenArray = React.Children.toArray(children);
      
      // Check if the paragraph is an environment line: starts and ends with quotes
      // and contains italics (parsed as <em> by react-markdown)
      const firstChild = childrenArray[0];
      const startsWithQuote = firstChild === '"' || (typeof firstChild === 'string' && firstChild.startsWith('"'));
      const lastChild = childrenArray[childrenArray.length - 1];
      const endsWithQuote = lastChild === '"' || (typeof lastChild === 'string' && lastChild.endsWith('"'));
      
      const hasItalics = childrenArray.some(child => 
        typeof child === 'object' && (child as any).type === 'em'
      );

      if (startsWithQuote && endsWithQuote && hasItalics) {
        return (
          <p className="text-[11px] italic opacity-50 my-3 font-mono tracking-wider leading-relaxed text-[#39FF14]/80">
            {children}
          </p>
        );
      }

      return <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>;
    },
    em: ({ children }: any) => <em className="italic">{children}</em>,
    strong: ({ children }: any) => <strong className="font-bold text-[#39FF14]">{children}</strong>,
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
          <div className="w-10 h-10 rounded-full bg-black border border-[#39FF14]/40 flex items-center justify-center text-[#39FF14] shadow-[0_0_10px_rgba(57,255,20,0.2)]">
            <Cat size={24} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              Siggy <span className="text-[10px] uppercase tracking-widest text-[#39FF14] font-mono opacity-80">Ritual Familiar</span>
            </h1>
            <p className="text-xs text-[#39FF14]/60 italic font-mono">Status: Observing the Forge</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={clearChat}
            className="p-2 hover:bg-[#39FF14]/10 rounded-full transition-all text-[#39FF14]/60 hover:text-[#39FF14] hover:shadow-[0_0_10px_rgba(57,255,20,0.2)]"
            title="Reset Ritual"
          >
            <Trash2 size={18} />
          </button>
          <div className="h-4 w-[1px] bg-[#39FF14]/20" />
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#39FF14]/40 font-mono">
            <Sparkles size={12} className="text-[#39FF14]" />
            The Circle is Open
          </div>
        </div>
      </header>

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
                <div 
                  className={`max-w-[85%] md:max-w-[75%] px-6 py-5 rounded-2xl transition-all ${
                    message.role === 'user' 
                      ? 'bg-[#39FF14]/5 border border-[#39FF14]/30 text-white shadow-[0_0_15px_rgba(57,255,20,0.05)]' 
                      : 'bg-black/60 border border-[#39FF14]/10 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)]'
                  }`}
                >
                  <div className="text-sm font-light tracking-wide">
                    <Markdown components={MarkdownComponents}>{message.text}</Markdown>
                  </div>
                  <div className={`mt-3 text-[9px] uppercase tracking-[0.2em] font-mono opacity-30 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#39FF14]/60 font-mono">Summoning response...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Fixed Footer */}
      <footer className="flex-none relative z-20 p-8 bg-gradient-to-t from-black via-black to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Whisper your incantation..."
              className="w-full bg-black border border-[#39FF14]/20 rounded-xl py-5 pl-8 pr-16 focus:outline-none focus:border-[#39FF14]/60 focus:shadow-[0_0_20px_rgba(57,255,20,0.1)] transition-all placeholder:text-[#39FF14]/20 text-white font-light tracking-wide"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`absolute right-3 top-3 w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                input.trim() && !isLoading 
                  ? 'bg-[#39FF14] text-black shadow-[0_0_20px_rgba(57,255,20,0.4)] hover:scale-105 active:scale-95' 
                  : 'bg-[#39FF14]/10 text-[#39FF14]/20'
              }`}
            >
              <Send size={20} />
            </button>
          </div>
          <div className="flex justify-center gap-8 mt-6">
            <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-[#39FF14]/30 font-mono">
              <div className="w-1 h-1 rounded-full bg-[#39FF14]/30" />
              Arcane Protocol
            </div>
            <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-[#39FF14]/30 font-mono">
              <div className="w-1 h-1 rounded-full bg-[#39FF14]/30" />
              Timeline Sync: Active
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
