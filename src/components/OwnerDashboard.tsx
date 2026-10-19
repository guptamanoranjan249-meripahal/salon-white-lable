import React, { useState, useEffect } from 'react';
import { Booking, BookingStatus, StaffMember, CustomerData, Shop, Transaction } from '../types';
import { 
  TrendingUp, Clock, CheckCircle2, DollarSign, Search, Calendar, ChevronDown, 
  Trash2, Mail, Phone, Eye, Check, X, ShieldAlert, ArrowDownUp, RefreshCw, 
  Layers, Users, UserPlus, Scissors, Sparkles, MessageSquare, ChevronRight,
  LogOut, Play, CheckCircle, Smartphone, Award, Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OwnerDashboardProps {
  activeShopId: string;
  shops: Shop[];
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  staff: StaffMember[];
  setStaff: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  customers: CustomerData[];
  setCustomers: React.Dispatch<React.SetStateAction<CustomerData[]>>;
  onBookingStateChange: () => void;
  onRefreshTrigger: number;
  onAddTransaction: (txn: Transaction) => void;
  onUpdateShopBalance: (shopId: string, amount: number) => void;
  onAddWithdrawRequest: (amount: number, dest: string) => void;
  onExit: () => void;
  onViewStaffProfile?: (staff: StaffMember) => void;
}

export default function OwnerDashboard({ 
  activeShopId,
  shops,
  bookings,
  setBookings,
  staff,
  setStaff,
  customers,
  setCustomers,
  onBookingStateChange,
  onRefreshTrigger,
  onAddTransaction,
  onUpdateShopBalance,
  onAddWithdrawRequest,
  onExit,
  onViewStaffProfile
}: OwnerDashboardProps) {
  
  // Find currently active shop details
  const activeShop = shops.find(s => s.id === activeShopId) || shops[0];

  // Tab routing inside Owner Portal
  const [ownerTab, setOwnerTab] = useState<'bookings' | 'staff' | 'customers' | 'campaigns' | 'wallet'>('bookings');

  // Drilldown states
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  // Searching / Sorting / Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Add staff state
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Senior Stylist');
  const [newStaffSpecialty, setNewStaffSpecialty] = useState('');

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDest, setWithdrawDest] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');

  // AI WhatsApp Campaign States
  const [inactiveDaysThreshold, setInactiveDaysThreshold] = useState<60 | 90>(60);
  const [campaignMessage, setCampaignMessage] = useState(`We miss your presence at activeShop.name. Claim 20% off your next session! Use code MISSYOU20 at checkout.`);
  const [campaignRunning, setCampaignRunning] = useState(false);
  const [campaignLogs, setCampaignLogs] = useState<string[]>([]);
  const [campaignProgress, setCampaignProgress] = useState(0);
  const [campaignCompleted, setCampaignCompleted] = useState(false);
  const [recoveredCount, setRecoveredCount] = useState(0);

  // Synchronize campaign message default when entering tab or changing shops
  useEffect(() => {
    setCampaignMessage(`We miss your presence at ${activeShop.name}! Claim 20% off your next session. Use code MISSYOU20 at bookings.`);
  }, [activeShopId]);

  // Filter Bookings scoped strictly to CURRENT activeShopId
  const shopBookings = React.useMemo(() => {
    return bookings.filter(b => b.shopId === activeShopId);
  }, [bookings, activeShopId]);

  // Filter Staff scoped strictly to CURRENT activeShopId
  const shopStaff = React.useMemo(() => {
    return staff.filter(s => s.shopId === activeShopId);
  }, [staff, activeShopId]);

  // Filter Customers scoped strictly to CURRENT activeShopId
  const shopCustomers = React.useMemo(() => {
    return customers.filter(c => c.shopId === activeShopId);
  }, [customers, activeShopId]);

  // Auto-select first booking of relevant shop if none is selected
  useEffect(() => {
    if (shopBookings.length > 0) {
      setSelectedBooking(shopBookings[0]);
    } else {
      setSelectedBooking(null);
    }
  }, [activeShopId, bookings]);

  // Booking Status triggers
  const handleUpdateStatus = (id: string, newStatus: BookingStatus) => {
    const updated = bookings.map((b) => {
      if (b.id === id) {
        const updatedBooking = { ...b, status: newStatus };
        
        // Sync selected details panel immediately
        if (selectedBooking && selectedBooking.id === id) {
          setSelectedBooking(updatedBooking);
        }

        // If completed, add revenue to shop balance & log transaction
        if (newStatus === 'Completed') {
          onUpdateShopBalance(b.shopId, b.price);
          
          const newTxn: Transaction = {
            id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
            shopId: b.shopId,
            shopName: activeShop.name,
            amount: b.price,
            type: 'Booking Deposit',
            status: 'Completed',
            createdAt: new Date().toISOString()
          };
          onAddTransaction(newTxn);
        }

        return updatedBooking;
      }
      return b;
    });

    setBookings(updated);
    localStorage.setItem('nexora_bookings', JSON.stringify(updated));
    onBookingStateChange(); // Notify parent state triggers
  };

  const handleDeleteBooking = (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this reservation record?')) {
      const updated = bookings.filter((b) => b.id !== id);
      setBookings(updated);
      localStorage.setItem('nexora_bookings', JSON.stringify(updated));
      if (selectedBooking?.id === id) {
        const remaining = updated.filter(b => b.shopId === activeShopId);
        setSelectedBooking(remaining.length > 0 ? remaining[0] : null);
      }
      onBookingStateChange();
    }
  };

  // Staff Management updates
  const toggleStaffAvailability = (staffId: string) => {
    const updated = staff.map(s => {
      if (s.id === staffId) {
        return { ...s, isAvailable: !s.isAvailable };
      }
      return s;
    });
    setStaff(updated);
    localStorage.setItem('nexora_staff', JSON.stringify(updated));
  };

  const handleRegisterStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName) return;

    const newMember: StaffMember = {
      id: `st-${Math.floor(100 + Math.random() * 900)}`,
      shopId: activeShopId,
      name: newStaffName,
      role: newStaffRole,
      specialty: newStaffSpecialty || "Universal Precision Artistry",
      rating: 5.0,
      isAvailable: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
    };

    const updated = [...staff, newMember];
    setStaff(updated);
    localStorage.setItem('nexora_staff', JSON.stringify(updated));

    // Clear form
    setNewStaffName('');
    setNewStaffSpecialty('');
    setShowAddStaffModal(false);
  };

  // Withdraw Request triggers
  const handleInitiateWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(withdrawAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert("Please enter a valid transfer amount.");
      return;
    }
    if (amountVal > activeShop.balance) {
      alert("Insufficient escrow balances inside shop account.");
      return;
    }
    if (!withdrawDest) {
      alert("Please enter destination accounts credentials.");
      return;
    }

    onAddWithdrawRequest(amountVal, withdrawDest);
    setWithdrawSuccess(`Your request to withdraw $${amountVal} to "${withdrawDest}" has been transmitted to platform admin queue!`);
    setWithdrawAmount('');
    setWithdrawDest('');
    
    setTimeout(() => {
      setWithdrawSuccess('');
    }, 6000);
  };

  // simulated AI WhatsApp campaign engine
  const handleRunCampaign = () => {
    // Count eligible inactive customers
    const inactiveCustomers = shopCustomers.filter(c => c.status === 'Inactive');
    if (inactiveCustomers.length === 0) {
      alert("There are currently no inactive customers matching your threshold. All client retention is in standard holding pattern.");
      return;
    }

    setCampaignRunning(true);
    setCampaignCompleted(false);
    setCampaignLogs([]);
    setCampaignProgress(0);
    setRecoveredCount(0);

    const logs: string[] = [];
    const addLog = (msg: string) => {
      logs.push(msg);
      setCampaignLogs([...logs]);
    };

    addLog(`INITIALIZED RETENTION ENGINE for ${activeShop.name}...`);
    addLog(`Analyzing customer database matching [Visits > 45 days ago]...`);
    addLog(`Target identified: Found ${inactiveCustomers.length} inactive digital touchpoints.`);

    let progress = 10;
    setCampaignProgress(progress);

    // Run interval-based telemetry logging
    let index = 0;
    const interval = setInterval(() => {
      if (index < inactiveCustomers.length) {
        const client = inactiveCustomers[index];
        progress += Math.floor(70 / inactiveCustomers.length);
        setCampaignProgress(progress);
        
        addLog(`[Gateway] Composing custom gold-bracket coupons for "${client.name}"...`);
        addLog(`[WhatsApp Server] Despatching campaign broadcast to ${client.phone}...`);
        addLog(`Sent successfully ✔ "${campaignMessage.replace('activeShop.name', activeShop.name)}"`);

        index++;
      } else {
        clearInterval(interval);
        
        // Finish up and mark status as reclaimed
        setCampaignProgress(100);
        addLog(`Platform broadcast completed successfully. Evaluating reclaim triggers...`);
        
        // Mark inactive customers as "Reclaimed", add to campaignCount
        const upgradedCustomers = customers.map(c => {
          if (c.shopId === activeShopId && c.status === 'Inactive') {
            return {
              ...c,
              status: 'Reclaimed' as const,
              campaignCount: c.campaignCount + 1,
              totalSpend: c.totalSpend + 150 // Assume they booked a mock service!
            };
          }
          return c;
        });

        setCustomers(upgradedCustomers);
        localStorage.setItem('nexora_customers', JSON.stringify(upgradedCustomers));

        // Inject a simulated booking inside our ledger to show immediate ROI!
        const reclaimedGuest = inactiveCustomers[0];
        const newSimulatedBooking: Booking = {
          id: `NEX-${Math.floor(1000 + Math.random() * 9000)}`,
          shopId: activeShopId,
          serviceId: 'haircut',
          serviceName: 'Royal Sculpt & Style (RECLAIMED)',
          price: 180,
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
          timeSlot: '03:00 PM',
          customerName: reclaimedGuest.name,
          customerEmail: reclaimedGuest.email,
          customerPhone: reclaimedGuest.phone,
          notes: 'Auto-scheduled through simulated AI coupon activation campaign ROI tracker.',
          status: 'Confirmed',
          createdAt: new Date().toISOString()
        };

        const currentBookingsList = JSON.parse(localStorage.getItem('nexora_bookings') || '[]');
        const updatedBookings = [...currentBookingsList, newSimulatedBooking];
        setBookings(updatedBookings);
        localStorage.setItem('nexora_bookings', JSON.stringify(updatedBookings));

        // Add to balance immediately!
        onUpdateShopBalance(activeShopId, 180);

        addLog(`SUCCESS! Simulated AI campaign triggered a mock booking for ${reclaimedGuest.name} worth $180!`);
        addLog(`Earned valuation synced successfully into Virtual Ledger.`);
        
        setRecoveredCount(inactiveCustomers.length);
        setCampaignRunning(false);
        setCampaignCompleted(true);
        onBookingStateChange(); // Notify parent
      }
    }, 1500);

  };

  // Statistics specific to CURRENT shop
  const stats = React.useMemo(() => {
    const total = shopBookings.length;
    const pending = shopBookings.filter((b) => b.status === 'Pending').length;
    const confirmed = shopBookings.filter((b) => b.status === 'Confirmed').length;
    const estimatedRev = shopBookings
      .filter((b) => b.status === 'Confirmed' || b.status === 'Completed')
      .reduce((sum, b) => sum + b.price, 0);

    return {
      totalBookings: total,
      pendingBookings: pending,
      confirmedBookings: confirmed,
      estimatedRevenue: estimatedRev
    };
  }, [shopBookings]);

  // Bookings filter logic
  const processedBookings = React.useMemo(() => {
    return shopBookings
      .filter((b) => {
        const matchSearch = 
          b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.serviceName.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchStatus = statusFilter === 'All' || b.status === statusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        let fieldA: any = a[sortBy];
        let fieldB: any = b[sortBy];

        if (sortBy === 'createdAt') {
          fieldA = new Date(a.createdAt).getTime();
          fieldB = new Date(b.createdAt).getTime();
        } else if (sortBy === 'date') {
          fieldA = new Date(a.date).getTime();
          fieldB = new Date(b.date).getTime();
        }

        if (fieldA < fieldB) return sortOrder === 'asc' ? -1 : 1;
        if (fieldA > fieldB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [shopBookings, searchQuery, statusFilter, sortBy, sortOrder]);

  const toggleSort = (field: 'date' | 'price' | 'createdAt') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div id="owner-dashboard-container" className="min-h-screen py-24 px-4 sm:px-6 relative z-10 text-gray-200">
      <div className="max-w-7xl mx-auto">
        
        {/* UPPER TITLE BAR FOR SHOP SPECIFIC */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d4af37] animate-pulse" />
              <span className="text-xs font-mono tracking-[0.43em] text-[#d4af37] uppercase block">
                White-Label Client Panel
              </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-sans tracking-tight text-white uppercase font-light">
              {activeShop.name} &bull; <span className="text-[#d4af37] font-semibold italic">Dash</span>
            </h1>
            
            <p className="mt-2 text-xs md:text-sm text-gray-400 font-sans font-light max-w-xl">
              Configured domain mapping: <span className="text-[#d4af37] font-mono">{activeShop.subdomain}</span>. Manage schedules, configure staff profiles, design custom WhatsApp customer campaigns, and withdraw escrow funds.
            </p>
          </div>

          <button
            onClick={onExit}
            className="flex items-center gap-2 px-5 py-3 bg-[#0a0a0a] hover:bg-[#d4af37] hover:text-black border border-[#d4af37]/30 text-[#d4af37] text-xs font-mono tracking-widest uppercase rounded-sm transition-all shadow-md cursor-pointer active:scale-95 self-start"
          >
            <LogOut className="w-3.5 h-3.5" /> Return To B2B Homepage
          </button>
        </div>

        {/* 1. STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
          
          <div className="bg-[#0b0b0b] border border-white/5 rounded p-5 relative overflow-hidden">
            <span className="text-gray-500 font-mono text-[9px] uppercase tracking-widest block">Bookings Received</span>
            <span className="text-2xl sm:text-4xl font-mono text-white font-semibold mt-2 block">{stats.totalBookings}</span>
            <span className="text-[10px] text-gray-400 font-sans block mt-1.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-[#d4af37]" /> Active client requests
            </span>
            <div className="absolute top-2 right-2 opacity-5"><Layers className="w-12 h-12 text-[#d4af37]" /></div>
          </div>

          <div className="bg-[#0b0b0b] border border-white/5 rounded p-5 relative overflow-hidden">
            <span className="text-gray-500 font-mono text-[9px] uppercase tracking-widest block">Pending Review</span>
            <span className="text-2xl sm:text-4xl font-mono text-amber-400 font-semibold mt-2 block">{stats.pendingBookings}</span>
            <span className="text-[10px] text-amber-500/80 font-sans block mt-1.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" /> Actions required
            </span>
            <div className="absolute top-2 right-2 opacity-5"><Clock className="w-12 h-12 text-amber-500" /></div>
          </div>

          <div className="bg-[#0b0b0b] border border-[#d4af37]/20 rounded p-5 relative overflow-hidden shadow-md shadow-[#d4af37]/2">
            <span className="text-gray-400 font-mono text-[9px] uppercase tracking-widest block">Virtual Balance Hold</span>
            <span className="text-2xl sm:text-4xl font-mono text-[#d4af37] font-bold mt-2 block">${activeShop.balance}</span>
            <span className="text-[10px] text-[#d4af37]/80 font-sans block mt-1.5 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-[#d4af37]" /> Available for withdrawal
            </span>
            <div className="absolute top-2 right-2 opacity-10"><DollarSign className="w-12 h-12 text-[#d4af37]" /></div>
          </div>

          <div className="bg-[#0b0b0b] border border-white/5 rounded p-5 relative overflow-hidden">
            <span className="text-gray-500 font-mono text-[9px] uppercase tracking-widest block">Est. Est Gross Valuation</span>
            <span className="text-2xl sm:text-4xl font-mono text-emerald-400 font-bold mt-2 block">${stats.estimatedRevenue}</span>
            <span className="text-[10px] text-gray-400 font-sans block mt-1.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Confirmed + Completed
            </span>
          </div>

        </div>

        {/* 2. INNER CONTROLS SUBTABS */}
        <div className="flex items-center gap-1 bg-[#0b0b0b] border border-white/5 p-1 rounded-sm mb-8 overflow-x-auto">
          <button
            onClick={() => setOwnerTab('bookings')}
            className={`px-5 py-3 rounded-sm font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
              ownerTab === 'bookings' ? 'bg-[#d4af37] text-black font-semibold' : 'text-gray-400 hover:text-white'
            }`}
          >
            Bookings Ledger
          </button>
          
          <button
            onClick={() => setOwnerTab('staff')}
            className={`px-5 py-3 rounded-sm font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
              ownerTab === 'staff' ? 'bg-[#d4af37] text-black font-semibold' : 'text-gray-400 hover:text-white'
            }`}
          >
            Staff Directory & Sched ({shopStaff.length})
          </button>
          
          <button
            onClick={() => setOwnerTab('customers')}
            className={`px-5 py-3 rounded-sm font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
              ownerTab === 'customers' ? 'bg-[#d4af37] text-black font-semibold' : 'text-gray-400 hover:text-white'
            }`}
          >
            Customer Database ({shopCustomers.length})
          </button>
          
          <button
            onClick={() => setOwnerTab('campaigns')}
            className={`px-5 py-3 rounded-sm font-mono text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              ownerTab === 'campaigns' ? 'bg-[#d4af37] text-black font-semibold' : 'text-gray-400 hover:text-[#d4af37]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> AI WhatsApp Campaigns
          </button>

          <button
            onClick={() => setOwnerTab('wallet')}
            className={`px-5 py-3 rounded-sm font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
              ownerTab === 'wallet' ? 'bg-[#d4af37] text-black font-semibold' : 'text-gray-400 hover:text-white'
            }`}
          >
            Wallet Escrows
          </button>
        </div>

        {/* 3. SUBTAB BODY RENDERER */}
        <div>

          {/* TAB 1: BOOKINGS CONCIERGE (Original Gorgeous Table view with Filter + Details panel) */}
          {ownerTab === 'bookings' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Ledger Table Area */}
              <div className="lg:col-span-2 bg-[#0b0b0b] border border-white/5 rounded p-6 shadow-2xl">
                
                {/* Search / Filters header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search guest, treatment, ref ID..."
                      className="w-full bg-[#111] border border-white/5 rounded-sm pl-9 pr-4 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37] transition-all font-mono"
                    />
                  </div>

                  {/* Filter tabs */}
                  <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                    {['All', 'Pending', 'Confirmed', 'Completed', 'Rejected'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-sm font-mono text-[9px] uppercase tracking-wider transition-all cursor-pointer ${
                          statusFilter === status ? 'bg-[#d4af37] text-black font-semibold' : 'bg-[#141414] text-gray-400 hover:text-white'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sorters log */}
                <div className="flex items-center gap-4 mb-4 text-[10px] font-mono uppercase tracking-widest text-gray-500">
                  <span>Sort Grid:</span>
                  <button onClick={() => toggleSort('createdAt')} className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-[#d4af37]">
                    Request Date <ArrowDownUp className="w-2.5 h-2.5" />
                  </button>
                  <button onClick={() => toggleSort('date')} className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
                    Treatment Schedule <ArrowDownUp className="w-2.5 h-2.5" />
                  </button>
                  <button onClick={() => toggleSort('price')} className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
                    Price <ArrowDownUp className="w-2.5 h-2.5" />
                  </button>
                </div>

                {/* Grid table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-[9px] font-mono uppercase text-gray-500">
                        <th className="py-2.5 px-2">REF ID</th>
                        <th className="py-2.5 px-2">GUEST</th>
                        <th className="py-2.5 px-2">EXPERIENCE</th>
                        <th className="py-2.5 px-2">SCHEDULE</th>
                        <th className="py-2.5 px-2">RATE</th>
                        <th className="py-2.5 px-2">STATUS</th>
                        <th className="py-2.5 px-2 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {processedBookings.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-12 font-mono text-gray-500">
                            No booking rows found. Clients can book instantly via subdomain portals.
                          </td>
                        </tr>
                      ) : (
                        processedBookings.map((b) => (
                          <tr
                            key={b.id}
                            onClick={() => setSelectedBooking(b)}
                            className={`hover:bg-white/1 cursor-pointer transition-colors ${selectedBooking?.id === b.id ? 'bg-[#181610]' : ''}`}
                          >
                            <td className="py-3 px-2 font-mono text-[#d4af37] font-semibold">{b.id}</td>
                            <td className="py-3 px-2">
                              <strong className="text-white block font-medium font-sans">{b.customerName}</strong>
                              <span className="text-[9px] text-gray-500 font-mono italic block">{b.customerEmail}</span>
                            </td>
                            <td className="py-3 px-2 text-gray-300">{b.serviceName}</td>
                            <td className="py-3 px-2 font-mono">
                              <div>{b.date}</div>
                              <div className="text-[10px] text-gray-500">{b.timeSlot}</div>
                            </td>
                            <td className="py-3 px-2 font-mono text-[#d4af37] font-bold">${b.price}</td>
                            <td className="py-3 px-2">
                              <span className={`inline-block px-2 py-0.5 rounded-[2px] font-mono text-[9px] uppercase border ${
                                b.status === 'Pending' ? 'bg-amber-400/5 text-amber-400 border-amber-400/20' : 
                                b.status === 'Confirmed' ? 'bg-emerald-400/5 text-emerald-400 border-emerald-400/20' : 
                                b.status === 'Completed' ? 'bg-sky-400/5 text-sky-400 border-sky-450/20' : 'bg-red-400/5 text-red-300 border-red-500/25'
                              }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => handleDeleteBooking(b.id)}
                                className="p-1 px-1.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 rounded-sm cursor-pointer border border-red-900/20"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Right Side selected details companion */}
              <div>
                <div className="bg-[#0b0b0b] border border-[#d4af37]/20 rounded p-6 shadow-2xl relative overflow-hidden">
                  
                  <div className="pb-3 border-b border-white/5 mb-6 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-mono text-[#d4af37] block">ESCROW LEDGER</span>
                      <h4 className="text-sm font-sans font-medium text-white uppercase mt-0.5">Reservation detail</h4>
                    </div>
                    <span className="text-2.5 h-2.5 rounded-full bg-[#d4af37] animate-pulse" />
                  </div>

                  {selectedBooking ? (
                    <div className="space-y-5 text-xs">
                      <div className="flex justify-between items-center bg-[#111] p-3 rounded font-mono">
                        <div>
                          <span className="text-gray-500 block text-[9px]">REF ID</span>
                          <span className="text-white font-semibold">{selectedBooking.id}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-500 block text-[9px]">TREATMENT TARIFF</span>
                          <span className="text-[#d4af37] font-semibold">${selectedBooking.price}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-500 font-mono text-[9px] uppercase tracking-wider block mb-1">Guest details</span>
                        <strong className="text-white text-sm block font-sans">{selectedBooking.customerName}</strong>
                        <span className="text-gray-400 font-mono block mt-0.5">{selectedBooking.customerPhone} &bull; {selectedBooking.customerEmail}</span>
                      </div>

                      <div className="p-3 bg-zinc-950 border border-white/5 rounded space-y-1">
                        <div className="flex justify-between text-gray-450"><span className="text-gray-500">Date Logged:</span> <span className="text-white font-mono">{selectedBooking.date}</span></div>
                        <div className="flex justify-between text-gray-450"><span className="text-gray-500">Hour Slated:</span> <span className="text-white font-mono">{selectedBooking.timeSlot}</span></div>
                        <div className="flex justify-between text-gray-450"><span className="text-gray-500">Therapy:</span> <span className="text-[#d4af37] font-sans font-medium">{selectedBooking.serviceName}</span></div>
                      </div>

                      <div>
                        <span className="text-gray-400 font-mono text-[9px] uppercase tracking-wider block mb-1">Directives and alerts</span>
                        <div className="p-3 bg-zinc-950 rounded italic text-gray-400 text-[11px] leading-relaxed">
                          "{selectedBooking.notes || 'No customized preferences mapped for this booking.'}"
                        </div>
                      </div>

                      {/* Controls rows based on status */}
                      <div className="pt-4 border-t border-white/5 space-y-2">
                        <span className="text-gray-500 font-mono text-[9px] uppercase tracking-wider block mb-2">Concierge commands</span>
                        {selectedBooking.status === 'Pending' && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleUpdateStatus(selectedBooking.id, 'Confirmed')}
                              className="py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-mono uppercase tracking-widest rounded border border-emerald-500/20 cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(selectedBooking.id, 'Rejected')}
                              className="py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-mono uppercase tracking-widest rounded border border-red-500/20 cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        )}

                        {selectedBooking.status === 'Confirmed' && (
                          <button
                            onClick={() => handleUpdateStatus(selectedBooking.id, 'Completed')}
                            className="bg-[#d4af37] hover:bg-yellow-500 text-black py-2.5 w-full text-[10px] font-mono tracking-widest font-bold uppercase rounded cursor-pointer"
                          >
                            Mark Treatment Complete
                          </button>
                        )}

                        {selectedBooking.status === 'Completed' && (
                          <div className="text-center p-3 bg-zinc-950 border border-white/5 rounded text-emerald-400 font-mono uppercase text-[9px] flex items-center justify-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Bookings completed & cleared
                          </div>
                        )}

                        {selectedBooking.status === 'Rejected' && (
                          <div className="text-center p-3 bg-zinc-950 border border-white/5 rounded text-red-400 font-mono uppercase text-[9px]">
                            Rejected guest reservations
                          </div>
                        )}
                      </div>

                    </div>
                  ) : (
                    <div className="py-12 text-center text-gray-500 font-mono text-xs">
                      Choose an active reservation row in the concierge table to audit credentials.
                    </div>
                  )}

                </div>
              </div>

            </div>
          )}

          {/* TAB 2: STAFF MEMBERS DIRECTORY */}
          {ownerTab === 'staff' && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <h3 className="text-base font-sans font-medium text-white uppercase tracking-wider">
                  Associated Stylists Guild ({shopStaff.length})
                </h3>
                <button
                  onClick={() => setShowAddStaffModal(true)}
                  className="flex items-center gap-1 px-4 py-2 bg-[#d4af37] hover:bg-yellow-500 text-black text-[10px] font-mono uppercase tracking-widest font-bold rounded cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Onboard Artisan
                </button>
              </div>

              {/* Staff Cards Grids */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {shopStaff.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-gray-500 font-mono text-xs border border-white/5 bg-[#0b0b0b] rounded">
                    No active staff assigned to this shop. Onboard artisans to allocate reservations.
                  </div>
                ) : (
                  shopStaff.map((st) => (
                    <div key={st.id} className="p-6 bg-[#0b0b0b] border border-white/5 rounded relative flex gap-4">
                      
                      {/* Avatar */}
                      <img 
                        src={st.avatar} 
                        alt={st.name} 
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-full object-cover border border-white/10"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-base font-sans text-white font-medium block truncate">{st.name}</strong>
                          <span className="text-[10px] text-[#d4af37] font-mono flex items-center gap-0.5">
                            ★ {st.rating}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono block uppercase mt-0.5">{st.role}</span>
                        <div className="bg-[#111] py-1.5 px-2 rounded mt-2.5 text-[10px] font-mono border border-white/2 truncate">
                          <span className="text-[#d4af37]">Signature:</span> {st.specialty}
                        </div>

                        {/* Staff profile & Schedule status */}
                        <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-gray-500 uppercase text-[9px]">Schedules Allocation</span>
                            <button
                              onClick={() => toggleStaffAvailability(st.id)}
                              className={`px-2 py-1 rounded text-[9px] uppercase tracking-wide border cursor-pointer ${
                                st.isAvailable 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                  : 'bg-zinc-950 text-gray-500 border-zinc-800'
                              }`}
                            >
                              {st.isAvailable ? 'Allocating Slots' : 'Schedules Blocked'}
                            </button>
                          </div>

                          {onViewStaffProfile && (
                            <button
                              onClick={() => onViewStaffProfile(st)}
                              id={`owner-view-staff-profile-${st.id}`}
                              className="w-full py-1.5 bg-[#d4af37]/10 hover:bg-[#d4af37] text-[#d4af37] hover:text-black border border-[#d4af37]/30 text-[9px] font-mono uppercase tracking-widest font-semibold rounded transition-colors cursor-pointer text-center"
                            >
                              View Profile & Work Gallery
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>

              {/* Modal add staff */}
              {showAddStaffModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                  <div className="bg-[#0b0b0b] border border-[#d4af37]/30 rounded p-6 max-w-md w-full relative">
                    <h4 className="text-lg font-sans font-light text-white uppercase mb-4">Onboard master artisan</h4>
                    <form onSubmit={handleRegisterStaff} className="space-y-4">
                      <div>
                        <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1">Full Legal Name</label>
                        <input 
                          type="text" 
                          required
                          value={newStaffName}
                          onChange={(e) => setNewStaffName(e.target.value)}
                          placeholder="e.g., Madame Christine"
                          className="w-full bg-[#111] border border-white/5 rounded px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1">Title Role</label>
                        <select
                          value={newStaffRole}
                          onChange={(e) => setNewStaffRole(e.target.value)}
                          className="w-full bg-[#111] border border-white/5 rounded p-2 text-xs text-white focus:outline-none"
                        >
                          <option value="Senior Stylist">Senior Stylist</option>
                          <option value="Color Specialist">Color Specialist</option>
                          <option value="Master of Shaves">Master of Shaves</option>
                          <option value="Wellness Therapist">Wellness Therapist</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1">Artisan specialty</label>
                        <input 
                          type="text" 
                          value={newStaffSpecialty}
                          onChange={(e) => setNewStaffSpecialty(e.target.value)}
                          placeholder="e.g., Auric Gold Blend"
                          className="w-full bg-[#111] border border-white/5 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <button type="submit" className="w-full py-2.5 bg-[#d4af37] text-black text-[10px] font-mono font-bold uppercase rounded cursor-pointer">
                          Add Member
                        </button>
                        <button type="button" onClick={() => setShowAddStaffModal(false)} className="px-4 py-2.5 bg-[#111] border border-white/5 text-gray-400 text-[10px] font-mono uppercase rounded cursor-pointer">
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: CUSTOMER DATABASE */}
          {ownerTab === 'customers' && (
            <div className="bg-[#0b0b0b] border border-white/5 p-6 rounded">
              <div className="pb-4 border-b border-white/5 mb-6">
                <h3 className="text-base font-sans font-medium text-white uppercase tracking-wider">
                  Sovereign Client Database ({shopCustomers.length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] font-mono uppercase text-gray-400">
                      <th className="pb-3 px-2">GUEST ACCOUNT</th>
                      <th className="pb-3 px-2">CONTACTS</th>
                      <th className="pb-3 px-2">LAST SCHED LOG</th>
                      <th className="pb-3 px-2">LIFE-TIME VALUATION</th>
                      <th className="pb-3 px-2">LOYALTY REWARDS</th>
                      <th className="pb-3 px-2">AI TELEMETRY</th>
                      <th className="pb-3 px-2">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {shopCustomers.map((c) => (
                      <tr key={c.id} className="hover:bg-white/1">
                        <td className="py-3 px-2 font-medium text-white text-sm font-sans">{c.name}</td>
                        <td className="py-3 px-2 font-mono text-[11px] text-gray-400">
                          <div>{c.phone}</div>
                          <div className="text-[10px] text-gray-500">{c.email}</div>
                        </td>
                        <td className="py-3 px-2 font-mono text-gray-300">{c.lastBookingDate}</td>
                        <td className="py-3 px-2 font-mono text-[#d4af37] font-semibold">${c.totalSpend}</td>
                        <td className="py-3 px-2 font-mono text-[11px]">
                          <div className="text-[#d4af37] font-semibold flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-[#d4af37]" />
                            <span>{(c.loyaltyPoints || Math.round(c.totalSpend * 10)).toLocaleString()} pts</span>
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {c.totalSpend >= 500 ? 'Diamond VIP' : c.totalSpend >= 250 ? 'Platinum' : c.totalSpend >= 100 ? 'Gold' : 'Silver'}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-gray-550 font-mono text-[10px]">
                          {c.campaignCount === 0 ? 'No Campaigns Sent' : `${c.campaignCount} Reclaim attempts`}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-block px-2 py-0.5 rounded-[2px] font-mono text-[9px] uppercase border ${
                            c.status === 'Active' ? 'bg-emerald-400/5 text-emerald-400 border-emerald-400/20' :
                            c.status === 'Reclaimed' ? 'bg-[#d4af37]/5 text-[#d4af37] border-[#d4af37]/20 font-bold' :
                            'bg-red-550/5 text-red-400 border-red-500/20'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 4: AI WHATSAPP RECOVERY CAMPAIGN SUITE */}
          {ownerTab === 'campaigns' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Campaign Composer */}
              <div className="lg:col-span-1 bg-[#0b0b0b] border border-white/5 p-6 rounded space-y-6">
                <div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#d4af37]/10 text-[#d4af37] text-[9px] font-mono uppercase tracking-widest mb-2">
                    <Sparkles className="w-3" /> WhatsApp Reclaim Gateway
                  </span>
                  <h3 className="text-base font-sans font-medium text-white uppercase tracking-wider">
                    Targeted customer reclamation
                  </h3>
                  <p className="text-[11px] text-gray-400 font-sans mt-1 leading-relaxed">
                    Automatically filter customers who have not visited in over 45 days. Fire targeted WhatsApp automated coupons containing seasonal reservation codes.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1">Inactive Threshold</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setInactiveDaysThreshold(60)}
                        className={`w-full py-2 rounded text-[10px] font-mono uppercase border cursor-pointer transition-all ${
                          inactiveDaysThreshold === 60 ? 'bg-[#d4af37] text-black font-semibold border-[#d4af37]' : 'bg-[#111] text-gray-400 border-white/5'
                        }`}
                      >
                        Lapsed &gt; 60 Days
                      </button>
                      <button 
                        onClick={() => setInactiveDaysThreshold(90)}
                        className={`w-full py-2 rounded text-[10px] font-mono uppercase border cursor-pointer transition-all ${
                          inactiveDaysThreshold === 90 ? 'bg-[#d4af37] text-black font-semibold border-[#d4af37]' : 'bg-[#111] text-gray-400 border-white/5'
                        }`}
                      >
                        Severe &gt; 90 Days
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1">Target Count</label>
                    <div className="p-3 bg-zinc-950 rounded border border-white/5 flex items-center justify-between text-xs">
                      <strong className="text-white">Eligible Inactive Customers:</strong>
                      <span className="font-mono font-bold text-red-400">{shopCustomers.filter(c => c.status === 'Inactive').length} clients</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1">Campaign SMS Content</label>
                    <textarea
                      value={campaignMessage}
                      onChange={(e) => setCampaignMessage(e.target.value)}
                      rows={4}
                      className="w-full bg-[#111] border border-white/5 rounded p-3 text-xs text-gray-300 focus:outline-none focus:border-[#d4af37] leading-relaxed"
                    />
                  </div>

                  <button
                    onClick={handleRunCampaign}
                    disabled={campaignRunning}
                    className="w-full py-3 bg-[#d4af37] disabled:bg-zinc-800 disabled:text-gray-500 text-black text-[10px] font-mono font-bold tracking-widest uppercase rounded cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" /> Execute Campaign Broadcast
                  </button>
                </div>
              </div>

              {/* Log stream viewport */}
              <div className="lg:col-span-2 bg-[#0b0b0b] border border-white/5 p-6 rounded flex flex-col justify-between min-h-[480px]">
                
                <div>
                  <div className="pb-3 border-b border-white/5 mb-4 flex justify-between items-center bg-[#0b0b0b]">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Gateway Stream logs</span>
                    {campaignRunning && <span className="text-[9px] font-mono text-amber-500 animate-pulse">TRANSMITTING...</span>}
                  </div>

                  {campaignLogs.length === 0 ? (
                    <div className="py-24 text-center text-gray-600 font-mono text-xs max-w-sm mx-auto">
                      Composition stream is silent. Design campaign templates and click execute to trigger simulated WhatsApp API packet despatch.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[340px] overflow-y-auto font-mono text-xs text-gray-400 bg-black/40 p-4 rounded border border-white/2">
                      {campaignLogs.map((log, lidx) => (
                        <div key={lidx} className="flex gap-2">
                          <span className="text-gray-600 select-none">&gt;&gt;</span>
                          <span className={`${log.startsWith('SUCCESS') || log.includes('Success') ? 'text-[#d4af37] font-semibold' : ''}`}>{log}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Progress bar layout */}
                {(campaignRunning || campaignCompleted) && (
                  <div className="pt-6 border-t border-white/5 mt-4">
                    <div className="flex justify-between font-mono text-[10px] text-gray-400 mb-2">
                      <span>Gateway Transmission Progress</span>
                      <span>{campaignProgress}%</span>
                    </div>

                    <div className="h-2.5 w-full bg-zinc-950 rounded overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[#d4af37]/30 to-[#d4af37] h-full transition-all duration-300"
                        style={{ width: `${campaignProgress}%` }}
                      />
                    </div>

                    {campaignCompleted && (
                      <div className="mt-4 p-4 bg-[#d4af37]/10 border border-[#d4af37]/45 rounded flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-[#d4af37] shrink-0" />
                        <div className="text-xs font-sans text-gray-300">
                          <h5 className="font-bold text-white uppercase">Marketing ROI cleared successfully!</h5>
                          <p className="mt-1 font-light leading-relaxed">
                            Simulated AI tracking suggests {recoveredCount} clients have successfully been reclaimed for {activeShop.name}. A mock slot booking reservation for $180 has automatically been ledgered to tomorrow's schedule to simulate high customer recovery!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>

            </div>
          )}

          {/* TAB 5: VUAL WALLET ESCROWS & TRANSACTION HISTORY */}
          {ownerTab === 'wallet' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Withdraw module */}
              <div className="bg-[#0b0b0b] border border-white/5 p-6 rounded space-y-6">
                <div>
                  <h3 className="text-base font-sans font-medium text-white uppercase tracking-wider">
                    Initiate Virtuous Escrow withdrawals
                  </h3>
                  <p className="text-[11px] text-gray-450 font-sans mt-1 leading-relaxed">
                    Accumulate hair/barber treatments deposit cash. Enter destination credentials and amount to clear balance targets instantly.
                  </p>
                </div>

                {withdrawSuccess && (
                  <div className="p-4 bg-[#d4af37]/10 border border-[#d4af37]/40 rounded text-xs text-[#d4af37]">
                    {withdrawSuccess}
                  </div>
                )}

                <form onSubmit={handleInitiateWithdrawal} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1">Available Hold</label>
                    <div className="p-3 bg-[#111] rounded border border-white/5 font-mono text-base font-bold text-[#d4af37]">
                      ${activeShop.balance} Gross USD
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1">Withdraw amount (USD)</label>
                    <input 
                      type="number"
                      required
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="e.g., 1000"
                      className="w-full bg-[#111] border border-white/5 rounded p-3 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1">Destination bank or UPI account</label>
                    <input 
                      type="text"
                      required
                      value={withdrawDest}
                      onChange={(e) => setWithdrawDest(e.target.value)}
                      placeholder="e.g., Chase Business *9412 or UPI: eleonore@ybl"
                      className="w-full bg-[#111] border border-white/5 rounded p-3 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <button type="submit" className="w-full py-3 bg-[#d4af37] hover:bg-yellow-500 text-black text-[10px] font-mono font-bold tracking-widest uppercase rounded cursor-pointer transition-all">
                    Transmit Withdraw Request
                  </button>
                </form>
              </div>

              {/* Transactions Specific */}
              <div className="bg-[#0b0b0b] border border-white/5 p-6 rounded space-y-4">
                <h3 className="text-base font-sans font-medium text-white uppercase tracking-wider pb-2 border-b border-white/5">
                  Shop Cash audit trails
                </h3>

                <div className="space-y-3 max-h-[360px] overflow-y-auto font-mono text-xs">
                  {/* Filter transactions of shop */}
                  {localStorage.getItem('nexora_transactions') && JSON.parse(localStorage.getItem('nexora_transactions') || '[]')
                    .filter((t: Transaction) => t.shopId === activeShopId)
                    .map((t: Transaction) => (
                      <div key={t.id} className="p-3 bg-zinc-950 border border-white/1 rounded flex items-center justify-between">
                        <div>
                          <span className="text-[#d4af37] block font-semibold">{t.id}</span>
                          <span className="text-[10px] text-gray-500">{t.type} &bull; {new Date(t.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-white font-bold">${t.amount}</span>
                          <span className="text-gray-500 text-[10px] block uppercase">{t.status}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
