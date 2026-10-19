import { ChangeEvent, ReactNode, useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, CalendarDays, Check, CheckCircle2,
  ChevronDown, CircleHelp, Clock3, Copy, ExternalLink, Eye, Globe2, ImagePlus, LayoutDashboard,
  Link2, LoaderCircle, LogOut, Menu, Palette, PencilLine, Plus, Scissors, Settings2, ShieldCheck,
  Sparkles, Store, Trash2, UploadCloud, UserRound, UsersRound, X,
} from 'lucide-react';
import type { OwnerBooking, PublicSalon, SalonConfig, SalonOwner, SalonRecord, SalonService, SalonTeamMember } from '../types';
import { apiRequest, getOwnerBookings, uploadImage } from '../lib/api';
import SalonWebsite from './SalonWebsite';

interface OwnerWorkspaceProps {
  user: SalonOwner;
  salon: SalonRecord;
  onSalonChange: (salon: SalonRecord) => void;
  onSignedOut: () => void;
}

type WorkspaceSection = 'overview' | 'brand' | 'services' | 'team' | 'content' | 'bookings';

const navigation: Array<{ id: WorkspaceSection; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'brand', label: 'Website & brand', icon: Store },
  { id: 'services', label: 'Services & pricing', icon: Scissors },
  { id: 'team', label: 'Your team', icon: UsersRound },
  { id: 'content', label: 'Content & contact', icon: PencilLine },
  { id: 'bookings', label: 'Bookings', icon: CalendarDays },
];

const sectionTitles: Record<WorkspaceSection, { eyebrow: string; title: string; description: string }> = {
  overview: { eyebrow: 'YOUR SALON, AT A GLANCE', title: 'Good to have you here.', description: 'Take your time setting up your online home. Your changes stay private until you publish.' },
  brand: { eyebrow: 'MAKE IT YOURS', title: 'Website & brand', description: 'Start with your name, imagery, and colors. This is the first impression clients will remember.' },
  services: { eyebrow: 'YOUR MENU, YOUR PRICES', title: 'Services & pricing', description: 'Add the services you offer. Prices and descriptions show on your public website.' },
  team: { eyebrow: 'THE PEOPLE BEHIND THE CHAIR', title: 'Introduce your team', description: 'Show clients who they will meet and what each person loves doing.' },
  content: { eyebrow: 'SAY IT IN YOUR OWN WORDS', title: 'Content & contact', description: 'Shape the story, headings, opening information, and ways clients can reach you.' },
  bookings: { eyebrow: 'CLIENT REQUESTS', title: 'Booking requests', description: 'Every appointment request for this salon appears here—and only here.' },
};

function cloneConfig(config: SalonConfig): SalonConfig {
  return JSON.parse(JSON.stringify(config)) as SalonConfig;
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function slugify(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
}

function cleanSlugInput(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-{2,}/g, '-').slice(0, 48);
}

function Field({ label, hint, children, className = '' }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return <label className={`builder-field ${className}`}><span className="builder-label">{label}</span>{children}{hint && <small className="builder-hint">{hint}</small>}</label>;
}

function ImagePicker({ label, hint, value, ratio = 'landscape', onChange }: { label: string; hint: string; value: string; ratio?: 'square' | 'landscape'; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setUploadError('Choose a JPG, PNG, WEBP, or GIF image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Images must be 5 MB or smaller.');
      return;
    }
    setUploadError('');
    setUploading(true);
    try {
      onChange(await uploadImage(file));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-picker">
      <div className={`image-picker-preview ${ratio === 'square' ? 'image-picker-square' : ''}`}>
        {value ? <img src={value} alt="Selected salon image" /> : <div className="image-picker-empty"><ImagePlus size={22} /><span>{ratio === 'square' ? 'Logo preview' : 'Hero image preview'}</span></div>}
        {uploading && <div className="image-picker-loading"><LoaderCircle size={20} className="spin" /><span>Uploading image…</span></div>}
      </div>
      <div className="image-picker-controls">
        <div><strong>{label}</strong><p>{hint}</p></div>
        <div className="image-picker-actions">
          <label className="button button-quiet button-xs upload-label"><UploadCloud size={14} /> {uploading ? 'Uploading…' : 'Upload image'}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleFile} disabled={uploading} /></label>
          {value && <button type="button" className="icon-button subtle-icon" aria-label={`Remove ${label.toLowerCase()}`} onClick={() => onChange('')}><Trash2 size={14} /></button>}
        </div>
      </div>
      <Field label="Or use an image URL"><input value={value.startsWith('/media/') ? '' : value} onChange={event => onChange(event.target.value.trim())} placeholder="https://…" /></Field>
      {uploadError && <p className="inline-error">{uploadError}</p>}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (color: string) => void }) {
  return <Field label={label}><div className="color-control"><input aria-label={`${label} picker`} type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#D4AF37'} onChange={event => onChange(event.target.value)} /><input aria-label={`${label} hex value`} value={value} onChange={event => onChange(event.target.value)} maxLength={7} /></div></Field>;
}

