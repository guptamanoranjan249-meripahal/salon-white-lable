import React from 'react';
import { ARTISANS } from '../data';
import { Artisan } from '../types';
import { Instagram, Award, Sparkles } from 'lucide-react';

interface ArtisansListProps {
  onBookWithArtisan: (serviceId?: string) => void;
  onViewStaffProfile?: (artisan: Artisan) => void;
}

export default function ArtisansList({ onBookWithArtisan, onViewStaffProfile }: ArtisansListProps) {
  return (
    <section 
      id="artisans-section" 
      className="py-32 px-6 bg-gradient-to-b from-[#050505]/95 to-black relative z-10 border-t border-white/5"
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-20 animate-fade-in">
          <span className="text-xs font-mono tracking-[0.3em] text-[#d4af37] uppercase block mb-3 font-semibold">
            Elite Master Stylists
          </span>
          <h2 className="text-4xl md:text-5xl font-sans tracking-tight text-white uppercase font-light">
            MEET THE <span className="text-[#d4af37] font-semibold italic">ARTISANS</span>
          </h2>
          <p className="mt-4 text-zinc-200 text-sm sm:text-base font-sans font-normal max-w-xl mx-auto leading-relaxed">
            Meet our team of master stylists and beauty directors. Select any artisan to explore their individual work gallery, customer transformations, and service expertise.
          </p>
        </div>

        {/* Artisans Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {ARTISANS.map((artisan) => (
            <div 
              key={artisan.id}
              id={`artisan-card-${artisan.id}`}
              onClick={() => onViewStaffProfile && onViewStaffProfile(artisan)}
              className="group relative h-[500px] bg-[#090909] rounded-sm overflow-hidden border border-zinc-800 transition-all duration-700 ease-out hover:border-[#d4af37]/60 shadow-2xl cursor-pointer"
            >
              {/* Gold Top Highlight Glow */}
              <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#d4af37]/0 to-transparent group-hover:via-[#d4af37]/45 transition-all duration-700 z-30" />

              {/* Headshot Image Container */}
              <div className="absolute inset-0 z-0">
                <img 
                  src={artisan.image} 
                  alt={artisan.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105 group-hover:opacity-25 opacity-80"
                />
                {/* Always-on subtle vignette gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
              </div>

              {/* Quick Profile Tag Badge */}
              <div className="absolute top-4 left-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-xs font-mono text-[#d4af37] bg-black/90 border border-[#d4af37]/40 px-2.5 py-1 rounded shadow-lg font-medium">
                  View Profile & Work Gallery
                </span>
              </div>

              {/* Card Footer Info - Constant Text Block */}
              <div className="absolute bottom-0 left-0 w-full p-6 z-20 transition-all duration-500 ease-out group-hover:translate-y-[-6px]">
                
                {/* Artisan Role & Instagram always visible */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs text-[#d4af37] font-mono tracking-wider uppercase font-semibold">
                    {artisan.role}
                  </span>
                  <a 
                    href={`https://instagram.com/${artisan.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-400 hover:text-[#d4af37] font-mono flex items-center gap-1 transition-colors cursor-pointer z-30"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Instagram className="w-3.5 h-3.5 text-[#d4af37]" />
                    {artisan.instagram}
                  </a>
                </div>

                {/* Artisan Name */}
                <h3 className="text-xl font-sans text-white font-medium group-hover:text-[#d4af37] transition-colors duration-300">
                  {artisan.name}
                </h3>

                {/* Short Biography */}
                <p className="text-sm text-zinc-200 font-sans font-normal mt-2.5 leading-relaxed line-clamp-2 group-hover:text-white transition-colors">
                  {artisan.bio}
                </p>

                {/* HOVER REVEAL EFFECT: Specialty and CTAs */}
                <div className="mt-3.5 pt-3.5 border-t border-white/5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-500 ease-out transform translate-y-4 group-hover:translate-y-0 space-y-2">
                  
                  {/* Style Specialty Box */}
                  <div className="bg-[#d4af37]/5 border border-[#d4af37]/30 rounded px-3 py-2 mb-2">
                    <span className="text-[9px] font-mono tracking-widest text-[#d4af37] uppercase block mb-0.5">
                      SIGNATURE SPECIALTY
                    </span>
                    <span className="text-xs text-white font-sans font-medium tracking-wide block truncate">
                      {artisan.specialty}
                    </span>
                  </div>

                  {/* Primary: View Full Profile & Gallery CTA */}
                  <button
                    id={`view-profile-btn-${artisan.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onViewStaffProfile) onViewStaffProfile(artisan);
                    }}
                    className="w-full py-2 bg-[#d4af37] text-black text-[10px] font-mono tracking-widest uppercase font-bold rounded-sm hover:bg-yellow-500 transition-colors cursor-pointer block text-center shadow"
                  >
                    VIEW PROFILE & GALLERY
                  </button>

                  {/* Secondary: Direct Quick Book */}
                  <button
                    id={`book-with-artisan-btn-${artisan.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookWithArtisan();
                    }}
                    className="w-full py-1.5 bg-black/60 hover:bg-white/10 text-gray-300 hover:text-white text-[9px] font-mono tracking-widest uppercase rounded-sm border border-white/10 transition-colors cursor-pointer block text-center"
                  >
                    Quick Reserve
                  </button>

                </div>

              </div>

              {/* Aesthetic Border Framing lines decoration (Premium Luxury Touch) */}
              <div className="absolute top-3 left-3 right-3 bottom-3 border border-white/0 group-hover:border-white/5 pointer-events-none transition-all duration-700 z-15" />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
