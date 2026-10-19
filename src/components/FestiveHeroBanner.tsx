import React, { useEffect, useRef } from 'react';
import { Sparkles, Calendar, ArrowRight } from 'lucide-react';
import { gsap } from 'gsap';

interface FestiveHeroBannerProps {
  onBookNow: () => void;
}

export default function FestiveHeroBanner({ onBookNow }: FestiveHeroBannerProps) {
  const bannerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(bannerRef.current, 
        { opacity: 0, scale: 0.95 }, 
        { opacity: 1, scale: 1, duration: 1, ease: 'power3.out' }
      );
      gsap.fromTo(titleRef.current, 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.8, delay: 0.3, ease: 'power2.out' }
      );
      gsap.fromTo(ctaRef.current, 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.8, delay: 0.6, ease: 'power2.out' }
      );
    }, bannerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div 
      ref={bannerRef}
      className="relative w-full py-20 px-6 bg-gradient-to-r from-[#1a1708] via-[#0a0a0a] to-[#1a1708] border-b border-[#d4af37]/30 overflow-hidden"
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#d4af37]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-xs font-mono uppercase tracking-[0.2em] mb-6">
          <Sparkles className="w-4 h-4" />
          Jaipur Wedding Season Special
        </div>

        <h1 ref={titleRef} className="text-4xl md:text-6xl font-sans font-extralight text-white uppercase tracking-tight mb-8">
          Radiance for Your <span className="text-[#d4af37] font-semibold italic">Festive Days</span>
        </h1>

        <p className="text-zinc-300 font-sans text-lg mb-10 max-w-2xl mx-auto">
          Celebrate the wedding season with exclusive festive packages starting at just ₹3,800. Look your absolute best with our curated bridal and festive beauty experiences in Jaipur.
        </p>

        <button 
          ref={ctaRef}
          onClick={onBookNow}
          className="inline-flex items-center gap-3 px-8 py-4 bg-[#d4af37] text-black font-mono text-sm uppercase tracking-widest font-bold rounded-sm hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all duration-300 active:scale-95"
        >
          <Calendar className="w-5 h-5" />
          Book Your Festive Slot
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
