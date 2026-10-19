import React, { useState, useEffect, useRef } from 'react';
import { 
  MOCK_SHOPS, 
  MOCK_WITHDRAW_REQUESTS, 
  MOCK_TRANSACTIONS, 
  MOCK_STAFF, 
  MOCK_CUSTOMERS, 
  PREMIUM_SERVICES, 
  TESTIMONIALS,
  ARTISANS
} from './data';
import { Shop, WithdrawRequest, Transaction, StaffMember, CustomerData, Booking, Service, Artisan } from './types';
import Navbar from './components/Navbar';
import WebGLBackground from './components/WebGLBackground';
import ParallaxGallery from './components/ParallaxGallery';
import BookNow from './components/BookNow';
import OwnerDashboard from './components/OwnerDashboard';
import ArtisansList from './components/ArtisansList';
import StaffProfileModal from './components/StaffProfileModal';
import SaaSLandingPage from './components/SaaSLandingPage';
import SuperAdminPanel from './components/SuperAdminPanel';
import QuickBookFAB from './components/QuickBookFAB';
import JaipurFestiveSpecials from './components/JaipurFestiveSpecials';
import FestiveHeroBanner from './components/FestiveHeroBanner';
import StaffPicksSection from './components/StaffPicksSection';
import { 
  Star, Clock, ChevronRight, Phone, Mail, MapPin, Calendar, 
  Instagram, Facebook, Compass, Scissors, Award, Sparkles, AlertCircle, X, Eye, Search,
  Share2, Check, ChevronDown, SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export type SortOption = 'Most Popular' | 'Price: Low to High' | 'Price: High to Low';

export default function App() {
  // --- SUBDOMAIN/TENANCY ACTIVE CONTEXT STATE ---
  const [activeShopId, setActiveShopId] = useState<string>('looks');

  // --- CORE SYSTEM ROUTER ---
  const [currentView, setCurrentView] = useState<'saas_landing' | 'home' | 'book' | 'dashboard' | 'super_admin'>('saas_landing');
  const [preselectedServiceId, setPreselectedServiceId] = useState<string | null>(null);
  const [selectedStaffMember, setSelectedStaffMember] = useState<StaffMember | Artisan | null>(null);

  // --- ESCROW AND LEDGER STATE SYNCED TO LOCALSTORAGE ---
  const [shops, setShops] = useState<Shop[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Telemetry trigger state
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);

  // --- INITIAL LOADING AND SEEDING PROTOCOL ---
  useEffect(() => {
    // 1. Shops Seeding
    const localShops = localStorage.getItem('nexora_shops');
    let loadedShops: Shop[] = [];
    if (localShops) {
      try { loadedShops = JSON.parse(localShops); } catch (e) { console.error(e); }
    }
    if (loadedShops.length === 0) {
      loadedShops = MOCK_SHOPS;
      localStorage.setItem('nexora_shops', JSON.stringify(MOCK_SHOPS));
    }
    setShops(loadedShops);

    // 2. Withdraw requests Seeding
    const localWithdraws = localStorage.getItem('nexora_withdraw_requests');
    let loadedWithdraws: WithdrawRequest[] = [];
    if (localWithdraws) {
      try { loadedWithdraws = JSON.parse(localWithdraws); } catch (e) { console.error(e); }
    }
    if (loadedWithdraws.length === 0) {
      loadedWithdraws = MOCK_WITHDRAW_REQUESTS;
      localStorage.setItem('nexora_withdraw_requests', JSON.stringify(MOCK_WITHDRAW_REQUESTS));
    }
    setWithdrawRequests(loadedWithdraws);

    // 3. Transactions file Seeding
    const localTransactions = localStorage.getItem('nexora_transactions');
    let loadedTxns: Transaction[] = [];
    if (localTransactions) {
      try { loadedTxns = JSON.parse(localTransactions); } catch (e) { console.error(e); }
    }
    if (loadedTxns.length === 0) {
      loadedTxns = MOCK_TRANSACTIONS;
      localStorage.setItem('nexora_transactions', JSON.stringify(MOCK_TRANSACTIONS));
    }
    setTransactions(loadedTxns);

    // 4. Staff Directory Seeding
    const localStaff = localStorage.getItem('nexora_staff');
    let loadedStaff: StaffMember[] = [];
    if (localStaff) {
      try { loadedStaff = JSON.parse(localStaff); } catch (e) { console.error(e); }
    }
    if (loadedStaff.length === 0) {
      loadedStaff = MOCK_STAFF;
      localStorage.setItem('nexora_staff', JSON.stringify(MOCK_STAFF));
    }
    setStaff(loadedStaff);

    // 5. Customers telemetry mapping Seeding
    const localCustomers = localStorage.getItem('nexora_customers');
    let loadedCustomers: CustomerData[] = [];
    if (localCustomers) {
      try { loadedCustomers = JSON.parse(localCustomers); } catch (e) { console.error(e); }
    }
    if (loadedCustomers.length === 0) {
      loadedCustomers = MOCK_CUSTOMERS;
      localStorage.setItem('nexora_customers', JSON.stringify(MOCK_CUSTOMERS));
    }
    setCustomers(loadedCustomers);

    // 6. Bookings Database Seeding (Ensure historical bookings present out of box)
    const localBookings = localStorage.getItem('nexora_bookings');
    let loadedBookings: Booking[] = [];
    if (localBookings) {
      try { loadedBookings = JSON.parse(localBookings); } catch (e) { console.error(e); }
    }
    if (loadedBookings.length === 0) {
      const initialBookings: Booking[] = [
        {
          id: 'NEX-8241',
          shopId: 'looks',
          serviceId: 'haircut',
          serviceName: 'Royal Sculpt & Style',
          price: 150,
          date: '2026-06-04',
          timeSlot: '11:00 AM',
          customerName: 'Aurelia Sterling',
          customerEmail: 'aurelia@sterling.com',
          customerPhone: '+1 (555) 980-2481',
          notes: 'Prefer Madame Eléonore Vance for contour styling.',
          status: 'Confirmed',
          createdAt: '2026-06-01T10:00:00.000Z'
        },
        {
          id: 'NEX-1092',
          shopId: 'looks',
          serviceId: 'coloring',
          serviceName: 'Auric Balayage & Glaze Melt',
          price: 320,
          date: '2026-06-05',
          timeSlot: '02:00 PM',
          customerName: 'Marchesa Fiorella',
          customerEmail: 'fiorella@marchesa.it',
          customerPhone: '+1 (555) 234-9021',
          notes: 'Please prepare the auric chamomile tea refreshments.',
          status: 'Pending',
          createdAt: '2026-06-02T11:15:00.000Z'
        },
        {
          id: 'NEX-3401',
          shopId: 'royalbarber',
          serviceId: 'barber',
          serviceName: 'Monarch Shave & Contour',
          price: 110,
          date: '2026-06-04',
          timeSlot: '04:00 PM',
          customerName: 'Baron Von Klaus',
          customerEmail: 'klaus@munich.de',
          customerPhone: '+1 (555) 754-9218',
          notes: 'Hot sandalwood steam steam request.',
          status: 'Completed',
          createdAt: '2026-05-29T14:30:00.000Z'
        },
        {
          id: 'NEX-9011',
          shopId: 'beautyqueen',
          serviceId: 'bridal',
          serviceName: 'Crown Imperial Bridal',
          price: 650,
          date: '2026-06-12',
          timeSlot: '09:00 AM',
          customerName: 'Juliet Capulet',
          customerEmail: 'juliet@verona.com',
          customerPhone: '+1 (555) 441-1200',
          notes: 'Complete wedding party package styling prep.',
          status: 'Pending',
          createdAt: '2026-06-02T16:00:00.000Z'
        }
      ];
      loadedBookings = initialBookings;
      localStorage.setItem('nexora_bookings', JSON.stringify(initialBookings));
    }
    setBookings(loadedBookings);

  }, [refreshTrigger]);

  // Read bookings to calculate pending badge size for the currently active shop context
  const updatePendingBadge = () => {
    const pCount = bookings.filter(b => b.shopId === activeShopId && b.status === 'Pending').length;
    setPendingCount(pCount);
  };

  useEffect(() => {
    updatePendingBadge();
  }, [bookings, activeShopId]);

  // Deep linking: parse ?service=... or ?protocol=... from direct link on initial load
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const serviceParam = searchParams.get('service') || searchParams.get('serviceId') || searchParams.get('protocol');
      const shopParam = searchParams.get('shop') || searchParams.get('shopId');

      if (serviceParam) {
        if (shopParam && MOCK_SHOPS.some(s => s.id === shopParam)) {
          setActiveShopId(shopParam);
        }
        const matched = PREMIUM_SERVICES.find(
          s => s.id.toLowerCase() === serviceParam.toLowerCase() ||
               s.name.toLowerCase().includes(serviceParam.toLowerCase())
        );
        if (matched) {
          setCurrentView('home');
          setSelectedServiceForModal(matched);
        }
      }

      const staffParam = searchParams.get('staff') || searchParams.get('stylist') || searchParams.get('artisan');
      if (staffParam) {
        if (shopParam && MOCK_SHOPS.some(s => s.id === shopParam)) {
          setActiveShopId(shopParam);
        }
        const matchedArtisan = ARTISANS.find(
          a => a.id.toLowerCase() === staffParam.toLowerCase() ||
               a.name.toLowerCase().includes(staffParam.toLowerCase())
        );
        const matchedStaff = MOCK_STAFF.find(
          s => s.id.toLowerCase() === staffParam.toLowerCase() ||
               s.name.toLowerCase().includes(staffParam.toLowerCase())
        );
        const target = matchedArtisan || matchedStaff;
        if (target) {
          setCurrentView('home');
          setSelectedStaffMember(target);
        }
      }
    } catch (err) {
      console.warn('Direct protocol link parse notice', err);
    }
  }, []);

  // Refs for GSAP text reveal entrance animations
  const heroBadgeRef = useRef<HTMLSpanElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubtitleRef = useRef<HTMLParagraphElement>(null);
  const heroBarRef = useRef<HTMLDivElement>(null);
  const heroButtonRef = useRef<HTMLDivElement>(null);

  // Handle Home-to-Book navigation and pre-select
  const handleBookNow = (serviceId: string | null = null) => {
    setPreselectedServiceId(serviceId);
    setCurrentView('book');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Run GSAP text entrance animation when view returns to HOME
  useEffect(() => {
    if (currentView === 'home') {
      const ctx = gsap.context(() => {
        gsap.killTweensOf([
          heroBadgeRef.current, heroTitleRef.current, 
          heroSubtitleRef.current, heroBarRef.current, heroButtonRef.current
        ]);

        gsap.fromTo(heroBadgeRef.current, 
          { opacity: 0, y: 30, letterSpacing: '0.4em' },
          { opacity: 1, y: 0, letterSpacing: '0.5em', duration: 1.2, ease: 'power3.out' }
        );

        gsap.fromTo(heroTitleRef.current, 
          { opacity: 0, y: 40, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 1.5, delay: 0.3, ease: 'power4.out' }
        );

        gsap.fromTo(heroSubtitleRef.current, 
          { opacity: 0, y: 15, letterSpacing: '0.12em' },
          { opacity: 1, y: 0, letterSpacing: '0.23em', duration: 1.8, delay: 0.6, ease: 'sine.out' }
        );

        gsap.fromTo(heroBarRef.current, 
          { width: '0px', opacity: 0 },
          { width: '80px', opacity: 1, duration: 1.0, delay: 0.9, ease: 'power2.out' }
        );

        gsap.fromTo(heroButtonRef.current, 
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 1.2, delay: 1.1, ease: 'power3.out' }
        );
      });

      return () => ctx.revert();
    }
  }, [currentView, activeShopId]);

  // --- CORE CALLBAK HANDLERS FOR SAAS LANDING PAGE ---
  
  const handleAddNewShop = (newShop: Shop) => {
    const updated = [...shops, newShop];
    setShops(updated);
    localStorage.setItem('nexora_shops', JSON.stringify(updated));

    // Also register subscription transaction to show super admin ledger collecting money!
    const newTxn: Transaction = {
      id: `TXN-SUB-${Math.floor(100+Math.random()*900)}`,
      shopId: newShop.id,
      shopName: newShop.name,
      amount: 99,
      type: 'Subscription Plan',
      status: 'Completed',
      createdAt: new Date().toISOString()
    };
    const updatedTxns = [...transactions, newTxn];
    setTransactions(updatedTxns);
    localStorage.setItem('nexora_transactions', JSON.stringify(updatedTxns));

    // Alert completion
    alert(`Success! ${newShop.name} registered on subdomain: ${newShop.subdomain}. Escrow ledger allocated.`);
  };

  const handleSelectShop = (shopId: string, viewType: 'customer' | 'owner') => {
    setActiveShopId(shopId);
    if (viewType === 'customer') {
      setCurrentView('home');
    } else {
      setCurrentView('dashboard');
    }
    window.scrollTo({ top: 0 });
  };

  const handleEnterSuperAdmin = () => {
    setCurrentView('super_admin');
    window.scrollTo({ top: 0 });
  };

  // --- SUPER ADMIN MASTER SETTERS ---

  const handleApproveShop = (shopId: string) => {
    const updated = shops.map(s => {
      if (s.id === shopId) return { ...s, status: 'Active' as const };
      return s;
    });
    setShops(updated);
    localStorage.setItem('nexora_shops', JSON.stringify(updated));
  };

  const handleSuspendShop = (shopId: string) => {
    const updated = shops.map(s => {
      if (s.id === shopId) return { ...s, status: 'Suspended' as const };
      return s;
    });
    setShops(updated);
    localStorage.setItem('nexora_shops', JSON.stringify(updated));
  };

  const handleActivateShop = (shopId: string) => {
    const updated = shops.map(s => {
      if (s.id === shopId) return { ...s, status: 'Active' as const };
      return s;
    });
    setShops(updated);
    localStorage.setItem('nexora_shops', JSON.stringify(updated));
  };

  const handleApproveWithdraw = (wrId: string) => {
    const requestItem = withdrawRequests.find(w => w.id === wrId);
    if (!requestItem) return;

    // 1. Deduct from Shop balance
    const updatedShops = shops.map(s => {
      if (s.id === requestItem.shopId) {
        return { ...s, balance: Math.max(0, s.balance - requestItem.amount) };
      }
      return s;
    });

    // 2. Mark request approved
    const updatedWithdraws = withdrawRequests.map(w => {
      if (w.id === wrId) return { ...w, status: 'Approved' as const };
      return w;
    });

    // 3. Mark matching Transaction completed
    const updatedTransactions = transactions.map(t => {
      if (t.shopId === requestItem.shopId && t.amount === requestItem.amount && t.type === 'Withdrawal') {
        return { ...t, status: 'Completed' as const };
      }
      return t;
    });

    setShops(updatedShops);
    setWithdrawRequests(updatedWithdraws);
    setTransactions(updatedTransactions);

    localStorage.setItem('nexora_shops', JSON.stringify(updatedShops));
    localStorage.setItem('nexora_withdraw_requests', JSON.stringify(updatedWithdraws));
    localStorage.setItem('nexora_transactions', JSON.stringify(updatedTransactions));
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRejectWithdraw = (wrId: string) => {
    const updatedWithdraws = withdrawRequests.map(w => {
      if (w.id === wrId) return { ...w, status: 'Rejected' as const };
      return w;
    });
    setWithdrawRequests(updatedWithdraws);
    localStorage.setItem('nexora_withdraw_requests', JSON.stringify(updatedWithdraws));
    setRefreshTrigger(prev => prev + 1);
  };

  // --- ESCROW TRANSACTION ADDERS (CALLED BY COMPLETED BOOKINGS) ---

  const handleAddTransaction = (newTxn: Transaction) => {
    const updated = [newTxn, ...transactions];
    setTransactions(updated);
    localStorage.setItem('nexora_transactions', JSON.stringify(updated));
  };

  const handleUpdateShopBalance = (shopId: string, amount: number) => {
    const updated = shops.map(s => {
      if (s.id === shopId) return { ...s, balance: s.balance + amount };
      return s;
    });
    setShops(updated);
    localStorage.setItem('nexora_shops', JSON.stringify(updated));
  };

  const handleAddWithdrawRequest = (amount: number, dest: string) => {
    const targetShop = shops.find(s => s.id === activeShopId);
    if (!targetShop) return;

    const newRequest: WithdrawRequest = {
      id: `WR-${Math.floor(100 + Math.random() * 900)}`,
      shopId: activeShopId,
      shopName: targetShop.name,
      amount,
      destination: dest,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    const updatedWithdraws = [newRequest, ...withdrawRequests];
    setWithdrawRequests(updatedWithdraws);
    localStorage.setItem('nexora_withdraw_requests', JSON.stringify(updatedWithdraws));

    // Also register transaction log as Pending
    const newTxn: Transaction = {
      id: `TXN-WDL-${Math.floor(1000 + Math.random() * 9000)}`,
      shopId: activeShopId,
      shopName: targetShop.name,
      amount,
      type: 'Withdrawal',
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    const updatedTxns = [newTxn, ...transactions];
    setTransactions(updatedTxns);
    localStorage.setItem('nexora_transactions', JSON.stringify(updatedTxns));

    setRefreshTrigger(prev => prev + 1);
  };

  // Find currently active shop detail
  const activeShop = shops.find(s => s.id === activeShopId) || MOCK_SHOPS[0];

  // Dynamically filter PREMIUM_SERVICES corresponding to the active shop's category structure
  const activeShopServices = React.useMemo(() => {
    if (activeShopId === 'royalbarber') {
      return PREMIUM_SERVICES.filter(s => s.category === 'Barber' || s.category === 'Spa');
    } else if (activeShopId === 'beautyqueen') {
      return PREMIUM_SERVICES.filter(s => s.category === 'Manicure' || s.category === 'Spa' || s.category === 'Bridal');
    } else if (activeShopId === 'grooming') {
      return PREMIUM_SERVICES.filter(s => s.category === 'Barber' || s.category === 'Haircut' || s.category === 'Spa');
    } else { // looks or default
      return PREMIUM_SERVICES.filter(s => s.category === 'Haircut' || s.category === 'Coloring' || s.category === 'Spa' || s.category === 'Manicure');
    }
  }, [activeShopId]);

  // --- DYNAMIC HOME SERVICES CATEGORY FILTER, SEARCH & SORT STATE + GSAP ANIMATION ---
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('Most Popular');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState<boolean>(false);
  const servicesGridRef = useRef<HTMLDivElement>(null);
  const categoryDescRef = useRef<HTMLDivElement>(null);
  const emptySearchRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Close sort dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSortDropdownOpen(false);
      }
    };
    if (isSortDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSortDropdownOpen]);

  // Mapped category unique showcase messages describing why they are elite
  const categoryDescriptions: Record<string, string> = {
    All: "Explore our complete curated suite of premium treatments, engineered in alignment with elite styling research and tailored precisely to highlight your inherent elegance.",
    Haircut: "Each sculpture and style cut is a masterwork of precise proportion, personalized geometry, and customized structural integrity tailored to frame your profile.",
    Coloring: "Immersive, customized pigments and melting glazes curated with organic protectors, achieving uncompromised chromatic brilliance and seamless dimension.",
    Spa: "Deep, therapeutic scalp formulas, hot aromatherapy steaming, and tactile head-massage rituals designed to induce a state of serene neural absolute rest.",
    Manicure: "Precision cuticle sculpting and gold foil treatments delivering an immaculate visual finish, restoring strength and presenting uncompromised symmetry.",
    Barber: "Monarch hot shaves and sharp contouring utilizing sandalwood formulas, warm compresses, and single-blade precision to define your profile.",
    Bridal: "Crown imperial bridal combinations offering complete visual coordination, premium veil settings, and highly detailed pre-ceremony treatment sets."
  };

  // --- SERVICE DETAILS MODAL STATE & GSAP ANIMATION CORES ---
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<Service | null>(null);
  const [shareCopied, setShareCopied] = useState<boolean>(false);
  const modalOverlayRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // --- QUICK VIEW SIDE PANEL STATE & REF ---
  const [selectedServiceForQuickView, setSelectedServiceForQuickView] = useState<Service | null>(null);
  const [quickViewContent, setQuickViewContent] = useState<Service | null>(null);
  const quickViewPanelRef = useRef<HTMLDivElement>(null);

  const serviceExtendedDetails: Record<string, {
    richDescription: string;
    phases: string[];
    postCare: string[];
    recommendedStaff: {
      name: string;
      role: string;
      image: string;
      quote: string;
    }[];
  }> = {
    haircut: {
      richDescription: "A professional, expert haircut designed to suit your face and hair type. We start with a quick consultation, followed by a relaxing wash, a perfect cut, and a neat finish to make you look your best.",
      phases: [
        "Quick consultation to understand your style",
        "Relaxing hair wash and scalp massage",
        "Expert haircut for your hair type",
        "Final blow-dry and styling"
      ],
      postCare: [
        "Wait a few hours before washing your hair again.",
        "Use a simple comb to keep your style neat.",
        "Use a mild shampoo and conditioner to keep hair healthy."
      ],
      recommendedStaff: [
        {
          name: "Aarav Sharma",
          role: "Senior Hair Stylist",
          image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150",
          quote: "I believe a good haircut should be easy for you to manage every day, while making you feel confident and fresh."
        }
      ]
    },
    coloring: {
      richDescription: "Our professional color service gives you vibrant, beautiful hair color. We start by matching the perfect shade to your style, apply it with care to keep your hair healthy and shiny, and finish with a nourishing treatment.",
      phases: [
        "Consultation to pick the perfect color",
        "Gentle color application with hair protection",
        "Deep conditioning treatment",
        "Final blow-dry and shine finish"
      ],
      postCare: [
        "Rinse with cool water to keep color vibrant.",
        "Use products made for colored hair.",
        "Avoid too much direct sun exposure."
      ],
      recommendedStaff: [
        {
          name: "Priya Sen",
          role: "Master Colorist",
          image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
          quote: "Color is all about bringing out your personality and making your hair look healthy, vibrant, and fun."
        }
      ]
    },
    manicure: {
      richDescription: "Refresh your hands with our classic manicure. We focus on clean nail shaping, gentle cuticle care, and a relaxing hand massage, finishing with your choice of polish for a clean, neat look.",
      phases: [
        "Nail shaping and filing",
        "Gentle cuticle cleaning",
        "Relaxing hand and arm massage",
        "Professional polish application"
      ],
      postCare: [
        "Keep hands moisturized with lotion.",
        "Be careful with wet work for the first few hours.",
        "Use nail oil to keep cuticles healthy."
      ],
      recommendedStaff: [
        {
          name: "Rohan Verma",
          role: "Spa Specialist",
          image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
          quote: "Clean, well-groomed hands are a must. Our focus is on making you feel relaxed and refreshed."
        }
      ]
    },
    spa: {
      richDescription: "Our relaxing head spa is designed to de-stress and nourish your hair. With gentle steam, a calming scalp massage, and natural products, it's the perfect way to recharge.",
      phases: [
        "Scalp health check",
        "Herbal steam and wash",
        "Relaxing head and neck massage",
        "Finishing serum"
      ],
      postCare: [
        "Drink plenty of water afterwards.",
        "Avoid heavy styling products for a day.",
        "Keep your scalp clean and happy."
      ],
      recommendedStaff: [
        {
          name: "Rohan Verma",
          role: "Spa Specialist",
          image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
          quote: "A head spa is more than just washing your hair; it's about helping you find peace in a busy day."
        }
      ]
    },
    bridal: {
      richDescription: "Look your best on your special day with our bridal makeup and hair styling. We work with you to create a look that is natural, elegant, and perfect for your wedding.",
      phases: [
        "Trial session to plan your look",
        "Professional makeup application",
        "Expert hair styling and pinning",
        "Final touch-ups before you leave"
      ],
      postCare: [
        "Keep your makeup looking fresh with light touch-ups.",
        "Follow our instructions to gently remove makeup and hairpins.",
        "Enjoy your special day!"
      ],
      recommendedStaff: [
        {
          name: "Rohan Verma",
          role: "Bridal Specialist",
          image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
          quote: "It's an honor to be part of your wedding day. I focus on creating a look that makes you feel like the best version of yourself."
        }
      ]
    },
    barber: {
      richDescription: "Our signature shave and beard grooming is perfect for a clean, polished look. We use traditional techniques and quality products to ensure a comfortable and relaxing experience.",
      phases: [
        "Warm towel prep for comfort",
        "Precision shave or beard trim",
        "Soothing aftershave treatment",
        "Optional beard oil for shine"
      ],
      postCare: [
        "Use aftershave balm to soothe your skin.",
        "Keep your beard neat with regular trims.",
        "Use beard oil to keep it soft."
      ],
      recommendedStaff: [
        {
          name: "Sneha Kapoor",
          role: "Master Barber",
          image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
          quote: "Grooming should be relaxing. My goal is to make sure you leave feeling sharp and refreshed."
        }
      ]
    },
  };

  // GSAP animation on modal state open/close
  useEffect(() => {
    if (selectedServiceForModal) {
      const overlay = modalOverlayRef.current;
      const content = modalContentRef.current;
      if (overlay && content) {
        gsap.killTweensOf([overlay, content]);
        gsap.fromTo(overlay, 
          { opacity: 0 }, 
          { opacity: 1, duration: 0.3, ease: 'power2.out' }
        );
        gsap.fromTo(content, 
          { opacity: 0, y: 30, scale: 0.96 }, 
          { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.1)', delay: 0.05 }
        );
      }
    }
  }, [selectedServiceForModal]);

  const handleCloseModal = () => {
    setShareCopied(false);
    const overlay = modalOverlayRef.current;
    const content = modalContentRef.current;
    if (overlay && content) {
      gsap.killTweensOf([overlay, content]);
      gsap.to(content, {
        opacity: 0,
        y: 20,
        scale: 0.96,
        duration: 0.25,
        ease: 'power2.in'
      });
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => {
          setSelectedServiceForModal(null);
        }
      });
    } else {
      setSelectedServiceForModal(null);
    }
  };

  // Share direct protocol link to clipboard with fallback and copy confirmation
  const handleShareProtocol = async (service: Service | null) => {
    if (!service) return;
    try {
      const url = new URL(window.location.origin + window.location.pathname);
      url.searchParams.set('shop', activeShopId);
      url.searchParams.set('service', service.id);
      const shareUrl = url.toString();

      let copied = false;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(shareUrl);
          copied = true;
        } catch {
          // Fall back to execCommand below
        }
      }

      if (!copied) {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        textarea.setAttribute('readonly', '');
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        copied = true;
      }

      setShareCopied(true);
      setTimeout(() => {
        setShareCopied(false);
      }, 2600);
    } catch (err) {
      console.error('Failed to copy direct protocol link to clipboard', err);
    }
  };

  // GSAP animation for the slide-out Quick View side panel (non-blocking)
  useEffect(() => {
    const panel = quickViewPanelRef.current;
    if (panel) {
      if (selectedServiceForQuickView) {
        // If panel is already visible and we are swapping content, fade/slide swap beautifully
        if (quickViewContent && quickViewContent.id !== selectedServiceForQuickView.id) {
          const inner = panel.querySelector('#quickview-inner-content');
          if (inner) {
            gsap.killTweensOf(inner);
            gsap.to(inner, {
              opacity: 0,
              x: 15,
              duration: 0.18,
              ease: 'power2.in',
              onComplete: () => {
                setQuickViewContent(selectedServiceForQuickView);
                gsap.fromTo(inner,
                  { opacity: 0, x: -15 },
                  { opacity: 1, x: 0, duration: 0.25, ease: 'power2.out' }
                );
              }
            });
          } else {
            setQuickViewContent(selectedServiceForQuickView);
          }
        } else {
          // Open sliding panel from offscreen right to 0
          setQuickViewContent(selectedServiceForQuickView);
          gsap.killTweensOf(panel);
          gsap.fromTo(panel,
            { x: '100%', opacity: 0.8 },
            { x: '0%', opacity: 1, duration: 0.5, ease: 'power3.out' }
          );
        }
      } else {
        // Close panel by sliding screen right
        gsap.killTweensOf(panel);
        gsap.to(panel, {
          x: '100%',
          opacity: 0,
          duration: 0.35,
          ease: 'power3.in',
          onComplete: () => {
            setQuickViewContent(null);
          }
        });
      }
    }
  }, [selectedServiceForQuickView]);

  // Reset filter and search when active shop changes
  useEffect(() => {
    setSelectedCategory('All');
    setSearchQuery('');
  }, [activeShopId]);

  const availableCategories = React.useMemo(() => {
    const categories = activeShopServices.map(s => s.category);
    const unique = Array.from(new Set(categories));
    return ['All', ...unique];
  }, [activeShopServices]);

  const visibleServices = React.useMemo(() => {
    let list = [...activeShopServices];
    if (selectedCategory !== 'All') {
      list = list.filter(s => s.category === selectedCategory);
    }
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(s => 
        s.name.toLowerCase().includes(query) || 
        s.description.toLowerCase().includes(query)
      );
    }

    // Apply Sort By reordering ('Price: Low to High', 'Price: High to Low', 'Most Popular')
    if (sortBy === 'Price: Low to High') {
      list.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
    } else if (sortBy === 'Price: High to Low') {
      list.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name));
    } else if (sortBy === 'Most Popular') {
      // Calculate popularity score based on real ledger bookings + seed weights
      const getScore = (s: Service) => {
        const sId = s.id.toLowerCase();
        const bookingCount = bookings.filter(b => b.serviceId?.toLowerCase() === sId).length;
        const seedBoosts: Record<string, number> = {
          'haircut': 30,
          'coloring': 25,
          'bridal': 20,
          'spa': 15,
          'barber': 12,
          'manicure': 10,
        };
        return bookingCount * 100 + (seedBoosts[sId] || 5);
      };
      list.sort((a, b) => getScore(b) - getScore(a) || a.name.localeCompare(b.name));
    }

    return list;
  }, [activeShopServices, selectedCategory, searchQuery, sortBy, bookings]);

  // Dynamic popularity calculation based on real bookings in the system ledger
  const trendingServicesMap = React.useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Aggregate bookings for each service id (matching lowercase ids)
    bookings.forEach(booking => {
      const sId = booking.serviceId?.toLowerCase();
      if (sId) {
        counts[sId] = (counts[sId] || 0) + 1;
      }
    });

    // Rank list of non-zero service booking counts
    const sortedServiceIds = Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    const popularityMap: Record<string, 'Most Popular' | 'Seasonal Favorite' | null> = {};

    if (sortedServiceIds.length > 0) {
      // Top booking count
      const topId = sortedServiceIds[0][0];
      popularityMap[topId] = 'Most Popular';

      // Runner up booking count
      if (sortedServiceIds.length > 1) {
        const runnerUpId = sortedServiceIds[1][0];
        popularityMap[runnerUpId] = 'Seasonal Favorite';
      }
    }

    // Elegant fallback seed values to guarantee beautiful labels render out-of-the-box
    if (sortedServiceIds.length === 0) {
      popularityMap['haircut'] = 'Most Popular';
      popularityMap['coloring'] = 'Seasonal Favorite';
    }

    return popularityMap;
  }, [bookings]);

  // GSAP animated reordering on sort selection
  const handleSortChange = (newSort: SortOption) => {
    if (newSort === sortBy) {
      setIsSortDropdownOpen(false);
      return;
    }
    setIsSortDropdownOpen(false);

    if (servicesGridRef.current) {
      const cards = Array.from(servicesGridRef.current.children) as HTMLElement[];
      if (cards.length > 0) {
        gsap.killTweensOf(cards);
        // Animate out existing cards smoothly before state update reorders them
        gsap.to(cards, {
          opacity: 0.15,
          y: -10,
          scale: 0.98,
          duration: 0.22,
          stagger: 0.02,
          ease: 'power2.in',
          onComplete: () => {
            setSortBy(newSort);
          }
        });
        return;
      }
    }
    setSortBy(newSort);
  };

  // Handle transition out first, then apply state change
  const handleFilterCategory = (category: string) => {
    if (category === selectedCategory) return;

    // Fade out current dynamic text summary first
    if (categoryDescRef.current) {
      gsap.to(categoryDescRef.current, {
        opacity: 0,
        y: -10,
        duration: 0.2,
        ease: 'power2.in'
      });
    }
    
    if (servicesGridRef.current) {
      const cards = servicesGridRef.current.children;
      if (cards.length > 0) {
        gsap.killTweensOf(cards);
        gsap.to(cards, {
          opacity: 0,
          y: -15,
          scale: 0.96,
          duration: 0.25,
          stagger: 0.03,
          ease: 'power2.in',
          onComplete: () => {
            setSelectedCategory(category);
          }
        });
      } else {
        setSelectedCategory(category);
      }
    } else {
      setSelectedCategory(category);
    }
  };

  // GSAP animation on category state update for dynamic entry text
  useEffect(() => {
    if (currentView === 'home' && categoryDescRef.current) {
      gsap.killTweensOf(categoryDescRef.current);
      gsap.fromTo(categoryDescRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.1 }
      );
    }
  }, [selectedCategory, currentView]);

  // GSAP animation for the service cards in #services-section (subtle fade for filtered/sorted results and scroll entrance)
  useEffect(() => {
    if (currentView === 'home' && servicesGridRef.current) {
      const cards = Array.from(servicesGridRef.current.children) as HTMLElement[];
      if (cards.length > 0 && visibleServices.length > 0) {
        // Kill existing triggers on all cards first to prevent overlap/leak
        ScrollTrigger.getAll().forEach(trigger => {
          if (cards.includes(trigger.trigger as any)) {
            trigger.kill();
          }
        });
        cards.forEach(card => gsap.killTweensOf(card));

        // Check if servicesGrid is already in the viewport or user is actively filtering or sorting
        const rect = servicesGridRef.current.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight && rect.bottom > 0;

        if (isInView || searchQuery.trim().length > 0 || selectedCategory !== 'All' || sortBy !== 'Most Popular') {
          // Subtle GSAP entrance animation for real-time filtered and sorted results
          gsap.fromTo(cards,
            { opacity: 0.15, y: 14, scale: 0.98 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.38,
              stagger: 0.035,
              ease: 'power2.out',
              overwrite: 'auto'
            }
          );
        } else {
          // Initial entrance scroll trigger
          gsap.set(cards, { opacity: 0, y: 40 });
          const triggers = cards.map((card, i) => {
            return ScrollTrigger.create({
              trigger: card,
              start: 'top 92%',
              once: true,
              onEnter: () => {
                gsap.to(card, {
                  opacity: 1,
                  y: 0,
                  duration: 0.7,
                  delay: i * 0.08,
                  ease: 'power2.out',
                  overwrite: 'auto'
                });
              }
            });
          });

          return () => {
            triggers.forEach(trigger => trigger.kill());
          };
        }
      }

      // If no results, animate empty search message subtly
      if (visibleServices.length === 0 && emptySearchRef.current) {
        gsap.killTweensOf(emptySearchRef.current);
        gsap.fromTo(emptySearchRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', overwrite: 'auto' }
        );
      }
    }
  }, [visibleServices, currentView, searchQuery, selectedCategory, sortBy]);

  return (
    <div className="bg-[#030303] text-gray-200 min-h-screen font-sans selection:bg-[#d4af37]/20 selection:text-[#d4af37] relative overflow-x-hidden">
      
      {/* Real-time WebGL gold fluid fractal background shader */}
      <WebGLBackground />

      {/* Floating navigation header */}
      <Navbar 
        currentView={currentView} 
        onChangeView={(view) => {
          if (view !== 'book') setPreselectedServiceId(null);
          setCurrentView(view);
          window.scrollTo({ top: 0 });
        }}
        pendingCount={pendingCount}
        activeShopName={activeShop?.name}
      />

      {/* VIEW CONDITIONAL ROUTER ENGINE */}
      <main className="relative z-10">

        {/* B2B SAAS LANDING PORTAL HUB (STOPS CONFUSION, RENDER FIRST) */}
        {currentView === 'saas_landing' && (
          <SaaSLandingPage 
            shops={shops}
            onAddNewShop={handleAddNewShop}
            onSelectShop={handleSelectShop}
            onEnterSuperAdmin={handleEnterSuperAdmin}
          />
        )}

        {/* MASTER PLATFORM OWNER CONTROL SUPER ADMIN BOARD */}
        {currentView === 'super_admin' && (
          <SuperAdminPanel 
            shops={shops}
            withdrawRequests={withdrawRequests}
            transactions={transactions}
            bookings={bookings}
            customers={customers}
            onApproveShop={handleApproveShop}
            onSuspendShop={handleSuspendShop}
            onActivateShop={handleActivateShop}
            onApproveWithdraw={handleApproveWithdraw}
            onRejectWithdraw={handleRejectWithdraw}
            onExitAdmin={() => {
              setCurrentView('saas_landing');
              window.scrollTo({ top: 0 });
            }}
          />
        )}

        {/* TENANT CONSUMER WEBSITE: HOME VIEW */}
        {currentView === 'home' && (
          <div id="home-view-canvas">
            
            {/* FESTIVE HERO BANNER */}
            <FestiveHeroBanner onBookNow={() => handleBookNow()} />

            {/* 1. HERO SECTION */}
            <section 
              id="hero-banner-section" 
              className="min-h-screen flex flex-col justify-center items-center text-center px-6 relative pt-20"
            >
              {/* Subtle background luxury asset vignette using the tenant background image */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none -z-10 bg-blend-multiply bg-black" 
                style={{ backgroundImage: `url(${activeShop?.backgroundImage})` }}
              />

              <div className="max-w-4xl space-y-6">
                <span 
                  ref={heroBadgeRef}
                  id="hero-badge-item"
                  className="text-xs font-mono tracking-[0.5em] text-[#d4af37] uppercase block text-amber-500/90"
                >
                  THE ATELIER OF {activeShop?.category.toUpperCase()} PRESTIGE
                </span>
                
                <h1 
                  ref={heroTitleRef}
                  id="hero-main-title"
                  className="text-4xl sm:text-6xl md:text-8xl font-sans tracking-tight text-white uppercase font-light leading-none select-none"
                >
                  {activeShop?.name.replace('Luxury Lab', '').replace('& Contour', '').replace('Parlour', '').replace('Grooming Studio', '')}
                </h1>

                {/* Aesthetic separate gold segment ribbon */}
                <div 
                  ref={heroBarRef}
                  id="hero-gold-separator-bar"
                  className="h-[1.5px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto opacity-75"
                  style={{ width: '80px' }}
                />

                <p 
                  ref={heroSubtitleRef}
                  id="hero-tagline"
                  className="text-xs sm:text-base md:text-xl font-mono text-gray-300 uppercase tracking-[0.23em] leading-relaxed font-light max-w-2xl mx-auto"
                >
                  {activeShop?.tagline}
                </p>

                <div 
                  ref={heroButtonRef}
                  id="hero-cta-wrapper"
                  className="pt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                  <button
                    onClick={() => handleBookNow()}
                    id="hero-primary-cta"
                    className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-amber-500 via-[#d4af37] to-yellow-600 text-black text-xs font-mono font-bold uppercase tracking-[0.25em] rounded-sm transition-all duration-500 hover:opacity-90 active:scale-95 shadow-[0_0_30px_rgba(212,175,55,0.2)] cursor-pointer"
                  >
                    RESERVE A TREATMENT
                  </button>
                  <a
                    href="#services-section"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    id="hero-secondary-cta"
                    className="w-full sm:w-auto px-10 py-5 border border-white/10 text-white text-xs font-mono tracking-[0.2em] uppercase rounded-sm hover:border-[#d4af37]/60 hover:text-[#d4af37] transition-all cursor-pointer"
                  >
                    EXPLORE MENUS
                  </a>
                </div>
              </div>

              {/* Scroll down mouse animation spacer */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-[10px] font-mono tracking-widest text-[#d4af37]/75">
                <span className="animate-pulse">SCROLL TO ATELIER</span>
                <div className="w-[1px] h-12 bg-gradient-to-b from-[#d4af37]/60 to-transparent animate-bounce mt-1" />
              </div>

            </section>

            {/* AESTHETIC HIGHLIGHT LABELS */}
            <section className="py-16 bg-[#060606]/95 border-y border-white/5 relative z-10">
              <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#d4af37]/10 rounded border border-[#d4af37]/30 text-[#d4af37] shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white text-base font-sans font-medium uppercase tracking-wider">VIP PRIVATE EXPERIENCE</h4>
                    <p className="text-sm text-zinc-300 leading-relaxed font-sans font-normal mt-1.5">
                      Private styling suites, complimentary beverages, and dedicated personal attention.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#d4af37]/10 rounded border border-[#d4af37]/30 text-[#d4af37] shrink-0">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white text-base font-sans font-medium uppercase tracking-wider">MASTER STYLISTS</h4>
                    <p className="text-sm text-zinc-300 leading-relaxed font-sans font-normal mt-1.5">
                      Certified specialists with years of high-end salon expertise and artistic precision.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#d4af37]/10 rounded border border-[#d4af37]/30 text-[#d4af37] shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white text-base font-sans font-medium uppercase tracking-wider">PERSONALIZED CARE</h4>
                    <p className="text-sm text-zinc-300 leading-relaxed font-sans font-normal mt-1.5">
                      We record your exact hair and styling preferences to guarantee perfect results every visit.
                    </p>
                  </div>
                </div>

              </div>
            </section>

            {/* JAIPUR FESTIVE SPECIALS */}
            <JaipurFestiveSpecials
              onSelectService={(srv) => {
                setSelectedServiceForModal(srv);
              }}
              onOpenQuickView={(srv) => {
                setSelectedServiceForQuickView(srv);
              }}
            />

            {/* STAFF PICKS SECTION */}
            <StaffPicksSection
              onSelectService={(srv) => {
                setSelectedServiceForModal(srv);
              }}
              onOpenStaffProfile={(artisan) => {
                setSelectedStaffMember(artisan);
              }}
            />

            {/* 2. DYNAMIC SERVICES GRID OF THIS DIRECT TENANT */}
            <section 
              id="services-section" 
              className="py-32 px-6 bg-[#030303] relative z-10"
            >
              {/* Subtle top border gradient divider */}
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#d4af37]/25 to-transparent z-20" />

              <div className="max-w-7xl mx-auto">
                
                {/* Header */}
                <div className="text-center mb-12">
                  <span className="text-xs font-mono tracking-[0.3em] text-[#d4af37] uppercase block mb-3 font-semibold">
                    Curated Treatment Menus
                  </span>
                  <h2 className="text-4xl md:text-5xl font-sans tracking-tight text-white uppercase font-light">
                    THE MENUS OF <span className="text-[#d4af37] font-semibold italic">TRANSFORMATION</span>
                  </h2>
                  <p className="mt-4 text-zinc-200 text-sm sm:text-base font-sans font-normal max-w-xl mx-auto leading-relaxed">
                    Precision haircuts, customized color transformations, and restorative spa therapies tailored to your unique style.
                  </p>
                </div>

                {/* Real-time Search Input Bar & Sort By Dropdown Menu */}
                <div id="services-search-container" className="max-w-4xl mx-auto mb-10 px-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    
                    {/* Search Input Bar */}
                    <div className="relative flex-1 flex items-center bg-[#0a0a0a]/90 border border-[#d4af37]/20 hover:border-[#d4af37]/50 focus-within:border-[#d4af37] focus-within:shadow-[0_0_20px_rgba(212,175,55,0.18)] rounded-full transition-all duration-300 p-1.5 pl-4 pr-2">
                      <Search className="w-4 h-4 text-[#d4af37] shrink-0 mr-3" />
                      <input
                        id="services-search-input"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search treatments by name or description..."
                        className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-gray-500 font-sans font-light focus:outline-none"
                      />
                      {searchQuery && (
                        <button
                          id="services-search-clear-btn"
                          onClick={() => setSearchQuery('')}
                          aria-label="Clear search"
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors mr-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span className="hidden md:flex text-[10px] font-mono tracking-widest text-[#d4af37] bg-[#d4af37]/10 border border-[#d4af37]/20 px-3 py-1 rounded-full shrink-0">
                        {visibleServices.length} {visibleServices.length === 1 ? 'TREATMENT' : 'TREATMENTS'}
                      </span>
                    </div>

                    {/* 'Sort By' Dropdown Menu */}
                    <div ref={sortDropdownRef} className="relative shrink-0">
                      <button
                        id="services-sort-dropdown-btn"
                        type="button"
                        onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                        aria-haspopup="listbox"
                        aria-expanded={isSortDropdownOpen}
                        className="w-full sm:w-auto h-full min-h-[46px] px-4 py-2.5 bg-[#0a0a0a]/90 border border-[#d4af37]/25 hover:border-[#d4af37]/60 focus:border-[#d4af37] rounded-full text-xs font-mono tracking-wider text-white flex items-center justify-between sm:justify-center gap-2.5 transition-all duration-300 hover:shadow-[0_0_15px_rgba(212,175,55,0.15)] cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span className="text-gray-400 text-[10px] sm:text-[11px] uppercase tracking-widest">Sort:</span>
                          <span className="text-[#d4af37] font-semibold">{sortBy}</span>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 text-[#d4af37] transition-transform duration-300 ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Dropdown Menu */}
                      {isSortDropdownOpen && (
                        <div 
                          id="services-sort-menu"
                          role="listbox"
                          aria-label="Sort options"
                          className="absolute right-0 top-full mt-2 w-full sm:w-64 bg-[#0d0d0d]/98 backdrop-blur-xl border border-[#d4af37]/35 rounded-xl p-1.5 shadow-[0_15px_35px_rgba(0,0,0,0.85),0_0_20px_rgba(212,175,55,0.15)] z-40 animate-in fade-in zoom-in-95 duration-150"
                        >
                          <div className="px-3 py-1.5 text-[9px] font-mono tracking-[0.2em] text-[#d4af37]/75 uppercase border-b border-white/5 mb-1 flex items-center justify-between">
                            <span>ARRANGE PROTOCOLS</span>
                            <ArrowUpDown className="w-3 h-3 text-[#d4af37]/60" />
                          </div>

                          {([
                            { label: 'Most Popular', desc: 'Atelier favorites & highest reservations', icon: Star, id: 'sort-option-most-popular' },
                            { label: 'Price: Low to High', desc: 'Accessible entry to bespoke', icon: ArrowUp, id: 'sort-option-price-low-to-high' },
                            { label: 'Price: High to Low', desc: 'Comprehensive signature transformations', icon: ArrowDown, id: 'sort-option-price-high-to-low' }
                          ] as const).map((option) => {
                            const isSelected = sortBy === option.label;
                            const IconComp = option.icon;
                            return (
                              <button
                                key={option.label}
                                id={option.id}
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => handleSortChange(option.label)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-mono transition-all duration-200 flex items-center justify-between cursor-pointer mb-0.5 ${
                                  isSelected 
                                    ? 'bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30 shadow-[0_0_12px_rgba(212,175,55,0.12)]' 
                                    : 'text-gray-300 hover:text-white hover:bg-white/5 border border-transparent'
                                }`}
                              >
                                <div className="flex items-start gap-2.5">
                                  <IconComp className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isSelected ? 'text-[#d4af37]' : 'text-gray-500'}`} />
                                  <div>
                                    <div className="font-semibold tracking-wide text-xs">{option.label}</div>
                                    <div className="text-[10px] text-gray-500 font-sans font-light mt-0.5">{option.desc}</div>
                                  </div>
                                </div>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-[#d4af37] shrink-0 ml-2" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active filter and sort status note */}
                  {(searchQuery.trim() || selectedCategory !== 'All' || sortBy !== 'Most Popular') && (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-gray-400 px-4 mt-3 pt-2.5 border-t border-white/5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-gray-500">Active:</span>
                        {searchQuery.trim() && (
                          <span className="bg-white/5 border border-white/10 px-2.5 py-0.5 rounded text-white flex items-center gap-1.5">
                            Query: <strong className="text-[#d4af37]">"{searchQuery}"</strong>
                            <button onClick={() => setSearchQuery('')} className="hover:text-red-400 ml-0.5 cursor-pointer">×</button>
                          </span>
                        )}
                        {selectedCategory !== 'All' && (
                          <span className="bg-white/5 border border-white/10 px-2.5 py-0.5 rounded text-white flex items-center gap-1.5">
                            Category: <strong className="text-[#d4af37]">{selectedCategory}</strong>
                            <button onClick={() => setSelectedCategory('All')} className="hover:text-red-400 ml-0.5 cursor-pointer">×</button>
                          </span>
                        )}
                        {sortBy !== 'Most Popular' && (
                          <span className="bg-[#d4af37]/10 border border-[#d4af37]/30 px-2.5 py-0.5 rounded text-[#d4af37] flex items-center gap-1.5">
                            Order: <strong>{sortBy}</strong>
                            <button onClick={() => handleSortChange('Most Popular')} className="hover:text-white ml-0.5 cursor-pointer">×</button>
                          </span>
                        )}
                      </div>
                      <button
                        id="reset-all-filters-sort-btn"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('All');
                          handleSortChange('Most Popular');
                        }}
                        className="text-[#d4af37] hover:underline cursor-pointer text-[10px] uppercase tracking-wider flex items-center gap-1"
                      >
                        Reset All Filters & Sort &rarr;
                      </button>
                    </div>
                  )}
                </div>

                {/* Dynamic Category Filter Headers */}
                <div className="flex justify-center items-center gap-3 mb-12 flex-wrap">
                  {availableCategories.map((category) => {
                    const isActive = category === selectedCategory;
                    return (
                      <button
                        key={category}
                        id={`filter-category-${category.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => handleFilterCategory(category)}
                        className={`px-5 py-2.5 text-[10px] sm:text-xs font-mono tracking-widest uppercase transition-all duration-300 rounded-full border cursor-pointer flex items-center justify-center gap-2 ${
                          isActive 
                            ? 'bg-[#d4af37] text-black border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.25)] font-bold' 
                            : 'bg-black/40 text-gray-400 border-white/10 hover:border-[#d4af37]/40 hover:text-white'
                        }`}
                      >
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-black block animate-pulse" />}
                        <span>{category}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Dynamic Category Summary Description */}
                <div 
                  ref={categoryDescRef}
                  id="category-summary-description"
                  className="max-w-3xl mx-auto text-center mb-16 px-4"
                >
                  <p className="text-[10px] font-mono tracking-[0.3em] text-[#d4af37] uppercase mb-2">
                    {selectedCategory} PRESTIGE SUITE
                  </p>
                  <p className="text-gray-300 font-sans font-light text-sm sm:text-base leading-relaxed italic max-w-lg mx-auto">
                    {categoryDescriptions[selectedCategory] || `A premium suite of curated ${selectedCategory.toLowerCase()} treatments designed for elite standards and delivered with uncompromising precision.`}
                  </p>
                  <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/35 to-transparent mx-auto mt-4" />
                </div>

                {/* dynamic items filtered of active shop */}
                <div 
                  ref={servicesGridRef}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {visibleServices.length === 0 ? (
                    <div 
                      ref={emptySearchRef}
                      id="services-search-empty-state"
                      className="col-span-full py-16 px-6 text-center bg-[#090909]/80 border border-white/5 rounded-sm max-w-xl mx-auto my-6 shadow-2xl backdrop-blur-sm"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/25 flex items-center justify-center mx-auto mb-4 text-[#d4af37]">
                        <Search className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-sans font-light text-white uppercase tracking-wider">
                        No Treatment Protocols Found
                      </h3>
                      <p className="text-xs text-gray-400 mt-2 font-sans font-light max-w-md mx-auto leading-relaxed">
                        No service matches <span className="text-[#d4af37]">"{searchQuery}"</span>
                        {selectedCategory !== 'All' ? ` within ${selectedCategory}.` : '.'} Try another keyword or reset the search.
                      </p>
                      <div className="flex justify-center items-center gap-3 mt-6">
                        {searchQuery && (
                          <button
                            id="reset-search-query-btn"
                            onClick={() => setSearchQuery('')}
                            className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 hover:text-white text-xs font-mono tracking-widest uppercase rounded-sm transition-colors cursor-pointer"
                          >
                            Clear Keyword
                          </button>
                        )}
                        <button
                          id="reset-all-filters-btn"
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedCategory('All');
                            handleSortChange('Most Popular');
                          }}
                          className="px-5 py-2 bg-[#d4af37] text-black text-xs font-mono tracking-widest uppercase font-bold rounded-sm hover:bg-[#b8972e] transition-colors cursor-pointer"
                        >
                          View All Services
                        </button>
                      </div>
                    </div>
                  ) : (
                    visibleServices.map((srv) => (
                    <div 
                      key={srv.id}
                      id={`home-service-card-${srv.id}`}
                      className="group bg-[#090909]/80 border border-white/5 hover:border-[#d4af37]/40 rounded-sm overflow-hidden flex flex-col justify-between transition-all duration-700 shadow-2xl hover:translate-y-[-4px]"
                    >
                      {/* Image placeholder */}
                      <div className="relative h-64 overflow-hidden">
                        <img 
                          src={srv.image} 
                          alt={srv.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105" 
                        />
                        {/* Elegant linear dark shade */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-transparent to-transparent opacity-90" />
                        
                        {/* Dynamic Popularity Tag */}
                        {trendingServicesMap[srv.id.toLowerCase()] && (
                          <div className="absolute top-4 left-4 z-20">
                            <span className={`text-[9px] font-mono tracking-widest uppercase px-3 py-1.5 rounded-sm border font-semibold flex items-center gap-1.5 backdrop-blur-md shadow-lg ${
                              trendingServicesMap[srv.id.toLowerCase()] === 'Most Popular'
                                ? 'bg-[#d4af37] text-black border-[#d4af37] shadow-[#d4af37]/25'
                                : 'bg-black/85 text-amber-100 border-[#d4af37]/30 shadow-black'
                            }`}>
                              <Star className={`w-3 h-3 ${trendingServicesMap[srv.id.toLowerCase()] === 'Most Popular' ? 'fill-black stroke-black' : 'fill-[#d4af37] stroke-[#d4af37]'}`} />
                              {trendingServicesMap[srv.id.toLowerCase()]}
                            </span>
                          </div>
                        )}

                        {/* Rating/Price badges overlay */}
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                          <span className="bg-black/85 text-[#d4af37] text-[10px] font-mono tracking-widest uppercase px-3 py-1.5 rounded-full border border-[#d4af37]/20 font-bold">
                            ${srv.price}
                          </span>
                        </div>
                      </div>

                      {/* Info Content Block */}
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-mono tracking-wider text-[#d4af37] uppercase font-semibold">
                              {srv.category}
                            </span>
                            <span className="text-zinc-600 font-mono text-xs">&bull;</span>
                            <span className="text-xs text-zinc-300 font-mono font-medium">
                              {srv.duration} Minutes
                            </span>
                          </div>

                          <h3 className="text-xl font-sans font-medium tracking-wide text-white group-hover:text-[#d4af37] transition-colors duration-300">
                            {srv.name}
                          </h3>
                          
                          <p className="text-sm text-zinc-200 mt-2.5 font-sans font-normal leading-relaxed">
                            {srv.description}
                          </p>
                        </div>

                        {/* Bullet checklist features */}
                        <ul className="space-y-2 mt-5 border-t border-zinc-800/80 pt-4">
                          {srv.features.slice(0, 2).map((feat, fi) => (
                            <li key={fi} className="text-xs text-zinc-300 font-sans font-normal flex items-center gap-2.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
                              <span className="truncate">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Footer Actions */}
                      <div className="p-6 pt-0 flex flex-col gap-2">
                        <button
                          onClick={() => handleBookNow(srv.id)}
                          id={`btn-book-now-${srv.id}`}
                          className="w-full py-3 bg-zinc-900 border border-white/5 text-xs font-mono tracking-widest uppercase text-[#d4af37] hover:bg-[#d4af37] hover:text-black hover:border-[#d4af37] transition-all duration-500 flex items-center justify-center gap-1 cursor-pointer font-semibold rounded-sm"
                        >
                          Book Experience <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setSelectedServiceForQuickView(selectedServiceForQuickView?.id === srv.id ? null : srv)}
                            id={`btn-quick-view-${srv.id}`}
                            className={`py-2 rounded-sm border text-[10px] sm:text-xs font-mono tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                              selectedServiceForQuickView?.id === srv.id
                                ? 'bg-[#d4af37] text-black border-[#d4af37] font-semibold shadow-[0_0_10px_rgba(212,175,55,0.2)]'
                                : 'bg-transparent border-white/5 text-gray-400 hover:text-white hover:border-[#d4af37]/30'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Quick View
                          </button>
                          
                          <button
                            onClick={() => setSelectedServiceForModal(srv)}
                            id={`btn-view-details-${srv.id}`}
                            className="py-2 bg-transparent border border-white/5 text-[10px] sm:text-xs font-mono tracking-widest uppercase text-gray-400 hover:text-white hover:border-[#d4af37]/40 transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer rounded-sm"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#d4af37]/50" />
                            Protocol
                          </button>
                        </div>
                      </div>

                    </div>
                  ))
                )}
                </div>

              </div>
              {/* Subtle bottom border gradient divider */}
              <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#d4af37]/25 to-transparent z-20" />
            </section>

            {/* MEET THE ARTISANS SECTION */}
            <ArtisansList 
              onBookWithArtisan={() => handleBookNow()} 
              onViewStaffProfile={(artisan) => setSelectedStaffMember(artisan)}
            />

            {/* 3. PARALLAX GALLERY SECTION */}
            <ParallaxGallery />

            {/* 4. TESTIMONIALS SECTION */}
            <section 
              id="testimonials-section" 
              className="py-32 px-6 bg-gradient-to-b from-[#030303] to-[#080808] relative z-10"
            >
              <div className="max-w-7xl mx-auto">
                
                {/* Section Header */}
                <div className="text-center mb-20">
                  <span className="text-xs font-mono tracking-[0.43em] text-[#d4af37] uppercase block mb-3">
                    Guest Endorsements
                  </span>
                  <h2 className="text-4xl md:text-5xl font-sans tracking-tight text-white uppercase font-light">
                    THE VERDICT OF <span className="text-[#d4af37] font-semibold italic">PRESTIGE</span>
                  </h2>
                  <p className="text-[11px] font-mono text-gray-500 uppercase tracking-widest mt-3">
                    Hover guest endorsements to reveal verified treatment protocols
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {TESTIMONIALS.map((review) => (
                    <div 
                      key={review.id}
                      id={`testimonial-card-${review.id}`}
                      className="group p-8 bg-[#0b0b0b]/80 hover:bg-[#111111]/90 border border-white/5 hover:border-[#d4af37]/40 rounded-sm relative shadow-2xl flex flex-col justify-between transition-all duration-300 hover:shadow-[0_12px_36px_rgba(212,175,55,0.08)] hover:-translate-y-1 cursor-default"
                    >
                      {/* Top Header: Interactive Gold Stars & Verified Guest Badge */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex gap-1.5">
                          {[...Array(review.rating)].map((_, si) => (
                            <Star key={si} className="w-4 h-4 fill-[#d4af37] text-[#d4af37] stroke-[1]" />
                          ))}
                        </div>
                        {review.verifiedTreatment && (
                          <div 
                            id={`testimonial-badge-verified-${review.id}`}
                            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/25 text-[10px] font-mono text-[#d4af37] tracking-wider uppercase transition-all duration-300 group-hover:bg-[#d4af37]/20 group-hover:border-[#d4af37]/50"
                          >
                            <Check className="w-2.5 h-2.5 text-[#d4af37]" />
                            <span className="font-medium">Verified Guest</span>
                          </div>
                        )}
                      </div>

                      {/* Review body quotes */}
                      <p className="text-sm text-gray-300 font-sans font-light leading-relaxed italic mb-8">
                        "{review.content}"
                      </p>

                      {/* Guest Credentials label */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-4">
                        <div>
                          <h4 className="text-sm font-sans font-medium text-white">{review.name}</h4>
                          <span className="text-[10px] text-gray-500 font-mono block mt-0.5 uppercase tracking-widest">{review.role}</span>
                        </div>
                        <span className="text-[10px] text-gray-600 font-mono">{review.date}</span>
                      </div>

                      {/* ELEGANT HOVER-REVEAL: Booked Service Treatment Context */}
                      <div 
                        id={`testimonial-service-reveal-${review.id}`}
                        className="mt-4 pt-3.5 border-t border-white/5 relative"
                      >
                        {/* Default compact preview (subtly indicates treatment booked) */}
                        <div className="flex items-center justify-between text-xs font-mono text-gray-400 transition-all duration-300 group-hover:opacity-0 group-hover:h-0 group-hover:overflow-hidden group-hover:py-0">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]/50"></span>
                            <span className="text-[10px] tracking-[0.18em] uppercase text-gray-400 font-mono">Booked Treatment</span>
                          </div>
                          <span className="text-[11px] text-[#d4af37]/90 font-sans italic truncate max-w-[150px]">
                            {review.serviceName}
                          </span>
                        </div>

                        {/* Expanded elegant reveal on hover */}
                        <div className="max-h-0 opacity-0 group-hover:max-h-36 group-hover:opacity-100 overflow-hidden transition-all duration-300 ease-out">
                          <div className="p-3 rounded bg-gradient-to-r from-[#d4af37]/12 via-[#d4af37]/5 to-[#080808] border border-[#d4af37]/30 shadow-lg">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse"></span>
                                <span className="text-[9px] font-mono tracking-[0.22em] text-[#d4af37] uppercase font-semibold">
                                  Treatment Verified
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-gray-400">
                                ${review.servicePrice} • {review.serviceDuration} min
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <h5 className="text-sm font-sans font-medium text-white tracking-tight flex items-center gap-1.5 truncate">
                                  <Sparkles className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                                  <span className="text-[#d4af37] truncate">{review.serviceName}</span>
                                </h5>
                                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mt-0.5 truncate">
                                  {review.serviceTag || review.serviceCategory}
                                </p>
                              </div>

                              {review.serviceId && (
                                <button
                                  type="button"
                                  id={`btn-testimonial-protocol-${review.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const srv = PREMIUM_SERVICES.find(s => s.id === review.serviceId);
                                    if (srv) {
                                      setSelectedServiceForModal(srv);
                                    }
                                  }}
                                  className="shrink-0 px-2.5 py-1 bg-[#d4af37]/15 hover:bg-[#d4af37] text-[#d4af37] hover:text-black border border-[#d4af37]/40 hover:border-[#d4af37] rounded-sm text-[10px] font-mono uppercase tracking-widest transition-all duration-200 flex items-center gap-1 cursor-pointer"
                                  title="View Treatment Protocol"
                                >
                                  <span>Protocol</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

              </div>
            </section>

          </div>
        )}

        {/* BOOK NOW VIEW PAGE */}
        {currentView === 'book' && (
          <BookNow 
            initialServiceId={preselectedServiceId} 
            activeShopId={activeShopId}
            onBookingComplete={() => {
              setRefreshTrigger(prev => prev + 1);
            }}
            onNavigateHome={() => {
              setCurrentView('home');
              window.scrollTo({ top: 0 });
            }}
          />
        )}

        {/* OWNER CONCIERGE DASHBOARD PAGE */}
        {currentView === 'dashboard' && (
          <OwnerDashboard 
            activeShopId={activeShopId}
            shops={shops}
            bookings={bookings}
            setBookings={setBookings}
            staff={staff}
            setStaff={setStaff}
            customers={customers}
            setCustomers={setCustomers}
            onBookingStateChange={() => {
              setRefreshTrigger(prev => prev + 1);
            }}
            onRefreshTrigger={refreshTrigger}
            onAddTransaction={handleAddTransaction}
            onUpdateShopBalance={handleUpdateShopBalance}
            onAddWithdrawRequest={handleAddWithdrawRequest}
            onViewStaffProfile={(st) => setSelectedStaffMember(st)}
            onExit={() => {
              setCurrentView('saas_landing');
              window.scrollTo({ top: 0 });
            }}
          />
        )}
      </main>

      {/* 5. FOOTER */}
      <footer 
        id="nexora-footer"
        className="relative z-20 bg-[#070707] border-t border-zinc-800/80 pt-20 pb-12 text-sm text-zinc-300"
      >
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-16">
          
          {/* Col 1: Branding and description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full border border-[#d4af37] flex items-center justify-center font-serif text-xs text-[#d4af37] font-bold">N</div>
              <span className="font-sans font-medium text-base text-white tracking-[0.2em] uppercase">AURA STUDIO & SALON</span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed font-normal max-w-sm">
              Aura Studio & Salon connects clients with top luxury salon branches in Jaipur. Enjoy effortless appointment booking, master stylists, and personalized care.
            </p>
          </div>

          {/* Col 2: Salon Opening Hours */}
          <div className="space-y-4">
            <h5 className="text-white text-xs font-mono uppercase tracking-widest text-[#d4af37] font-semibold">Opening Hours</h5>
            <ul className="space-y-3 text-sm font-sans">
              <li className="flex items-center justify-between border-b border-zinc-800/80 pb-2 gap-3">
                <span className="text-zinc-300 font-medium whitespace-nowrap">Monday – Friday</span>
                <span className="font-mono text-white font-medium whitespace-nowrap">09:00 AM – 07:00 PM</span>
              </li>
              <li className="flex items-center justify-between border-b border-zinc-800/80 pb-2 gap-3">
                <span className="text-zinc-300 font-medium whitespace-nowrap">Saturday</span>
                <span className="font-mono text-[#d4af37] font-semibold whitespace-nowrap">09:00 AM – 05:00 PM</span>
              </li>
              <li className="flex items-center justify-between pb-1 gap-3">
                <span className="text-zinc-300 font-medium whitespace-nowrap">Sunday</span>
                <span className="font-mono text-zinc-500 font-medium uppercase whitespace-nowrap">Closed</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact information */}
          <div className="space-y-4">
            <h5 className="text-white text-xs font-mono uppercase tracking-widest text-[#d4af37] font-semibold">Contact & Location</h5>
            <ul className="space-y-3 text-sm font-sans">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <span className="text-zinc-200">C-Scheme, Near Statue Circle, Jaipur</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#d4af37] shrink-0" />
                <a href="tel:+15558902401" className="text-zinc-200 hover:text-[#d4af37] transition-colors">+1 (555) 890-2401</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#d4af37] shrink-0" />
                <a href="mailto:concierge@aurastudio.in" className="text-zinc-200 hover:text-[#d4af37] transition-colors break-all">concierge@aurastudio.in</a>
              </li>
            </ul>
          </div>

          {/* Col 4: Newsletter & Updates */}
          <div className="space-y-4">
            <h5 className="text-white text-xs font-mono uppercase tracking-widest text-[#d4af37] font-semibold">Newsletter & Updates</h5>
            <p className="text-sm text-zinc-300 leading-relaxed font-normal">
              Subscribe for seasonal style trends, special promotional offers, and priority appointment booking.
            </p>
            <div className="flex rounded-md overflow-hidden border border-zinc-700 focus-within:border-[#d4af37] transition-colors">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="bg-[#111] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 w-full focus:outline-none"
              />
              <button className="bg-[#d4af37] text-black px-4 py-2.5 text-xs font-bold uppercase hover:bg-yellow-400 transition-colors cursor-pointer shrink-0">
                JOIN
              </button>
            </div>
          </div>

        </div>

        {/* Bottom micro bar */}
        <div className="max-w-7xl mx-auto px-6 border-t border-zinc-800/80 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-4">
          <p className="font-sans text-xs tracking-wide">
            &copy; {new Date().getFullYear()} Aura Studio & Salon. All rights reserved. Connecting beauty lovers with top luxury salons in Jaipur.
          </p>
          
          <div className="flex gap-4">
            <a href="#instagram" aria-label="Instagram" className="hover:text-[#d4af37] transition-colors p-1"><Instagram className="w-4 h-4" /></a>
            <a href="#facebook" aria-label="Facebook" className="hover:text-[#d4af37] transition-colors p-1"><Facebook className="w-4 h-4" /></a>
          </div>
        </div>

      </footer>

      {/* IMMERSIVE LUXURY SERVICE MODAL */}
      {selectedServiceForModal && (
        <div 
          ref={modalOverlayRef}
          id="service-protocol-modal-overlay"
          className="fixed inset-0 bg-black/92 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto"
          onClick={handleCloseModal}
        >
          {/* Inner content container */}
          <div 
            ref={modalContentRef}
            id="service-protocol-modal-content"
            className="bg-[#0b0b0b] border border-white/10 rounded-sm w-full max-w-4xl overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.15)] relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Actions: Share & Close */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
              <button 
                onClick={() => handleShareProtocol(selectedServiceForModal)}
                id="share-protocol-btn"
                title="Share this service protocol"
                aria-label="Share this service protocol"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all duration-300 border cursor-pointer backdrop-blur-md ${
                  shareCopied
                    ? 'bg-[#d4af37] text-black border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.4)] font-semibold'
                    : 'bg-black/60 text-gray-300 border-white/10 hover:border-[#d4af37]/50 hover:text-[#d4af37] hover:bg-black/80'
                }`}
              >
                {shareCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-black" />
                    <span className="tracking-wider uppercase text-[10px]">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span className="tracking-wider uppercase text-[10px]">Share</span>
                  </>
                )}
              </button>

              <button 
                onClick={handleCloseModal}
                id="close-protocol-modal-btn"
                aria-label="Close protocol modal"
                className="text-gray-400 hover:text-[#d4af37] transition-colors p-2 cursor-pointer border border-white/5 bg-black/60 hover:border-[#d4af37]/30 rounded-full backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct Link Copied Toast Notification */}
            {shareCopied && (
              <div 
                id="share-protocol-toast"
                className="absolute top-16 right-4 sm:right-6 bg-[#161616]/95 border border-[#d4af37]/60 text-white text-[11px] font-mono px-3.5 py-2 rounded shadow-[0_4px_25px_rgba(0,0,0,0.85)] flex items-center gap-2.5 z-40"
              >
                <Check className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Direct link copied to clipboard for sharing</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2">
              
              {/* Left Column: Visual branding and short summary */}
              <div className="relative h-64 md:h-auto min-h-[300px] overflow-hidden flex flex-col justify-end p-8">
                <img 
                  src={selectedServiceForModal.image} 
                  alt={selectedServiceForModal.name} 
                  className="absolute inset-0 w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b]/60 to-black/40 z-10" />
                
                {/* Visual accents */}
                <div className="relative z-20 space-y-3">
                  <span className="text-[10px] font-mono tracking-[0.3em] text-[#d4af37] uppercase block">
                    {selectedServiceForModal.category} • {selectedServiceForModal.duration} Mins
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-sans font-light text-white uppercase tracking-wide">
                    {selectedServiceForModal.name}
                  </h3>
                  <div className="w-16 h-[1.5px] bg-[#d4af37]" />
                  <p className="text-xs text-gray-300 font-sans font-light leading-relaxed max-w-sm">
                    {selectedServiceForModal.description}
                  </p>
                  <div className="text-3xl font-mono text-[#d4af37] font-semibold pt-2">
                    ${selectedServiceForModal.price}
                  </div>
                </div>
              </div>

              {/* Right Column: Complex details metadata */}
              <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[85vh] md:max-h-[620px] bg-black/40">
                
                {/* 1. Deep Scientific/Precision details */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono text-[#d4af37] uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" /> Treatment Philosophy
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-300 font-sans font-light leading-relaxed">
                    {serviceExtendedDetails[selectedServiceForModal.id]?.richDescription || 
                     "An absolute bespoke approach utilizing elite-level chemical synthesis and geometry formulation corresponding with global grooming research standards."}
                  </p>
                </div>

                {/* 2. Treatment Phases */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono text-[#d4af37] uppercase tracking-widest flex items-center gap-2">
                    <Compass className="w-3.5 h-3.5" /> Protocol Phases
                  </h4>
                  <div className="space-y-2">
                    {(serviceExtendedDetails[selectedServiceForModal.id]?.phases || selectedServiceForModal.features).map((phase, pi) => (
                      <div key={pi} className="flex gap-3 text-xs sm:text-sm">
                        <span className="font-mono text-[#d4af37]/75 text-xs select-none">0{pi + 1}</span>
                        <p className="text-gray-400 font-light font-sans">{phase}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Post-care Recommendations */}
                <div className="space-y-2 bg-[#090909]/90 border border-white/5 p-4 rounded-sm">
                  <h4 className="text-xs font-mono text-[#d4af37] uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Professional Post-Care
                  </h4>
                  <ul className="space-y-1.5 text-xs text-gray-400 font-sans font-light">
                    {(serviceExtendedDetails[selectedServiceForModal.id]?.postCare || [
                      "Avoid strong direct moisture or chemical hair styling products for 24-48 hours.",
                      "Cleanse with elite, sulfate-free nourishing shampoos.",
                      "Moisturize hair tips or styling lines nightly to extend the lifetime of your look."
                    ]).map((instruction, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-[#d4af37] text-xs font-bold leading-none select-none">•</span>
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 4. Staff recommendations context */}
                {serviceExtendedDetails[selectedServiceForModal.id]?.recommendedStaff?.[0] && (
                  <div className="space-y-2 border-t border-white/5 pt-4">
                    <h5 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Master Ambassador Recommendation</h5>
                    <div 
                      onClick={() => {
                        const recName = serviceExtendedDetails[selectedServiceForModal.id]?.recommendedStaff[0].name;
                        const matched = ARTISANS.find(a => a.name === recName) || MOCK_STAFF.find(s => s.name === recName);
                        if (matched) {
                          setSelectedStaffMember(matched);
                        }
                      }}
                      className="flex items-start gap-4 bg-[#111]/40 hover:bg-[#161616] p-3 rounded-sm border border-white/5 hover:border-[#d4af37]/40 transition-all cursor-pointer group"
                    >
                      <img 
                        src={serviceExtendedDetails[selectedServiceForModal.id]?.recommendedStaff[0].image} 
                        alt="Artisan Avatar" 
                        className="w-12 h-12 rounded-full object-cover border border-[#d4af37]/35 w-12 shrink-0 group-hover:border-[#d4af37]"
                      />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-white font-medium group-hover:text-[#d4af37] transition-colors">
                            {serviceExtendedDetails[selectedServiceForModal.id]?.recommendedStaff[0].name}
                          </p>
                          <span className="text-[9px] font-mono text-[#d4af37] uppercase group-hover:underline">View Portfolio →</span>
                        </div>
                        <p className="text-[9px] font-mono text-gray-400 uppercase">
                          {serviceExtendedDetails[selectedServiceForModal.id]?.recommendedStaff[0].role}
                        </p>
                        <p className="text-[11px] text-gray-400 font-sans italic font-light leading-relaxed">
                          "{serviceExtendedDetails[selectedServiceForModal.id]?.recommendedStaff[0].quote}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Booking & Share Actions directly inside modal */}
                <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      handleCloseModal();
                      setTimeout(() => {
                        handleBookNow(selectedServiceForModal.id);
                      }, 300);
                    }}
                    id="modal-book-now-btn"
                    className="flex-1 py-3 bg-[#d4af37] text-black text-xs font-mono tracking-widest uppercase font-bold hover:bg-opacity-95 transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer rounded-sm"
                  >
                    Reserve This Treatment <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleShareProtocol(selectedServiceForModal)}
                    id="modal-share-protocol-action-btn"
                    className={`py-3 px-4 border text-xs font-mono tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer rounded-sm ${
                      shareCopied
                        ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#d4af37]'
                        : 'bg-transparent border-white/10 text-gray-300 hover:text-white hover:border-[#d4af37]/40'
                    }`}
                  >
                    {shareCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>Link Copied</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>Share Protocol</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCloseModal}
                    id="modal-keep-exploring-btn"
                    className="py-3 px-5 bg-transparent border border-white/10 text-gray-400 text-xs font-mono tracking-widest uppercase hover:text-white hover:border-white/20 transition-all duration-300 cursor-pointer rounded-sm"
                  >
                    Return
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* QUICK VIEW SLIDE-OUT SIDE PANEL (NON-MODAL) */}
      <div 
        ref={quickViewPanelRef}
        id="quick-view-side-panel"
        style={{ transform: 'translateX(100%)' }}
        className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-[#070707] border-l border-white/10 z-[90] shadow-[-10px_0_40px_rgba(0,0,0,0.6)] flex flex-col justify-between overflow-hidden"
      >
        {quickViewContent ? (
          <div id="quickview-inner-content" className="h-full flex flex-col justify-between">
            
            {/* Header Image cover */}
            <div className="relative">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={quickViewContent.image} 
                  alt={quickViewContent.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-[#070707]/40 to-transparent" />
                
                {/* Close Panel Button */}
                <button 
                  onClick={() => setSelectedServiceForQuickView(null)}
                  id="close-quickview-btn"
                  className="absolute top-4 left-4 bg-black/70 border border-white/10 text-gray-400 hover:text-white transition-colors p-1.5 rounded-full z-20 cursor-pointer hover:border-[#d4af37]/40"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Price badge overlay */}
                <div className="absolute bottom-4 right-4 bg-black/90 border border-[#d4af37]/25 px-3 py-1 rounded-sm z-20 text-[#d4af37] font-mono text-xs tracking-wider font-semibold">
                  ${quickViewContent.price}
                </div>
              </div>
            </div>

            {/* Scrollable Center parameters */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              
              {/* Categorization & Duration */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono tracking-widest text-[#d4af37] uppercase">
                    {quickViewContent.category}
                  </span>
                  <span className="text-gray-700 font-mono text-[9px] select-none">&bull;</span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {quickViewContent.duration} minutes
                  </span>
                </div>
                <h3 className="text-lg font-sans font-light text-white uppercase tracking-wide">
                  {quickViewContent.name}
                </h3>
                <div className="w-10 h-[1px] bg-gradient-to-r from-[#d4af37] to-transparent mt-2" />
              </div>

              {/* Tagline/Introduction */}
              <div className="space-y-2 text-xs">
                <p className="text-gray-300 font-sans font-light leading-relaxed">
                  {quickViewContent.description}
                </p>
                <p className="text-gray-500 font-sans font-light italic leading-relaxed text-[11px]">
                  * Developed under state-of-the-art styling standards to frame your unique profile.
                </p>
              </div>

              {/* Features bullets */}
              <div className="space-y-3 pt-1">
                <h4 className="text-[10px] font-mono tracking-widest text-[#d4af37] uppercase flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#d4af37]/60" /> Core Protocols
                </h4>
                <ul className="space-y-2">
                  {quickViewContent.features.map((feat, idx) => (
                    <li key={idx} className="flex gap-2.5 text-xs text-gray-400 font-sans font-light">
                      <span className="font-mono text-[#d4af37]/60 text-[10px] select-none">0{idx + 1}</span>
                      <span className="leading-tight">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Ambassador insights if available */}
              {serviceExtendedDetails[quickViewContent.id.toLowerCase()]?.recommendedStaff?.[0] && (
                <div className="bg-[#111]/50 border border-white/5 p-3 rounded-sm space-y-2 mt-2">
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block font-semibold">AMBASSADOR SUGGESTION</span>
                  <div className="flex items-start gap-3">
                    <img 
                      src={serviceExtendedDetails[quickViewContent.id.toLowerCase()].recommendedStaff[0].image} 
                      alt="Artisan" 
                      className="w-8 h-8 rounded-full object-cover border border-[#d4af37]/20 shrink-0"
                    />
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-white font-medium">
                        {serviceExtendedDetails[quickViewContent.id.toLowerCase()].recommendedStaff[0].name}
                      </p>
                      <p className="text-[10px] text-gray-400 font-sans font-light leading-snug italic">
                        "{serviceExtendedDetails[quickViewContent.id.toLowerCase()].recommendedStaff[0].quote}"
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer booking triggers */}
            <div className="p-6 border-t border-white/10 bg-[#070707] space-y-2">
              <button
                onClick={() => {
                  setSelectedServiceForQuickView(null);
                  setTimeout(() => {
                    handleBookNow(quickViewContent.id);
                  }, 180);
                }}
                id="quickview-book-btn"
                className="w-full py-3 bg-[#d4af37] text-black text-xs font-mono tracking-widest uppercase font-bold hover:bg-opacity-95 transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer rounded-sm"
              >
                Book Experience now <ChevronRight className="w-3.5 h-3.5" />
              </button>
              
              <button
                onClick={() => {
                  setSelectedServiceForModal(quickViewContent);
                }}
                id="quickview-detailed-btn"
                className="w-full py-2 bg-transparent border border-white/5 text-[10px] sm:text-xs font-mono tracking-widest uppercase text-gray-400 hover:text-white hover:border-[#d4af37]/40 transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer rounded-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#d4af37]/50" />
                View Detailed Protocol
              </button>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-gray-500 space-y-2">
            <Eye className="w-8 h-8 text-gray-750 animate-pulse text-[#d4af37]/50" />
            <p className="text-xs font-mono tracking-widest uppercase">Browse Fleet</p>
            <p className="text-[11px] font-sans font-light max-w-xs leading-relaxed text-gray-400">
              Select "Quick View" on our treatments to instantly preview core profiles.
            </p>
          </div>
        )}
      </div>

      {/* IMMERSIVE MASTER ARTISAN & STAFF MEMBER PROFILE MODAL */}
      {selectedStaffMember && (
        <StaffProfileModal
          staff={selectedStaffMember}
          allStaff={[...ARTISANS, ...staff.filter(s => !ARTISANS.some(a => a.name === s.name))]}
          activeShopId={activeShopId}
          onClose={() => setSelectedStaffMember(null)}
          onBookService={(serviceId) => {
            setSelectedStaffMember(null);
            if (serviceId) {
              setPreselectedServiceId(serviceId);
            }
            setCurrentView('book');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSelectOtherStaff={(other) => {
            setSelectedStaffMember(other);
          }}
        />
      )}

      {/* GLOBAL QUICK BOOK FLOATING ACTION BUTTON (FAB) */}
      <QuickBookFAB
        currentView={currentView}
        onInitiateBooking={(serviceId) => {
          handleBookNow(serviceId || null);
        }}
        services={PREMIUM_SERVICES}
        activeShopName={activeShop?.name}
      />

    </div>
  );
}
