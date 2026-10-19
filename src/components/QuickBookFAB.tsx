import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Sparkles, ChevronUp, ArrowRight, X, Clock, Scissors, ShieldCheck } from 'lucide-react';
import { Service } from '../types';
import { gsap } from 'gsap';

interface QuickBookFABProps {
  currentView: string;
  onInitiateBooking: (serviceId?: string | null) => void;
  services?: Service[];
  activeShopName?: string;
}

export default function QuickBookFAB({
  currentView,
  onInitiateBooking,
  services = [],
  activeShopName = 'Atelier'
}: QuickBookFABProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fabButtonRef = useRef<HTMLDivElement>(null);

  // Close popup menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // 30-Second Inactivity Timer Triggering GSAP Attention Pulse
  useEffect(() => {
    if (currentView === 'book') return;

    let pulseTween: gsap.core.Tween | null = null;
    const timer = setTimeout(() => {
      if (fabButtonRef.current) {
        // Create an attention-grabbing GSAP pulse and scale oscillation
        pulseTween = gsap.to(fabButtonRef.current, {
          scale: 1.1,
          boxShadow: '0 0 50px rgba(212, 175, 55, 0.9), 0 0 20px rgba(245, 158, 11, 0.7)',
          repeat: 5,
          yoyo: true,
          duration: 0.8,
          ease: 'power1.inOut'
        });
      }
    }, 30000); // 30 seconds

    return () => {
      clearTimeout(timer);
      if (pulseTween) pulseTween.kill();
    };
  }, [currentView]);

  // Don't show the floating booking button if user is already in the booking flow
  if (currentView === 'book') {
    return null;
  }

  // Curated popular services for quick 1-click select
  const popularServices = services.slice(0, 4);

  return (
    <div 
      ref={menuRef}
      id="quick-book-fab-container"
      className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 flex flex-col items-end"
    >
      {/* Quick Treatment Selection Menu (Popup) */}
      {isMenuOpen && (
        <div 
          id="quick-book-menu-popup"
          className="mb-3 w-80 sm:w-96 bg-[#0a0a0a]/98 backdrop-blur-xl border border-[#d4af37]/40 rounded-xl p-4 shadow-[0_15px_40px_rgba(0,0,0,0.9),0_0_25px_rgba(212,175,55,0.2)] animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-white text-xs font-mono font-bold tracking-wider uppercase">
                  Instant Reservations
                </h4>
                <p className="text-[10px] text-zinc-400 font-sans">
                  Choose a treatment or open full booking schedule
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Service List */}
          <div className="py-2.5 space-y-1.5 max-h-64 overflow-y-auto">
            {popularServices.map((service) => (
              <button
                key={service.id}
                onClick={() => {
                  setIsMenuOpen(false);
                  onInitiateBooking(service.id);
                }}
                className="w-full text-left p-2.5 rounded-lg bg-zinc-950/80 hover:bg-[#d4af37]/15 border border-zinc-800/80 hover:border-[#d4af37]/50 transition-all duration-200 flex items-center justify-between group cursor-pointer"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-mono text-[#d4af37] uppercase tracking-wider">
                      {service.category}
                    </span>
                    <span className="text-zinc-600 text-xs">•</span>
                    <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-[#d4af37]" />
                      {service.duration}m
                    </span>
                  </div>
                  <h5 className="text-xs font-sans font-medium text-white group-hover:text-[#d4af37] truncate transition-colors">
                    {service.name}
                  </h5>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-[#d4af37] block">
                    ₹{service.price}
                  </span>
                  <span className="text-[9px] font-mono uppercase text-zinc-400 group-hover:text-white flex items-center gap-1 justify-end transition-colors">
                    Select <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Direct CTA to full flow */}
          <div className="pt-2 border-t border-zinc-800/80">
            <button
              onClick={() => {
                setIsMenuOpen(false);
                onInitiateBooking();
              }}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-[#d4af37] to-yellow-600 text-black font-mono text-xs font-bold uppercase tracking-wider rounded-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Open Full Booking Calendar</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Floating Action Button (FAB) */}
      <div className="flex items-center gap-2 group">
        {/* Helper pulse badge (desktop) */}
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/90 border border-[#d4af37]/40 text-[#d4af37] text-[11px] font-mono font-medium tracking-wide shadow-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-time Slots Open</span>
        </span>

        {/* Combined Dual Action Button with GSAP ref */}
        <div 
          ref={fabButtonRef}
          className="flex items-center rounded-full bg-gradient-to-r from-amber-500 via-[#d4af37] to-yellow-600 p-0.5 shadow-[0_6px_30px_rgba(212,175,55,0.45)] hover:shadow-[0_8px_40px_rgba(212,175,55,0.65)] hover:scale-105 active:scale-95 transition-all duration-300"
        >
          {/* Main Primary Click: Jump straight to booking */}
          <button
            onClick={() => onInitiateBooking()}
            id="global-quick-book-fab"
            aria-label="Quick Book Appointment"
            className="flex items-center gap-2.5 pl-4 pr-3 py-3 sm:py-3.5 text-black font-mono font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            <div className="relative">
              <Calendar className="w-4 h-4 text-black" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-black animate-ping opacity-75" />
            </div>
            <span className="font-semibold tracking-widest">QUICK BOOK</span>
          </button>

          {/* Quick Menu Toggle Chevron Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen)}
            }
            id="global-quick-book-menu-toggle"
            aria-label={isMenuOpen ? "Close Quick Services Menu" : "Open Quick Services Menu"}
            className="pr-3 pl-1.5 py-3 sm:py-3.5 text-black hover:bg-black/10 rounded-r-full transition-colors cursor-pointer border-l border-black/15"
            title="View Popular Services"
          >
            <ChevronUp className={`w-4 h-4 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
