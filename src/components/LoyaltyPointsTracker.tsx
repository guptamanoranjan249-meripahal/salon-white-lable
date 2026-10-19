import React, { useState } from 'react';
import { 
  Trophy, Sparkles, Award, Gift, ArrowRight, CheckCircle2, 
  TrendingUp, Calendar, Zap, ShieldCheck, ChevronRight, Percent, Star, Crown, Flame
} from 'lucide-react';

interface LoyaltyPointsTrackerProps {
  customerName: string;
  customerEmail: string;
  servicePrice: number;
  serviceName: string;
  onRebookNow: () => void;
}

export default function LoyaltyPointsTracker({
  customerName,
  customerEmail,
  servicePrice,
  serviceName,
  onRebookNow
}: LoyaltyPointsTrackerProps) {
  // Points calculation: 10 points per dollar spent
  const pointsEarned = Math.round(servicePrice * 10);
  
  // Retrieve previous points or initialize based on email
  const storageKey = `nexora_loyalty_${customerEmail.toLowerCase().trim() || 'guest'}`;
  const getStoredPoints = (): number => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.totalPoints || 0;
      }
    } catch (e) {
      console.error(e);
    }
    return 1850; // Welcome existing points for demonstration (Gold tier)
  };

  const [totalPoints] = useState<number>(() => {
    const prior = getStoredPoints();
    const updated = prior + pointsEarned;
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        totalPoints: updated,
        lastUpdated: new Date().toISOString()
      }));
    } catch (e) {
      console.error(e);
    }
    return updated;
  });

  const [rebookClaimed, setRebookClaimed] = useState(false);

  // Determine Tier & Visual Styling
  const getTierInfo = (points: number) => {
    if (points >= 5000) {
      return {
        tier: 'Diamond VIP' as const,
        tierIndex: 4,
        nextTier: 'Diamond Supreme',
        nextPoints: 10000,
        color: 'from-amber-300 via-[#d4af37] to-yellow-500',
        textColor: 'text-amber-300',
        badgeBg: 'bg-amber-400/15 border-amber-400/50 shadow-[0_0_20px_rgba(212,175,55,0.3)]',
        icon: Crown,
        perks: ['20 pts per $1 spent', 'Complimentary Champagne & Private Suite', 'Free Seasonal Glaze & Hair Spa'],
        multiplier: '2.0x Earning Rate'
      };
    } else if (points >= 2500) {
      return {
        tier: 'Platinum' as const,
        tierIndex: 3,
        nextTier: 'Diamond VIP',
        nextPoints: 5000,
        color: 'from-slate-200 via-zinc-300 to-amber-200',
        textColor: 'text-zinc-100',
        badgeBg: 'bg-zinc-200/15 border-zinc-300/45 shadow-[0_0_15px_rgba(255,255,255,0.15)]',
        icon: Sparkles,
        perks: ['15 pts per $1 spent', 'Priority Peak Slot Reservation', 'Complimentary Scalp Refresh Treatment'],
        multiplier: '1.5x Earning Rate'
      };
    } else if (points >= 1000) {
      return {
        tier: 'Gold' as const,
        tierIndex: 2,
        nextTier: 'Platinum',
        nextPoints: 2500,
        color: 'from-amber-400 via-[#d4af37] to-amber-600',
        textColor: 'text-[#d4af37]',
        badgeBg: 'bg-[#d4af37]/20 border-[#d4af37]/50 shadow-[0_0_15px_rgba(212,175,55,0.2)]',
        icon: Award,
        perks: ['12 pts per $1 spent', 'Complimentary Botanical Scalp Massage', '10% Discount on Home Care Products'],
        multiplier: '1.2x Earning Rate'
      };
    } else {
      return {
        tier: 'Silver' as const,
        tierIndex: 1,
        nextTier: 'Gold',
        nextPoints: 1000,
        color: 'from-zinc-400 to-zinc-200',
        textColor: 'text-zinc-300',
        badgeBg: 'bg-zinc-500/15 border-zinc-400/35',
        icon: Star,
        perks: ['10 pts per $1 spent', 'Exclusive Member Secret Flash Menus', 'Welcome Birthday Treatment Voucher'],
        multiplier: '1.0x Earning Rate'
      };
    }
  };

  const tierInfo = getTierInfo(totalPoints);
  const TierIconComp = tierInfo.icon;
  const progressToNextTier = Math.min(100, Math.round((totalPoints / tierInfo.nextPoints) * 100));
  const pointsNeeded = Math.max(0, tierInfo.nextPoints - totalPoints);
  const rewardsCashValue = (totalPoints / 100).toFixed(2);

  // All tiers for visual tier roadmap
  const allTiers = [
    { name: 'Silver', min: 0, icon: Star },
    { name: 'Gold', min: 1000, icon: Award },
    { name: 'Platinum', min: 2500, icon: Sparkles },
    { name: 'Diamond VIP', min: 5000, icon: Crown }
  ];

  return (
    <div id="loyalty-points-tracker-card" className="mt-8 max-w-xl mx-auto text-left">
      {/* Container with gold accent glow */}
      <div className="bg-gradient-to-b from-[#14120c] via-[#0c0c0c] to-[#090909] border border-[#d4af37]/35 rounded-xl p-6 sm:p-7 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(212,175,55,0.12)] relative overflow-hidden">
        {/* Decorative corner highlights */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/5 rounded-full blur-2xl pointer-events-none" />
        
        {/* Top Header Badge */}
        <div className="flex items-center justify-between gap-3 pb-5 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#d4af37] to-amber-200 flex items-center justify-center text-black font-bold shadow-md shadow-[#d4af37]/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-white text-base font-sans font-semibold tracking-wide">
                  Atelier Loyalty Rewards
                </h4>
                <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-bold ${tierInfo.badgeBg} ${tierInfo.textColor}`}>
                  <TierIconComp className="w-3 h-3" />
                  {tierInfo.tier} Tier
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-sans mt-0.5">
                Member ID: {customerEmail || 'Guest'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">
              POINTS EARNED
            </span>
            <span className="text-lg sm:text-xl font-mono text-[#d4af37] font-bold block">
              +{pointsEarned.toLocaleString()} PTS
            </span>
          </div>
        </div>

        {/* --- LOYALTY TIER STATUS VISUALIZER ROADMAP --- */}
        <div className="my-6 p-4 rounded-xl bg-zinc-950/90 border border-[#d4af37]/25 relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#d4af37] font-semibold flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" />
              <span>Membership Tier Roadmap</span>
            </span>
            <span className="text-xs font-mono text-zinc-400">
              {tierInfo.multiplier}
            </span>
          </div>

          {/* Stepper nodes */}
          <div className="grid grid-cols-4 gap-2 relative mt-4">
            {allTiers.map((t, idx) => {
              const isReached = totalPoints >= t.min;
              const isCurrent = tierInfo.tier.toLowerCase() === t.name.toLowerCase();
              const TIcon = t.icon;

              return (
                <div key={t.name} className="flex flex-col items-center text-center relative z-10">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${
                    isCurrent
                      ? 'bg-[#d4af37] text-black border-[#d4af37] scale-110 shadow-[0_0_20px_rgba(212,175,55,0.6)] font-bold'
                      : isReached
                      ? 'bg-zinc-900 text-[#d4af37] border-[#d4af37]/60'
                      : 'bg-zinc-950 text-zinc-600 border-zinc-800'
                  }`}>
                    <TIcon className="w-4 h-4" />
                  </div>
                  <span className={`text-[11px] font-sans font-medium mt-2 block ${isCurrent ? 'text-white font-bold' : isReached ? 'text-zinc-200' : 'text-zinc-500'}`}>
                    {t.name}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500 mt-0.5">
                    {t.min.toLocaleString()} pts
                  </span>
                </div>
              );
            })}
          </div>

          {/* Tier Perks Summary */}
          <div className="mt-4 pt-3 border-t border-zinc-800/80">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1.5">
              Active {tierInfo.tier} Benefits:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {tierInfo.perks.map((perk, pIdx) => (
                <div key={pIdx} className="flex items-center gap-1.5 text-[11px] text-zinc-200 font-sans bg-black/50 p-2 rounded border border-zinc-850">
                  <CheckCircle2 className="w-3 h-3 text-[#d4af37] shrink-0" />
                  <span className="truncate">{perk}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Current Balance & Cash Value Highlight */}
        <div className="py-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-zinc-950/70 border border-zinc-800">
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
              Total Reward Balance
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-mono text-white font-bold tracking-tight">
                {totalPoints.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-[#d4af37] font-semibold uppercase">
                POINTS
              </span>
            </div>
            <p className="text-xs text-zinc-300 mt-1 font-sans">
              Worth <strong className="text-emerald-400 font-mono">₹{rewardsCashValue}</strong> towards your future treatments
            </p>
          </div>

          <div className="p-4 rounded-lg bg-zinc-950/70 border border-zinc-800 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                Earning Rate ({tierInfo.tier})
              </span>
              <p className="text-xs text-zinc-200 font-sans leading-relaxed">
                Service: <strong className="text-white">{serviceName}</strong> (₹{servicePrice})
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-xs text-zinc-300">
              <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Points automatically banked to your profile</span>
            </div>
          </div>
        </div>

        {/* Tier Progress Bar */}
        <div className="py-4 border-t border-zinc-800/80">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
              Progress to <strong className="text-white font-semibold">{tierInfo.nextTier}</strong>
            </span>
            <span className="text-zinc-300 font-semibold">
              {progressToNextTier}% ({pointsNeeded.toLocaleString()} pts to go)
            </span>
          </div>

          {/* Progress track */}
          <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 via-[#d4af37] to-yellow-400 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(212,175,55,0.5)]"
              style={{ width: `${progressToNextTier}%` }}
            />
          </div>
        </div>

        {/* REBOOKING INCENTIVE BANNER */}
        <div className="mt-2 p-4 rounded-lg bg-gradient-to-r from-amber-500/15 via-[#d4af37]/10 to-zinc-900 border border-[#d4af37]/40 relative">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded bg-[#d4af37] text-black shrink-0 mt-0.5">
              <Gift className="w-4 h-4" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#d4af37]">
                  EXCLUSIVE REBOOKING INCENTIVE
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                  +500 BONUS PTS
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-200 font-sans font-normal leading-relaxed">
                Schedule your next session within <strong>30 days</strong> to unlock <strong>500 Bonus Points ($5 extra credit)</strong> and a complimentary organic scalp massage!
              </p>
              
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <button
                  onClick={() => {
                    setRebookClaimed(true);
                    onRebookNow();
                  }}
                  id="claim-rebook-incentive-btn"
                  className="px-4 py-2.5 bg-[#d4af37] hover:bg-yellow-400 text-black text-xs font-mono font-bold uppercase tracking-wider rounded transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book Next Appointment & Claim Bonus</span>
                </button>

                {rebookClaimed && (
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Bonus Code Reserved!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Redeemable Rewards Preview */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80">
          <span className="text-xs font-mono text-zinc-300 uppercase tracking-wider block mb-3 font-semibold flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-[#d4af37]" />
            What You Can Redeem On Your Next Visit:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 rounded bg-zinc-950/90 border border-zinc-800">
              <div className="flex items-center justify-between text-[#d4af37] font-mono font-bold mb-1">
                <span>$10 OFF</span>
                <span className="text-[10px] text-zinc-400">1,000 PTS</span>
              </div>
              <p className="text-[11px] text-zinc-300 font-sans">
                Direct credit deducted from any service bill.
              </p>
            </div>

            <div className="p-2.5 rounded bg-zinc-950/90 border border-zinc-800">
              <div className="flex items-center justify-between text-[#d4af37] font-mono font-bold mb-1">
                <span>SCALP SPA</span>
                <span className="text-[10px] text-zinc-400">1,500 PTS</span>
              </div>
              <p className="text-[11px] text-zinc-300 font-sans">
                Complimentary 15-min restorative scalp therapy.
              </p>
            </div>

            <div className="p-2.5 rounded bg-zinc-950/90 border border-zinc-800">
              <div className="flex items-center justify-between text-[#d4af37] font-mono font-bold mb-1">
                <span>GLAZE & GLOSS</span>
                <span className="text-[10px] text-zinc-400">2,500 PTS</span>
              </div>
              <p className="text-[11px] text-zinc-300 font-sans">
                Shine treatment and styling finish upgrade.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