function currencyLabel(currency: string): string {
  try { return new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(0).replace(/[0-9.,\s]/g, ''); }
  catch { return currency; }
}

function websiteUrl(salon: SalonRecord, meta: { publicBaseUrl: string; publicBaseDomain: string }): string {
  const activeSlug = salon.publishedSlug || salon.slug;
  if (meta.publicBaseDomain.trim()) return `https://${activeSlug}.${meta.publicBaseDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
  if (meta.publicBaseUrl.trim()) return `${meta.publicBaseUrl.trim().replace(/\/$/, '')}/${activeSlug}`;
  return `${window.location.origin}/${activeSlug}`;
}

export default function OwnerWorkspace({ user, salon: initialSalon, onSalonChange, onSignedOut }: OwnerWorkspaceProps) {
  const [salon, setSalon] = useState(initialSalon);
  const [draft, setDraft] = useState(() => cloneConfig(initialSalon.config));
  const [slug, setSlug] = useState(initialSalon.slug);
  const [section, setSection] = useState<WorkspaceSection>('overview');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState('');
  const [meta, setMeta] = useState({ publicBaseUrl: '', publicBaseDomain: '' });

  useEffect(() => {
    setSalon(initialSalon);
    setDraft(cloneConfig(initialSalon.config));
    setSlug(initialSalon.slug);
  }, [initialSalon]);

  useEffect(() => {
    apiRequest<typeof meta>('/api/meta').then(setMeta).catch(() => undefined);
  }, []);

  useEffect(() => {
    let active = true;
    setBookingsLoading(true);
    getOwnerBookings(salon.id).then(result => { if (active) setBookings(result); })
      .catch(error => { if (active) setBookingsError(error instanceof Error ? error.message : 'Bookings could not be loaded.'); })
      .finally(() => { if (active) setBookingsLoading(false); });
    return () => { active = false; };
  }, [salon.id]);

  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(salon.config) || slug !== salon.slug, [draft, salon.config, salon.slug]);
  const hasUnpublishedEdits = salon.isPublished && (
    JSON.stringify(salon.config) !== JSON.stringify(salon.publishedConfig || {}) || salon.slug !== salon.publishedSlug
  );
  const liveUrl = websiteUrl(salon, meta);
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(booking => booking.status === 'Pending').length;
  const readyChecklist = [
    Boolean(draft.brand.name.trim() && slug.trim()),
    Boolean(draft.brand.logoUrl),
    Boolean(draft.brand.heroTitle.trim()),
    draft.services.some(service => service.name.trim() && service.price >= 0),
    draft.staff.some(member => member.name.trim()),
    Boolean(draft.contact.address || draft.contact.phone || draft.contact.email),
    Boolean(draft.brand.heroImageUrl),
  ];
  const readyCount = readyChecklist.filter(Boolean).length;
  const completion = Math.round(readyCount / readyChecklist.length * 100);
  const title = sectionTitles[section];
  const noticeIsError = Boolean(error);

  useEffect(() => {
    if (!notice && !error) return;
    const timer = window.setTimeout(() => { setNotice(''); setError(''); }, 5200);
    return () => window.clearTimeout(timer);
  }, [notice, error]);

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [isDirty]);

  const changeSection = (next: WorkspaceSection) => {
    setSection(next);
    setMobileNavOpen(false);
    setError('');
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateBrand = (key: keyof SalonConfig['brand'], value: string) => {
    setDraft(current => ({ ...current, brand: { ...current.brand, [key]: value } }));
  };
  const updateContact = (key: keyof SalonConfig['contact'], value: string) => {
    setDraft(current => ({ ...current, contact: { ...current.contact, [key]: value } }));
  };
  const updateTheme = (key: keyof SalonConfig['theme'], value: string) => {
    setDraft(current => ({ ...current, theme: { ...current.theme, [key]: value } }));
  };
  const updateService = (index: number, key: keyof SalonService, value: string | number) => {
    setDraft(current => ({ ...current, services: current.services.map((service, itemIndex) => itemIndex === index ? { ...service, [key]: value } : service) }));
  };
  const updateTeamMember = (index: number, key: keyof SalonTeamMember, value: string) => {
    setDraft(current => ({ ...current, staff: current.staff.map((member, itemIndex) => itemIndex === index ? { ...member, [key]: value } : member) }));
  };

  const saveDraft = async (quiet = false): Promise<SalonRecord | null> => {
    if (saving) return null;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const updated = await apiRequest<SalonRecord>(`/api/salons/${encodeURIComponent(salon.id)}`, { method: 'PUT', body: { slug: slugify(slug), config: draft } });
      setSalon(updated);
      setDraft(cloneConfig(updated.config));
      setSlug(updated.slug);
      onSalonChange(updated);
      if (!quiet) setNotice('Your changes are saved privately.');
      return updated;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Your changes could not be saved.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const publishWebsite = async () => {
    if (publishing) return;
    setPublishing(true);
    setError('');
    setNotice('');
    try {
      let updated = salon;
      if (isDirty) {
        const saved = await saveDraft(true);
        if (!saved) return;
        updated = saved;
      }
      const published = await apiRequest<SalonRecord>(`/api/salons/${encodeURIComponent(salon.id)}/publish`, { method: 'POST', body: {} });
      setSalon(published);
      setDraft(cloneConfig(published.config));
      setSlug(published.slug);
      onSalonChange(published);
      setNotice('Your salon website is live. Share the link with your clients.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Your website could not be published.');
    } finally {
      setPublishing(false);
    }
  };

  const unpublishWebsite = async () => {
    if (!window.confirm('Take your salon website offline? Your saved content and bookings will stay in your workspace.')) return;
    try {
      const updated = await apiRequest<SalonRecord>(`/api/salons/${encodeURIComponent(salon.id)}/unpublish`, { method: 'POST', body: {} });
      setSalon(updated);
      onSalonChange(updated);
      setNotice('Your website is private again. You can publish it whenever you are ready.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Your website could not be unpublished.');
    }
  };

  const copyWebsiteLink = async () => {
    try {
      await navigator.clipboard.writeText(liveUrl);
      setNotice('Website link copied to your clipboard.');
    } catch {
      setError('Could not copy automatically. Select and copy the link instead.');
    }
  };

  const signOut = async () => {
    setSigningOut(true);
    try { await apiRequest('/api/auth/logout', { method: 'POST', body: {} }); }
    finally { onSignedOut(); }
  };

  const addService = () => {
    const service: SalonService = { id: newId(), name: '', category: '', price: 0, duration: 30, description: '', imageUrl: '' };
    setDraft(current => ({ ...current, services: [...current.services, service] }));
  };
  const removeService = (id: string) => setDraft(current => ({ ...current, services: current.services.filter(service => service.id !== id) }));
  const addTeamMember = () => {
    const member: SalonTeamMember = { id: newId(), name: '', role: '', bio: '', specialties: '', imageUrl: '' };
    setDraft(current => ({ ...current, staff: [...current.staff, member] }));
  };
  const removeTeamMember = (id: string) => setDraft(current => ({ ...current, staff: current.staff.filter(member => member.id !== id) }));

  const updateBookingStatus = async (booking: OwnerBooking, status: OwnerBooking['status']) => {
    try {
      const updated = await apiRequest<OwnerBooking>(`/api/salons/${encodeURIComponent(salon.id)}/bookings/${encodeURIComponent(booking.id)}`, { method: 'PATCH', body: { status } });
      setBookings(current => current.map(item => item.id === updated.id ? updated : item));
      setNotice(`Booking ${updated.id} marked ${status.toLowerCase()}.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Booking status could not be updated.');
    }
  };

  const previewSalon: PublicSalon = { id: salon.id, slug: slugify(slug), config: draft, isPublished: salon.isPublished };

  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <a href="/dashboard" className="workspace-brand"><span className="workspace-brand-mark"><Sparkles size={16} /></span><span><strong>NEXORA</strong><small>SALON STUDIO</small></span></a>
        <div className="workspace-sidebar-label">YOUR WORKSPACE</div>
        <nav className="workspace-nav" aria-label="Workspace navigation">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => changeSection(id)} className={`workspace-nav-item ${section === id ? 'is-active' : ''}`}>
              <Icon size={17} /><span>{label}</span>{id === 'bookings' && pendingBookings > 0 && <b>{pendingBookings}</b>}
            </button>
          ))}
        </nav>
        <div className="workspace-sidebar-bottom">
          <div className="workspace-help-card"><span className="help-card-icon"><CircleHelp size={15} /></span><div><strong>Need a hand?</strong><p>Your site stays private until you publish.</p></div></div>
          <button className="workspace-account" onClick={() => setSection('brand')}><span className="account-avatar">{user.name.slice(0, 1).toUpperCase()}</span><span className="account-copy"><strong>{user.name}</strong><small>{user.email}</small></span><Settings2 size={15} /></button>
        </div>
      </aside>

      <main className="workspace-main">
        <header className="workspace-topbar">
          <button className="workspace-mobile-menu" onClick={() => setMobileNavOpen(open => !open)} aria-label="Open workspace menu">{mobileNavOpen ? <X size={19} /> : <Menu size={19} />}</button>
          <div className="workspace-breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{title.title}</strong></div>
          <div className="workspace-top-actions">
            <span className={`save-state ${isDirty ? 'save-state-dirty' : ''}`}><span />{isDirty ? 'Unsaved changes' : 'All changes saved'}</span>
            <button className="button button-quiet top-preview" onClick={() => setPreviewOpen(true)}><Eye size={15} /> Preview</button>
            {isDirty && <button className="button button-quiet top-save" onClick={() => saveDraft()} disabled={saving}>{saving ? <LoaderCircle size={14} className="spin" /> : <Check size={14} />} Save</button>}
            {salon.isPublished && !isDirty && !hasUnpublishedEdits ? <a href={liveUrl} target="_blank" rel="noreferrer" className="button button-gold top-publish"><ExternalLink size={15} /> View live site</a> : <button className="button button-gold top-publish" onClick={publishWebsite} disabled={publishing || saving}>{publishing ? <LoaderCircle size={15} className="spin" /> : <Globe2 size={15} />} {salon.isPublished ? 'Publish updates' : 'Publish website'}</button>}
          </div>
        </header>

        {mobileNavOpen && <div className="workspace-mobile-nav">{navigation.map(({ id, label, icon: Icon }) => <button key={id} className={section === id ? 'is-active' : ''} onClick={() => changeSection(id)}><Icon size={16} />{label}</button>)}</div>}

        {(notice || error) && <div className={`workspace-toast ${noticeIsError ? 'toast-error' : 'toast-success'}`} role="status"><span>{noticeIsError ? <X size={16} /> : <Check size={16} />}</span><p>{error || notice}</p><button onClick={() => { setNotice(''); setError(''); }} aria-label="Dismiss notification"><X size={15} /></button></div>}

        <div className="workspace-content">
          <div className="workspace-page-heading"><div><span className="eyebrow workspace-eyebrow">{title.eyebrow}</span><h1>{section === 'overview' ? <>Good to have you here, <em>{user.name.split(' ')[0]}.</em></> : title.title}</h1><p>{title.description}</p></div>{section !== 'overview' && section !== 'bookings' && <button className="button button-gold workspace-save" onClick={() => saveDraft()} disabled={!isDirty || saving}>{saving ? <LoaderCircle size={15} className="spin" /> : <Check size={15} />}{saving ? 'Saving…' : 'Save changes'}</button>}</div>

          {section === 'overview' && (
            <div className="overview-grid">
              <section className="overview-hero-card">
                <div className="overview-hero-copy"><div className={`status-pill ${salon.isPublished ? 'status-published' : 'status-draft'}`}><span />{salon.isPublished ? hasUnpublishedEdits ? 'LIVE · DRAFT HAS CHANGES' : 'YOUR WEBSITE IS LIVE' : 'PRIVATE DRAFT'}</div><h2>{draft.brand.name || 'Your salon website'}<span>{salon.isPublished && !hasUnpublishedEdits ? ' is open for business online.' : ' is taking shape.'}</span></h2><p>{salon.isPublished ? hasUnpublishedEdits ? 'Your live website is unchanged. Publish your latest edits when they are ready.' : 'Your new online home is ready to share with the world.' : 'A few details are all it takes to bring your salon online. Nothing is public until you choose to publish.'}</p><div className="overview-hero-actions"><button className="button button-gold" onClick={() => salon.isPublished ? window.open(liveUrl, '_blank', 'noopener,noreferrer') : changeSection('brand')}>{salon.isPublished ? 'View your website' : 'Set up your website'} <ArrowRight size={15} /></button><button className="button button-dark-outline" onClick={() => setPreviewOpen(true)}><Eye size={15} /> Preview draft</button>{salon.isPublished && <button className="button button-dark-outline" onClick={unpublishWebsite}><X size={13} /> Take website offline</button>}</div></div>
                <div className="overview-hero-art"><div className="art-ring ring-one" /><div className="art-ring ring-two" /><div className="art-glint">✳</div><span className="art-wordmark">{draft.brand.name ? draft.brand.name.slice(0, 1).toUpperCase() : '✦'}</span><span className="art-caption">A LITTLE SPACE<br />THAT IS ALL YOURS</span></div>
              </section>

              <section className="checklist-card">
                <div className="card-heading-row"><div><span className="eyebrow card-eyebrow">YOUR SETUP</span><h2>Make your mark</h2></div><div className="progress-ring" style={{ '--progress': `${completion * 3.6}deg` } as CSSProperties}><span>{completion}%</span></div></div>
                <p className="checklist-intro">A thoughtful start makes all the difference. Keep going at your own pace.</p>
                <div className="checklist-items">
                  {[['brand', 'Name your website'], ['brand', 'Add a salon logo'], ['content', 'Write your hero heading'], ['services', 'Add your services'], ['team', 'Introduce your team'], ['content', 'Add contact details'], ['brand', 'Choose a hero image']].map(([target, label], index) => {
                    const done = readyChecklist[index];
                    return <button key={label} className={`checklist-item ${done ? 'is-done' : ''}`} onClick={() => changeSection(target as WorkspaceSection)}><span className="checklist-check">{done ? <Check size={12} /> : <span>{String(index + 1).padStart(2, '0')}</span>}</span><span>{label}</span><ArrowRight size={14} /></button>;
                  })}
                </div>
              </section>

              <section className="overview-metrics-card">
                <div className="metric-block"><span className="metric-icon"><CalendarDays size={18} /></span><span className="metric-value">{totalBookings}</span><span className="metric-label">Total booking requests</span></div>
                <div className="metric-divider" />
                <div className="metric-block"><span className="metric-icon metric-icon-warm"><Clock3 size={18} /></span><span className="metric-value">{pendingBookings}</span><span className="metric-label">Waiting for your reply</span></div>
                <button className="metric-link" onClick={() => changeSection('bookings')}>Open bookings <ArrowRight size={14} /></button>
              </section>

              <section className="link-card"><div className="link-card-head"><span className="link-card-icon"><Link2 size={17} /></span><div><span className="eyebrow card-eyebrow">YOUR WEBSITE ADDRESS</span><h2>{salon.isPublished ? 'Ready to share' : 'Reserved for you'}</h2></div></div><div className="website-link-field"><span>{salon.isPublished ? liveUrl : `${window.location.origin}/${salon.slug}`}</span>{salon.isPublished && <button onClick={copyWebsiteLink} aria-label="Copy website link"><Copy size={15} /></button>}</div><p>{salon.isPublished ? 'Your published website is available at this link.' : 'This private link is yours. Publish your site when it feels right.'}</p>{meta.publicBaseDomain && <div className="domain-note"><Globe2 size={14} /> Wildcard subdomains are enabled for {meta.publicBaseDomain}.</div>}</section>
            </div>
          )}

          {section === 'brand' && (
            <div className="editor-layout">
              <div className="editor-main-column">
                <section className="builder-card"><div className="builder-card-heading"><div><span className="eyebrow card-eyebrow">THE DETAILS CLIENTS SEE FIRST</span><h2>Your salon identity</h2><p>These details appear in your site header, browser link, and first impression.</p></div><span className="builder-section-icon"><Store size={18} /></span></div>
                  <div className="builder-form-grid"><Field label="Salon / website name"><input value={draft.brand.name} onChange={event => updateBrand('name', event.target.value)} placeholder="Your salon name" maxLength={100} required /></Field><Field label="Website address" hint="Lowercase letters, numbers, and hyphens only."><div className="slug-editor"><span>{meta.publicBaseDomain ? 'https://…' : `${window.location.host}/`}</span><input value={slug} onChange={event => setSlug(cleanSlugInput(event.target.value))} placeholder="your-salon" maxLength={48} /></div></Field><Field label="Salon type"><input value={draft.brand.category} onChange={event => updateBrand('category', event.target.value)} placeholder="Hair salon, wellness studio, barbershop…" maxLength={60} /></Field><Field label="Short tagline" hint="A short line that captures your salon’s feel."><input value={draft.brand.tagline} onChange={event => updateBrand('tagline', event.target.value)} placeholder="A few words that sound like you" maxLength={180} /></Field><Field label="Pricing currency"><select value={draft.brand.currency} onChange={event => updateBrand('currency', event.target.value)}>{[['INR', 'Indian Rupee (INR)'], ['USD', 'US Dollar (USD)'], ['GBP', 'Pound Sterling (GBP)'], ['EUR', 'Euro (EUR)'], ['AED', 'UAE Dirham (AED)'], ['CAD', 'Canadian Dollar (CAD)'], ['AUD', 'Australian Dollar (AUD)']].map(([code, label]) => <option value={code} key={code}>{label}</option>)}</select></Field></div>
                </section>

                <section className="builder-card"><div className="builder-card-heading"><div><span className="eyebrow card-eyebrow">YOUR VISUAL SIGNATURE</span><h2>Logo & photography</h2><p>Upload your own imagery or paste a secure image URL. Files stay associated with your account.</p></div><span className="builder-section-icon"><ImagePlus size={18} /></span></div>
                  <div className="image-picker-grid"><ImagePicker label="Salon logo" hint="Square artwork looks best. JPG, PNG, WEBP, or GIF · up to 5 MB." value={draft.brand.logoUrl} ratio="square" onChange={value => updateBrand('logoUrl', value)} /><ImagePicker label="Hero image" hint="Use a wide image to set the mood at the top of your website." value={draft.brand.heroImageUrl} onChange={value => updateBrand('heroImageUrl', value)} /></div>
                </section>
              </div>
              <aside className="editor-aside"><section className="builder-card theme-card"><div className="builder-card-heading"><div><span className="eyebrow card-eyebrow">SET THE TONE</span><h2>Your color palette</h2><p>Pick the colors that carry your brand through every section.</p></div><span className="builder-section-icon"><Palette size={18} /></span></div><div className="color-fields"><ColorField label="Accent color" value={draft.theme.accent} onChange={value => updateTheme('accent', value)} /><ColorField label="Website background" value={draft.theme.background} onChange={value => updateTheme('background', value)} /><ColorField label="Card / surface" value={draft.theme.surface} onChange={value => updateTheme('surface', value)} /><ColorField label="Main text" value={draft.theme.text} onChange={value => updateTheme('text', value)} /><ColorField label="Secondary text" value={draft.theme.muted} onChange={value => updateTheme('muted', value)} /></div><div className="palette-preview" style={{ background: draft.theme.background, color: draft.theme.text }}><span className="palette-preview-dot" style={{ background: draft.theme.accent }} /><span>YOUR BRAND, THROUGHOUT</span><strong>{draft.brand.name || 'Your salon name'}</strong><small style={{ color: draft.theme.muted }}>A website that feels like you.</small></div></section><section className="aside-tip"><Sparkles size={16} /><div><strong>Good to know</strong><p>Logo and hero imagery are optional while you are drafting. A strong, well-lit photo can help clients feel at home before they visit.</p></div></section></aside>
            </div>
          )}

          {section === 'services' && (
            <div className="services-editor"><div className="section-action-row"><div><h2>Your service menu</h2><p>{draft.services.length} {draft.services.length === 1 ? 'service' : 'services'} added · Update your price or description whenever you need.</p></div><button className="button button-gold" onClick={addService}><Plus size={16} /> Add a service</button></div>
              {draft.services.length === 0 ? <div className="editor-empty"><span><Scissors size={22} /></span><h3>Your menu starts here.</h3><p>There are no services in this workspace yet. Add the treatments, appointments, or packages you offer.</p><button className="button button-gold" onClick={addService}><Plus size={15} /> Add your first service</button></div> : <div className="service-editor-list">{draft.services.map((service, index) => <article className="service-editor-card" key={service.id}><div className="service-editor-card-top"><span className="service-number">{String(index + 1).padStart(2, '0')}</span><span className="service-card-label">SERVICE DETAILS</span><button className="icon-button remove-item" onClick={() => removeService(service.id)} aria-label="Remove service"><Trash2 size={15} /></button></div><div className="service-editor-grid"><Field label="Service name"><input value={service.name} onChange={event => updateService(index, 'name', event.target.value)} placeholder="e.g. Signature cut & style" maxLength={100} /></Field><Field label="Category"><input value={service.category} onChange={event => updateService(index, 'category', event.target.value)} placeholder="Hair, nails, skin…" maxLength={60} /></Field><Field label={`Price (${currencyLabel(draft.brand.currency)})`}><div className="number-field"><span>{currencyLabel(draft.brand.currency)}</span><input type="number" min="0" max="1000000" step="1" value={service.price} onChange={event => updateService(index, 'price', Number(event.target.value))} /></div></Field><Field label="Appointment length"><div className="number-field"><input type="number" min="0" max="1440" step="5" value={service.duration} onChange={event => updateService(index, 'duration', Number(event.target.value))} /><span>minutes · 0 hides</span></div></Field><Field label="Description" className="span-two"><textarea rows={3} value={service.description} onChange={event => updateService(index, 'description', event.target.value)} placeholder="What should clients know before they book?" maxLength={1200} /></Field><div className="span-two"><ImagePicker label="Service photo" hint="Optional · wide images work best on the service card." value={service.imageUrl} onChange={value => updateService(index, 'imageUrl', value)} /></div></div></article>)}</div>}
              <div className="editor-footnote"><ShieldCheck size={15} /> Your service menu is private until you publish your website.</div>
            </div>
          )}

          {section === 'team' && (
            <div className="services-editor"><div className="section-action-row"><div><h2>Meet the people clients will love</h2><p>{draft.staff.length} {draft.staff.length === 1 ? 'team member' : 'team members'} added · This section is hidden from your site until someone is added.</p></div><button className="button button-gold" onClick={addTeamMember}><Plus size={16} /> Add team member</button></div>
              {draft.staff.length === 0 ? <div className="editor-empty"><span><UsersRound size={22} /></span><h3>Every great salon has a story to tell.</h3><p>Introduce the stylists, artists, and specialists who make your salon feel like yours.</p><button className="button button-gold" onClick={addTeamMember}><Plus size={15} /> Add your first team member</button></div> : <div className="team-editor-list">{draft.staff.map((member, index) => <article className="team-editor-card" key={member.id}><div className="team-editor-card-top"><div className="team-avatar-placeholder">{member.imageUrl ? <img src={member.imageUrl} alt="" /> : <UserRound size={20} />}</div><div><span className="service-card-label">TEAM MEMBER {String(index + 1).padStart(2, '0')}</span><h3>{member.name || 'New team member'}</h3></div><button className="icon-button remove-item" onClick={() => removeTeamMember(member.id)} aria-label="Remove team member"><Trash2 size={15} /></button></div><div className="team-editor-grid"><Field label="Name"><input value={member.name} onChange={event => updateTeamMember(index, 'name', event.target.value)} placeholder="Full name" maxLength={100} /></Field><Field label="Role"><input value={member.role} onChange={event => updateTeamMember(index, 'role', event.target.value)} placeholder="Stylist, colorist, owner…" maxLength={80} /></Field><Field label="Specialties"><input value={member.specialties} onChange={event => updateTeamMember(index, 'specialties', event.target.value)} placeholder="What do they love doing?" maxLength={250} /></Field><div className="span-two"><ImagePicker label="Team portrait" hint="Optional · a square, natural-light photo works well." value={member.imageUrl} ratio="square" onChange={value => updateTeamMember(index, 'imageUrl', value)} /></div><Field label="A short introduction" className="span-two"><textarea rows={3} value={member.bio} onChange={event => updateTeamMember(index, 'bio', event.target.value)} placeholder="Tell clients a little about this person." maxLength={1000} /></Field></div></article>)}</div>}
            </div>
          )}

          {section === 'content' && (
            <div className="editor-layout content-editor-layout"><div className="editor-main-column">
              <section className="builder-card"><div className="builder-card-heading"><div><span className="eyebrow card-eyebrow">THE FIRST HELLO</span><h2>Homepage story</h2><p>Write the words that welcome clients in. Leave a field empty to keep that line off your website.</p></div><span className="builder-section-icon"><PencilLine size={18} /></span></div><div className="builder-form-grid"><Field label="Small introduction line"><input value={draft.brand.heroBadge} onChange={event => updateBrand('heroBadge', event.target.value)} placeholder="Welcome to our studio" maxLength={80} /></Field><Field label="Main hero heading"><input value={draft.brand.heroTitle} onChange={event => updateBrand('heroTitle', event.target.value)} placeholder="A heading that feels like you" maxLength={140} /></Field><Field label="Introduction below heading" className="span-two"><textarea rows={3} value={draft.brand.heroSubtitle} onChange={event => updateBrand('heroSubtitle', event.target.value)} placeholder="Share a little about what clients can expect here." maxLength={500} /></Field><Field label="About section heading"><input value={draft.brand.aboutTitle} onChange={event => updateBrand('aboutTitle', event.target.value)} placeholder="A little about us" maxLength={100} /></Field><Field label="Services section heading"><input value={draft.brand.servicesTitle} onChange={event => updateBrand('servicesTitle', event.target.value)} placeholder="Our services" maxLength={100} /></Field><Field label="About your salon" className="span-two"><textarea rows={6} value={draft.brand.aboutText} onChange={event => updateBrand('aboutText', event.target.value)} placeholder="Your approach, your neighborhood, and what makes a visit feel special…" maxLength={2400} /></Field></div></section>
              <section className="builder-card"><div className="builder-card-heading"><div><span className="eyebrow card-eyebrow">YOUR WEBSITE SECTIONS</span><h2>Headings & calls to action</h2><p>Every line is editable. Keep the language true to the experience you offer.</p></div><span className="builder-section-icon"><Sparkles size={18} /></span></div><div className="builder-form-grid"><Field label="Team section heading"><input value={draft.brand.teamTitle} onChange={event => updateBrand('teamTitle', event.target.value)} placeholder="Meet the team" maxLength={100} /></Field><Field label="Contact section heading"><input value={draft.brand.contactTitle} onChange={event => updateBrand('contactTitle', event.target.value)} placeholder="Find your way to us" maxLength={100} /></Field><Field label="Hero note"><input value={draft.brand.heroNote} onChange={event => updateBrand('heroNote', event.target.value)} placeholder="A short line beneath your introduction" maxLength={100} /></Field><Field label="Brand detail strip"><input value={draft.brand.marqueeText} onChange={event => updateBrand('marqueeText', event.target.value)} placeholder="A short phrase about your salon" maxLength={160} /></Field><Field label="Services introduction" className="span-two"><textarea rows={2} value={draft.brand.servicesIntro} onChange={event => updateBrand('servicesIntro', event.target.value)} placeholder="A line to introduce your service menu." maxLength={500} /></Field><Field label="Team introduction" className="span-two"><textarea rows={2} value={draft.brand.teamIntro} onChange={event => updateBrand('teamIntro', event.target.value)} placeholder="A line to introduce your team." maxLength={500} /></Field><Field label="Contact introduction" className="span-two"><textarea rows={2} value={draft.brand.contactIntro} onChange={event => updateBrand('contactIntro', event.target.value)} placeholder="A warm invitation to get in touch." maxLength={500} /></Field><Field label="Booking button text"><input value={draft.brand.bookingButton} onChange={event => updateBrand('bookingButton', event.target.value)} placeholder="Book an appointment" maxLength={60} /></Field><Field label="Footer note"><textarea rows={2} value={draft.brand.footerText} onChange={event => updateBrand('footerText', event.target.value)} placeholder="A sign-off or note for clients." maxLength={500} /></Field></div></section>
            </div><aside className="editor-aside"><section className="builder-card"><div className="builder-card-heading"><div><span className="eyebrow card-eyebrow">MAKE IT EASY TO VISIT</span><h2>Contact & opening hours</h2><p>Clients can use these details directly from your website.</p></div><span className="builder-section-icon"><Globe2 size={18} /></span></div><div className="contact-editor-fields"><Field label="Salon address"><textarea rows={3} value={draft.contact.address} onChange={event => updateContact('address', event.target.value)} placeholder="Street, area, city, postcode" maxLength={300} /></Field><Field label="Phone number"><input type="tel" value={draft.contact.phone} onChange={event => updateContact('phone', event.target.value)} placeholder="+91 …" maxLength={60} /></Field><Field label="Booking / contact email"><input type="email" value={draft.contact.email} onChange={event => updateContact('email', event.target.value)} placeholder="hello@yoursalon.com" maxLength={254} /></Field><Field label="Opening hours" hint="Add one line per day if that is easiest."><textarea rows={5} value={draft.contact.hours} onChange={event => updateContact('hours', event.target.value)} placeholder={'Monday – Friday · 9am–6pm\nSaturday · 10am–4pm\nSunday · Closed'} maxLength={700} /></Field></div></section><section className="builder-card"><div className="builder-card-heading"><div><span className="eyebrow card-eyebrow">STAY CONNECTED</span><h2>Social links</h2><p>Share the profiles where clients can find your latest work.</p></div></div><div className="contact-editor-fields"><Field label="Instagram URL"><input type="url" value={draft.contact.instagram} onChange={event => updateContact('instagram', event.target.value)} placeholder="https://instagram.com/…" maxLength={600} /></Field><Field label="Facebook URL"><input type="url" value={draft.contact.facebook} onChange={event => updateContact('facebook', event.target.value)} placeholder="https://facebook.com/…" maxLength={600} /></Field></div></section></aside></div>
          )}

          {section === 'bookings' && (
            <div className="bookings-panel"><div className="bookings-summary"><div><span className="eyebrow card-eyebrow">YOUR SALON'S APPOINTMENTS</span><h2>{bookings.length} {bookings.length === 1 ? 'request' : 'requests'} in your inbox</h2><p>Clients book directly from your published website. Their details stay in this private workspace.</p></div><div className="booking-summary-numbers"><span><b>{pendingBookings}</b> pending</span><span><b>{bookings.filter(booking => booking.status === 'Confirmed').length}</b> confirmed</span></div></div>
              {bookingsLoading ? <div className="bookings-loading"><LoaderCircle size={20} className="spin" /> Loading your bookings…</div> : bookingsError ? <div className="editor-empty"><span><CircleHelp size={22} /></span><h3>Bookings could not be loaded.</h3><p>{bookingsError}</p><button className="button button-quiet" onClick={() => { setBookingsError(''); setBookingsLoading(true); getOwnerBookings(salon.id).then(setBookings).catch(error => setBookingsError(error instanceof Error ? error.message : 'Please try again.')).finally(() => setBookingsLoading(false)); }}>Try again</button></div> : bookings.length === 0 ? <div className="editor-empty bookings-empty"><span><CalendarDays size={22} /></span><h3>Your next appointment request will land here.</h3><p>Once your website is published, clients can request an appointment from your service menu. No demo bookings are added.</p>{!salon.isPublished && <button className="button button-gold" onClick={() => changeSection('brand')}>Continue setting up <ArrowRight size={15} /></button>}</div> : <div className="booking-table-wrap"><table className="booking-table"><thead><tr><th>CLIENT</th><th>SERVICE</th><th>DATE & TIME</th><th>PRICE</th><th>STATUS</th></tr></thead><tbody>{bookings.map(booking => <tr key={booking.id}><td><div className="booking-client"><strong>{booking.customerName}</strong><a href={`mailto:${booking.customerEmail}`}>{booking.customerEmail}</a><a href={`tel:${booking.customerPhone}`}>{booking.customerPhone}</a></div></td><td><div className="booking-service-cell"><strong>{booking.serviceName}</strong>{booking.notes && <span>{booking.notes}</span>}</div></td><td><strong>{new Date(`${booking.date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong><small>{booking.timeSlot}</small></td><td>{new Intl.NumberFormat('en', { style: 'currency', currency: draft.brand.currency, maximumFractionDigits: 0 }).format(booking.price)}</td><td><select className={`booking-status status-${booking.status.toLowerCase()}`} value={booking.status} onChange={event => updateBookingStatus(booking, event.target.value as OwnerBooking['status'])}><option>Pending</option><option>Confirmed</option><option>Completed</option><option>Rejected</option></select></td></tr>)}</tbody></table></div>}
            </div>
          )}

          <footer className="workspace-footer"><span>Private by default. Built around your salon.</span><span><ShieldCheck size={13} /> Your salon data is isolated from every other workspace.</span></footer>
        </div>
      </main>

      {previewOpen && <div className="preview-overlay"><div className="preview-toolbar"><div className="preview-toolbar-brand"><span className="preview-live-dot" /> PRIVATE PREVIEW <span className="preview-separator">·</span> Only you can see this draft</div><div className="preview-toolbar-actions"><span className="preview-slug">{slug ? `/${slug}` : 'Choose a website address'}</span><button className="button button-quiet button-xs" onClick={() => setPreviewOpen(false)}><X size={15} /> Close preview</button></div></div><div className="preview-scroll"><SalonWebsite salon={previewSalon} preview /></div></div>}

      <div className="workspace-mobile-account"><span className="account-avatar">{user.name.slice(0, 1).toUpperCase()}</span><span>{user.email}</span><button onClick={signOut} disabled={signingOut} aria-label="Sign out">{signingOut ? <LoaderCircle size={15} className="spin" /> : <LogOut size={15} />}</button></div>
      <div className="workspace-desktop-signout"><button onClick={signOut} disabled={signingOut}><LogOut size={15} /> Sign out</button></div>
    </div>
  );
}
