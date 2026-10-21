import { FormEvent, useEffect, useState } from 'react';
import {
  BadgeCheck, Check, ChevronLeft, ChevronRight, Clock3, CreditCard, ExternalLink, Eye, Globe2, LoaderCircle,
  LogOut, MapPin, RefreshCw, Search, Settings2, ShieldCheck, Sparkles, Store, UsersRound, X,
} from 'lucide-react';
import type {
  AdminOverview, AdminPage, AdminReviewRecord, AdminSalonRecord, AdminSubscriptionRecord, AdminUserRecord,
  PlatformSettings, SalonOwner, SubscriptionPlan, SubscriptionStatus, UserRole,
} from '../types';
import { apiRequest } from '../lib/api';

type AdminSection = 'overview' | 'approvals' | 'users' | 'salons' | 'subscriptions' | 'settings';

const nav: Array<{ id: AdminSection; label: string; icon: typeof UsersRound }> = [
  { id: 'overview', label: 'Overview', icon: ShieldCheck },
  { id: 'approvals', label: 'Website approvals', icon: BadgeCheck },
  { id: 'users', label: 'Users & roles', icon: UsersRound },
  { id: 'salons', label: 'Salons & websites', icon: Store },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'settings', label: 'Platform settings', icon: Settings2 },
];

const titles: Record<AdminSection, { eyebrow: string; title: string; description: string }> = {
  overview: { eyebrow: 'PLATFORM CONTROL CENTER', title: 'Platform overview', description: 'A live view of accounts, salons, publishing, and subscriptions across the platform.' },
  approvals: { eyebrow: 'QUALITY & PUBLISHING CONTROL', title: 'Website approvals', description: 'Review salon websites, send clear feedback, and approve only complete websites for publishing.' },
  users: { eyebrow: 'IDENTITIES & ACCESS', title: 'Users & roles', description: 'Review platform accounts, adjust access roles, and suspend accounts when needed.' },
  salons: { eyebrow: 'TENANT MANAGEMENT', title: 'Salons & websites', description: 'Manage salon status and publication for every tenant without entering owner workspaces.' },
  subscriptions: { eyebrow: 'PLANS & BILLING STATUS', title: 'Subscriptions', description: 'Manage plans and subscription states. Payment processing is not connected.' },
  settings: { eyebrow: 'PLATFORM CONFIGURATION', title: 'Platform settings', description: 'Set the platform identity, default currency, support contact, and owner-registration availability.' },
};

const plans: SubscriptionPlan[] = ['free', 'starter', 'growth', 'premium'];
const subscriptionStatuses: SubscriptionStatus[] = ['trialing', 'active', 'past_due', 'cancelled', 'suspended'];

function formatDate(value: string | null): string {
  if (!value) return '—';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatPrice(value: number, currency: string): string {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value); }
  catch { return `${currency} ${value.toLocaleString()}`; }
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`admin-status-badge admin-status-${status.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`}><span />{status.replaceAll('_', ' ')}</span>;
}

function PageControls({ total, limit, offset, onChange }: { total: number; limit: number; offset: number; onChange: (next: number) => void }) {
  const current = Math.floor(offset / limit) + 1;
  const pages = Math.max(1, Math.ceil(total / limit));
  return <div className="admin-pagination"><span>{total === 0 ? 'No results' : `${offset + 1}–${Math.min(offset + limit, total)} of ${total}`}</span><div><button type="button" aria-label="Previous page" disabled={current <= 1} onClick={() => onChange(Math.max(0, offset - limit))}><ChevronLeft size={15} /></button><span>Page {current} of {pages}</span><button type="button" aria-label="Next page" disabled={current >= pages} onClick={() => onChange(offset + limit)}><ChevronRight size={15} /></button></div></div>;
}

function EmptyTable({ loading, children }: { loading: boolean; children: string }) {
  return <div className="admin-empty">{loading ? <><LoaderCircle size={20} className="spin" /> Loading platform data…</> : <>{children}</>}</div>;
}

