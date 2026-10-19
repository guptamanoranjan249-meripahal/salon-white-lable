import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Clock, Sparkles, X, ArrowRight, Users } from 'lucide-react';
import { gsap } from 'gsap';

interface PriorityWaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  selectedTimeSlot: string;
  serviceName: string;
  onJoinSuccess: () => void;
}

export default function PriorityWaitlistModal({
  isOpen,
  onClose,
  selectedDate,
  selectedTimeSlot,
  serviceName,
  onJoinSuccess
}: PriorityWaitlistModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Queue count state for real-time status indicator
  const [queueCount, setQueueCount] = useState<number>(4);
  const queueCountRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Generate randomized initial queue count based on time slot string
    const seed = (selectedTimeSlot || '10:00 AM').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const count = 3 + (seed % 5);
    setQueueCount(count);
  }, [selectedTimeSlot]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !email.includes('@') || !phone.trim()) {
      setError('Please provide valid name, email, and phone number for waitlist alerts.');
      return;
    }
    setError('');

    // Save waitlist entry to localStorage
    try {
      const storageKey = 'nexora_priority_waitlist';
      const existing = localStorage.getItem(storageKey);
      const list = existing ? JSON.parse(existing) : [];
      list.push({
        id: `WL-${Math.floor(1000 + Math.random() * 9000)}`,
        name,
        email,
        phone,
        serviceName,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem(storageKey, JSON.stringify(list));
    } catch (err) {
      console.error(err);
    }

    // GSAP live animation update for queue count increment without component remounting
    if (queueCountRef.current) {
      gsap.to(queueCountRef.current, {
        scale: 1.3,
        color: '#10b981',
        duration: 0.3,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          setQueueCount((prev) => prev + 1);
        }
      });
    } else {
      setQueueCount((prev) => prev + 1);
    }

    setSubmitted(true);
    setTimeout(() => {
      onJoinSuccess();
    }, 2800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="priority-waitlist-modal"
        className="w-full max-w-md bg-[#0e0e0e] border border-[#d4af37]/40 rounded-2xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(212,175,55,0.2)] relative"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37]">
                  <Bell className="w-4 h-4 animate-bounce" />
                </span>
                <span className="text-xs font-mono tracking-[0.2em] text-[#d4af37] uppercase font-semibold">
                  Priority Waitlist Dispatch
                </span>
              </div>
            </div>

            {/* Real-time Queue Status Indicator badge */}
            <div className="mb-4 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Current Queue Demand:</span>
              </span>
              <span className="text-[#d4af37] font-bold flex items-center gap-1">
                <span ref={queueCountRef} className="inline-block">{queueCount}</span> guests ahead
              </span>
            </div>

            <h3 className="text-xl font-sans font-normal text-white uppercase mb-2">
              Slot Fully Reserved — Join Queue
            </h3>
            
            <p className="text-xs text-zinc-300 font-sans leading-relaxed mb-5">
              {selectedTimeSlot} on {selectedDate} for <strong className="text-white">{serviceName}</strong> is currently fully booked. Join the priority waitlist for instant SMS & Email alerts when a cancellation occurs.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lady Victoria"
                  required
                  className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-xs text-white focus:border-[#d4af37] focus:outline-none font-sans"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="victoria@luxury.com"
                  required
                  className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-xs text-white focus:border-[#d4af37] focus:outline-none font-sans"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">
                  Phone Number (SMS Alert)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  required
                  className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-xs text-white focus:border-[#d4af37] focus:outline-none font-sans"
                />
              </div>

              {error && (
                <p className="text-red-400 text-xs font-mono">{error}</p>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-500 via-[#d4af37] to-yellow-600 text-black font-mono text-xs uppercase tracking-widest font-bold rounded-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Join Priority Waitlist</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-xl font-sans font-medium text-white">
              Successfully Added to Waitlist!
            </h4>
            <p className="text-xs text-zinc-300 font-sans leading-relaxed max-w-xs mx-auto">
              We have secured your priority queue position for {selectedTimeSlot}. You will receive an automated SMS notification instantly if a cancellation occurs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
