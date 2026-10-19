import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Share2, Check, Star, Award, Sparkles, Clock, Calendar, 
  ChevronRight, ChevronLeft, Instagram, Scissors, Maximize2, 
  ShieldCheck, ArrowRight, Eye, Sparkle, MessageSquare
} from 'lucide-react';
import gsap from 'gsap';
import { StaffMember, Artisan, WorkGalleryItem, ServiceExpertise } from '../types';
import ConsultationChat from './ConsultationChat';

interface StaffProfileModalProps {
  staff: StaffMember | Artisan;
  allStaff?: (StaffMember | Artisan)[];
  onClose: () => void;
  onBookService: (serviceId?: string, staffMember?: StaffMember | Artisan) => void;
  onSelectOtherStaff?: (staff: StaffMember | Artisan) => void;
  activeShopId?: string;
}

export default function StaffProfileModal({
  staff,
  allStaff = [],
  onClose,
  onBookService,
  onSelectOtherStaff,
  activeShopId = 'looks'
}: StaffProfileModalProps) {
  // Animation refs
  const modalOverlayRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Gallery filtering state
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState<string>('All');
  
  // Image Lightbox state
  const [lightboxItem, setLightboxItem] = useState<WorkGalleryItem | null>(null);
  
  // Share link copy state
  const [shareCopied, setShareCopied] = useState(false);
  
  // Consultation Chat modal state
  const [isChatOpen, setIsChatOpen] = useState(false);

  const getPhoto = (m: StaffMember | Artisan): string => {
    if ('avatar' in m && m.avatar) return m.avatar;
    if ('image' in m && m.image) return m.image;
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';
  };

  // Normalize staff data fields across StaffMember and Artisan
  const staffName = staff.name;
  const staffRole = staff.role;
  const staffSpecialty = staff.specialty;
  const staffImage = getPhoto(staff);
  const staffRating = staff.rating || 4.9;
  const staffBio = staff.bio || `${staffName} is a celebrated master artisan at Aura Studio & Salon, known for unparalleled craft and high-precision aesthetic transformations.`;
  const staffInstagram = staff.instagram || `@${staffName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  const staffExperience = staff.experience || '12+ Years';
  const staffAccreditations = staff.accreditations || [
    'Haute Coiffure Guild Master',
    'International Precision Styling Diploma',
    'Aesthetic Architecture Certified'
  ];

  const workGallery: WorkGalleryItem[] = staff.workGallery || [];
  const specificExpertise: ServiceExpertise[] = staff.specificExpertise || [];

  // Extract unique categories for gallery filter
  const galleryCategories = React.useMemo(() => {
    const cats = new Set<string>();
    workGallery.forEach(item => {
      if (item.category) cats.add(item.category);
    });
    return ['All', ...Array.from(cats)];
  }, [workGallery]);

  // Filtered gallery items
  const filteredGallery = React.useMemo(() => {
    if (selectedGalleryCategory === 'All') return workGallery;
    return workGallery.filter(item => item.category === selectedGalleryCategory);
  }, [workGallery, selectedGalleryCategory]);

  // Entrance and exit GSAP animations
  useEffect(() => {
    const overlay = modalOverlayRef.current;
    const content = modalContentRef.current;
    if (overlay && content) {
      gsap.killTweensOf([overlay, content]);
      gsap.fromTo(overlay, 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
      gsap.fromTo(content, 
        { opacity: 0, y: 35, scale: 0.97 }, 
        { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power3.out', delay: 0.05 }
      );
    }
  }, [staff.id]);

  // Close with GSAP animation
  const handleAnimatedClose = () => {
    const overlay = modalOverlayRef.current;
    const content = modalContentRef.current;
    if (overlay && content) {
      gsap.killTweensOf([overlay, content]);
      gsap.to(content, {
        opacity: 0,
        y: 20,
        scale: 0.97,
        duration: 0.25,
        ease: 'power2.in'
      });
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: onClose
      });
    } else {
      onClose();
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxItem) {
          setLightboxItem(null);
        } else {
          handleAnimatedClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxItem]);

  // Share direct staff profile link
  const handleShareProfile = async () => {
    try {
      const url = new URL(window.location.origin + window.location.pathname);
      url.searchParams.set('shop', activeShopId);
      url.searchParams.set('staff', staff.id);
      await navigator.clipboard.writeText(url.toString());
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3200);
    } catch {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3200);
    }
  };

  // Lightbox navigation
  const handleNextLightbox = () => {
    if (!lightboxItem || filteredGallery.length <= 1) return;
    const currentIndex = filteredGallery.findIndex(i => i.id === lightboxItem.id);
    const nextIndex = (currentIndex + 1) % filteredGallery.length;
    setLightboxItem(filteredGallery[nextIndex]);
  };

  const handlePrevLightbox = () => {
    if (!lightboxItem || filteredGallery.length <= 1) return;
    const currentIndex = filteredGallery.findIndex(i => i.id === lightboxItem.id);
    const prevIndex = (currentIndex - 1 + filteredGallery.length) % filteredGallery.length;
    setLightboxItem(filteredGallery[prevIndex]);
  };

  return (
    <div 
      ref={modalOverlayRef}
      id="staff-profile-modal-overlay"
      className="fixed inset-0 bg-black/94 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={handleAnimatedClose}
    >
      {/* Modal Container */}
      <div 
        ref={modalContentRef}
        id="staff-member-profile-page"
        className="bg-[#080808] border border-white/10 rounded-sm w-full max-w-5xl overflow-hidden shadow-[0_0_60px_rgba(212,175,55,0.15)] relative my-6 text-white max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Floating Action Bar */}
        <div className="sticky top-0 right-0 left-0 bg-[#080808]/90 backdrop-blur-md px-6 py-4 border-b border-white/5 flex items-center justify-between z-40">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono tracking-[0.3em] text-[#d4af37] uppercase">
              Master Artisan Profile
            </span>
            <span className="text-gray-600 font-mono text-xs">/</span>
            <span className="text-xs font-sans text-gray-300 font-light truncate max-w-[200px] sm:max-w-md">
              {staffName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Share Profile Button */}
            <button
              onClick={handleShareProfile}
              id="share-staff-profile-btn"
              title="Share Artisan Profile"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all duration-300 border cursor-pointer ${
                shareCopied
                  ? 'bg-[#d4af37] text-black border-[#d4af37] font-semibold'
                  : 'bg-black/60 text-gray-300 border-white/10 hover:border-[#d4af37]/50 hover:text-[#d4af37]'
              }`}
            >
              {shareCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-black" />
                  <span className="text-[10px] uppercase tracking-wider">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span className="text-[10px] uppercase tracking-wider">Share</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={handleAnimatedClose}
              id="close-staff-profile-btn"
              aria-label="Close Profile"
              className="p-1.5 text-gray-400 hover:text-[#d4af37] hover:bg-white/5 rounded border border-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Main Content */}
        <div className="overflow-y-auto flex-1 space-y-12 pb-16">
          
          {/* ======================================================== */}
          {/* PROFILE HERO HEADER */}
          {/* ======================================================== */}
          <section id="staff-profile-hero" className="p-6 sm:p-10 relative bg-gradient-to-b from-[#111]/80 to-[#080808]">
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
              
              {/* Portrait Image with Gold Frame Accent */}
              <div className="relative shrink-0 mx-auto md:mx-0">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-2 border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.25)] relative group">
                  <img 
                    src={staffImage} 
                    alt={staffName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                {/* Available Status Dot */}
                <div 
                  className="absolute bottom-1 right-2 bg-[#080808] border border-[#d4af37]/40 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg"
                  title="Verified Resident Stylist"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-mono text-gray-300 tracking-wider uppercase">Active Guild</span>
                </div>
              </div>

              {/* Artisan Details & Bio */}
              <div className="flex-1 space-y-3 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1">
                  <span className="text-xs font-mono text-[#d4af37] tracking-[0.2em] uppercase">
                    {staffRole}
                  </span>
                  <span className="text-gray-600 font-mono text-xs">·</span>
                  <span className="text-xs font-mono text-gray-400">
                    {staffExperience} Experience
                  </span>
                  <span className="text-gray-600 font-mono text-xs">·</span>
                  <div className="flex items-center gap-1 text-[#d4af37] text-xs font-mono">
                    <Star className="w-3.5 h-3.5 fill-[#d4af37]" />
                    <span>{staffRating.toFixed(1)} / 5.0</span>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-4xl font-sans font-light uppercase tracking-wide text-white">
                  {staffName}
                </h1>

                <div className="inline-block bg-[#161616] border border-[#d4af37]/20 px-3 py-1.5 rounded-sm">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                    Signature Focus: <span className="text-white font-medium">{staffSpecialty}</span>
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-gray-300 font-sans font-light leading-relaxed max-w-2xl">
                  {staffBio}
                </p>

                {/* Accreditations and Instagram */}
                <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
                  {staffAccreditations.map((acc, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400 bg-white/5 border border-white/5 px-2.5 py-1 rounded"
                    >
                      <ShieldCheck className="w-3 h-3 text-[#d4af37]" />
                      <span>{acc}</span>
                    </div>
                  ))}
                  
                  <a
                    href={`https://instagram.com/${staffInstagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[10px] font-mono text-[#d4af37] hover:text-yellow-400 bg-[#d4af37]/10 border border-[#d4af37]/20 px-2.5 py-1 rounded transition-colors"
                  >
                    <Instagram className="w-3 h-3" />
                    <span>{staffInstagram}</span>
                  </a>
                </div>

                {/* Direct CTA */}
                <div className="pt-4 flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <button
                    onClick={() => {
                      onBookService(undefined, staff);
                      handleAnimatedClose();
                    }}
                    id="book-with-staff-hero-btn"
                    className="px-6 py-3 bg-[#d4af37] text-black text-xs font-mono uppercase tracking-widest font-bold rounded-sm hover:bg-yellow-500 transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.25)]"
                  >
                    <span>Reserve Session With {staffName.split(' ')[staffName.split(' ').length - 1]}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setIsChatOpen(true)}
                    id="open-consultation-chat-btn"
                    className="px-5 py-3 bg-[#141414] hover:bg-[#1a1a1a] border border-[#d4af37]/40 hover:border-[#d4af37] text-zinc-200 hover:text-white text-xs font-mono uppercase tracking-widest rounded-sm transition-all cursor-pointer flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4 text-[#d4af37]" />
                    <span>Consultation Chat</span>
                  </button>
                </div>

              </div>

            </div>
          </section>

          {/* ======================================================== */}
          {/* SECTION 1: INDIVIDUAL WORK GALLERY */}
          {/* ======================================================== */}
          <section id="staff-work-gallery-section" className="px-6 sm:px-10">
            <div className="border-t border-white/10 pt-10">
              
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <span className="text-[10px] font-mono tracking-[0.3em] text-[#d4af37] uppercase block mb-1">
                    Bespoke Portfolio
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-sans font-light text-white uppercase tracking-tight">
                    Individual Work Gallery
                  </h2>
                  <p className="text-xs text-gray-400 font-sans font-light mt-1">
                    Authentic salon transformations and high-fidelity styling executed by {staffName}.
                  </p>
                </div>

                {/* Category Filter Tabs */}
                {galleryCategories.length > 2 && (
                  <div className="flex flex-wrap gap-1.5 p-1 bg-[#121212] border border-white/5 rounded">
                    {galleryCategories.map((cat) => (
                      <button
                        key={cat}
                        id={`filter-gallery-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => setSelectedGalleryCategory(cat)}
                        className={`px-3 py-1 text-[11px] font-mono rounded transition-all cursor-pointer ${
                          selectedGalleryCategory === cat
                            ? 'bg-[#d4af37] text-black font-semibold shadow'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Work Gallery Grid */}
              {filteredGallery.length === 0 ? (
                <div className="text-center py-12 border border-white/5 rounded bg-[#0b0b0b] text-gray-500 font-mono text-xs">
                  No portfolio items listed for category "{selectedGalleryCategory}".
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredGallery.map((item) => (
                    <div 
                      key={item.id}
                      id={`gallery-item-${item.id}`}
                      onClick={() => setLightboxItem(item)}
                      className="group bg-[#0b0b0b] border border-white/5 hover:border-[#d4af37]/50 rounded-sm overflow-hidden transition-all duration-500 flex flex-col cursor-pointer shadow-lg hover:shadow-[0_4px_25px_rgba(212,175,55,0.15)]"
                    >
                      {/* Image Thumbnail Container */}
                      <div className="relative aspect-[4/5] overflow-hidden bg-black">
                        <img 
                          src={item.image} 
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                        
                        {/* Expand Icon Badge */}
                        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm border border-white/10 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <Maximize2 className="w-3.5 h-3.5 text-[#d4af37]" />
                        </div>

                        {/* Category Label */}
                        <div className="absolute bottom-3 left-3 z-20">
                          <span className="text-[9px] font-mono tracking-widest text-[#d4af37] uppercase bg-black/80 px-2 py-0.5 rounded border border-[#d4af37]/30">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      {/* Card Meta Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-2 bg-[#0e0e0e]">
                        <div>
                          <h3 className="text-sm font-sans font-medium text-white group-hover:text-[#d4af37] transition-colors leading-snug">
                            {item.title}
                          </h3>
                          <p className="text-xs text-zinc-300 font-sans font-normal mt-1.5 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        {/* Client Result Highlight */}
                        {item.clientResult && (
                          <div className="pt-2 border-t border-zinc-800">
                            <span className="text-[10px] font-mono text-[#d4af37] uppercase tracking-wider block font-semibold">
                              Result:
                            </span>
                            <p className="text-xs text-zinc-200 font-sans font-normal italic mt-0.5 line-clamp-1">
                              "{item.clientResult}"
                            </p>
                          </div>
                        )}

                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {item.tags.map((tag, tidx) => (
                              <span key={tidx} className="text-[9px] font-mono text-gray-500">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          </section>

          {/* ======================================================== */}
          {/* SECTION 2: SPECIFIC SERVICE EXPERTISE */}
          {/* ======================================================== */}
          <section id="staff-service-expertise-section" className="px-6 sm:px-10">
            <div className="border-t border-white/10 pt-10">
              
              {/* Section Header */}
              <div className="mb-8">
                <span className="text-[10px] font-mono tracking-[0.3em] text-[#d4af37] uppercase block mb-1">
                  Mastery Curricula
                </span>
                <h2 className="text-2xl sm:text-3xl font-sans font-light text-white uppercase tracking-tight">
                  Specific Service Expertise
                </h2>
                <p className="text-xs text-gray-400 font-sans font-light mt-1">
                  Signature treatment methodologies and specialized protocols mastered by {staffName}.
                </p>
              </div>

              {/* Service Expertise Cards */}
              {specificExpertise.length === 0 ? (
                <div className="text-center py-12 border border-white/5 rounded bg-[#0b0b0b] text-gray-500 font-mono text-xs">
                  Expertise curriculum undergoing annual master guild accreditation review.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {specificExpertise.map((exp) => (
                    <div 
                      key={exp.id}
                      id={`expertise-card-${exp.id}`}
                      className="bg-[#0b0b0b] border border-white/5 hover:border-[#d4af37]/40 p-6 rounded-sm flex flex-col justify-between transition-all duration-300 space-y-5 shadow-lg group relative"
                    >
                      {/* Top Gold Accent Line */}
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37]/0 to-transparent group-hover:via-[#d4af37]/60 transition-all duration-500" />

                      <div className="space-y-3">
                        {/* Category & Mastery Level */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono text-[#d4af37] uppercase tracking-wider">
                            {exp.category}
                          </span>
                          <span className="text-[9px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                            {exp.masteryLevel}
                          </span>
                        </div>

                        {/* Service Title */}
                        <h3 className="text-lg font-sans font-medium text-white group-hover:text-[#d4af37] transition-colors">
                          {exp.serviceName}
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-zinc-200 font-sans font-normal leading-relaxed">
                          {exp.description}
                        </p>

                        {/* Techniques Checklist */}
                        {exp.techniques && exp.techniques.length > 0 && (
                          <div className="space-y-2 pt-2">
                            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block font-medium">
                              Signature Techniques:
                            </span>
                            <ul className="space-y-1.5">
                              {exp.techniques.map((tech, techIdx) => (
                                <li key={techIdx} className="flex items-start gap-2.5 text-xs text-zinc-300 font-sans font-normal">
                                  <Sparkle className="w-3 h-3 text-[#d4af37] shrink-0 mt-0.5" />
                                  <span>{tech}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Bottom Pricing, Duration & Direct Book CTA */}
                      <div className="pt-4 border-t border-zinc-800 space-y-3">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                            {exp.durationMinutes} Mins
                          </span>
                          <span className="text-[#d4af37] font-semibold text-sm">
                            From ${exp.startingPrice}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            onBookService(exp.serviceId, staff);
                            handleAnimatedClose();
                          }}
                          id={`book-expertise-${exp.id}`}
                          className="w-full py-2 bg-white/5 hover:bg-[#d4af37] text-white hover:text-black border border-white/10 hover:border-[#d4af37] text-[10px] font-mono tracking-widest uppercase font-semibold rounded-sm transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                        >
                          <span>Book This Protocol</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          </section>

          {/* ======================================================== */}
          {/* SECTION 3: OTHER MASTER ARTISANS SWITCHER */}
          {/* ======================================================== */}
          {allStaff && allStaff.length > 1 && onSelectOtherStaff && (
            <section id="other-guild-artisans" className="px-6 sm:px-10">
              <div className="border-t border-white/10 pt-8 pb-4">
                <span className="text-[10px] font-mono tracking-[0.3em] text-[#d4af37] uppercase block mb-3">
                  Explore More Resident Stylists
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {allStaff.filter(s => s.id !== staff.id).slice(0, 4).map((other) => {
                    const otherImage = getPhoto(other);
                    return (
                      <div
                        key={other.id}
                        id={`switch-to-artisan-${other.id}`}
                        onClick={() => onSelectOtherStaff(other)}
                        className="p-3 bg-[#111] hover:bg-[#181818] border border-white/5 hover:border-[#d4af37]/40 rounded cursor-pointer transition-all flex items-center gap-3 group"
                      >
                        <img 
                          src={otherImage} 
                          alt={other.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover:border-[#d4af37]"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-sans text-white font-medium truncate group-hover:text-[#d4af37]">
                            {other.name}
                          </p>
                          <span className="text-[9px] font-mono text-gray-400 block truncate">
                            {other.specialty}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

        </div>

      </div>

      {/* ======================================================== */}
      {/* INTERACTIVE IMAGE LIGHTBOX PREVIEW */}
      {/* ======================================================== */}
      {lightboxItem && (
        <div 
          id="gallery-lightbox-modal"
          className="fixed inset-0 bg-black/96 z-[120] flex items-center justify-center p-4 sm:p-8 backdrop-blur-lg"
          onClick={() => setLightboxItem(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-[#0a0a0a] border border-[#d4af37]/30 rounded-sm overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Lightbox */}
            <button
              onClick={() => setLightboxItem(null)}
              id="close-lightbox-btn"
              aria-label="Close Lightbox"
              className="absolute top-4 right-4 z-30 p-2 bg-black/70 text-gray-300 hover:text-white rounded-full border border-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Lightbox Image Preview */}
            <div className="relative md:w-3/5 bg-black flex items-center justify-center min-h-[300px] md:min-h-[500px]">
              <img 
                src={lightboxItem.image} 
                alt={lightboxItem.title}
                referrerPolicy="no-referrer"
                className="max-h-[80vh] w-full object-contain"
              />

              {/* Prev / Next controls */}
              {filteredGallery.length > 1 && (
                <>
                  <button
                    onClick={handlePrevLightbox}
                    id="lightbox-prev-btn"
                    aria-label="Previous Work"
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/70 hover:bg-[#d4af37] text-white hover:text-black rounded-full border border-white/10 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextLightbox}
                    id="lightbox-next-btn"
                    aria-label="Next Work"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/70 hover:bg-[#d4af37] text-white hover:text-black rounded-full border border-white/10 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Lightbox Details Panel */}
            <div className="md:w-2/5 p-6 sm:p-8 flex flex-col justify-between bg-[#0e0e0e] border-t md:border-t-0 md:border-l border-white/5 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-[#d4af37] uppercase block mb-1">
                    {lightboxItem.category} · Transformation #{lightboxItem.id}
                  </span>
                  <h3 className="text-xl font-sans font-light text-white uppercase">
                    {lightboxItem.title}
                  </h3>
                  <span className="text-[10px] font-mono text-gray-400 block mt-1">
                    Executed by {staffName}
                  </span>
                </div>

                <div className="w-12 h-[1px] bg-[#d4af37]" />

                <div className="space-y-2">
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                    Curatorial Notes
                  </h4>
                  <p className="text-xs text-gray-300 font-sans font-light leading-relaxed">
                    {lightboxItem.description}
                  </p>
                </div>

                {lightboxItem.clientResult && (
                  <div className="bg-[#141414] border border-[#d4af37]/20 p-3 rounded">
                    <span className="text-[9px] font-mono text-[#d4af37] uppercase tracking-wider block">
                      Client Outcome:
                    </span>
                    <p className="text-xs text-gray-200 font-sans font-light italic mt-1 leading-relaxed">
                      "{lightboxItem.clientResult}"
                    </p>
                  </div>
                )}

                {lightboxItem.tags && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {lightboxItem.tags.map((tag, idx) => (
                      <span key={idx} className="text-[10px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action in Lightbox */}
              <div className="pt-6 border-t border-white/5">
                <button
                  onClick={() => {
                    setLightboxItem(null);
                    onBookService(undefined, staff);
                    handleAnimatedClose();
                  }}
                  id="lightbox-book-btn"
                  className="w-full py-2.5 bg-[#d4af37] text-black text-xs font-mono tracking-widest uppercase font-bold rounded-sm hover:bg-yellow-500 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Request Similar Transformation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* CONSULTATION CHAT MODAL */}
      <ConsultationChat
        staff={staff}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onBookWithStaff={() => {
          setIsChatOpen(false);
          onBookService(undefined, staff);
          handleAnimatedClose();
        }}
      />

    </div>
  );
}