export default function SuperAdminDashboard({ user, onSignedOut, platformName = 'Nexora Salon Studio' }: { user: SalonOwner; onSignedOut: () => void; platformName?: string }) {
  const brandPrimary = platformName.trim().split(/\s+/).filter(Boolean)[0] || 'Nexora';
  const [section, setSection] = useState<AdminSection>('overview');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [reviews, setReviews] = useState<AdminPage<AdminSalonRecord> | null>(null);
  const [reviewRecord, setReviewRecord] = useState<AdminReviewRecord | null>(null);
  const [reviewReason, setReviewReason] = useState('');
  const [reviewActionError, setReviewActionError] = useState('');
  const [users, setUsers] = useState<AdminPage<AdminUserRecord> | null>(null);
  const [salons, setSalons] = useState<AdminPage<AdminSalonRecord> | null>(null);
  const [subscriptions, setSubscriptions] = useState<AdminPage<AdminSubscriptionRecord> | null>(null);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [userDrafts, setUserDrafts] = useState<Record<string, { role: UserRole; status: AdminUserRecord['status'] }>>({});
  const [salonDrafts, setSalonDrafts] = useState<Record<string, AdminSalonRecord['status']>>({});
  const [subscriptionDrafts, setSubscriptionDrafts] = useState<Record<string, { plan: SubscriptionPlan; status: SubscriptionStatus; renewsAt: string }>>({});
  const [query, setQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const load = async () => {
      try {
        if (section === 'overview') {
          const result = await apiRequest<AdminOverview>('/api/admin/overview');
          if (active) setOverview(result);
        } else if (section === 'settings') {
          const result = await apiRequest<PlatformSettings>('/api/admin/settings');
          if (active) setSettings(result);
        } else if (section === 'approvals') {
          const params = new URLSearchParams({ q: query, limit: '25', offset: String(offset) });
          const result = await apiRequest<AdminPage<AdminSalonRecord>>(`/api/admin/reviews?${params}`);
          if (active) setReviews(result);
        } else {
          const params = new URLSearchParams({ q: query, limit: '25', offset: String(offset) });
          if (section === 'users') {
            const result = await apiRequest<AdminPage<AdminUserRecord>>(`/api/admin/users?${params}`);
            if (active) { setUsers(result); setUserDrafts({}); }
          } else if (section === 'salons') {
            const result = await apiRequest<AdminPage<AdminSalonRecord>>(`/api/admin/salons?${params}`);
            if (active) { setSalons(result); setSalonDrafts({}); }
          } else {
            const result = await apiRequest<AdminPage<AdminSubscriptionRecord>>(`/api/admin/subscriptions?${params}`);
            if (active) {
              setSubscriptions(result);
              setSubscriptionDrafts(Object.fromEntries(result.items.map(item => [item.id, { plan: item.plan, status: item.status, renewsAt: item.renewsAt || '' }])));
            }
          }
        }
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Platform data could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [section, query, offset, reloadKey]);

  const changeSection = (next: AdminSection) => {
    setSection(next);
    setOffset(0);
    setQuery('');
    setNotice('');
    setError('');
  };

  const setUserDraft = (id: string, key: 'role' | 'status', value: UserRole | AdminUserRecord['status']) => {
    const current = users?.items.find(item => item.id === id);
    if (!current) return;
    setUserDrafts(existing => ({ ...existing, [id]: { role: current.role, status: current.status, ...existing[id], [key]: value } }));
  };

  const saveUser = async (item: AdminUserRecord) => {
    const draft = userDrafts[item.id] || { role: item.role, status: item.status };
    setBusyId(item.id); setError(''); setNotice('');
    try {
      await apiRequest(`/api/admin/users/${encodeURIComponent(item.id)}`, { method: 'PATCH', body: draft });
      setNotice(`Access updated for ${item.email}.`);
      setReloadKey(value => value + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'User access could not be updated.');
    } finally { setBusyId(''); }
  };

  const saveSalonStatus = async (item: AdminSalonRecord) => {
    const status = salonDrafts[item.id] || item.status;
    setBusyId(item.id); setError(''); setNotice('');
    try {
      await apiRequest(`/api/admin/salons/${encodeURIComponent(item.id)}`, { method: 'PATCH', body: { status } });
      setNotice(`${item.name} is now ${status}.`);
      setReloadKey(value => value + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Salon status could not be updated.');
    } finally { setBusyId(''); }
  };

  const changePublication = async (item: AdminSalonRecord) => {
    const action = item.isPublished ? 'unpublish' : 'publish';
    const prompt = item.isPublished
      ? `Take ${item.name}'s website offline? The owner can publish it again later.`
      : `Publish the current draft for ${item.name}?`;
    if (!window.confirm(prompt)) return;
    setBusyId(item.id); setError(''); setNotice('');
    try {
      await apiRequest(`/api/admin/salons/${encodeURIComponent(item.id)}/${action}`, { method: 'POST', body: {} });
      setNotice(item.isPublished ? `${item.name}'s website is offline.` : `${item.name}'s website is live.`);
      setReloadKey(value => value + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Website publication could not be changed.');
    } finally { setBusyId(''); }
  };

  const openReview = async (item: AdminSalonRecord) => {
    setBusyId(item.id); setError(''); setNotice('');
    try {
      const result = await apiRequest<AdminReviewRecord>(`/api/admin/salons/${encodeURIComponent(item.id)}/review`);
      setReviewRecord(result);
      setReviewReason('');
      setReviewActionError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The salon submission could not be opened.');
    } finally { setBusyId(''); }
  };

  const completeReview = async (action: 'approved' | 'rejected' | 'changes_requested') => {
    if (!reviewRecord || saving) return;
    if (action !== 'approved' && reviewReason.trim().length < 8) {
      setReviewActionError('Add a clear review reason of at least 8 characters.');
      return;
    }
    setSaving(true); setError(''); setNotice(''); setReviewActionError('');
    try {
      await apiRequest(`/api/admin/salons/${encodeURIComponent(reviewRecord.salon.id)}/review`, { method: 'POST', body: { action, reason: reviewReason.trim() } });
      const label = action === 'approved' ? 'approved' : action === 'rejected' ? 'rejected' : 'returned with requested changes';
      setNotice(`${reviewRecord.salon.name} was ${label}.`);
      setReviewRecord(null);
      setReviewReason('');
      setReloadKey(value => value + 1);
    } catch (requestError) {
      setReviewActionError(requestError instanceof Error ? requestError.message : 'The review decision could not be saved.');
    } finally { setSaving(false); }
  };

  const saveSubscription = async (item: AdminSubscriptionRecord) => {
    const draft = subscriptionDrafts[item.id] || { plan: item.plan, status: item.status, renewsAt: item.renewsAt || '' };
    setBusyId(item.id); setError(''); setNotice('');
    try {
      await apiRequest(`/api/admin/subscriptions/${encodeURIComponent(item.id)}`, { method: 'PATCH', body: { ...draft, renewsAt: draft.renewsAt || null } });
      setNotice(`Subscription updated for ${item.salonName}.`);
      setReloadKey(value => value + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Subscription could not be updated.');
    } finally { setBusyId(''); }
  };

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settings) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const updated = await apiRequest<PlatformSettings>('/api/admin/settings', { method: 'PUT', body: settings });
      setSettings(updated);
      setNotice('Platform settings saved.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Platform settings could not be saved.');
    } finally { setSaving(false); }
  };

  const signOut = async () => {
    setSigningOut(true);
    try { await apiRequest('/api/auth/logout', { method: 'POST', body: {} }); }
    finally { onSignedOut(); }
  };

  const title = titles[section];
  const activePage = section === 'users' ? users : section === 'salons' ? salons : subscriptions;
  const currentOffset = activePage?.offset || 0;
  const currentLimit = activePage?.limit || 25;
  const total = activePage?.total || 0;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a href="/admin" className="admin-brand"><span className="workspace-brand-mark"><Sparkles size={16} /></span><span><strong>{brandPrimary.toUpperCase()}</strong><small>PLATFORM ADMIN</small></span></a>
        <div className="admin-role-chip"><ShieldCheck size={14} /> SUPER ADMIN</div>
        <nav className="admin-nav" aria-label="Platform administration">
          {nav.map(({ id, label, icon: Icon }) => <button type="button" key={id} onClick={() => changeSection(id)} className={section === id ? 'is-active' : ''}><Icon size={17} /><span>{label}</span>{id === 'approvals' && overview?.pendingApprovals ? <b className="admin-nav-count">{overview.pendingApprovals}</b> : null}</button>)}
        </nav>
        <div className="admin-sidebar-bottom"><div className="admin-identity"><span>{user.name.slice(0, 1).toUpperCase()}</span><div><strong>{user.name}</strong><small>{user.email}</small></div></div><button className="admin-signout" onClick={signOut} disabled={signingOut}>{signingOut ? <LoaderCircle size={15} className="spin" /> : <LogOut size={15} />} Sign out</button></div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar"><div><span className="admin-topbar-mark"><ShieldCheck size={15} /></span><span>Platform administration</span><b>/</b><strong>{title.title}</strong></div><button className="admin-refresh" onClick={() => setReloadKey(value => value + 1)} disabled={loading} aria-label="Refresh platform data"><RefreshCw size={15} className={loading ? 'spin' : ''} /></button></header>
        <section className="admin-content">
          <div className="admin-page-heading"><div><span className="eyebrow workspace-eyebrow">{title.eyebrow}</span><h1>{title.title}</h1><p>{title.description}</p></div>{['approvals', 'users', 'salons', 'subscriptions'].includes(section) && <label className="admin-search"><Search size={15} /><input value={query} onChange={event => { setQuery(event.target.value); setOffset(0); }} placeholder="Search by name, email, or URL" /></label>}</div>
          {(notice || error) && <div className={`admin-message ${error ? 'is-error' : ''}`} role="status"><span>{error ? <X size={15} /> : <Check size={15} />}</span><p>{error || notice}</p><button onClick={() => { setError(''); setNotice(''); }} aria-label="Dismiss"><X size={15} /></button></div>}

          {section === 'overview' && <>
            {loading && !overview ? <EmptyTable loading>{''}</EmptyTable> : overview && <>
              <div className="admin-metrics-grid">
                <article><span className="admin-metric-icon"><UsersRound size={18} /></span><small>ALL ACCOUNTS</small><strong>{overview.totalUsers}</strong><span>{overview.activeUsers} active · {overview.suspendedUsers} suspended</span></article>
                <article><span className="admin-metric-icon"><Store size={18} /></span><small>SALON WORKSPACES</small><strong>{overview.totalSalons}</strong><span>{overview.suspendedSalons} suspended</span></article>
                <article><span className="admin-metric-icon"><Globe2 size={18} /></span><small>LIVE WEBSITES</small><strong>{overview.publishedWebsites}</strong><span>Published and available to visitors</span></article>
                <article className="admin-pending-metric"><span className="admin-metric-icon"><BadgeCheck size={18} /></span><small>AWAITING REVIEW</small><strong>{overview.pendingApprovals}</strong><span>Submissions needing a decision</span><button onClick={() => changeSection('approvals')}>Open approvals <ChevronRight size={14} /></button></article>
                <article><span className="admin-metric-icon"><CreditCard size={18} /></span><small>ACTIVE SUBSCRIPTIONS</small><strong>{overview.activeSubscriptions}</strong><span>{overview.pastDueSubscriptions} past due</span></article>
              </div>
              <div className="admin-overview-grid"><section className="admin-card admin-plan-card"><div className="admin-card-heading"><span className="admin-metric-icon"><CreditCard size={17} /></span><div><small>SUBSCRIPTION MIX</small><h2>Plans across the platform</h2></div></div><div className="admin-plan-list">{plans.map(plan => <div key={plan}><span>{plan}</span><b>{overview.planCounts[plan] || 0}</b><i><span style={{ width: `${overview.totalSalons ? Math.max(3, overview.planCounts[plan] / overview.totalSalons * 100) : 0}%` }} /></i></div>)}</div></section>
                <section className="admin-card admin-quick-actions"><span className="eyebrow card-eyebrow">ADMIN SHORTCUTS</span><h2>Keep the platform in good shape.</h2><button onClick={() => changeSection('approvals')}><BadgeCheck size={16} /> Review owner submissions <ChevronRight size={15} /></button><button onClick={() => changeSection('users')}><UsersRound size={16} /> Review user access <ChevronRight size={15} /></button><button onClick={() => changeSection('salons')}><Store size={16} /> Manage salon websites <ChevronRight size={15} /></button><button onClick={() => changeSection('settings')}><Settings2 size={16} /> Update platform settings <ChevronRight size={15} /></button></section></div>
              <div className="admin-note"><ShieldCheck size={16} /><span><strong>Tenant privacy is enforced server-side.</strong> Owners can access only their own workspace. Admin actions use a separate role-checked API.</span></div>
            </>}
          </>}

          {section === 'approvals' && <div className="admin-review-queue"><div className="admin-table-card"><div className="admin-table-heading"><div><span className="eyebrow card-eyebrow">SUBMITTED SALON WEBSITES</span><h2>Waiting for your decision</h2></div><span>{reviews?.total ?? '—'} pending</span></div><p className="admin-review-intro">Inspect each salon’s identity, location, services, staff, and imagery before approving. Owners will see your decision and feedback in their workspace.</p>{!reviews?.items.length ? <EmptyTable loading={loading}>{error ? 'The approval queue is unavailable.' : 'No websites are waiting for review.'}</EmptyTable> : <div className="admin-review-list">{reviews.items.map(item => <article className="admin-review-row" key={item.id}><div className="admin-review-avatar">{item.name.slice(0, 1).toUpperCase()}</div><div className="admin-review-main"><div className="admin-review-title"><h3>{item.name || 'Untitled salon'}</h3><StatusBadge status={item.approvalStatus} /></div><p>{item.ownerName} <span>·</span> {item.ownerEmail}</p><div className="admin-review-meta"><span><Globe2 size={13} /> /{item.slug}</span><span><Store size={13} /> {item.serviceCount} services · {item.staffCount} team members</span><span><Clock3 size={13} /> Submitted {formatDate(item.submittedAt)}</span></div></div><button className="button button-gold admin-review-open" onClick={() => openReview(item)} disabled={busyId === item.id}>{busyId === item.id ? <LoaderCircle size={15} className="spin" /> : <BadgeCheck size={15} />} Review submission</button></article>)}</div>}{reviews && <PageControls total={reviews.total} limit={reviews.limit} offset={reviews.offset} onChange={setOffset} />}</div></div>}

          {section === 'users' && <div className="admin-table-card"><div className="admin-table-heading"><div><span className="eyebrow card-eyebrow">IDENTITY DIRECTORY</span><h2>Platform accounts</h2></div><span>{users?.total ?? '—'} users</span></div>{!users?.items.length ? <EmptyTable loading={loading}>{error ? 'User list is unavailable.' : 'No user accounts match this search.'}</EmptyTable> : <div className="admin-table-scroll"><table className="admin-table admin-users-table"><thead><tr><th>USER</th><th>SALON</th><th>ROLE</th><th>ACCOUNT</th><th>JOINED</th><th>ACTION</th></tr></thead><tbody>{users.items.map(item => { const draft = userDrafts[item.id] || { role: item.role, status: item.status }; const changed = draft.role !== item.role || draft.status !== item.status; return <tr key={item.id}><td><div className="admin-person"><span>{item.name.slice(0, 1).toUpperCase()}</span><div><strong>{item.name}</strong><small>{item.email} · {item.emailVerified ? 'verified' : 'unverified'}</small></div></div></td><td>{item.salonName ? <div className="admin-salon-cell"><strong>{item.salonName}</strong><small>/{item.slug}</small></div> : <span className="admin-muted">No salon linked</span>}</td><td><select value={draft.role} disabled={item.id === user.id} onChange={event => setUserDraft(item.id, 'role', event.target.value as UserRole)}><option value="salon_owner">Salon owner</option><option value="super_admin">Super admin</option></select></td><td><select className={`admin-inline-status ${draft.status}`} value={draft.status} disabled={item.id === user.id} onChange={event => setUserDraft(item.id, 'status', event.target.value as AdminUserRecord['status'])}><option value="active">Active</option><option value="suspended">Suspended</option></select></td><td>{formatDate(item.createdAt)}</td><td><button className="admin-save-row" disabled={!changed || busyId === item.id} onClick={() => saveUser(item)}>{busyId === item.id ? <LoaderCircle size={14} className="spin" /> : <Check size={14} />} Save</button></td></tr>; })}</tbody></table></div>}{users && <PageControls total={users.total} limit={users.limit} offset={users.offset} onChange={setOffset} />}</div>}

          {section === 'salons' && <div className="admin-table-card"><div className="admin-table-heading"><div><span className="eyebrow card-eyebrow">SALON DIRECTORY</span><h2>Workspaces & live sites</h2></div><span>{salons?.total ?? '—'} salons</span></div>{!salons?.items.length ? <EmptyTable loading={loading}>{error ? 'Salon list is unavailable.' : 'No salons match this search.'}</EmptyTable> : <div className="admin-table-scroll"><table className="admin-table admin-salons-table"><thead><tr><th>SALON / OWNER</th><th>WEBSITE</th><th>PLAN</th><th>WORKSPACE</th><th>PUBLICATION</th><th>ACTION</th></tr></thead><tbody>{salons.items.map(item => <tr key={item.id}><td><div className="admin-salon-cell"><strong>{item.name}</strong><small>{item.ownerName} · {item.ownerEmail}</small></div></td><td><a className="admin-url" href={item.isPublished ? `/${item.publishedSlug || item.slug}` : undefined} target="_blank" rel="noreferrer">/{item.publishedSlug || item.slug} {item.isPublished && <ExternalLink size={12} />}</a></td><td><span className="admin-plan-chip">{item.plan}</span><small className="admin-sub-status">{item.subscriptionStatus.replaceAll('_', ' ')}</small></td><td><select className={`admin-inline-status ${salonDrafts[item.id] || item.status}`} value={salonDrafts[item.id] || item.status} onChange={event => setSalonDrafts(current => ({ ...current, [item.id]: event.target.value as AdminSalonRecord['status'] }))}><option value="active">Active</option><option value="suspended">Suspended</option></select></td><td><StatusBadge status={item.isPublished ? 'published' : 'private'} /><small className="admin-salon-counts">Approval: {item.approvalStatus.replaceAll('_', ' ')}<br />{item.serviceCount} services · {item.staffCount} staff</small></td><td><div className="admin-row-actions"><button className="admin-save-row" disabled={busyId === item.id || (salonDrafts[item.id] || item.status) === item.status} onClick={() => saveSalonStatus(item)}>{busyId === item.id ? <LoaderCircle size={14} className="spin" /> : <Check size={14} />} Save</button><button className={`admin-publish-action ${item.isPublished ? 'unpublish' : ''}`} disabled={busyId === item.id || (item.status === 'suspended' && !item.isPublished) || (!item.isPublished && item.approvalStatus !== 'approved')} onClick={() => changePublication(item)}>{busyId === item.id ? <LoaderCircle size={13} className="spin" /> : <Globe2 size={13} />}{item.isPublished ? 'Take offline' : item.approvalStatus === 'approved' ? 'Publish approved' : 'Await approval'}</button><button className="admin-view-details" disabled={busyId === item.id} onClick={() => openReview(item)}>{busyId === item.id ? <LoaderCircle size={13} className="spin" /> : <Eye size={13} />} Details</button></div></td></tr>)}</tbody></table></div>}{salons && <PageControls total={salons.total} limit={salons.limit} offset={salons.offset} onChange={setOffset} />}</div>}

          {section === 'subscriptions' && <div className="admin-table-card"><div className="admin-table-heading"><div><span className="eyebrow card-eyebrow">SUBSCRIPTION REGISTER</span><h2>Plans & account status</h2></div><span>{subscriptions?.total ?? '—'} subscriptions</span></div><div className="admin-billing-note"><CreditCard size={15} /> Plan and status changes are administrative records only. Connect a billing provider before collecting payments.</div>{!subscriptions?.items.length ? <EmptyTable loading={loading}>{error ? 'Subscription list is unavailable.' : 'No subscriptions match this search.'}</EmptyTable> : <div className="admin-table-scroll"><table className="admin-table admin-subscriptions-table"><thead><tr><th>SALON / OWNER</th><th>PLAN</th><th>STATUS</th><th>RENEWS</th><th>ACTION</th></tr></thead><tbody>{subscriptions.items.map(item => { const draft = subscriptionDrafts[item.id] || { plan: item.plan, status: item.status, renewsAt: item.renewsAt || '' }; const changed = draft.plan !== item.plan || draft.status !== item.status || draft.renewsAt !== (item.renewsAt || ''); return <tr key={item.id}><td><div className="admin-salon-cell"><strong>{item.salonName}</strong><small>{item.ownerName} · {item.ownerEmail}</small></div></td><td><select value={draft.plan} onChange={event => setSubscriptionDrafts(current => ({ ...current, [item.id]: { ...draft, plan: event.target.value as SubscriptionPlan } }))}>{plans.map(plan => <option key={plan} value={plan}>{plan[0].toUpperCase() + plan.slice(1)}</option>)}</select></td><td><select className={`admin-inline-status ${draft.status}`} value={draft.status} onChange={event => setSubscriptionDrafts(current => ({ ...current, [item.id]: { ...draft, status: event.target.value as SubscriptionStatus } }))}>{subscriptionStatuses.map(status => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select></td><td><input type="date" value={draft.renewsAt} onChange={event => setSubscriptionDrafts(current => ({ ...current, [item.id]: { ...draft, renewsAt: event.target.value } }))} aria-label={`Renewal date for ${item.salonName}`} /></td><td><button className="admin-save-row" disabled={!changed || busyId === item.id} onClick={() => saveSubscription(item)}>{busyId === item.id ? <LoaderCircle size={14} className="spin" /> : <Check size={14} />} Save</button></td></tr>; })}</tbody></table></div>}{subscriptions && <PageControls total={subscriptions.total} limit={subscriptions.limit} offset={subscriptions.offset} onChange={setOffset} />}</div>}

          {section === 'settings' && (loading && !settings ? <EmptyTable loading>{''}</EmptyTable> : settings && <form className="admin-settings-grid" onSubmit={saveSettings}><section className="admin-card"><div className="admin-card-heading"><span className="admin-metric-icon"><Sparkles size={17} /></span><div><small>PLATFORM IDENTITY</small><h2>How the platform appears</h2></div></div><label className="admin-setting-field"><span>Platform name</span><input maxLength={80} required value={settings.platformName} onChange={event => setSettings(current => current ? { ...current, platformName: event.target.value } : current)} /></label><label className="admin-setting-field"><span>Support email</span><input type="email" maxLength={254} value={settings.supportEmail} onChange={event => setSettings(current => current ? { ...current, supportEmail: event.target.value } : current)} placeholder="support@example.com" /></label><label className="admin-setting-field"><span>Default salon currency</span><select value={settings.defaultCurrency} onChange={event => setSettings(current => current ? { ...current, defaultCurrency: event.target.value } : current)}><option value="INR">INR · Indian Rupee</option><option value="USD">USD · US Dollar</option><option value="GBP">GBP · Pound Sterling</option><option value="EUR">EUR · Euro</option><option value="CAD">CAD · Canadian Dollar</option><option value="AUD">AUD · Australian Dollar</option></select></label></section><section className="admin-card admin-registration-card"><div className="admin-card-heading"><span className="admin-metric-icon"><BadgeCheck size={17} /></span><div><small>OWNER ACCESS</small><h2>New registrations</h2></div></div><label className="admin-toggle-setting"><span><strong>Allow new salon owners to register</strong><small>Existing accounts can continue signing in when registration is closed.</small></span><input type="checkbox" checked={settings.allowOwnerRegistration} onChange={event => setSettings(current => current ? { ...current, allowOwnerRegistration: event.target.checked } : current)} /><i /></label><div className="admin-settings-warning"><ShieldCheck size={15} /><span>Super admin privileges are assigned through the server-side admin promotion command and cannot be self-selected during signup.</span></div><button className="button button-gold" type="submit" disabled={saving}>{saving ? <LoaderCircle size={15} className="spin" /> : <Check size={15} />} Save platform settings</button></section></form>)}
        </section>
      </main>

      {reviewRecord && <div className="admin-review-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !saving) setReviewRecord(null); }}><section className="admin-review-modal" role="dialog" aria-modal="true" aria-labelledby="admin-review-title"><header className="admin-review-modal-head"><div><span className="eyebrow card-eyebrow">{reviewRecord.salon.approvalStatus === 'pending_approval' ? 'WEBSITE REVIEW' : 'SALON WEBSITE DETAILS'}</span><h2 id="admin-review-title">{reviewRecord.salon.name || 'Salon submission'}</h2><p>Owner: {reviewRecord.salon.ownerName} · {reviewRecord.salon.ownerEmail}</p></div><button className="admin-review-close" aria-label="Close review" onClick={() => setReviewRecord(null)} disabled={saving}><X size={19} /></button></header><div className="admin-review-modal-content"><div className="admin-review-visuals">{reviewRecord.config.brand.logoUrl ? <img className="admin-review-logo" src={reviewRecord.config.brand.logoUrl} alt={`${reviewRecord.salon.name} logo`} /> : <div className="admin-review-logo-fallback">{reviewRecord.salon.name.slice(0, 1).toUpperCase()}</div>}{reviewRecord.config.brand.heroImageUrl ? <img className="admin-review-hero" src={reviewRecord.config.brand.heroImageUrl} alt="Salon homepage hero" /> : <div className="admin-review-hero-empty">No homepage image supplied</div>}</div><div className="admin-review-summary-grid"><article><small>WEBSITE ADDRESS</small><strong>/{reviewRecord.salon.slug}</strong><span>Template: {reviewRecord.config.brand.template}</span></article><article><small>SUBMISSION</small><strong>{formatDate(reviewRecord.salon.submittedAt)}</strong><span>{reviewRecord.salon.serviceCount} services · {reviewRecord.salon.staffCount} team members</span></article></div><div className="admin-review-detail-grid"><section className="admin-review-detail-card"><h3>Salon identity</h3><p><strong>{reviewRecord.config.brand.heroTitle || 'No homepage heading'}</strong></p><p>{reviewRecord.config.brand.tagline || 'No tagline provided'}</p><p>{reviewRecord.config.brand.aboutText || 'No salon story provided'}</p></section><section className="admin-review-detail-card"><h3>Contact & location</h3>{reviewRecord.config.contact.address && <p><MapPin size={14} /> {reviewRecord.config.contact.address}</p>}{reviewRecord.config.contact.locationUrl && <a href={reviewRecord.config.contact.locationUrl} target="_blank" rel="noreferrer">Open map / location link <ExternalLink size={12} /></a>}{reviewRecord.config.contact.phone && <p>{reviewRecord.config.contact.phone}</p>}{reviewRecord.config.contact.email && <p>{reviewRecord.config.contact.email}</p>}{reviewRecord.config.contact.hours && <p className="admin-review-hours">{reviewRecord.config.contact.hours}</p>}</section><section className="admin-review-detail-card"><h3>Services & prices</h3>{reviewRecord.config.services.filter(service => service.name.trim()).map(service => <div className="admin-review-service" key={service.id}><span><strong>{service.name}</strong><small>{service.category || 'Salon service'}{service.duration ? ` · ${service.duration} min` : ''}</small></span><b>{formatPrice(service.price, reviewRecord.config.brand.currency)}</b></div>)}{!reviewRecord.config.services.some(service => service.name.trim()) && <p>No services listed.</p>}</section><section className="admin-review-detail-card"><h3>Salon team</h3>{reviewRecord.config.staff.filter(member => member.name.trim()).map(member => <div className="admin-review-team" key={member.id}><strong>{member.name}</strong><span>{member.role || member.specialties || 'Team member'}</span></div>)}{!reviewRecord.config.staff.some(member => member.name.trim()) && <p>No team members listed.</p>}</section></div>{reviewRecord.history.length > 0 && <section className="admin-review-history"><h3>Previous review actions</h3>{reviewRecord.history.map((entry, index) => <div key={`${entry.createdAt}-${index}`}><StatusBadge status={entry.action} /><span>{entry.reviewerName} · {formatDate(entry.createdAt)}</span><p>{entry.reason || 'No note added.'}</p></div>)}</section>}{reviewActionError && <p className="admin-review-error" role="alert">{reviewActionError}</p>}{reviewRecord.salon.approvalStatus === 'pending_approval' ? <section className="admin-review-decision"><label htmlFor="review-reason">Feedback for the salon owner <span>Required for rejection or change requests</span></label><textarea id="review-reason" maxLength={1200} rows={4} value={reviewReason} onChange={event => setReviewReason(event.target.value)} placeholder="Be specific and constructive—for example, explain what details or images need to change."/><div className="admin-review-decision-actions"><button className="admin-review-reject" disabled={saving || reviewReason.trim().length < 8} onClick={() => completeReview('rejected')}>{saving ? <LoaderCircle size={14} className="spin" /> : <X size={14} />} Reject</button><button className="admin-review-request" disabled={saving || reviewReason.trim().length < 8} onClick={() => completeReview('changes_requested')}>{saving ? <LoaderCircle size={14} className="spin" /> : <RefreshCw size={14} />} Request changes</button><button className="button button-gold" disabled={saving} onClick={() => completeReview('approved')}>{saving ? <LoaderCircle size={14} className="spin" /> : <Check size={14} />} Approve website</button></div></section> : <div className="admin-review-readonly"><StatusBadge status={reviewRecord.salon.approvalStatus} /><strong>Current review status</strong><p>{reviewRecord.salon.approvalReason || 'No additional feedback is recorded for this website.'}</p></div>}</div></section></div>}
    </div>
  );
}
