import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Sparkles, X, Check, User, Clock } from 'lucide-react';
import { StaffMember, Artisan } from '../types';

interface ConsultationChatProps {
  staff: StaffMember | Artisan;
  isOpen: boolean;
  onClose: () => void;
  onBookWithStaff: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'customer' | 'stylist';
  text: string;
  timestamp: string;
}

export default function ConsultationChat({
  staff,
  isOpen,
  onClose,
  onBookWithStaff
}: ConsultationChatProps) {
  const staffName = staff.name;
  const staffPhoto = ('avatar' in staff && staff.avatar) ? staff.avatar : ('image' in staff && staff.image) ? staff.image : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';

  const storageKey = `nexora_chat_${staff.id}`;
  
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    // Default greeting from stylist
    return [
      {
        id: 'msg-1',
        sender: 'stylist',
        text: `Hello! I'm ${staffName}. Feel free to ask me any questions about hair types, treatments, or suitability before booking your session.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, storageKey]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'customer',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate instant intelligent stylist reply based on query keywords
    setTimeout(() => {
      let replyText = `Thanks for reaching out! Based on your hair type and preferences, I would be delighted to customize this treatment for you during our session. Feel free to book when you're ready!`;
      
      const query = userMsg.text.toLowerCase();
      if (query.includes('price') || query.includes('cost') || query.includes('rate') || query.includes('₹')) {
        replyText = `Our pricing is transparent and all-inclusive of premium products and washing. You can view specific service rates right on my menu below!`;
      } else if (query.includes('suit') || query.includes('face') || query.includes('skin') || query.includes('color') || query.includes('balayage')) {
        replyText = `That's a wonderful choice! During your visit, I will analyze your hair texture and tone to ensure we achieve the exact look you desire.`;
      } else if (query.includes('time') || query.includes('long') || query.includes('duration') || query.includes('hour')) {
        replyText = `Most of my signature treatments take around 60 to 90 minutes. We always start with a relaxing consultation wash!`;
      }

      const stylistReply: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'stylist',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, stylistReply]);
      setIsTyping(false);
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="consultation-chat-modal"
        className="w-full max-w-lg bg-[#0a0a0a] border border-[#d4af37]/40 rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_30px_rgba(212,175,55,0.2)] flex flex-col h-[600px] max-h-[90vh]"
      >
        {/* Chat Header */}
        <div className="bg-[#121212] border-b border-white/10 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={staffPhoto}
                alt={staffName}
                className="w-10 h-10 rounded-full object-cover border border-[#d4af37]"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-white text-sm font-sans font-medium uppercase tracking-wide">
                  Consultation with {staffName}
                </h4>
              </div>
              <p className="text-[10px] font-mono text-[#d4af37]">
                Online • Typically replies instantly
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close Chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#060606]">
          {messages.map((msg) => {
            const isStylist = msg.sender === 'stylist';
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 ${isStylist ? 'justify-start' : 'justify-end'}`}
              >
                {isStylist && (
                  <img
                    src={staffPhoto}
                    alt={staffName}
                    className="w-7 h-7 rounded-full object-cover border border-[#d4af37]/50 shrink-0 mb-1"
                  />
                )}
                <div
                  className={`max-w-[80%] p-3.5 rounded-2xl text-xs sm:text-sm font-sans leading-relaxed ${
                    isStylist
                      ? 'bg-[#141414] border border-zinc-800 text-zinc-200 rounded-bl-sm'
                      : 'bg-[#d4af37] text-black font-medium rounded-br-sm shadow-md'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span
                    className={`text-[9px] font-mono block mt-1 text-right ${
                      isStylist ? 'text-zinc-500' : 'text-black/70'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono py-2">
              <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-ping" />
              <span>{staffName} is typing a response...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2.5 bg-[#0e0e0e] border-t border-zinc-850 flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
          {[
            'Is this treatment suitable for curly hair?',
            'What is the price in INR (₹)?',
            'How long does the session take?'
          ].map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => setInputText(suggestion)}
              className="px-3 py-1 bg-zinc-900 hover:bg-[#d4af37]/20 border border-zinc-800 hover:border-[#d4af37]/50 rounded-full text-[11px] font-sans text-zinc-300 hover:text-white shrink-0 transition-colors cursor-pointer"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Input Footer */}
        <div className="p-4 bg-[#111111] border-t border-white/10 flex items-center gap-3 shrink-0">
          <form onSubmit={handleSend} className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ask ${staffName.split(' ')[0]} a question about services...`}
              className="flex-1 bg-black border border-zinc-800 focus:border-[#d4af37] rounded-full px-4 py-3 text-xs text-white font-sans focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              aria-label="Send Message"
              className="p-3 bg-[#d4af37] disabled:opacity-50 text-black rounded-full hover:bg-yellow-400 transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <button
            onClick={() => {
              onClose();
              onBookWithStaff();
            }}
            className="hidden sm:flex items-center gap-1.5 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 border border-[#d4af37]/40 text-[#d4af37] rounded-full text-xs font-mono uppercase tracking-wider shrink-0 transition-colors cursor-pointer"
          >
            <span>Book Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
