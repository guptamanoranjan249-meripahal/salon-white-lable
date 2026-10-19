import React, { useMemo } from 'react';
import { Service, Booking } from '../types';
import { Sparkles, Clock, Calendar, ArrowRight, Check, Heart, Trophy, RefreshCw } from 'lucide-react';

interface RecommendedTreatmentsProps {
  currentService: Service | null;
  customerEmail: string;
  customerPhone?: string;
  allServices: Service[];
  onSelectRecommendedService: (service: Service) => void;
}

interface MatchResult {
  service: Service;
  matchScore: number;
  reason: string;
  recommendedTimeframe: string;
}

export default function RecommendedTreatments({
  currentService,
  customerEmail,
  customerPhone,
  allServices,
  onSelectRecommendedService
}: RecommendedTreatmentsProps) {
  // Retrieve customer's historical bookings from localStorage
  const customerHistory = useMemo(() => {
    try {
      const stored = localStorage.getItem('nexora_bookings');
      if (stored) {
        const parsed: Booking[] = JSON.parse(stored);
        const emailLower = customerEmail.toLowerCase().trim();
        return parsed.filter(b => 
          (b.customerEmail && b.customerEmail.toLowerCase().trim() === emailLower) ||
          (customerPhone && b.customerPhone === customerPhone)
        );
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  }, [customerEmail, customerPhone]);

  // Simple matching algorithm based on current service & booking history
  const recommendations: MatchResult[] = useMemo(() => {
    if (!allServices || allServices.length === 0) return [];

    // Extract categories user has booked in the past + current
    const pastCategories = new Set<string>();
    customerHistory.forEach(b => {
      // Find matching service category if available
      const matched = allServices.find(s => s.id === b.serviceId || s.name === b.serviceName);
      if (matched) pastCategories.add(matched.category);
    });

    if (currentService) {
      pastCategories.add(currentService.category);
    }

    const currentId = currentService?.id || '';
    const currentCategory = currentService?.category || '';

    // Score all available alternative services
    const candidates = allServices.filter(s => s.id !== currentId);

    const scored: MatchResult[] = candidates.map(service => {
      let score = 80;
      let reason = 'Curated complementary treatment for your styling routine.';
      let timeframe = '4 – 6 Weeks';

      // 1. Direct Pairing Logic based on current service category
      if (currentCategory === 'Haircut') {
        if (service.category === 'Spa') {
          score = 98;
          reason = 'Deep restorative scalp hydro-steam recommended to stimulate healthy hair growth following precision styling.';
          timeframe = '3 – 4 Weeks';
        } else if (service.category === 'Coloring') {
          score = 94;
          reason = 'Subtle multi-tonal glaze to illuminate hair layers and accentuate cut geometry.';
          timeframe = '4 – 6 Weeks';
        } else if (service.category === 'Manicure') {
          score = 88;
          reason = 'Head-to-toe relaxation pairing while enjoying our private salon amenities.';
          timeframe = '2 – 3 Weeks';
        }
      } else if (currentCategory === 'Coloring') {
        if (service.category === 'Spa') {
          score = 99;
          reason = 'Essential post-color bond hydration to seal cuticle scales and lock in luminous gold tones.';
          timeframe = '2 – 3 Weeks';
        } else if (service.category === 'Haircut') {
          score = 95;
          reason = 'Healthy ends maintenance and shape rejuvenation to showcase your balayage gradient.';
          timeframe = '6 – 8 Weeks';
        } else if (service.category === 'Manicure') {
          score = 89;
          reason = 'Complete beauty ritual to pair vibrant nail lacquer with your new color look.';
          timeframe = '3 – 4 Weeks';
        }
      } else if (currentCategory === 'Spa') {
        if (service.category === 'Haircut') {
          score = 97;
          reason = 'Pairs deeply cleansed, revitalized hair strands with precision structural cutting.';
          timeframe = '4 – 6 Weeks';
        } else if (service.category === 'Manicure') {
          score = 93;
          reason = 'Full-spectrum holistic luxury care combining hand reflexology with head relaxation.';
          timeframe = '2 – 3 Weeks';
        } else if (service.category === 'Coloring') {
          score = 90;
          reason = 'Your scalp and hair are perfectly primed and nourished for delicate hand-painted color.';
          timeframe = '4 – 6 Weeks';
        }
      } else if (currentCategory === 'Barber') {
        if (service.category === 'Spa') {
          score = 98;
          reason = 'Hot steam vapor therapy and scalp detox to relieve tension and soothe skin after razor contouring.';
          timeframe = '2 – 3 Weeks';
        } else if (service.category === 'Haircut') {
          score = 94;
          reason = 'Seamless scissor taper to match and elevate your clean-shaven beard lines.';
          timeframe = '3 – 4 Weeks';
        }
      } else if (currentCategory === 'Bridal') {
        if (service.category === 'Manicure') {
          score = 99;
          reason = 'Picture-perfect golden dust hand ritual essential for close-up ceremony ring photography.';
          timeframe = '1 – 2 Weeks';
        } else if (service.category === 'Spa') {
          score = 96;
          reason = 'Decompressing pre-event sensory detox to relieve wedding stress and hydrate hair.';
          timeframe = '1 – 2 Weeks';
        }
      } else if (currentCategory === 'Manicure') {
        if (service.category === 'Spa') {
          score = 96;
          reason = 'Continue your wellness day with our signature restorative hydrotherapy suite.';
          timeframe = '3 – 4 Weeks';
        } else if (service.category === 'Haircut') {
          score = 92;
          reason = 'Complement your polished nails with a fresh Parisian blowout and precision cut.';
          timeframe = '4 – 6 Weeks';
        }
      }

      // 2. Bonus affinity if customer has previously booked this category in past history
      if (pastCategories.has(service.category)) {
        score = Math.min(99, score + 2);
      }

      // 3. Price affinity: services close to customer's spend profile score higher
      if (currentService) {
        const priceDiff = Math.abs(service.price - currentService.price);
        if (priceDiff < 60) {
          score = Math.min(99, score + 1);
        }
      }

      return {
        service,
        matchScore: score,
        reason,
        recommendedTimeframe: timeframe
      };
    });

    // Sort descending by match score and take top 3 recommendations
    return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
  }, [currentService, allServices, customerHistory]);

  if (recommendations.length === 0) return null;

  return (
    <div id="recommended-treatments-section" className="mt-10 max-w-4xl mx-auto text-left">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37]">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-mono tracking-widest text-[#d4af37] uppercase font-semibold">
              Curated Recommendations
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-sans font-medium text-white tracking-wide">
            Recommended For Your Next Appointment
          </h3>
          <p className="text-xs sm:text-sm text-zinc-300 font-sans mt-1">
            Matched intelligently to your recent <strong className="text-white">{currentService?.name || 'styling session'}</strong> and treatment history.
          </p>
        </div>

        {customerHistory.length > 0 && (
          <div className="shrink-0 bg-zinc-950 px-3 py-1.5 rounded border border-zinc-800 text-[11px] font-mono text-zinc-400">
            Based on <span className="text-[#d4af37] font-semibold">{customerHistory.length}</span> previous {customerHistory.length === 1 ? 'visit' : 'visits'}
          </div>
        )}
      </div>

      {/* Grid of Recommended Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {recommendations.map(({ service, matchScore, reason, recommendedTimeframe }) => {
          const pointsWillEarn = Math.round(service.price * 10);

          return (
            <div
              key={service.id}
              id={`recommended-card-${service.id}`}
              className="group bg-[#0d0d0d] border border-zinc-800 hover:border-[#d4af37]/60 rounded-xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Visual Image with Match Score Badge */}
                <div className="relative h-44 overflow-hidden bg-black">
                  <img
                    src={service.image}
                    alt={service.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-85 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-black/30" />

                  {/* Match Score Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/85 border border-[#d4af37]/50 text-[#d4af37] text-[10px] font-mono font-bold tracking-wider backdrop-blur-md shadow-lg">
                      <Sparkles className="w-3 h-3 text-[#d4af37]" />
                      {matchScore}% MATCH
                    </span>
                  </div>

                  {/* Price Tag */}
                  <div className="absolute top-3 right-3 z-10">
                    <span className="px-2.5 py-1 rounded-full bg-black/85 border border-zinc-700 text-white font-mono text-xs font-bold">
                      ${service.price}
                    </span>
                  </div>

                  {/* Recommended Follow-up Timing */}
                  <div className="absolute bottom-2.5 left-3 z-10">
                    <span className="text-[10px] font-mono text-zinc-300 bg-zinc-950/80 px-2 py-0.5 rounded border border-white/10 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-[#d4af37]" />
                      Next visit in {recommendedTimeframe}
                    </span>
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#d4af37] uppercase tracking-wider font-semibold">
                      {service.category}
                    </span>
                    <span className="text-zinc-400">
                      {service.duration} mins
                    </span>
                  </div>

                  <h4 className="text-base font-sans font-medium text-white group-hover:text-[#d4af37] transition-colors leading-snug">
                    {service.name}
                  </h4>

                  {/* Matching logic explanation */}
                  <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="text-[9px] font-mono text-[#d4af37] uppercase tracking-widest block mb-0.5 font-semibold">
                      Why This Pairs Well:
                    </span>
                    <p className="text-xs text-zinc-300 font-sans leading-relaxed line-clamp-3">
                      {reason}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Footer with Loyalty Rewards & 1-Click Select CTA */}
              <div className="p-4 pt-0 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-2 border-t border-zinc-800">
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-[#d4af37]" />
                    Earns Loyalty:
                  </span>
                  <span className="text-[#d4af37] font-semibold">
                    +{pointsWillEarn.toLocaleString()} PTS
                  </span>
                </div>

                <button
                  onClick={() => onSelectRecommendedService(service)}
                  id={`btn-select-recommended-${service.id}`}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-[#d4af37] to-yellow-600 hover:brightness-110 text-black font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Select & Rebook</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
