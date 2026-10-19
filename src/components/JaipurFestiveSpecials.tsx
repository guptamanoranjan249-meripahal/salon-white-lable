import React, { useState } from 'react';
import { PREMIUM_SERVICES } from '../data';
import { Service } from '../types';
import { Sparkles, Clock, Calendar, Check, ArrowRight, Tag, Flame, ShieldCheck } from 'lucide-react';

interface JaipurFestiveSpecialsProps {
  onSelectService: (service: Service) => void;
  onOpenQuickView?: (service: Service) => void;
}

export default function JaipurFestiveSpecials({
  onSelectService,
  onOpenQuickView
}: JaipurFestiveSpecialsProps) {
  // Extract services with unique 'Seasonal' tag (rebranded to Jaipur Festive Specials)
  const festivePackages = PREMIUM_SERVICES.filter(
    (s) => s.seasonalTag === 'Seasonal' || s.isSeasonal || s.category === 'Seasonal'
  );

  const [activePackageId, setActivePackageId] = useState<string>(
    festivePackages[0]?.id || ''
  );

  if (festivePackages.length === 0) return null;

  const currentPackage = festivePackages.find((s) => s.id === activePackageId) || festivePackages[0];

  return (
    <section 
      id="jaipur-festive-specials-section" 
      aria-label="Jaipur Festive Specials Promotional Packages"
      className="relative z-20 py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#090805] via-[#0d0b06] to-[#040404] border-y border-[#d4af37]/25 overflow-hidden"
    >
      {/* Ambient background glow & motif */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#d4af37]/8 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#f59e0b]/5 rounded-full blur-3xl pointer-events-none translate-y-1/2" />
      
      {/* Decorative top badge line */}
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#d4af37] text-xs font-mono uppercase tracking-[0.25em] font-semibold mb-4 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
              <Flame className="w-3.5 h-3.5 text-[#f59e0b] animate-pulse" />
              <span>Jaipur Festive Special Curation</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans tracking-tight text-white uppercase font-light">
              JAIPUR FESTIVE <span className="text-[#d4af37] font-semibold italic">SPECIALS</span>
            </h2>
            <p className="mt-3 text-zinc-300 text-sm sm:text-base font-sans font-normal max-w-2xl leading-relaxed">
              Curated festive combinations for weddings and major events, offering total transformations with exclusive festival savings.
            </p>
          </div>

          {/* Quick tab switcher for packages */}
          <div className="flex flex-wrap gap-2">
            {festivePackages.map((pkg, idx) => {
              const isSelected = pkg.id === activePackageId;
              return (
                <button
                  key={pkg.id}
                  onClick={() => setActivePackageId(pkg.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-mono tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-[#d4af37] text-black font-bold border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.4)] scale-[1.02]'
                      : 'bg-[#141414] text-zinc-300 border-zinc-800 hover:border-[#d4af37]/40 hover:text-white'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-black' : 'bg-[#d4af37]'}`} />
                  <span>Curation 0{idx + 1}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Featured Showcase Card */}
        <div className="bg-[#0e0e0e]/90 rounded-2xl border border-[#d4af37]/35 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(212,175,55,0.1)] transition-all duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Visual Column */}
            <div className="lg:col-span-5 relative min-h-[320px] lg:min-h-full overflow-hidden group">
              <img
                src={currentPackage.image}
                alt={currentPackage.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 brightness-90 group-hover:brightness-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-black/20 lg:to-[#0e0e0e]" />
              
              {/* Badges on image */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-black/85 backdrop-blur-md border border-[#d4af37]/60 text-[#d4af37] text-xs font-mono uppercase tracking-wider font-semibold shadow-lg">
                  <Tag className="w-3.5 h-3.5" />
                  {currentPackage.seasonalTag || 'Seasonal'}
                </span>
                {currentPackage.seasonalLabel && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#d4af37]/20 backdrop-blur-md border border-[#d4af37]/40 text-amber-200 text-[11px] font-sans font-medium">
                    {currentPackage.seasonalLabel}
                  </span>
                )}
              </div>

              {/* Savings pill overlay */}
              {currentPackage.originalPrice && (
                <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Save ₹{currentPackage.originalPrice - currentPackage.price} Package Bundle
                </div>
              )}
            </div>

            {/* Details Column */}
            <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
              <div>
                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400 mb-4 pb-4 border-b border-zinc-800">
                  <span className="flex items-center gap-1.5 text-zinc-200">
                    <Clock className="w-4 h-4 text-[#d4af37]" />
                    {currentPackage.duration} Minutes Atelier Session
                  </span>
                  {currentPackage.validUntil && (
                    <span className="flex items-center gap-1.5 text-amber-300/90">
                      <Calendar className="w-4 h-4 text-[#d4af37]" />
                      Valid through {currentPackage.validUntil}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-zinc-200">
                    <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
                    VIP Suite Guarantee
                  </span>
                </div>

                {/* Package Name */}
                <h3 className="text-2xl sm:text-3xl font-sans font-normal text-white mb-3">
                  {currentPackage.name}
                </h3>

                {/* Description */}
                <p className="text-zinc-200 text-sm sm:text-base font-sans font-normal leading-relaxed mb-6">
                  {currentPackage.description}
                </p>

                {/* Included Features & Rituals */}
                <div className="space-y-2.5 mb-8">
                  <span className="text-xs font-mono uppercase tracking-widest text-[#d4af37] block font-semibold mb-2">
                    Included Atelier Protocols:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentPackage.features.map((feat, fIdx) => (
                      <div 
                        key={fIdx}
                        className="flex items-start gap-2.5 text-xs text-zinc-200 font-sans bg-black/40 border border-zinc-800/80 p-2.5 rounded-lg"
                      >
                        <Check className="w-3.5 h-3.5 text-[#d4af37] shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action and Pricing Bar */}
              <div className="pt-6 border-t border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-0.5">
                    Special Package Price
                  </div>
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-3xl sm:text-4xl font-mono font-bold text-[#d4af37]">
                      ₹{currentPackage.price.toLocaleString()}
                    </span>
                    {currentPackage.originalPrice && (
                      <span className="text-base sm:text-lg font-mono text-zinc-500 line-through">
                        ₹{currentPackage.originalPrice.toLocaleString()}
                      </span>
                    )}
                    <span className="text-xs font-mono text-emerald-400 font-medium">
                      (All-Inclusive)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {onOpenQuickView && (
                    <button
                      type="button"
                      onClick={() => onOpenQuickView(currentPackage)}
                      className="flex-1 sm:flex-initial px-4 py-3 bg-[#181818] hover:bg-[#222222] border border-zinc-700 hover:border-[#d4af37]/60 text-zinc-200 hover:text-white rounded-lg text-xs font-mono tracking-wider transition-colors cursor-pointer"
                    >
                      View Details
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectService(currentPackage)}
                    className="flex-1 sm:flex-initial px-6 py-3.5 bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#d4af37] text-black font-mono text-xs uppercase tracking-widest font-bold rounded-lg hover:shadow-[0_0_25px_rgba(212,175,55,0.45)] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Reserve Curation</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
