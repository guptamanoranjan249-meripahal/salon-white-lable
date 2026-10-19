import { FormEvent, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Globe2, LockKeyhole, Scissors, Sparkles } from 'lucide-react';
import { apiRequest, type AuthPayload } from '../lib/api';

interface AuthPageProps {
  mode: 'signup' | 'login';
  onModeChange: (mode: 'signup' | 'login') => void;
  onSuccess: (payload: AuthPayload) => void;
  onBack: () => void;
}

function slugify(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
}

function cleanSlugInput(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-{2,}/g, '-').slice(0, 48);
}

export default function AuthPage({ mode, onModeChange, onSuccess, onBack }: AuthPageProps) {
  const [ownerName, setOwnerName] = useState('');
  const [salonName, setSalonName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isSignup = mode === 'signup';

  const suggestedSlug = useMemo(() => slugify(salonName), [salonName]);
  const visibleSlug = slugTouched ? slug : suggestedSlug;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const payload = isSignup
        ? await apiRequest<AuthPayload>('/api/auth/register', {
            method: 'POST',
            body: { name: ownerName, email, password, salonName, slug: visibleSlug },
          })
        : await apiRequest<AuthPayload>('/api/auth/login', {
            method: 'POST',
            body: { email, password },
          });
      onSuccess(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not complete that request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-layout">
      <section className="auth-story">
        <button type="button" className="auth-back" onClick={onBack}><ArrowLeft size={15} /> Back to home</button>
        <a href="/" className="brand-lockup auth-brand"><span className="brand-mark"><Sparkles size={16} /></span><span><strong>NEXORA</strong><small>SALON STUDIO</small></span></a>
        <div className="auth-story-content">
          <span className="eyebrow"><span className="eyebrow-dot" /> YOUR NEXT CHAPTER STARTS HERE</span>
          <h1>{isSignup ? <>Make space<br />for <em>your brand.</em></> : <>Welcome back<br />to <em>your studio.</em></>}</h1>
          <p>{isSignup ? 'A polished salon website is closer than you think. Tell us a little about your salon and we’ll open your private workspace.' : 'Your salon website, details, and bookings are right where you left them.'}</p>
          <div className="auth-points"><span><Check size={15} /> Private owner workspace</span><span><Check size={15} /> Preview before you publish</span><span><Check size={15} /> Your own shareable URL</span></div>
        </div>
        <div className="auth-story-foot"><span>DESIGNED FOR THE PEOPLE BEHIND THE CHAIR</span><span>01 — 03</span></div>
        <div className="auth-ornament"><span /><span /><span /></div>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="auth-mobile-mark"><span className="brand-mark"><Sparkles size={16} /></span><span><strong>NEXORA</strong><small>SALON STUDIO</small></span></div>
          <div className="auth-kicker"><span className="auth-kicker-icon">{isSignup ? <Scissors size={16} /> : <LockKeyhole size={16} />}</span><span>{isSignup ? 'CREATE YOUR WORKSPACE' : 'OWNER SIGN IN'}</span></div>
          <h2>{isSignup ? 'Let’s make this yours.' : 'Good to see you again.'}</h2>
          <p className="auth-form-intro">{isSignup ? 'Set up your account and claim your website address.' : 'Sign in to manage your salon website.'}</p>

          <form onSubmit={handleSubmit} className="auth-form">
            {isSignup && (
              <>
                <label className="field-label">Your name<input autoComplete="name" value={ownerName} onChange={event => setOwnerName(event.target.value)} placeholder="How should we address you?" required maxLength={80} /></label>
                <label className="field-label">Salon / website name<input autoComplete="organization" value={salonName} onChange={event => { setSalonName(event.target.value); if (!slugTouched) setSlug(slugify(event.target.value)); }} placeholder="The name your clients know" required maxLength={100} /></label>
                <label className="field-label">Your website address
                  <div className="slug-input-wrap"><span className="slug-prefix">yourdomain.com /</span><input value={visibleSlug} onChange={event => { setSlugTouched(true); setSlug(cleanSlugInput(event.target.value)); }} placeholder="your-salon" required maxLength={48} /></div>
                  <small className="field-hint"><Globe2 size={12} /> You can connect a custom domain after setup.</small>
                </label>
              </>
            )}
            <label className="field-label">Email address<input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@your-salon.com" required maxLength={254} /></label>
            <label className="field-label">Password
              <div className="password-field"><input type={passwordVisible ? 'text' : 'password'} autoComplete={isSignup ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} placeholder={isSignup ? 'At least 8 characters' : 'Enter your password'} required minLength={isSignup ? 8 : undefined} maxLength={128} /><button type="button" onClick={() => setPasswordVisible(value => !value)} aria-label={passwordVisible ? 'Hide password' : 'Show password'}>{passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
              {isSignup && <small className="field-hint"><LockKeyhole size={12} /> Use at least 8 characters. Your password is stored securely.</small>}
            </label>

            {error && <div role="alert" className="form-error">{error}</div>}

            <button type="submit" disabled={submitting} className="button button-gold button-full auth-submit">{submitting ? 'One moment…' : isSignup ? 'Create my workspace' : 'Sign in to workspace'} <ArrowRight size={16} /></button>
          </form>

          <div className="auth-switch">{isSignup ? 'Already have a workspace?' : 'New to Nexora?'} <button onClick={() => { setError(''); onModeChange(isSignup ? 'login' : 'signup'); }}>{isSignup ? 'Sign in' : 'Create your salon website'}</button></div>
          <p className="auth-legal">By continuing, you agree to keep your account details accurate and secure.</p>
        </div>
      </section>
    </main>
  );
}
