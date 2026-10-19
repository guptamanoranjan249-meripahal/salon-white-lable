import React, { useState } from 'react';
import { Shop, WithdrawRequest, Transaction, Booking, CustomerData } from '../types';
import { 
  Building2, Users, CalendarCheck, Coins, TrendingUp, Sparkles, Check, X,
  AlertOctagon, Clock, Trash2, ArrowUpRight, Search, BarChart3, Receipt,
  Wallet, PieChart, ShieldCheck, CornerDownRight, Filter, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SuperAdminPanelProps {
  shops: Shop[];
  withdrawRequests: WithdrawRequest[];
  transactions: Transaction[];
  bookings: Booking[];
  customers: CustomerData[];
  onApproveShop: (shopId: string) => void;
  onSuspendShop: (shopId: string) => void;
  onActivateShop: (shopId: string) => void;
  onApproveWithdraw: (id: string) => void;
  onRejectWithdraw: (id: string) => void;
  onExitAdmin: () => void;
}

export default function SuperAdminPanel({
  shops,
  withdrawRequests,
  transactions,
  bookings,
  customers,
  onApproveShop,
  onSuspendShop,
  onActivateShop,
  onApproveWithdraw,
  onRejectWithdraw,
  onExitAdmin
}: SuperAdminPanelProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'shops' | 'wallets' | 'analytics'>('overview');
  
  // Drill-down selectors
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Calculate live platform-wide metrics
  const totalShopsCount = shops.length;
  const activeShopsCount = shops.filter(s => s.status === 'Active').length;
  
  // Customers count is the length of MOCK_CUSTOMERS (plus any additions)
  const totalCustomersCount = customers.length;
  const totalBookingsCount = bookings.length;
  
  // Total platform value (Sum of all shop balances + subscription fees collected)
  const totalRevenue = shops.reduce((sum, s) => sum + s.balance, 0) + 1240; 
  
  // Pending withdrawals amount sum
  const pendingWithdrawRequests = withdrawRequests.filter(wr => wr.status === 'Pending');
  const pendingWithdrawAmount = pendingWithdrawRequests.reduce((sum, wr) => sum + wr.amount, 0);

  // Shop selected for details
  const selectedShop = shops.find(s => s.id === selectedShopId) || null;

  return (
    <div id="super-admin-canvas" className="min-h-screen py-24 px-4 sm:px-6 relative z-10 text-gray-200">
      <div className="max-w-7xl mx-auto">
        
        {/* Upper Breadcrumb Master Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
              <span className="text-xs font-mono tracking-[0.43em] text-[#d4af37] uppercase block">
                Platform Kernel Control
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-sans tracking-tight text-white uppercase font-light">
              SUPER <span className="text-[#d4af37] font-semibold italic">ADMIN COURT</span>
            </h1>
            <p className="mt-2 text-xs md:text-sm text-gray-400 font-sans font-light">
              Enterprise supervisor interface. Regulate active tenants, monitor high-yield subscription deposits, and clear escrow transfers.
            </p>
          </div>
          
          <button
            onClick={onExitAdmin}
            className="flex items-center gap-2 px-5 py-3 bg-[#0a0a0a] hover:bg-[#d4af37] hover:text-black border border-[#d4af37]/30 text-[#d4af37] text-xs font-mono tracking-widest uppercase rounded-sm transition-all shadow-md cursor-pointer active:scale-95 self-start"
          >
            <LogOut className="w-3.5 h-3.5" /> Return To B2B Homepage
          </button>
        </div>

        {/* Level 1: Key Platform Metrics Rows */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          
          <div className="bg-[#090909] border border-white/5 rounded p-4 relative overflow-hidden">
            <span className="text-gray-500 font-mono text-[9px] uppercase tracking-widest block">Total Shops</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-mono text-white font-semibold">{totalShopsCount}</span>
              <span className="text-[10px] text-gray-400 font-sans">registered</span>
            </div>
            <div className="absolute top-2 right-2 opacity-5"><Building2 className="w-12 h-12 text-[#d4af37]" /></div>
          </div>

          <div className="bg-[#090909] border border-white/5 rounded p-4 relative overflow-hidden">
            <span className="text-gray-500 font-mono text-[9px] uppercase tracking-widest block">Active Tenants</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-mono text-emerald-400 font-semibold">{activeShopsCount}</span>
              <span className="text-[10px] text-gray-500 font-sans">approved</span>
            </div>
            <div className="absolute top-2 right-2 opacity-5"><ShieldCheck className="w-12 h-12 text-emerald-400" /></div>
          </div>

          <div className="bg-[#090909] border border-white/5 rounded p-4 relative overflow-hidden">
            <span className="text-gray-500 font-mono text-[9px] uppercase tracking-widest block">Logged Guests</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-mono text-white font-semibold">{totalCustomersCount}</span>
              <span className="text-[10px] text-gray-400 font-sans">customers</span>
            </div>
            <div className="absolute top-2 right-2 opacity-5"><Users className="w-12 h-12 text-[#d4af37]" /></div>
          </div>

          <div className="bg-[#090909] border border-white/5 rounded p-4 relative overflow-hidden">
            <span className="text-gray-500 font-mono text-[9px] uppercase tracking-widest block">Platform Bookings</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-mono text-[#d4af37] font-semibold">{totalBookingsCount}</span>
              <span className="text-[10px] text-gray-500 font-sans">slated</span>
            </div>
            <div className="absolute top-2 right-2 opacity-5"><CalendarCheck className="w-12 h-12 text-[#d4af37]" /></div>
          </div>

          <div className="bg-[#090909] border border-[#d4af37]/15 rounded p-4 relative overflow-hidden shadow-lg shadow-[#d4af37]/2">
            <span className="text-gray-400 font-mono text-[9px] uppercase tracking-widest block">Gross Escrow Value</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl sm:text-3xl font-mono text-[#d4af37] font-bold">${totalRevenue}</span>
            </div>
            <div className="absolute top-2 right-2 opacity-10"><Coins className="w-12 h-12 text-[#d4af37]" /></div>
          </div>

          <div className="bg-[#090909] border border-amber-500/10 rounded p-4 relative overflow-hidden">
            <span className="text-amber-500 font-mono text-[9px] uppercase tracking-widest block">Pending Withdrawals</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-mono text-amber-400 font-bold">${pendingWithdrawAmount}</span>
              <span className="text-[10px] text-amber-500/80 font-mono">({pendingWithdrawRequests.length})</span>
            </div>
            <div className="absolute top-2 right-2 opacity-5"><Wallet className="w-12 h-12 text-amber-400" /></div>
          </div>

        </div>

        {/* Level 2: Tabs selector bar */}
        <div className="flex items-center gap-1 bg-[#0b0b0b] border border-white/5 p-1 rounded-sm mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-5 py-3 rounded-sm font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'overview' ? 'bg-[#d4af37] text-black font-semibold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <PieChart className="w-4 h-4" /> Snapshot Overview
          </button>
          
          <button
            onClick={() => setActiveTab('shops')}
            className={`flex items-center gap-2 px-5 py-3 rounded-sm font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'shops' ? 'bg-[#d4af37] text-black font-semibold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" /> Shops Management
          </button>
          
          <button
            onClick={() => setActiveTab('wallets')}
            className={`flex items-center gap-2 px-5 py-3 rounded-sm font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'wallets' ? 'bg-[#d4af37] text-black font-semibold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Wallet className="w-4 h-4" /> Wallets & Escrows
          </button>
          
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-5 py-3 rounded-sm font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'analytics' ? 'bg-[#d4af37] text-black font-semibold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Growth Analytics
          </button>
        </div>

        {/* LEVEL 3: TAB CONTENT CANVAS */}
        <div>

          {/* TAB 1: SNAPSHOT OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Quick Actions and Alerts column */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Pending Shops Notification Alert bar */}
                {shops.filter(s => s.status === 'Pending').length > 0 && (
                  <div className="p-4 bg-amber-500/5 border border-amber-500/25 rounded-sm flex items-start gap-4">
                    <div className="p-2 bg-amber-500/10 text-amber-400 rounded">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white text-sm font-sans font-medium uppercase">Pending Shop Approval required</h4>
                      <p className="text-xs text-gray-400 font-sans mt-0.5 leading-relaxed">
                        There are new salon registration applications awaiting verification and activation code mapping.
                      </p>
                      <button 
                        onClick={() => setActiveTab('shops')}
                        className="mt-3 text-xs font-mono text-[#d4af37] uppercase tracking-widest hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Inspect Pending Shops <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Left: Pending Withdraw Approval Table */}
                <div className="bg-[#0b0b0b] border border-white/5 rounded p-6">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                    <h3 className="text-base font-sans font-medium text-white uppercase tracking-wider">
                      Pending Escrow Withdraw requests ({pendingWithdrawRequests.length})
                    </h3>
                    <span className="text-[10px] text-gray-500 font-mono uppercase">Escrow Queue</span>
                  </div>

                  {pendingWithdrawRequests.length === 0 ? (
                    <div className="py-10 text-center font-mono text-gray-500 text-xs">
                      All pending withdraw queries completed and cleared!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingWithdrawRequests.map((wr) => (
                        <div 
                          key={wr.id}
                          className="p-4 bg-zinc-900/50 rounded border border-white/5 flex items-center justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-white uppercase">{wr.shopName}</span>
                              <span className="text-[9px] font-mono text-[#d4af37] bg-[#d4af37]/5 px-2.5 py-0.5 rounded border border-[#d4af37]/20 uppercase">
                                {wr.id}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-500 font-mono block mt-1">Destination: {wr.destination}</span>
                          </div>

                          <div className="flex items-center gap-6">
                            <span className="text-base font-mono font-bold text-[#d4af37]">${wr.amount}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => onApproveWithdraw(wr.id)}
                                className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/25 transition-all cursor-pointer"
                                title="Approve Request"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onRejectWithdraw(wr.id)}
                                className="p-2 bg-red-400/5 hover:bg-red-400/20 text-red-400 rounded-full border border-red-400/20 transition-all cursor-pointer"
                                title="Reject Request"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sub-block: Recent transactions */}
                <div className="bg-[#0b0b0b] border border-white/5 rounded p-6">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                    <h3 className="text-base font-sans font-medium text-white uppercase tracking-wider">
                      Recent Platform activity log
                    </h3>
                    <button 
                      onClick={() => setActiveTab('wallets')}
                      className="text-[10px] font-mono text-[#d4af37] uppercase tracking-widest hover:underline"
                    >
                      Audit ledger
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans text-xs">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] font-mono uppercase text-gray-500">
                          <th className="pb-2">TXN ID</th>
                          <th className="pb-2">SALON</th>
                          <th className="pb-2">CLASSIFICATION</th>
                          <th className="pb-2">VALUE</th>
                          <th className="pb-2">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {transactions.slice(0, 4).map((tx) => (
                          <tr key={tx.id} className="hover:bg-white/2">
                            <td className="py-2.5 font-mono text-gray-400">{tx.id}</td>
                            <td className="py-2.5 text-white font-medium">{tx.shopName}</td>
                            <td className="py-2.5 font-mono text-[10px] uppercase text-gray-500">{tx.type}</td>
                            <td className="py-2.5 font-mono text-[#d4af37] font-semibold">${tx.amount}</td>
                            <td className="py-2.5">
                              <span className={`inline-block px-1.5 py-0.5 rounded-[2px] font-mono text-[9px] uppercase border ${
                                tx.status === 'Completed' ? 'bg-emerald-400/5 text-emerald-400 border-emerald-400/20' : 
                                tx.status === 'Pending' ? 'bg-amber-400/5 text-amber-400 border-amber-500/20' : 'bg-red-400/5 text-red-400 border-red-500/20'
                              }`}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Right panel: Static tenant summary directory */}
              <div className="space-y-6">
                <div className="p-6 bg-[#0b0b0b] border border-white/5 rounded relative overflow-hidden">
                  <h4 className="text-sm font-sans font-semibold text-white uppercase tracking-wider mb-4 pb-2 border-b border-white/5">
                    Tenant status board
                  </h4>
                  <div className="space-y-4">
                    {shops.map((s) => (
                      <div key={s.id} className="flex justify-between items-center text-xs">
                        <div>
                          <strong className="text-white font-sans">{s.name}</strong>
                          <span className="text-[10px] text-gray-500 font-mono block">{s.subdomain}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-[2px] font-mono text-[9px] border uppercase ${
                          s.status === 'Active' ? 'bg-emerald-400/5 text-emerald-400 border-emerald-400/20' :
                          s.status === 'Suspended' ? 'bg-red-400/5 text-red-300 border-red-400/20' : 'bg-amber-400/5 text-amber-500 border-amber-400/20'
                        }`}>
                          {s.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-[#0b0b0b] to-zinc-950 border border-[#d4af37]/20 rounded text-center">
                  <Sparkles className="w-8 h-8 text-[#d4af37] mx-auto mb-3" />
                  <h4 className="text-white text-sm font-serif font-light uppercase tracking-wider">Subdomain router online</h4>
                  <p className="mt-1 text-xs text-gray-400 leading-relaxed font-sans font-light">
                    Incoming request redirects are auto-mapped via header sniffing to isolated SaaS databases.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SHOPS MANAGEMENT */}
          {activeTab === 'shops' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Register Shops list table */}
              <div className="lg:col-span-2 bg-[#0b0b0b] border border-white/5 p-6 rounded">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
                  <h3 className="text-base font-sans font-medium text-white uppercase tracking-wider">
                    Registered franchise directory ({shops.length})
                  </h3>
                  
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Search shop, credentials..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-[#111] border border-white/5 rounded px-8 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37] w-52 font-mono"
                    />
                  </div>
                </div>

                <table className="w-full text-left font-sans text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] font-mono uppercase text-gray-400">
                      <th className="pb-3 px-2">TENANT</th>
                      <th className="pb-3 px-2">CATEGORY</th>
                      <th className="pb-3 px-2">EMAIL</th>
                      <th className="pb-3 px-2">STATUS</th>
                      <th className="pb-3 px-2 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {shops
                    .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((s) => (
                      <tr 
                        key={s.id} 
                        onClick={() => setSelectedShopId(s.id)}
                        className={`hover:bg-white/2 cursor-pointer ${selectedShopId === s.id ? 'bg-[#181610]' : ''}`}
                      >
                        <td className="py-3 px-2">
                          <strong className="text-white text-sm block font-sans font-semibold">{s.name}</strong>
                          <span className="text-[10px] text-gray-500 font-mono block">{s.subdomain}</span>
                        </td>
                        <td className="py-3 px-2 text-gray-300 uppercase font-mono text-[10px]">{s.category}</td>
                        <td className="py-3 px-2 text-gray-400 font-mono">{s.ownerEmail}</td>
                        <td className="py-3 px-2">
                          <span className={`inline-block px-2 py-0.5 rounded-[2px] font-mono text-[9px] border uppercase ${
                            s.status === 'Active' ? 'bg-emerald-400/5 text-emerald-400 border-emerald-400/20' :
                            s.status === 'Suspended' ? 'bg-red-400/5 text-red-300 border-red-400/20' : 'bg-amber-400/5 text-amber-400 border-amber-400/20'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1 justify-end">
                            {s.status === 'Pending' && (
                              <button
                                onClick={() => { onApproveShop(s.id); setSelectedShopId(s.id); }}
                                className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-mono uppercase tracking-wider rounded border border-emerald-500/20 cursor-pointer"
                              >
                                Approve
                              </button>
                            )}
                            {s.status === 'Active' && (
                              <button
                                onClick={() => { onSuspendShop(s.id); setSelectedShopId(s.id); }}
                                className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-mono uppercase tracking-wider rounded border border-red-500/25 cursor-pointer"
                              >
                                Suspend
                              </button>
                            )}
                            {s.status === 'Suspended' && (
                              <button
                                onClick={() => { onActivateShop(s.id); setSelectedShopId(s.id); }}
                                className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-mono uppercase tracking-wider rounded border border-emerald-500/20 cursor-pointer"
                              >
                                Activate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Right Column: Interactive Drill-down details with commands */}
              <div className="bg-[#0b0b0b] border border-white/5 p-6 rounded relative overflow-hidden">
                <div className="pb-3 border-b border-white/5 mb-6">
                  <span className="text-[10px] font-mono text-[#d4af37] uppercase">Supervisory Command</span>
                  <h3 className="text-base font-sans font-medium text-white uppercase mt-0.5">Franchise Details</h3>
                </div>

                {selectedShop ? (
                  <div className="space-y-6">
                    <div>
                      <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider block">ID & Classification</span>
                      <strong className="text-sm font-sans font-semibold text-white block mt-1">{selectedShop.name}</strong>
                      <span className="text-xs text-[#d4af37] font-mono block mt-1">{selectedShop.category} &bull; {selectedShop.subdomain}</span>
                    </div>

                    <div className="p-3 bg-zinc-900 border border-white/5 rounded space-y-1.5 text-xs">
                      <div className="flex justify-between font-mono text-[10px]"><span className="text-gray-500">Status</span> <span className="text-white uppercase">{selectedShop.status}</span></div>
                      <div className="flex justify-between font-mono text-[10px]"><span className="text-gray-500">Owner Credentials</span> <span className="text-white">{selectedShop.ownerEmail}</span></div>
                      <div className="flex justify-between font-mono text-[10px]"><span className="text-gray-500">Wallet balance</span> <span className="text-[#d4af37] font-bold">${selectedShop.balance}</span></div>
                      <div className="flex justify-between font-mono text-[10px]"><span className="text-gray-500">Registered</span> <span className="text-gray-400">{new Date(selectedShop.createdAt).toLocaleDateString()}</span></div>
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-2.5">
                      <span className="text-[10px] font-mono text-gray-500 uppercase">Operational Checks</span>
                      
                      {selectedShop.status === 'Pending' ? (
                        <div className="space-y-2">
                          <button
                            onClick={() => onApproveShop(selectedShop.id)}
                            className="w-full py-3 bg-emerald-500 text-black text-xs font-mono font-bold tracking-widest uppercase rounded hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve Registration
                          </button>
                          <p className="text-[11px] text-gray-400 font-sans text-center leading-relaxed">
                            Approving maps subdomain on the edge server and allocates a dedicated virtual ledger.
                          </p>
                        </div>
                      ) : selectedShop.status === 'Active' ? (
                        <div className="space-y-2">
                          <button
                            onClick={() => onSuspendShop(selectedShop.id)}
                            className="w-full py-3 bg-red-500 text-black text-xs font-mono font-bold tracking-widest uppercase rounded hover:bg-red-600 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <AlertOctagon className="w-3.5 h-3.5 text-black" /> Suspend Operations
                          </button>
                          <p className="text-[11px] text-red-400/80 font-sans text-center leading-relaxed">
                            Suspended salons temporarily block client reservations & dashboard logins.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <button
                            onClick={() => onActivateShop(selectedShop.id)}
                            className="w-full py-3 bg-emerald-500 text-black text-xs font-mono font-bold tracking-widest uppercase rounded hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Reactivate Salon
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-500 font-mono text-xs">
                    Choose a tenant from the directory to initiate direct control checks.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: WALLETS & ESCROWS */}
          {activeTab === 'wallets' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Virtual Shop Wallets ledger */}
              <div className="lg:col-span-1 bg-[#0b0b0b] border border-white/5 p-6 rounded">
                <h3 className="text-base font-sans font-medium text-white uppercase tracking-wider mb-6 pb-2 border-b border-white/5">
                  Sovereign client balances
                </h3>

                <div className="space-y-4">
                  {shops.map((s) => (
                    <div key={s.id} className="p-3 bg-zinc-900 rounded border border-white/5 flex justify-between items-center">
                      <div>
                        <strong className="text-xs text-white uppercase block">{s.name}</strong>
                        <span className="text-[9px] text-gray-500 font-mono italic">{s.subdomain}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-mono text-[#d4af37] font-semibold">${s.balance}</span>
                        <span className="text-[9px] text-gray-500 font-mono block">Escrow hold</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Central transactions / Escrow transfers log */}
              <div className="lg:col-span-2 bg-[#0b0b0b] border border-white/5 p-6 rounded">
                <h3 className="text-base font-sans font-medium text-white uppercase tracking-wider mb-6 pb-2 border-b border-white/5">
                  Escrow Withdraw Request Controls & Complete Ledger
                </h3>

                {/* Withdraw requests table */}
                <div className="mb-8">
                  <span className="text-[10px] font-mono text-[#d4af37] tracking-widest uppercase block mb-3">Withdraw queue ({withdrawRequests.length})</span>
                  
                  <div className="space-y-3">
                    {withdrawRequests.map((wr) => (
                      <div key={wr.id} className="p-3 bg-zinc-950 rounded border border-white/5 flex items-center justify-between text-xs font-mono">
                        <div>
                          <strong className="text-white font-sans text-xs">{wr.shopName}</strong>
                          <span className="text-[10px] text-gray-500 block mt-0.5">Dest: {wr.destination} &bull; {new Date(wr.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-[#d4af37] text-sm">${wr.amount}</span>
                          
                          {wr.status === 'Pending' ? (
                            <div className="flex gap-1.5">
                              <button 
                                onClick={() => onApproveWithdraw(wr.id)}
                                className="px-2.5 py-1.5 bg-emerald-500 text-black text-[10px] font-bold uppercase rounded cursor-pointer"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => onRejectWithdraw(wr.id)}
                                className="px-2.5 py-1.5 bg-red-500 text-black text-[10px] font-bold uppercase rounded cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase border ${
                              wr.status === 'Approved' ? 'bg-emerald-400/5 text-emerald-400 border-emerald-400/20' : 'bg-red-400/10 text-red-300 border-red-500/25'
                            }`}>
                              {wr.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Log list */}
                <div>
                  <span className="text-[10px] font-mono text-[#d4af37] tracking-widest uppercase block mb-3">Escrow Transaction audit trail</span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans text-xs">
                      <thead>
                        <tr className="border-b border-white/5 text-[9px] font-mono uppercase text-gray-500">
                          <th className="py-2">TX ID</th>
                          <th className="py-2">SALON</th>
                          <th className="py-2">CLASSIFICATION</th>
                          <th className="py-2 text-right">VALUE</th>
                          <th className="py-2 text-right">AUDIT STAT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        {transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-white/1">
                            <td className="py-2.5 text-gray-400">{tx.id}</td>
                            <td className="py-2.5 text-white font-sans text-xs">{tx.shopName}</td>
                            <td className="py-2.5 text-gray-500 text-[10px] uppercase">{tx.type}</td>
                            <td className="py-2.5 text-[#d4af37] text-right font-semibold">${tx.amount}</td>
                            <td className="py-2.5 text-right">
                              <span className={`inline-block px-1.5 py-0.5 rounded-[2px] text-[9px] border uppercase ${
                                tx.status === 'Completed' ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' :
                                tx.status === 'Rejected' ? 'bg-red-500/5 text-red-400 border-red-500/20' : 'bg-amber-400/5 text-amber-500 border-amber-500/20'
                              }`}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 4: GROWTH ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              
              {/* Premium Luxury Custom SVG-Charts Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Chart 1: Revenue growth line shape */}
                <div className="bg-[#0b0b0b] border border-white/5 rounded p-6">
                  <div className="mb-4 pb-2 border-b border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-[#d4af37] uppercase tracking-widest">Growth Metric</span>
                      <h4 className="text-sm font-sans font-medium text-white uppercase mt-0.5">Revenue Growth (USD)</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono text-[#d4af37] font-semibold">+42% MoM</span>
                    </div>
                  </div>

                  {/* Responsive High End Custom Styled SVG Line Chart with glow */}
                  <div className="h-64 w-full relative">
                    <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                      {/* Gridlines */}
                      <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      
                      {/* Gold Glowing Gradient line */}
                      <defs>
                        <linearGradient id="glowGold" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#d4af37" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#d4af37" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Line Shape Area Fill */}
                      <path 
                        d="M 10 180 L 100 150 L 200 160 L 300 90 L 400 70 L 490 30 L 490 190 L 10 190 Z" 
                        fill="url(#glowGold)" 
                      />

                      {/* Golden Path Stroke */}
                      <path 
                        d="M 10 180 L 100 150 L 200 160 L 300 90 L 400 70 L 490 30" 
                        fill="none" 
                        stroke="#d4af37" 
                        strokeWidth="2.5" 
                      />

                      {/* Glowing Circles over points */}
                      <circle cx="10" cy="180" r="4.5" fill="#black" stroke="#d4af37" strokeWidth="2" />
                      <circle cx="100" cy="150" r="4.5" fill="#black" stroke="#d4af37" strokeWidth="2" />
                      <circle cx="200" cy="160" r="4.5" fill="#black" stroke="#d4af37" strokeWidth="2" />
                      <circle cx="300" cy="90" r="4.5" fill="#black" stroke="#d4af37" strokeWidth="2" />
                      <circle cx="400" cy="70" r="4.5" fill="#black" stroke="#d4af37" strokeWidth="2" />
                      <circle cx="490" cy="30" r="4.5" fill="#d4af37" stroke="#white" strokeWidth="2.5" className="animate-pulse" />
                    </svg>

                    {/* Timeline indicators */}
                    <div className="flex justify-between font-mono text-[9px] text-gray-500 mt-2">
                      <span>Jan 2026</span>
                      <span>Feb</span>
                      <span>Mar</span>
                      <span>Apr</span>
                      <span>May</span>
                      <span>Jun (Current)</span>
                    </div>
                  </div>
                </div>

                {/* Chart 2: Booking Growth bar shape */}
                <div className="bg-[#0b0b0b] border border-white/5 rounded p-6">
                  <div className="mb-4 pb-2 border-b border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-[#d4af37] uppercase tracking-widest">Operational Metric</span>
                      <h4 className="text-sm font-sans font-medium text-white uppercase mt-0.5">Booking Volume growth</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono text-emerald-400 font-semibold">+84 slots total</span>
                    </div>
                  </div>

                  {/* Elegant custom bar layout */}
                  <div className="h-64 w-full relative">
                    <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                      <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                      {/* Golden Transparent bars */}
                      <rect x="25" y="160" width="30" height="30" rx="2" fill="#d4af37" fillOpacity="0.3" stroke="#d4af37" strokeWidth="1" />
                      <rect x="105" y="140" width="30" height="50" rx="2" fill="#d4af37" fillOpacity="0.4" stroke="#d4af37" strokeWidth="1" />
                      <rect x="185" y="120" width="30" height="70" rx="2" fill="#d4af37" fillOpacity="0.5" stroke="#d4af37" strokeWidth="1" />
                      <rect x="265" y="90" width="30" height="100" rx="2" fill="#d4af37" fillOpacity="0.6" stroke="#d4af37" strokeWidth="1" />
                      <rect x="345" y="60" width="30" height="130" rx="2" fill="#d4af37" fillOpacity="0.7" stroke="#d4af37" strokeWidth="1" />
                      <rect x="425" y="30" width="30" height="160" rx="2" fill="#d4af37" fillOpacity="0.9" stroke="#d4af37" strokeWidth="1.5" />
                    </svg>

                    {/* Timeline indicators */}
                    <div className="flex justify-between font-mono text-[9px] text-gray-500 mt-2">
                      <span className="w-16 text-center">Wk 1</span>
                      <span className="w-16 text-center">Wk 2</span>
                      <span className="w-16 text-center">Wk 3</span>
                      <span className="w-16 text-center">Wk 4</span>
                      <span className="w-16 text-center">Wk 5</span>
                      <span className="w-16 text-center">Wk 6</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Row 2: Top Shops Ranking & Customer Growth */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Ranking: Top Shops by Revenue */}
                <div className="bg-[#0b0b0b] border border-white/5 rounded p-6">
                  <div className="mb-4 pb-2 border-b border-white/5">
                    <span className="text-[9px] font-mono text-[#d4af37] uppercase tracking-widest font-light">Performance Leaderboard</span>
                    <h4 className="text-sm font-sans font-medium text-white uppercase mt-0.5">Top Shops ranking by Gross balance</h4>
                  </div>

                  <div className="space-y-5">
                    {shops
                    .slice()
                    .sort((a,b) => b.balance - a.balance)
                    .map((sh, idx) => {
                      const maxBalance = Math.max(...shops.map(s=>s.balance)) || 1;
                      const percentage = (sh.balance / maxBalance) * 100;
                      return (
                        <div key={sh.id} className="space-y-1.5 font-mono text-xs">
                          <div className="flex justify-between text-xs">
                            <span className="text-white font-sans font-medium flex items-center gap-2">
                              <span className="text-gray-600 font-mono">0{idx+1}.</span> {sh.name}
                            </span>
                            <span className="text-[#d4af37] font-bold">${sh.balance}</span>
                          </div>
                          
                          {/* Percent bar */}
                          <div className="h-2 w-full bg-zinc-950 rounded overflow-hidden border border-white/5">
                            <div 
                              className="h-full bg-gradient-to-r from-[#d4af37]/35 to-[#d4af37]" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Growth 4: Customer acquisition slope */}
                <div className="bg-[#0b0b0b] border border-white/5 rounded p-6">
                  <div className="mb-4 pb-2 border-b border-white/5">
                    <span className="text-[9px] font-mono text-[#d4af37] uppercase tracking-widest font-light">Audience Slope</span>
                    <h4 className="text-sm font-sans font-medium text-white uppercase mt-0.5">Global Lapsed and Inactive Customer Metrics</h4>
                  </div>

                  {/* Customer Status bars */}
                  <div className="space-y-6 pt-2 font-mono text-xs">
                    
                    <div className="space-y-1.5Packed">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-emerald-400">Active Retained Members</span>
                        <span className="text-white">4 Customers</span>
                      </div>
                      <div className="h-3 w-full bg-zinc-950 rounded-sm overflow-hidden flex">
                        <div className="bg-emerald-500 h-full" style={{ width: '57%' }} />
                        <span className="ml-2 text-[10px] text-gray-500">57% active retention rating</span>
                      </div>
                    </div>

                    <div className="space-y-1.5Ready mt-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-amber-500">Inactive Lapsed Members (Actionable)</span>
                        <span className="text-white">3 Customers</span>
                      </div>
                      <div className="h-3 w-full bg-zinc-950 rounded-sm overflow-hidden flex">
                        <div className="bg-amber-500 h-full" style={{ width: '43%' }} />
                        <span className="ml-2 text-[10px] text-gray-500">43% reclaim eligibility triggers</span>
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-950 rounded border border-white/5 mt-6">
                      <span className="text-[10px] font-mono text-gray-500 uppercase block mb-1">Super Admin Insight</span>
                      <p className="text-[11px] text-gray-400 leading-normal font-sans font-light">
                        Our internal telemetry confirms salons deploying **AI-driven WhatsApp automated coupons** re-activate 40%+ of inactive clients within 48 hours of campaign launch.
                      </p>
                    </div>

                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
