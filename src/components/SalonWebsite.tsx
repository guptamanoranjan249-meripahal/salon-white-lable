import { FormEvent, useMemo, useState, type CSSProperties } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, CalendarDays, Check, Clock3, Instagram, Mail, MapPin, Menu, Phone, Scissors, Sparkles, Star, UsersRound, X } from 'lucide-react';
import type { PublicSalon, SalonService } from '../types';
import { apiRequest } from '../lib/api';

interface SalonWebsiteProps {
  salon: PublicSalon;
  preview?: boolean;
}

const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'];

function formattedPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(price);
  } catch {
    return `${currency} ${price.toLocaleString()}`;
  }
}

function safeWebLink(value: string): string {
  try {
    const url = new URL(value);
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol) ? value : '';
  } catch {
    return '';
  }
}

function initials(value: string): string {
  return value.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '✳';
}

function BookingDialog({ salon, service, preview, onClose }: { salon: PublicSalon; service: SalonService | null; preview: boolean; onClose: () => void }) {
  const { brand, services } = salon.config;
  const [serviceId, setServiceId] = useState(service?.id || services.find(item => item.name.trim())?.id || '');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const serviceSelected = services.find(item => item.id === serviceId);
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const maximumDate = new Date(today);
  maximumDate.setDate(maximumDate.getDate() + 365);
  const maxDate = `${maximumDate.getFullYear()}-${String(maximumDate.getMonth() + 1).padStart(2, '0')}-${String(maximumDate.getDate()).padStart(2, '0')}`;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (preview) {
      setError('This is a private preview. Booking requests become available after you publish your website.');
      return;
    }
    setSending(true);
    setError('');
    try {
      const result = await apiRequest<{ id: string }>(`/api/public/salons/${encodeURIComponent(salon.slug)}/bookings`, {
        method: 'POST',
        body: { serviceId, date, timeSlot, customerName, customerEmail, customerPhone, notes },
      });
      setReference(result.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'We could not send your request. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="salon-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="booking-dialog" role="dialog" aria-modal="true" aria-labelledby="booking-dialog-title">
        <div className="booking-dialog-top"><span className="salon-modal-kicker"><CalendarDays size={13} /> APPOINTMENT REQUEST</span><button className="salon-icon-button" aria-label="Close booking form" onClick={onClose}><X size={19} /></button></div>
        {reference ? <div className="booking-success"><span><Check size={25} /></span><small>REQUEST SENT</small><h2>We’ll be in touch.</h2><p>Your appointment request is on its way to {brand.name}. The salon will follow up using the contact details you provided.</p><div className="booking-reference">REQUEST REFERENCE <strong>{reference}</strong></div><button className="salon-cta" onClick={onClose}>Back to the website <ArrowRight size={15} /></button></div> : <>
          <div className="booking-dialog-title"><span className="salon-eyebrow">MAKE A LITTLE TIME FOR YOU</span><h2 id="booking-dialog-title">Request an appointment</h2><p>Choose a service and a time that works for you. {brand.name} will confirm your visit.</p></div>
          <form className="booking-form" onSubmit={submit}>
            <label>Service<select value={serviceId} onChange={event => setServiceId(event.target.value)} required><option value="" disabled>Choose a service</option>{services.filter(item => item.name.trim()).map(item => <option value={item.id} key={item.id}>{item.name} · {formattedPrice(item.price, brand.currency)}</option>)}</select></label>
            <div className="booking-form-row"><label>Date<input type="date" min={minDate} max={maxDate} value={date} onChange={event => setDate(event.target.value)} required /></label><label>Preferred time<select value={timeSlot} onChange={event => setTimeSlot(event.target.value)} required><option value="" disabled>Choose a time</option>{timeSlots.map(slot => <option key={slot}>{slot}</option>)}</select></label></div>
            <label>Your name<input value={customerName} onChange={event => setCustomerName(event.target.value)} autoComplete="name" placeholder="Full name" maxLength={100} required /></label>
            <div className="booking-form-row"><label>Email<input type="email" value={customerEmail} onChange={event => setCustomerEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" maxLength={254} required /></label><label>Phone<input type="tel" value={customerPhone} onChange={event => setCustomerPhone(event.target.value)} autoComplete="tel" placeholder="+91 …" maxLength={60} required /></label></div>
            <label>Anything else we should know? <span className="optional-label">OPTIONAL</span><textarea rows={2} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Preferences, questions, or a note for the salon…" maxLength={800} /></label>
            {serviceSelected && <div className="booking-selected-service"><span>{serviceSelected.name}{serviceSelected.duration ? ` · ${serviceSelected.duration} min` : ''}</span><strong>{formattedPrice(serviceSelected.price, brand.currency)}</strong></div>}
            {error && <p className="booking-error" role="alert">{error}</p>}
            <button className="salon-cta booking-submit" type="submit" disabled={sending}>{sending ? 'Sending your request…' : 'Send appointment request'} {sending ? <span className="small-spinner" /> : <ArrowRight size={15} />}</button>
            <p className="booking-fineprint">This is a request, not a confirmed appointment. Your details are shared only with this salon.</p>
          </form>
        </>}
      </section>
    </div>
  );
}

export default function SalonWebsite({ salon, preview = false }: SalonWebsiteProps) {
  const { brand, contact, theme, services, staff } = salon.config;
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingService, setBookingService] = useState<SalonService | null>(null);
  const [selectedService, setSelectedService] = useState<SalonService | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<'recommended' | 'price-asc' | 'price-desc'>('recommended');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const categories = useMemo(() => ['All', ...Array.from(new Set(services.filter(service => service.name.trim()).map(service => service.category).filter(Boolean)))], [services]);
  const filteredServices = useMemo(() => {
    const list = services.filter(service => service.name.trim())
      .filter(service => activeCategory === 'All' || service.category === activeCategory)
      .filter(service => `${service.name} ${service.category} ${service.description}`.toLowerCase().includes(query.toLowerCase()));
    if (sortMode === 'price-asc') list.sort((first, second) => first.price - second.price || first.name.localeCompare(second.name));
    if (sortMode === 'price-desc') list.sort((first, second) => second.price - first.price || first.name.localeCompare(second.name));
    return list;
  }, [services, activeCategory, query, sortMode]);
  const phoneLink = contact.phone ? `tel:${contact.phone.replace(/[^+\d]/g, '')}` : '';
  const emailLink = contact.email ? `mailto:${contact.email}` : '';
  const addressLink = contact.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}` : '';
  const bookingLabel = brand.bookingButton.trim() || 'Book an appointment';
  const styleVars = {
    '--salon-accent': theme.accent,
    '--salon-bg': theme.background,
    '--salon-surface': theme.surface,
    '--salon-ink': theme.text,
    '--salon-muted': theme.muted,
  } as CSSProperties;

  const openBooking = (service: SalonService | null = null) => {
    setSelectedService(null);
    setBookingService(service);
    setBookingOpen(true);
  };
  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={`salon-site ${preview ? 'salon-site-preview' : ''}`} style={styleVars}>
      <header className="salon-header">
        <a className="salon-brand" href="#top" onClick={event => { event.preventDefault(); scrollTo('top'); }}>
          {brand.logoUrl ? <img className="salon-logo" src={brand.logoUrl} alt={`${brand.name} logo`} /> : <span className="salon-monogram">{initials(brand.name)}</span>}
          <span className="salon-brand-copy"><strong>{brand.name || 'Your salon'}</strong>{brand.tagline && <small>{brand.tagline}</small>}</span>
        </a>
        <nav className={`salon-nav ${mobileMenuOpen ? 'salon-nav-open' : ''}`} aria-label="Salon website">
          {brand.aboutText && <button onClick={() => scrollTo('about')}>Our story</button>}
          <button onClick={() => scrollTo('services')}>Services</button>
          {staff.some(member => member.name.trim()) && <button onClick={() => scrollTo('team')}>The team</button>}
          <button onClick={() => scrollTo('contact')}>Visit us</button>
          <button className="salon-cta salon-nav-cta" onClick={() => openBooking(null)}>{bookingLabel} <ArrowUpRight size={14} /></button>
        </nav>
        <button className="salon-menu-button" aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMobileMenuOpen(open => !open)}>{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
      </header>

      <main id="top">
        <section className={`salon-hero ${brand.heroImageUrl ? 'has-hero-image' : 'hero-no-image'}`} style={brand.heroImageUrl ? { backgroundImage: `linear-gradient(90deg, ${theme.background}F2 0%, ${theme.background}B8 45%, ${theme.background}26 100%), url("${brand.heroImageUrl.replace(/"/g, '%22')}")` } : undefined}>
          <div className="salon-hero-texture" />
          <div className="salon-hero-copy"><div className="salon-eyebrow"><span className="eyebrow-rule" />{brand.heroBadge || brand.category || 'AN INDEPENDENT SALON'}</div><h1>{brand.heroTitle || brand.name || 'Your salon'}<span className="hero-dot">.</span></h1><p>{brand.heroSubtitle || brand.tagline}</p><div className="salon-hero-actions"><button className="salon-cta" onClick={() => openBooking(null)}>{bookingLabel} <ArrowRight size={16} /></button><button className="salon-text-link" onClick={() => scrollTo('services')}>Explore the menu <ArrowDown size={14} /></button></div>{(brand.heroNote || brand.tagline) && <div className="salon-hero-note"><Sparkles size={14} /><span>{brand.heroNote || brand.tagline}</span></div>}</div>
          {brand.heroImageUrl && <div className="hero-image-caption"><span>{brand.name.toUpperCase()}</span><i /><span>{brand.marqueeText || brand.category || 'SALON & STUDIO'}</span></div>}
          {!brand.heroImageUrl && <div className="hero-abstract"><span className="abstract-circle" /><span className="abstract-arc" /><span className="abstract-spark">✳</span><span className="abstract-label">A SPACE TO FEEL<br />MORE LIKE YOU</span></div>}
          <div className="salon-hero-index"><span>01</span><i /> HOME</div>
        </section>

        <section className="salon-marquee" aria-label="Salon details"><div><span>{brand.marqueeText || brand.tagline || brand.name}</span><i /> <span>{brand.name.toUpperCase()}</span><i /> <span>{brand.marqueeText || brand.tagline || brand.name}</span></div></section>

        <section className="salon-services-section salon-section" id="services">
          <div className="salon-section-head"><div><span className="salon-eyebrow"><span className="eyebrow-rule" /> THE MENU</span><h2>{brand.servicesTitle || 'A little something for you'}<span className="hero-dot">.</span></h2>{brand.servicesIntro && <p>{brand.servicesIntro}</p>}</div><div className="service-count"><span>{filteredServices.length.toString().padStart(2, '0')}</span><small>SERVICES ON<br />THE MENU</small></div></div>
          {services.length > 0 && <div className="service-filters"><div className="service-category-list">{categories.map(category => <button key={category} onClick={() => setActiveCategory(category)} className={activeCategory === category ? 'active' : ''}>{category}</button>)}</div><label className="service-sort"><span>Sort by</span><select aria-label="Sort services" value={sortMode} onChange={event => setSortMode(event.target.value as typeof sortMode)}><option value="recommended">Recommended</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></label><label className="service-search"><input aria-label="Search services" placeholder="Find a service" value={query} onChange={event => setQuery(event.target.value)} /><span>⌕</span></label></div>}
          {filteredServices.length === 0 ? <div className="salon-empty-services"><Scissors size={21} /><p>{services.length ? 'No services match that search just yet.' : 'Our menu is being thoughtfully put together. Please check back soon.'}</p></div> : <div className="salon-service-grid">{filteredServices.map((service, index) => <article key={service.id} className="salon-service-card" onClick={() => setSelectedService(service)} tabIndex={0} onKeyDown={event => { if (event.key === 'Enter') setSelectedService(service); }}>
            <div className="salon-service-visual">{service.imageUrl ? <img src={service.imageUrl} alt="" loading="lazy" /> : <div className={`service-art service-art-${index % 3}`}><span>{String(index + 1).padStart(2, '0')}</span><i>✳</i><small>{service.category || brand.name}</small></div>}<span className="service-price-tag">{formattedPrice(service.price, brand.currency)}</span><button className="service-card-open" aria-label={`View ${service.name}`} onClick={event => { event.stopPropagation(); setSelectedService(service); }}><ArrowUpRight size={16} /></button></div>
            <div className="salon-service-copy"><div className="service-meta"><span>{service.category || 'SALON SERVICE'}</span>{service.duration > 0 && <span><Clock3 size={12} /> {service.duration} MIN</span>}</div><h3>{service.name}</h3>{service.description && <p>{service.description}</p>}<button className="service-book-link" onClick={event => { event.stopPropagation(); openBooking(service); }}>Request this service <ArrowRight size={14} /></button></div>
          </article>)}</div>}
        </section>

        {brand.aboutText && <section className="salon-about-section salon-section" id="about"><div className="about-side-label"><span>02</span><i /> OUR STORY</div><div className="about-main"><span className="salon-eyebrow"><span className="eyebrow-rule" /> {brand.aboutTitle || brand.name}</span><h2>{brand.aboutTitle || 'Made with care, always.'}</h2><p>{brand.aboutText}</p><div className="about-signoff"><span className="about-signoff-mark">✳</span><span>{brand.name}</span><i /></div></div><div className="about-art"><div className="about-art-ring"><span>THE LITTLE THINGS<br />MAKE A DIFFERENCE</span><i>✳</i></div></div></section>}

        {staff.some(member => member.name.trim()) && <section className="salon-team-section salon-section" id="team"><div className="salon-section-head team-section-head"><div><span className="salon-eyebrow"><span className="eyebrow-rule" /> {brand.category || brand.name}</span><h2>{brand.teamTitle || 'Meet the team'}<span className="hero-dot">.</span></h2>{brand.teamIntro && <p>{brand.teamIntro}</p>}</div><div className="team-section-aside"><UsersRound size={17} /><span>YOUR SALON<br />YOUR TEAM</span></div></div><div className="salon-team-grid">{staff.filter(member => member.name.trim()).map((member, index) => <article className="salon-team-card" key={member.id}><div className="team-photo">{member.imageUrl ? <img src={member.imageUrl} alt={member.name} loading="lazy" /> : <div className={`team-initials team-initials-${index % 3}`}>{initials(member.name)}</div>}<span className="team-photo-number">0{index + 1}</span></div><div className="team-card-copy"><div><h3>{member.name}</h3><span>{member.role}</span></div>{member.specialties && <p className="team-specialty"><Star size={12} /> {member.specialties}</p>}{member.bio && <p className="team-bio">{member.bio}</p>}</div></article>)}</div></section>}

        <section className="salon-visit-section salon-section" id="contact"><div className="visit-copy"><span className="salon-eyebrow"><span className="eyebrow-rule" /> {brand.contactTitle || 'VISIT US'}</span><h2>{brand.contactTitle || 'We’d love to see you'}<span className="hero-dot">.</span></h2>{brand.contactIntro && <p>{brand.contactIntro}</p>}<button className="salon-cta" onClick={() => openBooking(null)}>{bookingLabel} <ArrowRight size={16} /></button></div><div className="visit-details">{contact.address && <a className="visit-detail" href={addressLink} target="_blank" rel="noreferrer"><span className="visit-icon"><MapPin size={17} /></span><span><small>FIND US</small><strong>{contact.address}</strong></span><ArrowUpRight className="visit-arrow" size={15} /></a>}{contact.phone && <a className="visit-detail" href={phoneLink}><span className="visit-icon"><Phone size={17} /></span><span><small>GIVE US A CALL</small><strong>{contact.phone}</strong></span><ArrowUpRight className="visit-arrow" size={15} /></a>}{contact.email && <a className="visit-detail" href={emailLink}><span className="visit-icon"><Mail size={17} /></span><span><small>DROP US A NOTE</small><strong>{contact.email}</strong></span><ArrowUpRight className="visit-arrow" size={15} /></a>}{contact.hours && <div className="visit-detail visit-hours"><span className="visit-icon"><Clock3 size={17} /></span><span><small>WHEN WE’RE HERE</small><strong className="hours-text">{contact.hours}</strong></span></div>}{!contact.address && !contact.phone && !contact.email && !contact.hours && <div className="visit-details-empty"><span className="visit-icon"><MapPin size={17} /></span><span><small>CONTACT DETAILS</small><strong>Details coming soon.</strong></span></div>}<div className="visit-socials">{contact.instagram && <a href={safeWebLink(contact.instagram)} target="_blank" rel="noreferrer"><Instagram size={15} /> Instagram <ArrowUpRight size={12} /></a>}{contact.facebook && <a href={safeWebLink(contact.facebook)} target="_blank" rel="noreferrer">Facebook <ArrowUpRight size={12} /></a>}</div></div><div className="visit-stamp"><span>YOUR<br />NEIGHBORHOOD<br />SALON</span><i>✳</i></div></section>
      </main>

      <footer className="salon-footer"><a className="salon-brand footer-salon-brand" href="#top" onClick={event => { event.preventDefault(); scrollTo('top'); }}>{brand.logoUrl ? <img className="salon-logo" src={brand.logoUrl} alt="" /> : <span className="salon-monogram">{initials(brand.name)}</span>}<span className="salon-brand-copy"><strong>{brand.name}</strong>{brand.tagline && <small>{brand.tagline}</small>}</span></a><div className="salon-footer-center"><span>{brand.footerText || brand.tagline || brand.name}</span><small>© {new Date().getFullYear()} {brand.name}. ALL RIGHTS RESERVED.</small></div><button className="back-to-top" onClick={() => scrollTo('top')}>BACK TO TOP <ArrowUpRight size={14} /></button></footer>

      {selectedService && <div className="salon-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedService(null); }}><section className="service-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="service-detail-title"><button className="salon-icon-button service-detail-close" aria-label="Close service details" onClick={() => setSelectedService(null)}><X size={19} /></button><div className="service-detail-visual">{selectedService.imageUrl ? <img src={selectedService.imageUrl} alt={selectedService.name} /> : <div className="service-art service-art-0"><i>✳</i></div>}<span>{selectedService.category || 'SALON SERVICE'}</span></div><div className="service-detail-copy"><span className="salon-eyebrow">MADE FOR YOU</span><h2 id="service-detail-title">{selectedService.name}</h2>{selectedService.description && <p>{selectedService.description}</p>}<div className="service-detail-stats"><span><strong>{formattedPrice(selectedService.price, brand.currency)}</strong><small>PRICE</small></span>{selectedService.duration > 0 && <span><strong>{selectedService.duration} min</strong><small>TIME</small></span>}</div><button className="salon-cta" onClick={() => openBooking(selectedService)}>{bookingLabel} <ArrowRight size={15} /></button></div></section></div>}
      {bookingOpen && <BookingDialog salon={salon} service={bookingService} preview={preview} onClose={() => setBookingOpen(false)} />}
    </div>
  );
}
