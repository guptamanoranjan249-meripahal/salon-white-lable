import React, { useEffect, useRef, useState } from 'react';
import { GALLERY_ROWS } from '../data';
import { gsap } from 'gsap';

export default function ParallaxGallery() {
  const containerRef = useRef<HTMLDivElement>(null);
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const row3Ref = useRef<HTMLDivElement>(null);
  
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Elegant Mouse Parallax Tracking
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX - innerWidth / 2) / (innerWidth / 2);
      const y = (e.clientY - innerHeight / 2) / (innerHeight / 2);
      setMouseOffset({ x: x * 15, y: y * 15 });
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Scroll parallax using precise GSAP or elegant event binding
    // Since ScrollTrigger requires separate registration, we can use an ultra-fast scroll listener
    // that updates row translations with GSAP to ensure smooth, hardware-accelerated rendering.
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrolled = window.scrollY;
      const viewportHeight = window.innerHeight;

      // Check if container is in or close to view
      if (rect.top < viewportHeight && rect.bottom > 0) {
        const relativeScroll = scrolled - (containerRef.current.offsetTop - viewportHeight);
        
        // Rows move at different speeds (Scroll parallax)
        gsap.to(row1Ref.current, {
          x: relativeScroll * 0.12 - 50,
          duration: 0.8,
          ease: 'power1.out',
          overwrite: 'auto'
        });
        
        gsap.to(row2Ref.current, {
          x: -relativeScroll * 0.16 + 50,
          duration: 0.8,
          ease: 'power1.out',
          overwrite: 'auto'
        });
        
        gsap.to(row3Ref.current, {
          x: relativeScroll * 0.08 - 30,
          duration: 0.8,
          ease: 'power1.out',
          overwrite: 'auto'
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once initially
    handleScroll();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="parallax-gallery-section"
      className="relative overflow-hidden py-24 bg-gradient-to-b from-[#0a0a0a]/90 to-black border-y border-[#d4af37]/15 z-10"
    >
      <div className="max-w-7xl mx-auto px-6 mb-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-xs font-mono tracking-[0.4em] text-[#d4af37] uppercase mb-3 block">
              Luxury Gallery
            </span>
            <h2 className="text-3xl md:text-5xl font-sans tracking-tight text-white uppercase font-light">
              THE ART OF <span className="text-[#d4af37] font-semibold italic">TRANSFORMATION</span>
            </h2>
          </div>
          <p className="mt-4 md:mt-0 text-gray-400 font-sans font-light max-w-md text-sm leading-relaxed">
            Peek inside our premium physical locations. Moving with silent prestige, Aura Studio & Salon offers a sanctuary of luxury.
          </p>
        </div>
      </div>

      {/* Row Containers with subtle global mouse parallax offset with deep luxury shadows */}
      <div 
        className="flex flex-col gap-6 relative"
        style={{
          transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0)`,
          transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
      >
        {/* Row 1: Left to Right */}
        <div className="overflow-hidden py-1">
          <div
            ref={row1Ref}
            className="flex gap-6 whitespace-nowrap will-change-transform"
            style={{ width: '150%' }}
          >
            {GALLERY_ROWS[0].map((src, i) => (
              <div 
                key={`r1-${i}`} 
                className="w-72 md:w-96 aspect-[4/3] rounded-sm overflow-hidden flex-shrink-0 group relative border border-white/5 shadow-2xl"
                id={`gallery-r1-${i}`}
              >
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors duration-500 z-10" />
                <img
                  src={src}
                  alt={`Luxury salon feature ${i + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out scale-105 group-hover:scale-110"
                />
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                  <span className="text-xs font-mono tracking-widest text-[#d4af37]">NEXORA ATELIER</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: Right to Left */}
        <div className="overflow-hidden py-1">
          <div
            ref={row2Ref}
            className="flex gap-6 whitespace-nowrap will-change-transform"
            style={{ width: '150%' }}
          >
            {GALLERY_ROWS[1].map((src, i) => (
              <div 
                key={`r2-${i}`} 
                className="w-72 md:w-96 aspect-[4/3] rounded-sm overflow-hidden flex-shrink-0 group relative border border-[#d4af37]/20 shadow-2xl"
                id={`gallery-r2-${i}`}
              >
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors duration-500 z-10" />
                <img
                  src={src}
                  alt={`Luxury salon ambience ${i + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out scale-105 group-hover:scale-110"
                />
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                  <span className="text-xs font-mono tracking-widest text-[#d4af37]">GOLD EXPERIENCE</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 3: Left to Right */}
        <div className="overflow-hidden py-1">
          <div
            ref={row3Ref}
            className="flex gap-6 whitespace-nowrap will-change-transform"
            style={{ width: '150%' }}
          >
            {GALLERY_ROWS[2].map((src, i) => (
              <div 
                key={`r3-${i}`} 
                className="w-72 md:w-96 aspect-[4/3] rounded-sm overflow-hidden flex-shrink-0 group relative border border-white/5 shadow-2xl"
                id={`gallery-r3-${i}`}
              >
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors duration-500 z-10" />
                <img
                  src={src}
                  alt={`Luxury treatment ${i + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out scale-105 group-hover:scale-110"
                />
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                  <span className="text-xs font-mono tracking-widest text-[#d4af37]">PRESCRIPTION SALON</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
