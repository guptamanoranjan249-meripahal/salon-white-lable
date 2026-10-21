import { useEffect, useState } from 'react';
import { ArrowLeft, LoaderCircle, Sparkles } from 'lucide-react';
import AuthPage from './components/AuthPage';
import OwnerWorkspace from './components/OwnerWorkspace';
import PlatformLanding from './components/PlatformLanding';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import SalonWebsite from './components/SalonWebsite';
import WebGLBackground from './components/WebGLBackground';
import { apiRequest, getCurrentUser, getPublicSalon, type AuthPayload, type PublicMeta } from './lib/api';
import type { PublicSalon, SalonRecord } from './types';

function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

function routeSlug(pathname: string): string | null {
  const parts = normalizePath(pathname).split('/').filter(Boolean);
  if (parts.length !== 1 || ['dashboard', 'admin', 'login', 'signup', 'api', 'media'].includes(parts[0])) return null;
  try { return decodeURIComponent(parts[0]).toLowerCase(); }
  catch { return null; }
}

function LoadingScreen({ message = 'Opening your studio…' }: { message?: string }) {
  return <div className="app-loading"><span className="workspace-brand-mark"><Sparkles size={16} /></span><LoaderCircle size={19} className="spin" /><p>{message}</p></div>;
}

function NotFound({ onHome, platformName }: { onHome: () => void; platformName: string }) {
  return <main className="not-found-page"><span className="not-found-icon"><Sparkles size={18} /></span><span className="eyebrow">A LITTLE DETOUR</span><h1>We couldn't find<br /><em>that salon.</em></h1><p>The website address may be new, private, or spelled a little differently.</p><button className="button button-gold" onClick={onHome}><ArrowLeft size={15} /> Back to {platformName.split(/\s+/)[0] || 'home'}</button></main>;
}

