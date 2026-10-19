import React from 'react';
import { ARTISANS, PREMIUM_SERVICES } from '../data';
import { Artisan, Service } from '../types';
import { Sparkles, Star, Award, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

interface StaffPicksSectionProps {
  onSelectService: (service: Service) => void;
  onOpenStaffProfile: (artisan: Artisan) => void;
}

export default function StaffPicksSection({
  onSelectService,
  onOpenStaffProfile
}: StaffPicksSectionProps) {
  // Top-rated artisans (rating >= 4.9)
  const topArtisans = ARTISANS.filter((a) => a.rating >= 4.9);

  return (
    <section 
      id="staff-picks-section"
      aria-label="Staff Picks Curated Services"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#030303] via-[#080705] to-[#040404] relative z-20 border-t border-[#d4af37]/20"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-xs font-mono uppercase tracking-[0.3em] font-semibold mb-4 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Master Artisan Recommendations</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans tracking-tight text-white uppercase font-light">
            CURATED <span className="text-[#d4af37] font-semibold italic">STAFF PICKS</span>
          </h2>
          <p className="mt-4 text-zinc-300 text-sm sm:text-base font-sans font-normal max-w-2xl mx-auto leading-relaxed">
            Discover signature treatments hand-selected by our elite master artisans, featuring their personal techniques and professional recommendations.
          </p>
        </div>

        {/* Staff Picks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {topArtisans.map((artisan) => {
            // Find their top featured service from specificExpertise or fallback to first matching premium service
            const primaryExp = artisan.specificExpertise[0];
            const matchingService = PREMIUM_SERVICES.find(
              (s) => s.id === primaryExp?.serviceId
            ) || PREMIUM_SERVICES[0];

            return (
              <div
                key={artisan.id}
                className="bg-[#0b0a08]/90 rounded-2xl border border-[#d4af37]/25 hover:border-[#d4af37]/60 overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.7)] flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1"
              >
                <div>
                  {/* Artisan & Featured Service Visual Header */}
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={matchingService.image}
                      alt={matchingService.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 brightness-90 group-hover:brightness-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0a08] via-black/40 to-transparent" />

                    {/* Artisan Avatar & Name Floating Badge */}
                    <div 
                      onClick={() => onOpenStaffProfile(artisan)}
                      className="absolute top-3 left-3 right-3 flex items-center justify-between bg-black/80 backdrop-blur-md p-2 rounded-xl border border-[#d4af37]/35 cursor-pointer hover:border-[#d4af37] transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={artisan.image}
                          alt={artisan.name}
                          className="w-9 h-9 rounded-full object-cover border border-[#d4af37]/60 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-sans font-medium text-white truncate">
                            {artisan.name}
                          </h4>
                          <p className="text-[10px] font-mono text-[#d4af37] truncate">
                            {artisan.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-[#d4af37]/15 px-2 py-0.5 rounded text-[11px] font-mono font-bold text-[#d4af37] shrink-0">
                        <Star className="w-3 h-3 fill-[#d4af37]" />
                        <span>{artisan.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    {/* Price tag */}
                    <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-black/85 backdrop-blur-md border border-[#d4af37]/40 text-[#d4af37] text-xs font-mono font-bold">
                      ${matchingService.price}
                    </div>
                  </div>

                  {/* Service Info Content */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-mono tracking-wider text-[#d4af37] uppercase bg-[#d4af37]/10 px-2 py-0.5 rounded border border-[#d4af37]/20 font-semibold">
                        {matchingService.category} Pick
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1 ml-auto">
                        <Clock className="w-3 h-3 text-[#d4af37]" />
                        {matchingService.duration}m
                      </span>
                    </div>

                    <h3 className="text-base font-sans font-medium text-white mb-2 group-hover:text-[#d4af37] transition-colors line-clamp-1">
                      {matchingService.name}
                    </h3>

                    <p className="text-xs text-zinc-300 font-sans font-normal leading-relaxed mb-4 line-clamp-2">
                      {primaryExp?.description || matchingService.description}
                    </p>

                    {/* Artisan quote/expert note */}
                    <div className="bg-black/50 border border-zinc-800/80 p-2.5 rounded-lg mb-4">
                      <p className="text-[11px] italic font-sans text-amber-200/90 leading-snug">
                        "{primaryExp?.masteryLevel ? `Mastery: ${primaryExp.masteryLevel}` : artisan.specialty}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenStaffProfile(artisan)}
                    className="px-3 py-2.5 bg-[#181818] hover:bg-[#222222] border border-zinc-700 hover:border-[#d4af37]/50 text-zinc-200 hover:text-white rounded-lg text-xs font-mono tracking-wider transition-colors text-center cursor-pointer"
                  >
                    View Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectService(matchingService)}
                    className="px-3 py-2.5 bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#d4af37] text-black font-mono text-xs uppercase tracking-wider font-bold rounded-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Book</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
