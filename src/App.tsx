import { useEffect, useState } from 'react';
import { ArrowLeft, LoaderCircle, Sparkles } from 'lucide-react';
import AuthPage from './components/AuthPage';
import OwnerWorkspace from './components/OwnerWorkspace';
import PlatformLanding from './components/PlatformLanding';
import SalonWebsite from './components/SalonWebsite';
import WebGLBackground from './components/WebGLBackground';
import { ApiError, apiRequest, getCurrentOwner, getPublicSalon, type AuthPayload } from './lib/api';
import type { PublicSalon, SalonRecord } from './types';

function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

function routeSlug(pathname: string): string | null {
  const parts = normalizePath(pathname).split('/').filter(Boolean);
  if (parts.length !== 1 || ['dashboard', 'login', 'signup', 'api', 'media'].includes(parts[0])) return null;
  try { return decodeURIComponent(parts[0]).toLowerCase(); }
  catch { return null; }
}

function LoadingScreen({ message = 'Opening your studio…' }: { message?: string }) {
  return <div className="app-loading"><span className="workspace-brand-mark"><Sparkles size={16} /></span><LoaderCircle size={19} className="spin" /><p>{message}</p></div>;
}

function NotFound({ onHome }: { onHome: () => void }) {
  return <main className="not-found-page"><span className="not-found-icon"><Sparkles size={18} /></span><span className="eyebrow">A LITTLE DETOUR</span><h1>We couldn't find<br /><em>that salon.</em></h1><p>The website address may be new, private, or spelled a little differently.</p><button className="button button-gold" onClick={onHome}><ArrowLeft size={15} /> Back to Nexora</button></main>;
}

export default function App() {
  const [pathname, setPathname] = useState(() => normalizePath(window.location.pathname));
  const [owner, setOwner] = useState<AuthPayload | null>(null);
  const [ownerChecked, setOwnerChecked] = useState(false);
  const [workspaceLoading, setWorkspaceLoading] = useState(pathname === '/dashboard');
  const [rootPublicSalon, setRootPublicSalon] = useState<PublicSalon | null>(null);
  const [publicSalon, setPublicSalon] = useState<PublicSalon | null>(null);
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicNotFound, setPublicNotFound] = useState(false);
  const [publicError, setPublicError] = useState('');

  const navigate = (path: string, replace = false) => {
    if (replace) window.history.replaceState({}, '', path);
    else window.history.pushState({}, '', path);
    setPathname(normalizePath(window.location.pathname));
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

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
      Promise.allSettled([getPublicSalon(), getCurrentOwner()]).then(([publicResult, ownerResult]) => {
        if (!active) return;
        if (publicResult.status === 'fulfilled') setRootPublicSalon(publicResult.value);
        if (ownerResult.status === 'fulfilled') setOwner(ownerResult.value);
        else setOwner(null);
        setOwnerChecked(true);
      });
    } else if (pathname === '/dashboard') {
      setWorkspaceLoading(true);
      getCurrentOwner().then(payload => {
        if (active) { setOwner(payload); setOwnerChecked(true); }
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
    if (pathname === '/dashboard') document.title = `${owner?.salon.config.brand.name || 'Workspace'} · Nexora Salon Studio`;
    else if (pathname === '/login' || pathname === '/signup') document.title = 'Your salon workspace · Nexora';
    else if (publicSalon || rootPublicSalon) document.title = `${(publicSalon || rootPublicSalon)?.config.brand.name || 'Salon'} · Salon website`;
    else document.title = 'Nexora Salon Studio · Your salon, your story';
  }, [pathname, owner, publicSalon, rootPublicSalon]);

  const authSuccess = (payload: AuthPayload) => {
    setOwner(payload);
    setOwnerChecked(true);
    navigate('/dashboard');
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
    return <><WebGLBackground /><AuthPage mode={pathname === '/signup' ? 'signup' : 'login'} onModeChange={mode => navigate(mode === 'signup' ? '/signup' : '/login')} onSuccess={authSuccess} onBack={() => navigate('/')} /></>;
  }

  if (pathname === '/dashboard') {
    if (workspaceLoading || !ownerChecked) return <LoadingScreen message="Opening your private workspace…" />;
    if (!owner) return <LoadingScreen message="Taking you to sign in…" />;
    return <OwnerWorkspace user={owner.user} salon={owner.salon} onSalonChange={handleSalonChange} onSignedOut={signOut} />;
  }

  if (pathname === '/') {
    if (rootPublicSalon) return <SalonWebsite salon={rootPublicSalon} />;
    return <><WebGLBackground /><PlatformLanding onGetStarted={() => navigate(owner ? '/dashboard' : '/signup')} onSignIn={() => navigate(owner ? '/dashboard' : '/login')} isSignedIn={ownerChecked && Boolean(owner)} /></>;
  }

  if (publicLoading) return <LoadingScreen message="Preparing your salon website…" />;
  if (publicSalon) return <SalonWebsite salon={publicSalon} />;
  if (publicError && !publicNotFound) return <NotFound onHome={() => navigate('/')} />;
  if (publicNotFound || !routeSlug(pathname)) return <NotFound onHome={() => navigate('/')} />;
  return <LoadingScreen />;
}