export default function App() {
  const [pathname, setPathname] = useState(() => normalizePath(window.location.pathname));
  const [owner, setOwner] = useState<AuthPayload | null>(null);
  const [ownerChecked, setOwnerChecked] = useState(false);
  const [workspaceLoading, setWorkspaceLoading] = useState(pathname === '/dashboard' || pathname === '/admin');
  const [rootPublicSalon, setRootPublicSalon] = useState<PublicSalon | null>(null);
  const [publicSalon, setPublicSalon] = useState<PublicSalon | null>(null);
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicNotFound, setPublicNotFound] = useState(false);
  const [publicError, setPublicError] = useState('');
  const [platformMeta, setPlatformMeta] = useState<PublicMeta>({ publicBaseUrl: '', publicBaseDomain: '', platformName: 'Nexora Salon Studio', supportEmail: '' });

  const navigate = (path: string, replace = false) => {
    if (replace) window.history.replaceState({}, '', path);
    else window.history.pushState({}, '', path);
    setPathname(normalizePath(window.location.pathname));
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  useEffect(() => {
    let active = true;
    apiRequest<PublicMeta>('/api/meta').then(meta => { if (active) setPlatformMeta(meta); }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handlePop = () => setPathname(normalizePath(window.location.pathname));
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  useEffect(() => {
    let active = true;
    if (pathname === '/') {
      setRootPublicSalon(null);
      setOwnerChecked(false);
      Promise.allSettled([getPublicSalon(), getCurrentUser()]).then(([publicResult, ownerResult]) => {
        if (!active) return;
        if (publicResult.status === 'fulfilled') setRootPublicSalon(publicResult.value);
        if (ownerResult.status === 'fulfilled') setOwner(ownerResult.value);
        else setOwner(null);
        setOwnerChecked(true);
      });
    } else if (pathname === '/dashboard' || pathname === '/admin') {
      setWorkspaceLoading(true);
      getCurrentUser().then(payload => {
        if (!active) return;
        setOwner(payload);
        setOwnerChecked(true);
        if (pathname === '/dashboard' && payload.user.role === 'super_admin') navigate('/admin', true);
        else if (pathname === '/admin' && payload.user.role !== 'super_admin') navigate('/dashboard', true);
      }).catch(() => {
        if (active) { setOwner(null); setOwnerChecked(true); navigate('/login', true); }
      }).finally(() => { if (active) setWorkspaceLoading(false); });
    } else {
      setOwnerChecked(true);
      setPublicSalon(null);
      setPublicNotFound(false);
      setPublicError('');
      const slug = routeSlug(pathname);
      if (slug) {
        setPublicLoading(true);
        getPublicSalon(slug).then(result => {
          if (!active) return;
          setPublicSalon(result);
          setPublicNotFound(!result);
        }).catch(error => {
          if (!active) return;
          setPublicError(error instanceof Error ? error.message : 'This salon website could not be loaded.');
          setPublicNotFound(true);
        }).finally(() => { if (active) setPublicLoading(false); });
      }
    }
    return () => { active = false; };
  }, [pathname]);

  useEffect(() => {
    const platformName = platformMeta.platformName || 'Nexora Salon Studio';
    if (pathname === '/admin') document.title = `Platform administration · ${platformName}`;
    else if (pathname === '/dashboard') document.title = `${owner?.salon?.config.brand.name || 'Workspace'} · ${platformName}`;
    else if (pathname === '/login' || pathname === '/signup') document.title = `Your salon workspace · ${platformName}`;
    else if (publicSalon || rootPublicSalon) document.title = `${(publicSalon || rootPublicSalon)?.config.brand.name || 'Salon'} · Salon website`;
    else document.title = `${platformName} · Your salon, your story`;
  }, [pathname, owner, publicSalon, rootPublicSalon, platformMeta.platformName]);

  const authSuccess = (payload: AuthPayload) => {
    setOwner(payload);
    setOwnerChecked(true);
    navigate(payload.user.role === 'super_admin' ? '/admin' : '/dashboard');
  };

  const handleSalonChange = (salon: SalonRecord) => {
    setOwner(current => current ? { ...current, salon } : current);
  };

  const signOut = async () => {
    try { await apiRequest('/api/auth/logout', { method: 'POST', body: {} }); } catch { /* the local session is cleared regardless */ }
    setOwner(null);
    navigate('/', true);
  };

  if (pathname === '/signup' || pathname === '/login') {
    return <><WebGLBackground /><AuthPage mode={pathname === '/signup' ? 'signup' : 'login'} onModeChange={mode => navigate(mode === 'signup' ? '/signup' : '/login')} onSuccess={authSuccess} onBack={() => navigate('/')} platformName={platformMeta.platformName} publicBaseUrl={platformMeta.publicBaseUrl} publicBaseDomain={platformMeta.publicBaseDomain} /></>;
  }

  if (pathname === '/admin') {
    if (workspaceLoading || !ownerChecked) return <LoadingScreen message="Checking platform access…" />;
    if (!owner || owner.user.role !== 'super_admin') return <LoadingScreen message="Taking you to the right workspace…" />;
    return <SuperAdminDashboard user={owner.user} onSignedOut={signOut} platformName={platformMeta.platformName} />;
  }

  if (pathname === '/dashboard') {
    if (workspaceLoading || !ownerChecked) return <LoadingScreen message="Opening your private workspace…" />;
    if (!owner || !owner.salon || owner.user.role !== 'salon_owner') return <LoadingScreen message="Taking you to the right workspace…" />;
    return <OwnerWorkspace user={owner.user} salon={owner.salon} onSalonChange={handleSalonChange} onSignedOut={signOut} platformName={platformMeta.platformName} />;
  }

  if (pathname === '/') {
    if (rootPublicSalon) return <SalonWebsite salon={rootPublicSalon} />;
    return <><WebGLBackground /><PlatformLanding onGetStarted={() => navigate(owner ? owner.user.role === 'super_admin' ? '/admin' : '/dashboard' : '/signup')} onSignIn={() => navigate(owner ? owner.user.role === 'super_admin' ? '/admin' : '/dashboard' : '/login')} isSignedIn={ownerChecked && Boolean(owner)} platformName={platformMeta.platformName} supportEmail={platformMeta.supportEmail} /></>;
  }

  if (publicLoading) return <LoadingScreen message="Preparing your salon website…" />;
  if (publicSalon) return <SalonWebsite salon={publicSalon} />;
  if (publicError && !publicNotFound) return <NotFound onHome={() => navigate('/')} platformName={platformMeta.platformName} />;
  if (publicNotFound || !routeSlug(pathname)) return <NotFound onHome={() => navigate('/')} platformName={platformMeta.platformName} />;
  return <LoadingScreen />;
}
