import React from 'react';
import { Menu, X, Scissors, CalendarRange, Lock, Compass, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  currentView: 'saas_landing' | 'home' | 'book' | 'dashboard' | 'super_admin';
  onChangeView: (view: 'saas_landing' | 'home' | 'book' | 'dashboard' | 'super_admin') => void;
  pendingCount?: number;
  activeShopName?: string;
}

export default function Navbar({ currentView, onChangeView, pendingCount = 0, activeShopName }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Configure dynamic tabs depending on context
  const navItems = React.useMemo(() => {
    // If the user is on the main B2B SaaS hub or Super Admin Panel, show global tabs
    if (currentView === 'saas_landing' || currentView === 'super_admin') {
      return [
        { id: 'saas_landing' as const, label: 'SaaS Platform Home', icon: Compass },
        { id: 'super_admin' as const, label: 'Super Admin', icon: ShieldAlert },
      ];
    }

    // If they are on a specific salon website ('home', 'book', 'dashboard'), show domain focused sub-tabs
    return [
      { id: 'home' as const, label: `${activeShopName || 'Atelier'} Web`, icon: Scissors },
      { id: 'book' as const, label: 'Reserve Appointment', icon: CalendarRange },
      { id: 'dashboard' as const, label: 'Owner Portal', icon: Lock, badge: pendingCount > 0 ? pendingCount : undefined },
      { id: 'saas_landing' as const, label: '← Exit to SaaS Hub', icon: Compass },
    ];
  }, [currentView, pendingCount, activeShopName]);

  return (
    <nav 
      id="nexora-navbar"
      className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/85 border-b border-[#d4af37]/15 backdrop-blur-md transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Luxury Brand Styling */}
        <div 
          onClick={() => onChangeView('saas_landing')} 
          id="navbar-branding-logo"
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="relative w-8 h-8 rounded-full border border-[#d4af37] flex items-center justify-center overflow-hidden transition-transform duration-700 group-hover:rotate-180">
            {/* Minimalist modern luxury custom element */}
            <span className="font-serif text-sm font-semibold text-[#d4af37] tracking-wider">N</span>
          </div>
          <div className="flex flex-col">
            <span className="font-sans font-light text-base text-white tracking-[0.3em] uppercase leading-none group-hover:text-[#d4af37] transition-all">
              NEXORA
            </span>
            <span className="font-mono text-[8px] text-[#d4af37] tracking-[0.2em] uppercase mt-1 leading-none">
              SALONOS
            </span>
          </div>
        </div>

        {/* Desktop Luxury Item Links */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => {
                  onChangeView(item.id);
                  setMobileOpen(false);
                }}
                className={`relative py-2 px-1 text-xs font-mono tracking-widest uppercase transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  isActive 
                    ? 'text-[#d4af37]' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 opacity-80" />
                <span>{item.label}</span>
                
                {/* Pending dot badge for Owner Concierge */}
                {item.badge !== undefined && (
                  <span className="h-5 min-w-[20px] px-1 bg-amber-500 text-black text-[9px] font-bold font-mono rounded-full flex items-center justify-center animate-bounce shadow">
                    {item.badge}
                  </span>
                )}
                
                {/* Active marker line */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#d4af37] shadow-[0_1px_10px_rgba(212,175,55,0.8)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          id="navbar-mobile-toggle"
          className="md:hidden text-[#d4af37] border border-[#d4af37]/25 p-2 rounded cursor-pointer"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div 
          id="navbar-mobile-drawer"
          className="md:hidden bg-black/95 border-b border-[#d4af37]/20 px-6 py-8 space-y-6 absolute left-0 right-0 top-[80px]"
        >
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                id={`mobile-nav-item-${item.id}`}
                onClick={() => {
                  onChangeView(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full py-3.5 px-4 text-xs font-mono tracking-widest uppercase text-left rounded border transition-all flex items-center justify-between cursor-pointer ${
                  isActive 
                    ? 'bg-[#181611] text-[#d4af37] border-[#d4af37]/30' 
                    : 'bg-[#080808]/50 text-gray-400 border-transparent hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-[#d4af37]" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="h-5 min-w-[20px] px-1 bg-[#d4af37] text-black text-[9px] font-bold font-mono rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
}
