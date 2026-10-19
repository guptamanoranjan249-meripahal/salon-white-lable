import React, { useState } from 'react';
import { Shop } from '../types';
import { 
  Scissors, Activity, ShieldCheck, CreditCard, Sparkles, Plus, 
  ArrowRight, Globe, Layers, CheckCircle2, Monitor, ArrowUpRight, 
  Trash2, Mail, Lock, Phone, User, Store, BookOpen, UserCheck
} from 'lucide-react';
import { motion } from 'motion/react';

interface SaasLandingPageProps {
  shops: Shop[];
  onAddNewShop: (newShop: Shop) => void;
  onSelectShop: (shopId: string, view: 'customer' | 'owner') => void;
  onEnterSuperAdmin: () => void;
}

export default function SaasLandingPage({ 
  shops, 
  onAddNewShop, 
  onSelectShop, 
  onEnterSuperAdmin 
}: SaasLandingPageProps) {
  // Registration form state
  const [registering, setRegistering] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newShopTagline, setNewShopTagline] = useState('');
  const [newSubdomain, setNewSubdomain] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newCategory, setNewCategory] = useState<'Barber Shop' | 'Hair Salon' | 'Beauty Parlour' | 'Grooming Studio' | 'Spa' | 'Nails Studio' | 'Tattoo Studio' | 'Massage'>('Hair Salon');
  const [successMsg, setSuccessMsg] = useState('');

  // Submit Handler
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName || !newSubdomain || !newOwnerEmail) {
      alert("Please fill in all required fields.");
      return;
    }

    const cleanedSubdomain = newSubdomain.toLowerCase().replace(/[^a-z0-9]/g, '');
    const newShop: Shop = {
      id: cleanedSubdomain,
      name: newShopName,
      tagline: newShopTagline || "Your Sanctuary of Refined Taste",
      status: 'Pending', // Newly registered salons are approved dynamically by Super Admin!
      ownerEmail: newOwnerEmail,
      subdomain: `${cleanedSubdomain}.nexorasalonos.com`,
      category: newCategory,
      logoPlaceholder: newShopName.substring(0, 3).toUpperCase(),
      backgroundImage: newCategory === 'Barber Shop' 
        ? 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600'
        : newCategory === 'Beauty Parlour'
        ? 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600'
        : 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=600',
      balance: 0,
      address: 'Jaipur, Rajasthan',
      createdAt: new Date().toISOString()
    };

    onAddNewShop(newShop);
    setSuccessMsg(`Welcome to Aura Studio & Salon! "${newShop.name}" is now initialized as a pending tenant. Switch to the 'Super Admin' panel to approve it!`);
    
    // Clear form
    setNewShopName('');
    setNewShopTagline('');
    setNewSubdomain('');
    setNewOwnerEmail('');
    
    setTimeout(() => {
      setSuccessMsg('');
      setRegistering(false);
    }, 6000);
  };

  return (
    <div id="saas-homepage" className="min-h-screen text-gray-200 font-sans relative z-10 pt-24 pb-16">
      
      {/* Decorative gradient for B2B feel */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#d4af37]/5 via-transparent to-transparent pointer-events-none -z-10" />

      {/* Hero Header */}
      <div className="max-w-7xl mx-auto px-6 pt-12 md:pt-20 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-[10px] font-mono uppercase tracking-[0.25em] mb-6">
          <Sparkles className="w-3.5 h-3.5" /> YOUR LOCAL SALON & SPA PLATFORM
        </span>
        
        <h1 className="text-4xl md:text-7xl font-sans tracking-tight text-white font-extralight uppercase leading-tight max-w-5xl mx-auto">
          YOUR SALON. <span className="text-[#d4af37] font-semibold italic">YOUR BRAND.</span> <br />
          YOUR GROWTH.
        </h1>
        
        <p className="mt-6 text-zinc-200 font-sans text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
          Aura Studio & Salon is an easy-to-use platform for salons and spas in Jaipur. Create your custom booking website, manage appointments, and grow your business with tools built for you.
        </p>

        {/* Call to Actions main */}
        <div className="mt-10 flex flex-wrap gap-4 justify-center items-center">
          <button 
            onClick={() => setRegistering(true)}
            className="px-6 py-4 bg-[#d4af37] text-black text-xs font-mono font-bold tracking-widest uppercase rounded-sm hover:bg-yellow-500 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-[#d4af37]/10 active:scale-95"
          >
            <Plus className="w-4 h-4 text-black" /> Register My Salon
          </button>
          
          <button 
            onClick={onEnterSuperAdmin}
            className="px-6 py-4 bg-[#0a0a0a] border border-[#d4af37]/40 text-[#d4af37] text-xs font-mono tracking-widest uppercase rounded-sm hover:bg-[#d4af37]/10 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <UserCheck className="w-4 h-4" /> Admin Access
          </button>
        </div>
      </div>

      {/* Interactive registration modal */}
      {registering && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0b0b] border border-[#d4af37]/30 rounded p-6 sm:p-8 max-w-lg w-full relative shadow-2xl">
            <h3 className="text-xl font-sans font-light text-white uppercase tracking-wider mb-2">
              Register Your <span className="text-[#d4af37] font-semibold italic">Salon Brand</span>
            </h3>
            <p className="text-sm text-zinc-300 font-sans font-normal mb-6">
              Create your custom branded website link on Aura Studio & Salon and start accepting online client bookings today.
            </p>

            {successMsg ? (
              <div className="p-4 bg-[#d4af37]/10 border border-[#d4af37]/40 rounded text-xs text-[#d4af37] font-sans leading-relaxed">
                {successMsg}
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 block mb-1">
                    Salon / Shop Name *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g., Parisian Locks"
                    value={newShopName}
                    onChange={(e) => {
                      setNewShopName(e.target.value);
                      // Auto-populate subdomain suggestions
                      setNewSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                    }}
                    className="w-full bg-[#111] border border-white/5 rounded px-3 py-2.5 text-xs text-white uppercase font-mono focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 block mb-1">
                    Slogan / Brand Slogan
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g., Bespoke hair artistry"
                    value={newShopTagline}
                    onChange={(e) => setNewShopTagline(e.target.value)}
                    className="w-full bg-[#111] border border-white/5 rounded px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 block mb-1">
                      Salon Classification
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full bg-[#111] border border-white/5 rounded px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    >
                      <option value="Hair Salon">Hair Salon</option>
                      <option value="Barber Shop">Barber Shop</option>
                      <option value="Beauty Parlour">Beauty Parlour</option>
                      <option value="Grooming Studio">Grooming Studio</option>
                      <option value="Spa">Spa</option>
                      <option value="Nails Studio">Nails Studio</option>
                      <option value="Tattoo Studio">Tattoo Studio</option>
                      <option value="Massage">Massage</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 block mb-1">
                      Subdomain Prefix *
                    </label>
                    <div className="flex items-center">
                      <input 
                        type="text" 
                        required
                        placeholder="parisian"
                        value={newSubdomain}
                        onChange={(e) => setNewSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                        className="w-full bg-[#111] border border-white/5 rounded-l px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#d4af37]"
                      />
                      <span className="bg-zinc-900 border-y border-r border-white/5 text-gray-500 text-[10px] p-2.5 font-mono rounded-r select-none">
                        .salon.os
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 block mb-1">
                    Owner Email Credentials *
                  </label>
                  <input 
                    type="email" 
                    required
                    placeholder="owner@parisianlocks.com"
                    value={newOwnerEmail}
                    onChange={(e) => setNewOwnerEmail(e.target.value)}
                    className="w-full bg-[#111] border border-white/5 rounded px-3 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="flex gap-2.5 pt-4">
                  <button 
                    type="submit"
                    className="w-full py-3 bg-[#d4af37] text-black text-xs font-mono font-bold tracking-widest uppercase rounded-sm hover:bg-yellow-500 transition-colors cursor-pointer"
                  >
                    INIT MASTER PLAN
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setRegistering(false)}
                    className="px-4 py-3 bg-[#111] hover:bg-zinc-900 text-gray-400 text-xs font-mono tracking-widest uppercase rounded-sm border border-white/5 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Core B2B Features Grid */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-mono tracking-[0.3em] text-[#d4af37] uppercase block mb-3 font-semibold">
            Powerful Platform Features
          </span>
          <h2 className="text-3xl md:text-5xl font-sans tracking-tight text-white uppercase font-normal">
            EVERYTHING YOUR SALON NEEDS <span className="text-[#d4af37] font-semibold italic">TO GROW</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          <div className="p-6 bg-[#0c0c0c] border border-zinc-800 rounded-lg hover:border-[#d4af37]/60 shadow-lg hover:shadow-[0_10px_30px_rgba(0,0,0,0.8)] transition-all duration-300">
            <div className="w-10 h-10 rounded bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] mb-4">
              <Globe className="w-5 h-5" />
            </div>
            <h4 className="text-white text-base font-sans font-semibold tracking-wide mb-2">Dedicated Salon Website</h4>
            <p className="text-sm text-zinc-200 font-sans font-normal leading-relaxed">
              Every salon gets its own custom website address with personalized branding, online booking pages, and direct client access (e.g., looks.nexorasalonos.com).
            </p>
          </div>

          <div className="p-6 bg-[#0c0c0c] border border-zinc-800 rounded-lg hover:border-[#d4af37]/60 shadow-lg hover:shadow-[0_10px_30px_rgba(0,0,0,0.8)] transition-all duration-300">
            <div className="w-10 h-10 rounded bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] mb-4">
              <Monitor className="w-5 h-5" />
            </div>
            <h4 className="text-white text-base font-sans font-semibold tracking-wide mb-2">All-in-One Dashboard</h4>
            <p className="text-sm text-zinc-200 font-sans font-normal leading-relaxed">
              Accept customer appointments, organize stylist working schedules, view daily revenue reports, and request instant earnings payouts with ease.
            </p>
          </div>

          <div className="p-6 bg-[#0c0c0c] border border-zinc-800 rounded-lg hover:border-[#d4af37]/60 shadow-lg hover:shadow-[0_10px_30px_rgba(0,0,0,0.8)] transition-all duration-300">
            <div className="w-10 h-10 rounded bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] mb-4">
              <Activity className="w-5 h-5" />
            </div>
            <h4 className="text-white text-base font-sans font-semibold tracking-wide mb-2">Smart Client Reminders</h4>
            <p className="text-sm text-zinc-200 font-sans font-normal leading-relaxed">
              Automatically notify past customers when they are due for their next haircut or treatment, driving effortless repeat bookings and client loyalty.
            </p>
          </div>

          <div className="p-6 bg-[#0c0c0c] border border-zinc-800 rounded-lg hover:border-[#d4af37]/60 shadow-lg hover:shadow-[0_10px_30px_rgba(0,0,0,0.8)] transition-all duration-300">
            <div className="w-10 h-10 rounded bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] mb-4">
              <CreditCard className="w-5 h-5" />
            </div>
            <h4 className="text-white text-base font-sans font-semibold tracking-wide mb-2">Secure Payouts & Wallets</h4>
            <p className="text-sm text-zinc-200 font-sans font-normal leading-relaxed">
              Safely collect client payments and deposits directly in your digital salon wallet, with fast and transparent withdrawals directly to your bank account.
            </p>
          </div>

        </div>
      </section>

      {/* Tenancy Selector Board (The core interactive demo centerpiece!) */}
      <section className="py-16 px-6 max-w-7xl mx-auto bg-[#0a0a0a] border border-zinc-800 rounded-lg relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none">
          <Layers className="w-full h-full text-[#d4af37]" />
        </div>

        <div className="max-w-3xl mb-12">
          <span className="text-xs font-mono tracking-widest text-[#d4af37] uppercase block mb-1 font-semibold">
            LIVE DEMO CENTER
          </span>
          <h3 className="text-2xl md:text-3xl font-sans text-white uppercase font-normal">
            ACTIVATE & EXPLORE <span className="text-[#d4af37] font-semibold italic">PARTNER SALONS</span>
          </h3>
          <p className="mt-2 text-sm text-zinc-300 font-sans font-normal leading-relaxed">
            SalonOS currently powers the following live luxury establishments. Choose whether to explore their customer booking website or test the manager dashboard for daily salon operations.
          </p>
        </div>

        {/* Tenant Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <div 
              key={shop.id}
              className={`p-6 rounded-lg bg-[#0e0e0e] border transition-all duration-300 ${
                shop.status === 'Active' 
                  ? 'border-zinc-800 hover:border-[#d4af37]/60 shadow-lg' 
                  : 'border-amber-500/30 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-mono bg-zinc-900 text-zinc-300 px-2.5 py-1 rounded border border-zinc-800 uppercase tracking-wider font-medium">
                  {shop.category}
                </span>
                
                {shop.status === 'Active' ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> LIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> PENDING
                  </span>
                )}
              </div>

              <h4 className="text-xl font-sans font-medium text-white group-hover:text-[#d4af37] transition-colors">
                {shop.name}
              </h4>
              
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-zinc-400 font-mono">
                <Globe className="w-3.5 h-3.5 text-[#d4af37]" />
                <span className="text-zinc-300">{shop.subdomain}</span>
              </div>

              <p className="mt-3 text-sm text-zinc-300 font-sans italic leading-relaxed min-h-[44px]">
                "{shop.tagline}"
              </p>

              {/* Action columns depending on status */}
              <div className="mt-6 pt-4 border-t border-zinc-800/80 flex flex-col gap-2.5">
                {shop.status === 'Active' ? (
                  <>
                    <button
                      onClick={() => onSelectShop(shop.id, 'customer')}
                      className="w-full py-2.5 bg-zinc-900 hover:bg-[#d4af37] hover:text-black text-xs font-mono font-bold tracking-wider text-[#d4af37] uppercase rounded border border-zinc-700 hover:border-[#d4af37] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Explore Customer Website <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onSelectShop(shop.id, 'owner')}
                      className="w-full py-2.5 bg-[#141414] hover:bg-[#d4af37]/15 text-xs font-mono font-semibold tracking-wider text-white hover:text-[#d4af37] uppercase rounded border border-zinc-800 hover:border-[#d4af37]/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Salon Owner Dashboard <Monitor className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-3 bg-amber-500/10 rounded border border-amber-500/30 text-xs font-mono text-amber-300 leading-relaxed uppercase">
                    Pending Activation by Admin<br />
                    <span className="text-zinc-400 normal-case">Go to Admin panel to approve this salon</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Brand values banner */}
      <section className="py-12 border-t border-zinc-800/80 mt-16 text-center">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <h5 className="text-[#d4af37] font-mono text-2xl font-bold uppercase tracking-tight">100% SECURE</h5>
            <span className="text-zinc-300 text-xs font-sans font-medium block mt-1">Protected Payments & Deposits</span>
          </div>
          <div>
            <h5 className="text-[#d4af37] font-mono text-2xl font-bold uppercase tracking-tight">FAST & RESPONSIVE</h5>
            <span className="text-zinc-300 text-xs font-sans font-medium block mt-1">Instant Mobile Booking Experience</span>
          </div>
          <div>
            <h5 className="text-[#d4af37] font-mono text-2xl font-bold uppercase tracking-tight">SMART REMINDERS</h5>
            <span className="text-zinc-300 text-xs font-sans font-medium block mt-1">Automated Appointment Notifications</span>
          </div>
        </div>
      </section>

    </div>
  );
}
