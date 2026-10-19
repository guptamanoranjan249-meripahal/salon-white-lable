import React, { useState, useEffect } from 'react';
import { PREMIUM_SERVICES, TIME_SLOTS } from '../data';
import { Service, Booking, BookingStatus } from '../types';
import { Check, Calendar as CalendarIcon, Clock, User, Phone, Mail, FileText, ArrowRight, ArrowLeft, Trophy, ChevronRight, Timer, RefreshCw, AlertCircle, Lock, Sparkles, Gift, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LoyaltyPointsTracker from './LoyaltyPointsTracker';
import RecommendedTreatments from './RecommendedTreatments';
import BookingTrendsVisualizer from './BookingTrendsVisualizer';
import PriorityWaitlistModal from './PriorityWaitlistModal';

interface BookNowProps {
  initialServiceId?: string | null;
  onBookingComplete: () => void;
  onNavigateHome: () => void;
  activeShopId: string;
}

export default function BookNow({ initialServiceId, onBookingComplete, onNavigateHome, activeShopId }: BookNowProps) {
  const [step, setStep] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  
  // Custom multi-tenant services filter (including seasonal curations)
  const filteredServices = React.useMemo(() => {
    let baseServices: Service[] = [];
    if (activeShopId === 'royalbarber') {
      baseServices = PREMIUM_SERVICES.filter(s => s.category === 'Barber' || s.category === 'Spa');
    } else if (activeShopId === 'beautyqueen') {
      baseServices = PREMIUM_SERVICES.filter(s => s.category === 'Manicure' || s.category === 'Spa' || s.category === 'Bridal');
    } else if (activeShopId === 'grooming') {
      baseServices = PREMIUM_SERVICES.filter(s => s.category === 'Barber' || s.category === 'Haircut' || s.category === 'Spa');
    } else { // looks or other
      baseServices = PREMIUM_SERVICES.filter(s => s.category === 'Haircut' || s.category === 'Coloring' || s.category === 'Spa' || s.category === 'Manicure');
    }
    const seasonalServices = PREMIUM_SERVICES.filter(s => s.seasonalTag === 'Seasonal' || s.isSeasonal || s.category === 'Seasonal');
    const combined = [...baseServices];
    seasonalServices.forEach(ss => {
      if (!combined.some(item => item.id === ss.id)) {
        combined.push(ss);
      }
    });
    return combined;
  }, [activeShopId]);

  // Customer details
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  
  // Generated booking ref
  const [bookingRef, setBookingRef] = useState('');
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Countdown Timer for Time Slot Reservation (Default 10 minutes = 600s)
  const INITIAL_COUNTDOWN_SECONDS = 600;
  const [secondsLeft, setSecondsLeft] = useState<number>(INITIAL_COUNTDOWN_SECONDS);
  const [isTimerExpired, setIsTimerExpired] = useState<boolean>(false);

  // Active reservation timer countdown
  useEffect(() => {
    // Only tick when in active booking steps (1, 2, or 3) and not yet expired
    if (step === 4 || isTimerExpired) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsTimerExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step, isTimerExpired]);

  const handleExtendTimer = () => {
    setSecondsLeft((prev) => Math.min(prev + 300, 900)); // Add 5 mins, max 15 mins
    setIsTimerExpired(false);
  };

  const handleRenewTimer = () => {
    setSecondsLeft(INITIAL_COUNTDOWN_SECONDS);
    setIsTimerExpired(false);
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.time;
      return copy;
    });
  };

  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [waitlistTimeSlot, setWaitlistTimeSlot] = useState('');

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = Math.max(0, Math.min(100, (secondsLeft / INITIAL_COUNTDOWN_SECONDS) * 100));

  // Pre-load initial service if provided
  useEffect(() => {
    if (initialServiceId) {
      const s = filteredServices.find(srv => srv.id === initialServiceId) || PREMIUM_SERVICES.find(srv => srv.id === initialServiceId);
      if (s) {
        setSelectedService(s);
        setStep(2); // Jump directly to date and time selection
      }
    }
  }, [initialServiceId, filteredServices]);

  // Generate 14-day calendar from current time
  const [availableDays, setAvailableDays] = useState<{ dateStr: string; label: string; dayName: string; dayNum: number }[]>([]);

  useEffect(() => {
    const days = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // We start from today
    const baseDate = new Date();
    
    for (let i = 0; i < 14; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      days.push({
        dateStr,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dayName: weekdays[d.getDay()],
        dayNum: d.getDate()
      });
    }
    setAvailableDays(days);
    // Set first day as default selected date if empty
    if (days.length > 0) {
      setSelectedDate(days[0].dateStr);
    }
  }, []);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleNextStep = () => {
    if (isTimerExpired) {
      setErrors((prev) => ({ ...prev, time: 'Reservation hold has expired. Please click "Renew Hold" to secure your slot.' }));
      return;
    }

    if (step === 2) {
      if (!selectedDate) {
        setErrors({ ...errors, date: 'Please select a date' });
        return;
      }
      if (!selectedTimeSlot) {
        setErrors({ ...errors, time: 'Please select a preferred hour' });
        return;
      }
      setErrors({});
      setStep(3);
    } else if (step === 3) {
      const newErrors: Record<string, string> = {};
      if (!name.trim()) newErrors.name = 'Full name is strictly required';
      if (!email.trim() || !email.includes('@')) newErrors.email = 'A valid email address is required';
      if (!phone.trim()) newErrors.phone = 'Phone number is required for notification';
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
      submitBooking();
    }
  };

  const submitBooking = () => {
    if (!selectedService) return;
    
    // Generate high-end randomized reference number
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const refId = `NEX-${randNum}`;
    setBookingRef(refId);

    const newBooking: Booking = {
      id: refId,
      shopId: activeShopId,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      price: selectedService.price,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      notes: notes,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      pointsEarned: Math.round(selectedService.price * 10)
    };

    // Store to LocalStorage
    const stored = localStorage.getItem('nexora_bookings');
    let bookings: Booking[] = [];
    if (stored) {
      try {
        bookings = JSON.parse(stored);
      } catch (err) {
        console.error(err);
      }
    }
    bookings.push(newBooking);
    localStorage.setItem('nexora_bookings', JSON.stringify(bookings));

    setStep(4);
    onBookingComplete();
  };

  return (
    <div id="booking-flow-container" className="min-h-screen py-24 px-4 relative z-10">
      <div className="max-w-4xl mx-auto">
        
        {/* Luxury Header Banner */}
        <div className="text-center mb-12">
          <span className="text-xs font-mono tracking-[0.43em] text-[#d4af37] uppercase block mb-3">
            Elite Appointments
          </span>
          <h1 className="text-3xl md:text-5xl font-sans tracking-tight text-white uppercase font-light">
            BOOK A <span className="text-[#d4af37] font-semibold italic">DESIGN EXPERIENCE</span>
          </h1>
          <p className="mt-4 text-gray-400 font-sans text-xs md:text-sm max-w-lg mx-auto font-light leading-relaxed">
            Reserve your personal transformation ritual. Handcrafted techniques, luxury refreshments, and undivided attention.
          </p>
        </div>

        {/* Step Flow Progress Indicator */}
        <div className="flex items-center justify-between max-w-md mx-auto mb-16 relative">
          <div className="absolute left-0 right-0 h-[1.5px] bg-white/5 top-1/2 -translate-y-1/2 z-0" />
          <div 
            className="absolute left-0 h-[1.5px] bg-[#d4af37] top-1/2 -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />

          {[
            { s: 1, label: 'Service' },
            { s: 2, label: 'Schedule' },
            { s: 3, label: 'Credentials' },
            { s: 4, label: 'Invoiced' }
          ].map((item) => (
            <div key={item.s} className="flex flex-col items-center relative z-10">
              <button
                disabled={item.s > step && step !== 4}
                onClick={() => setStep(item.s)}
                id={`btn-step-progress-${item.s}`}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs border transition-all duration-500 cursor-pointer ${
                  step === item.s
                    ? 'bg-black border-[#d4af37] text-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                    : step > item.s
                    ? 'bg-[#d4af37] border-[#d4af37] text-black font-bold'
                    : 'bg-[#151515] border-white/15 text-gray-500'
                }`}
              >
                {step > item.s ? <Check className="w-4 h-4" /> : item.s}
              </button>
              <span className={`text-[10px] font-mono tracking-wider uppercase mt-2 ${
                step === item.s ? 'text-[#d4af37]' : 'text-gray-400'
              }`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Form Body with Smooth Transitions */}
        <div className="bg-[#0e0e0e]/90 border border-[#d4af37]/15 rounded-md p-6 md:p-12 shadow-2xl backdrop-blur-md relative min-h-[400px]">
          
          {/* Small, Elegant Reservation Countdown Timer (Steps 1-3) */}
          {step !== 4 && (
            <div 
              id="reservation-countdown-bar"
              className={`mb-8 p-3.5 sm:p-4 rounded border transition-all duration-500 relative overflow-hidden backdrop-blur-md ${
                isTimerExpired
                  ? 'bg-red-950/25 border-red-500/40 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                  : secondsLeft <= 120
                  ? 'bg-amber-950/30 border-amber-500/50 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                  : 'bg-[#14120b]/90 border-[#d4af37]/30 text-gray-200 shadow-[0_4px_25px_rgba(0,0,0,0.5)]'
              }`}
            >
              {/* Subtle background ambient gold wash */}
              <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-[#d4af37]/10 to-transparent pointer-events-none" />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-start sm:items-center gap-3">
                  <div className={`w-9 h-9 rounded flex items-center justify-center border shrink-0 transition-colors ${
                    isTimerExpired 
                      ? 'bg-red-900/40 border-red-500 text-red-400' 
                      : secondsLeft <= 120 
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400 animate-pulse' 
                      : 'bg-[#d4af37]/10 border-[#d4af37]/40 text-[#d4af37]'
                  }`}>
                    {isTimerExpired ? (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    ) : (
                      <Timer className={`w-4 h-4 ${secondsLeft <= 60 ? 'animate-pulse text-amber-400' : ''}`} />
                    )}
                  </div>
                  
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#d4af37] font-semibold">
                        {isTimerExpired ? 'Reservation Hold Expired' : 'Time Slot Hold Active'}
                      </span>
                      {selectedTimeSlot && !isTimerExpired && (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#d4af37] font-bold tracking-wider inline-flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> {selectedTimeSlot}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-300 font-sans font-light mt-0.5 leading-snug">
                      {isTimerExpired ? (
                        <span>Your temporary reservation window has lapsed. Please renew hold to guarantee your slot.</span>
                      ) : selectedTimeSlot ? (
                        <span>Your chosen time slot is temporarily locked. Complete reservation before it expires and returns to public pool.</span>
                      ) : (
                        <span>Temporary reservation window open. Complete your booking before available slots refresh.</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Countdown display & interactions */}
                <div className="flex items-center gap-3 sm:gap-4 self-end sm:self-center shrink-0">
                  {!isTimerExpired ? (
                    <div className="text-right">
                      <div className="flex items-baseline gap-1.5 font-mono">
                        <span 
                          id="countdown-timer-digits"
                          className={`text-2xl sm:text-3xl font-bold tracking-wider transition-colors ${
                            secondsLeft <= 120 ? 'text-amber-400 animate-pulse' : 'text-[#d4af37]'
                          }`}
                        >
                          {formattedTime}
                        </span>
                        <span className="text-[9px] uppercase tracking-widest text-gray-400 font-mono">
                          HOLD
                        </span>
                      </div>
                      <button
                        onClick={handleExtendTimer}
                        id="btn-extend-reservation-timer"
                        title="Add 5 minutes to reservation hold"
                        className="text-[9px] font-mono text-gray-400 hover:text-[#d4af37] uppercase tracking-wider underline underline-offset-2 transition-colors cursor-pointer"
                      >
                        +5 Min Extension
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleRenewTimer}
                      id="btn-renew-reservation-hold"
                      className="px-3.5 py-2 bg-[#d4af37] text-black font-mono text-xs uppercase font-bold rounded hover:bg-opacity-90 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Renew Hold (10:00)
                    </button>
                  )}
                </div>
              </div>

              {/* Countdown Progress Track Line */}
              <div className="w-full bg-white/5 h-[2px] mt-3 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    isTimerExpired 
                      ? 'bg-red-500 w-0' 
                      : secondsLeft <= 120 
                      ? 'bg-gradient-to-r from-amber-500 to-red-400' 
                      : 'bg-gradient-to-r from-amber-600 via-[#d4af37] to-yellow-300'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
          
          <AnimatePresence mode="wait">
            
            {/* STEP 1: SERVICE SELECT */}
            {step === 1 && (
              <motion.div
                key="step-service"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <h3 className="text-xl font-sans font-light tracking-wide text-white uppercase mb-2">
                    SELECT A PREMIUM SERVICE RITUAL
                  </h3>
                  <p className="text-gray-400 text-xs font-sans font-light">
                    Highlight a treatment card to proceed to calendar booking.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredServices.map((srv) => {
                    const isSelected = selectedService?.id === srv.id;
                    return (
                      <div
                        key={srv.id}
                        id={`service-card-select-${srv.id}`}
                        onClick={() => handleServiceSelect(srv)}
                        className={`group relative rounded border p-5 cursor-pointer overflow-hidden transition-all duration-500 flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#14120a]/60 border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.15)]'
                            : 'bg-[#121212]/30 border-white/5 hover:border-[#d4af37]/40 hover:bg-[#151515]/60'
                        }`}
                      >
                        <div>
                          {/* Image backdrop for richness */}
                          <div className="absolute right-0 top-0 h-28 w-28 opacity-10 group-hover:opacity-25 transition-opacity pointer-events-none rounded-bl-full overflow-hidden">
                            <img src={srv.image} alt={srv.name} className="w-full h-full object-cover" />
                          </div>

                          <div className="flex items-center gap-2 mb-2 pr-28">
                            <span className="text-[10px] font-mono tracking-widest text-[#d4af37] uppercase bg-[#d4af37]/5 px-2 py-1 rounded">
                              {srv.category}
                            </span>
                            <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                              <Clock className="w-3.h-3 w-3 h-3 text-gray-500" /> {srv.duration}M
                            </span>
                          </div>

                          <h4 className="text-lg font-sans font-medium text-white group-hover:text-[#d4af37] transition-colors">
                            {srv.name}
                          </h4>
                          <p className="text-xs text-gray-400 mt-2 font-sans font-light leading-relaxed pr-8">
                            {srv.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                          <span className="text-lg font-mono text-[#d4af37] font-medium">
                            ${srv.price}
                          </span>
                          <button
                            id={`btn-select-svc-${srv.id}`}
                            className={`text-xs font-mono tracking-widest uppercase flex items-center gap-1 transition-all ${
                              isSelected ? 'text-[#d4af37] font-semibold' : 'text-gray-400 group-hover:text-white'
                            }`}
                          >
                            {isSelected ? 'SELECTED' : 'SELECT SERVICE'} <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 2: DATE & TIME */}
            {step === 2 && (
              <motion.div
                key="step-datetime"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-sans font-light tracking-wide text-white uppercase mb-2">
                      SELECT DATE & PREFERRED HOUR
                    </h3>
                    <p className="text-gray-400 text-xs font-sans font-light">
                      Reservations are available within a 14-day rolling cycle.
                    </p>
                  </div>
                  {selectedService && (
                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] font-mono text-gray-400 block uppercase">Ritual selected</span>
                      <span className="text-sm font-sans text-[#d4af37] font-medium">{selectedService.name}</span>
                    </div>
                  )}
                </div>

                {/* 14-Day Calendar Grid */}
                <div className="mb-8">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-widest block mb-4 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-[#d4af37]" /> Select Date
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-7 gap-3">
                    {availableDays.map((day) => {
                      const isSelected = selectedDate === day.dateStr;
                      return (
                        <button
                          key={day.dateStr}
                          id={`calendar-day-btn-${day.dateStr}`}
                          onClick={() => {
                            setSelectedDate(day.dateStr);
                            setErrors({ ...errors, date: '' });
                          }}
                          className={`p-3 rounded flex flex-col items-center justify-center border transition-all duration-300 cursor-pointer ${
                            isSelected
                              ? 'bg-[#d4af37] border-[#d4af37] text-black font-bold shadow-[0_0_15px_rgba(212,175,55,0.25)]'
                              : 'bg-[#141414] border-white/5 text-gray-400 hover:border-[#d4af37]/40 hover:text-white'
                          }`}
                        >
                          <span className="text-[10px] font-mono uppercase tracking-wider opacity-60">
                            {day.dayName}
                          </span>
                          <span className="text-lg font-sans font-semibold mt-1">
                            {day.dayNum}
                          </span>
                          <span className="text-[9px] font-mono uppercase tracking-wider opacity-60 mt-0.5">
                            {day.label.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.date && <p className="text-red-400 text-xs mt-2 font-mono">{errors.date}</p>}
                </div>

                {/* Time Slots Grid */}
                <div className="mb-10">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-widest block mb-4 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#d4af37]" /> Preferred Time Slot
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {TIME_SLOTS.map((time, idx) => {
                      const isSelected = selectedTimeSlot === time;
                      // Simulate slots at index 4 ('01:00 PM') and 7 ('04:00 PM') as fully booked peak slots
                      const isFullyBooked = idx === 4 || idx === 7;

                      if (isFullyBooked) {
                        return (
                          <div
                            key={time}
                            className="p-2.5 rounded text-center border border-zinc-800 bg-[#0c0c0c] flex flex-col justify-between items-center group relative overflow-hidden"
                          >
                            <span className="text-[10px] font-mono text-zinc-500 line-through">
                              {time}
                            </span>
                            <span className="text-[9px] font-mono text-amber-400 uppercase tracking-wider my-1 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              Booked
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setWaitlistTimeSlot(time);
                                setIsWaitlistOpen(true);
                              }}
                              className="w-full mt-1 py-1 bg-zinc-900 hover:bg-[#d4af37] text-zinc-300 hover:text-black font-mono text-[9px] uppercase tracking-wider rounded border border-zinc-700 hover:border-[#d4af37] transition-all cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Bell className="w-2.5 h-2.5" /> Waitlist
                            </button>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={time}
                          id={`time-slot-btn-${time.replace(/[: ]/g, '')}`}
                          onClick={() => {
                            setSelectedTimeSlot(time);
                            setErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.time;
                              return copy;
                            });
                            if (isTimerExpired) {
                              setSecondsLeft(INITIAL_COUNTDOWN_SECONDS);
                              setIsTimerExpired(false);
                            }
                          }}
                          className={`p-3 rounded text-center border font-mono text-xs transition-all duration-300 cursor-pointer ${
                            isSelected
                              ? 'bg-[#d4af37] border-[#d4af37] text-black font-semibold shadow-[0_0_15px_rgba(212,175,55,0.25)]'
                              : 'bg-[#141414] border-white/5 text-gray-400 hover:border-[#d4af37]/40 hover:text-white'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                  {errors.time && <p className="text-red-400 text-xs mt-2 font-mono">{errors.time}</p>}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between border-t border-white/5 pt-8">
                  <button
                    onClick={() => setStep(1)}
                    id="btn-back-to-step-1"
                    className="flex items-center gap-2 text-xs font-mono uppercase text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Change Service
                  </button>
                  <button
                    onClick={handleNextStep}
                    id="btn-next-to-step-3"
                    className="flex items-center gap-2 text-xs font-mono uppercase bg-gradient-to-r from-amber-500 via-[#d4af37] to-yellow-600 text-black px-6 py-3 rounded font-semibold hover:opacity-90 active:scale-95 transition-all shadow-xl cursor-pointer"
                  >
                    Enter Details <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: DETAILS */}
            {step === 3 && (
              <motion.div
                key="step-details"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <h3 className="text-xl font-sans font-light tracking-wide text-white uppercase mb-2">
                    CONTACT & RESERVATION DETAILS
                  </h3>
                  <p className="text-gray-400 text-xs font-sans font-light">
                    Your luxury invitation details. Name, phone number and email are required to complete reservation.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Name Input */}
                  <div className="relative">
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#d4af37]" /> Full Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="form-input-name"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (errors.name) setErrors({ ...errors, name: '' });
                        }}
                        placeholder="e.g., Victoria Sterling"
                        className="w-full bg-[#111111] border border-white/5 rounded px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37] transition-colors"
                      />
                    </div>
                    {errors.name && <p className="text-red-400 text-xs mt-1.5 font-mono">{errors.name}</p>}
                  </div>

                  {/* Phone Input */}
                  <div className="relative">
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#d4af37]" /> Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        id="form-input-phone"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (errors.phone) setErrors({ ...errors, phone: '' });
                        }}
                        placeholder="e.g., +1 (555) 902-1248"
                        className="w-full bg-[#111111] border border-white/5 rounded px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37] transition-colors"
                      />
                    </div>
                    {errors.phone && <p className="text-red-400 text-xs mt-1.5 font-mono">{errors.phone}</p>}
                  </div>

                  {/* Email Input */}
                  <div className="md:col-span-2 relative">
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#d4af37]" /> Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        id="form-input-email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors({ ...errors, email: '' });
                        }}
                        placeholder="victoria@sterling.com"
                        className="w-full bg-[#111111] border border-white/5 rounded px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37] transition-colors"
                      />
                    </div>
                    {errors.email && <p className="text-red-400 text-xs mt-1.5 font-mono">{errors.email}</p>}
                  </div>

                  {/* Special Notes Block */}
                  <div className="md:col-span-2 relative">
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#d4af37]" /> Special Treatment Requests / Notes (Optional)
                    </label>
                    <div className="relative">
                      <textarea
                        rows={3}
                        id="form-input-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Specify hair textures, allergies, style requests, or if you prefer total silence..."
                        className="w-full bg-[#111111] border border-white/5 rounded px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37] transition-colors resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Bill Summary Card inside screen */}
                {selectedService && (
                  <>
                    <div className="bg-[#14120b] rounded-t p-5 border-t border-x border-[#d4af37]/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">SUMMARY BILL</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                            isTimerExpired
                              ? 'bg-red-950/40 border-red-500/40 text-red-300'
                              : secondsLeft <= 120 
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 animate-pulse' 
                              : 'bg-[#d4af37]/10 border-[#d4af37]/30 text-[#d4af37]'
                          }`}>
                            <Timer className="w-3 h-3" />
                            {isTimerExpired ? 'Hold Expired' : `Slot held: ${formattedTime} remaining`}
                          </span>
                        </div>
                        <h5 className="text-sm font-sans text-white font-medium">{selectedService.name}</h5>
                        <span className="text-xs text-gray-400 font-mono mt-1 block">
                          Date: {selectedDate} &bull; Time: {selectedTimeSlot}
                        </span>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-2xl font-mono text-[#d4af37] font-semibold">${selectedService.price}</span>
                        <span className="text-[10px] font-mono text-gray-500 block uppercase">vat included</span>
                      </div>
                    </div>

                    {/* Real-time Loyalty Points Calculation Preview */}
                    <div className="mb-8 p-3.5 rounded-b bg-[#120f08] border-x border-b border-[#d4af37]/30 flex items-center justify-between flex-wrap gap-2 text-xs shadow-inner">
                      <span className="text-zinc-200 flex items-center gap-1.5 font-sans font-medium">
                        <Sparkles className="w-4 h-4 text-[#d4af37]" />
                        <span>Loyalty Points earned on this reservation:</span>
                      </span>
                      <span className="font-mono text-[#d4af37] font-bold">
                        +{Math.round(selectedService.price * 10).toLocaleString()} PTS (${(Math.round(selectedService.price * 10) / 100).toFixed(2)} rewards credit)
                      </span>
                    </div>
                  </>
                )}

                {/* Back / Submit Action control */}
                <div className="flex items-center justify-between border-t border-white/5 pt-8">
                  <button
                    onClick={() => setStep(2)}
                    id="btn-back-to-step-2"
                    className="flex items-center gap-2 text-xs font-mono uppercase text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Change Time
                  </button>
                  <button
                    onClick={handleNextStep}
                    id="btn-submit-booking"
                    className="flex items-center gap-2 text-xs font-mono uppercase bg-gradient-to-r from-amber-500 via-[#d4af37] to-yellow-600 text-black px-8 py-3.5 rounded font-semibold hover:opacity-90 active:scale-95 transition-all shadow-xl cursor-pointer"
                  >
                    COMPLETE BOOKING <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: CONFIRMATION SUCCESS */}
            {step === 4 && (
              <motion.div
                key="step-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-10"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 mb-8 shadow-[0_0_30px_rgba(212,175,55,0.15)] animate-pulse">
                  <Trophy className="w-10 h-10 text-[#d4af37]" />
                </div>

                <span className="text-xs font-mono tracking-[0.43em] text-[#d4af37] uppercase block mb-3">
                  Reservation Validated
                </span>
                <h3 className="text-3xl font-sans tracking-tight text-white uppercase font-light">
                  YOUR SANCTUARY <span className="text-[#d4af37] font-semibold italic">IS READY</span>
                </h3>
                
                <p className="mt-4 text-gray-400 text-xs sm:text-sm font-sans font-light max-w-md mx-auto leading-relaxed">
                  Thank you, <span className="text-white font-medium">{name}</span>. Your reservation has been secured. An entry invitation is dispatched to <span className="text-white font-medium">{email}</span>.
                </p>

                {/* Stylized Invoice/Receipt Card */}
                <div className="max-w-md mx-auto mt-10 p-6 bg-[#121212] rounded border border-[#d4af37]/20 relative overflow-hidden">
                  {/* Decorative golden corner dashes */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#d4af37]" />
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#d4af37]" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#d4af37]" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#d4af37]" />

                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">
                    BOOKING REFERENCE NO.
                  </span>
                  <span id="booking-success-ref-id" className="text-2xl font-mono text-[#d4af37] font-bold block mt-1 tracking-wider">
                    {bookingRef}
                  </span>

                  <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5 text-left text-xs">
                    <div>
                      <span className="text-gray-500 font-mono uppercase block text-[9px]">GUEST</span>
                      <span className="text-white font-medium truncate block mt-0.5">{name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-mono uppercase block text-[9px]">RITUAL</span>
                      <span className="text-white font-medium truncate block mt-0.5">{selectedService?.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-mono uppercase block text-[9px]">DATE</span>
                      <span className="text-white font-medium block mt-0.5">{selectedDate}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-mono uppercase block text-[9px]">TIME SLOT</span>
                      <span className="text-white font-medium block mt-0.5">{selectedTimeSlot}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-left">
                    <span className="text-[10px] font-mono text-gray-500 uppercase">AMOUNT GUARANTEED</span>
                    <span className="text-lg font-mono text-[#d4af37] font-semibold">₹{selectedService?.price}</span>
                  </div>
                </div>

                {/* USER BOOKING PROFILE LOYALTY POINTS TRACKER */}
                <LoyaltyPointsTracker
                  customerName={name}
                  customerEmail={email}
                  servicePrice={selectedService?.price || 0}
                  serviceName={selectedService?.name || 'Selected Treatment'}
                  onRebookNow={() => {
                    setSelectedService(null);
                    setSelectedTimeSlot('');
                    setSecondsLeft(INITIAL_COUNTDOWN_SECONDS);
                    setIsTimerExpired(false);
                    setStep(1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />

                {/* 6-MONTH BOOKING FREQUENCY TRENDS VISUALIZER */}
                <BookingTrendsVisualizer
                  customerEmail={email}
                  customerPhone={phone}
                  currentBookingDate={selectedDate}
                  currentServiceName={selectedService?.name}
                />

                {/* PERSONALIZED RECOMMENDED TREATMENTS SECTION */}
                <RecommendedTreatments
                  currentService={selectedService}
                  customerEmail={email}
                  customerPhone={phone}
                  allServices={filteredServices}
                  onSelectRecommendedService={(recService) => {
                    setSelectedService(recService);
                    setSelectedTimeSlot('');
                    setSecondsLeft(INITIAL_COUNTDOWN_SECONDS);
                    setIsTimerExpired(false);
                    // Retain guest info and jump straight to schedule selection
                    setStep(2);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />

                <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={onNavigateHome}
                    id="btn-success-close-home"
                    className="w-full sm:w-auto px-6 py-3 border border-white/10 rounded text-xs font-mono uppercase text-gray-300 hover:text-white hover:border-[#d4af37] transition-all cursor-pointer"
                  >
                    RETURN TO HOME
                  </button>
                  <button
                    onClick={() => {
                      // Reset booking details and go again
                      setSelectedService(null);
                      setSelectedTimeSlot('');
                      setName('');
                      setEmail('');
                      setPhone('');
                      setNotes('');
                      setSecondsLeft(INITIAL_COUNTDOWN_SECONDS);
                      setIsTimerExpired(false);
                      setStep(1);
                    }}
                    id="btn-success-book-another"
                    className="w-full sm:w-auto px-6 py-3 bg-[#d4af37] rounded text-xs font-mono uppercase text-black font-semibold hover:bg-opacity-90 transition-all cursor-pointer"
                  >
                    BOOK ANOTHER EXPERIENCE
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>

      </div>

      {/* PRIORITY WAITLIST MODAL */}
      <PriorityWaitlistModal
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
        selectedDate={selectedDate || new Date().toISOString().split('T')[0]}
        selectedTimeSlot={waitlistTimeSlot}
        serviceName={selectedService?.name || 'Selected Treatment'}
        onJoinSuccess={() => {
          setIsWaitlistOpen(false);
        }}
      />
    </div>
  );
}
