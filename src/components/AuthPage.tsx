import { FormEvent, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Globe2, LockKeyhole, Scissors, Sparkles } from 'lucide-react';
import { apiRequest, type AuthPayload } from '../lib/api';

interface AuthPageProps {
  mode: 'signup' | 'login';
  onModeChange: (mode: 'signup' | 'login') => void;
  onSuccess: (payload: AuthPayload) => void;
  onBack: () => void;
  platformName?: string;
  publicBaseUrl?: string;
  publicBaseDomain?: string;
}

function slugify(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
}

function cleanSlugInput(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-{2,}/g, '-').slice(0, 48);
}

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"/><path fill="#FF3D00" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"/><path fill="#4CAF50" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8l6.8-5.3Z"/><path fill="#1976D2" d="M24 12c3 0 5.7 1 7.8 3.1l5.9-5.9C34.1 5.8 29.5 4 24 4A20 20 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12Z"/></svg>;
}

export default function AuthPage({ mode, onModeChange, onSuccess, onBack, platformName = 'Nexora Salon Studio', publicBaseUrl = '', publicBaseDomain = '' }: AuthPageProps) {
  const brandParts = platformName.trim().split(/\s+/).filter(Boolean);
  const brandPrimary = brandParts[0] || 'Nexora';
  const brandSecondary = brandParts.slice(1).join(' ') || 'SALON STUDIO';
  const domain = publicBaseDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const slugPrefix = domain ? 'https://' : `${(publicBaseUrl.trim().replace(/\/$/, '') || window.location.origin)}/`;
  const slugSuffix = domain ? `.${domain}` : '';
  const [ownerName, setOwnerName] = useState('');
  const [salonName, setSalonName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState('');
  const [info, setInfo] = useState('');
  const [error, setError] = useState(() => {
    const authError = new URLSearchParams(window.location.search).get('authError');
    if (authError === 'google-unavailable') return 'Google sign-in is not configured yet. Use your email and password or contact the platform administrator.';
    if (authError === 'google-cancelled') return 'Google sign-in was cancelled. You can try again or continue with email.';
    if (authError === 'registration-closed') return 'New salon registrations are temporarily closed. Please contact platform support.';
    if (authError === 'workspace') return 'Your owner workspace needs to be restored. Please contact platform support.';
    if (authError === 'verification-link') return 'That verification link is invalid or has expired. Sign in and request a new one.';
    if (authError === 'account-suspended') return 'This account is suspended. Contact platform support.';
    if (authError === 'google') return 'We could not verify your Google sign-in. Please try again.';
    return '';
  });
  const isSignup = mode === 'signup';

  const suggestedSlug = useMemo(() => slugify(salonName), [salonName]);
  const visibleSlug = slugTouched ? slug : suggestedSlug;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError('');
    setInfo('');
    setSubmitting(true);
    try {
      if (isSignup) {
        const result = await apiRequest<{ verificationRequired: boolean; verificationUrl?: string }>('/api/auth/register', {
          method: 'POST',
          body: { name: ownerName, email, password, salonName, slug: visibleSlug },
        });
        setVerificationUrl(result.verificationUrl || '');
        setVerificationSent(true);
      } else {
        const payload = await apiRequest<AuthPayload>('/api/auth/login', { method: 'POST', body: { email, password } });
        onSuccess(payload);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not complete that request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resendVerification = async () => {
    if (!email.trim() || submitting) {
      setError('Enter your email address first.');
      return;
    }
    setError('');
    setInfo('');
    setSubmitting(true);
    try {
      const result = await apiRequest<{ sent: boolean; verificationUrl?: string }>('/api/auth/verification/resend', { method: 'POST', body: { email } });
      setVerificationUrl(result.verificationUrl || '');
      setInfo('If that address has an unverified account, a new verification link has been sent.');
      setVerificationSent(Boolean(result.verificationUrl));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The verification email could not be resent.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-layout">
      <section className="auth-story">
        <button type="button" className="auth-back" onClick={onBack}><ArrowLeft size={15} /> Back to home</button>
        <a href="/" className="brand-lockup auth-brand"><span className="brand-mark"><Sparkles size={16} /></span><span><strong>{brandPrimary.toUpperCase()}</strong><small>{brandSecondary.toUpperCase()}</small></span></a>
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
          <div className="auth-mobile-mark"><span className="brand-mark"><Sparkles size={16} /></span><span><strong>{brandPrimary.toUpperCase()}</strong><small>{brandSecondary.toUpperCase()}</small></span></div>
          <div className="auth-kicker"><span className="auth-kicker-icon">{isSignup ? <Scissors size={16} /> : <LockKeyhole size={16} />}</span><span>{isSignup ? 'CREATE YOUR WORKSPACE' : 'OWNER SIGN IN'}</span></div>
          <h2>{verificationSent ? 'Check your inbox.' : isSignup ? 'Let’s make this yours.' : 'Good to see you again.'}</h2>
          <p className="auth-form-intro">{verificationSent ? `We sent an email verification link to ${email}. Verify your address to open your private onboarding workspace.` : isSignup ? 'Set up your account and claim your website address.' : 'Sign in to manage your salon website.'}</p>

          {verificationSent ? <div className="verification-panel">
            <span className="verification-check"><Check size={21} /></span>
            <strong>Your account is waiting for email verification.</strong>
            <p>The link expires in 24 hours. Once verified, you can complete your salon details and submit your website for review.</p>
            {verificationUrl && <a className="button button-gold button-full" href={verificationUrl}>Open verification link <ArrowRight size={15} /></a>}
            <button className="resend-verification" type="button" disabled={submitting} onClick={resendVerification}>{submitting ? 'Sending…' : 'Resend verification link'}</button>
            {info && <p className="verification-info" role="status">{info}</p>}
            {error && <p className="form-error" role="alert">{error}</p>}
          </div> : <>
            <a className="button-google" href="/api/auth/google/start" target="_top"><GoogleMark /><span>{isSignup ? 'Continue with Google' : 'Sign in with Google'}</span><ArrowRight size={15} /></a>
            <div className="auth-divider"><span>OR CONTINUE WITH EMAIL</span></div>

            <form onSubmit={handleSubmit} className="auth-form">
              {isSignup && (
                <>
                  <label className="field-label">Your name<input autoComplete="name" value={ownerName} onChange={event => setOwnerName(event.target.value)} placeholder="How should we address you?" required maxLength={80} /></label>
                  <label className="field-label">Salon / website name<input autoComplete="organization" value={salonName} onChange={event => { setSalonName(event.target.value); if (!slugTouched) setSlug(slugify(event.target.value)); }} placeholder="The name your clients know" required maxLength={100} /></label>
                  <label className="field-label">Your website address
                    <div className="slug-input-wrap"><span className="slug-prefix">{slugPrefix}</span><input value={visibleSlug} onChange={event => { setSlugTouched(true); setSlug(cleanSlugInput(event.target.value)); }} placeholder="your-salon" required maxLength={48} />{slugSuffix && <span className="slug-suffix">{slugSuffix}</span>}</div>
                    <small className="field-hint"><Globe2 size={12} /> You can connect a custom domain after setup.</small>
                  </label>
                </>
              )}
              <label className="field-label">Email address<input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@your-salon.com" required maxLength={254} /></label>
              <label className="field-label">Password
                <div className="password-field"><input type={passwordVisible ? 'text' : 'password'} autoComplete={isSignup ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} placeholder={isSignup ? 'At least 8 characters' : 'Enter your password'} required minLength={isSignup ? 8 : undefined} maxLength={128} /><button type="button" onClick={() => setPasswordVisible(value => !value)} aria-label={passwordVisible ? 'Hide password' : 'Show password'}>{passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
                {isSignup && <small className="field-hint"><LockKeyhole size={12} /> Use at least 8 characters. We’ll ask you to verify this email before sign-in.</small>}
              </label>

              {error && <div role="alert" className="form-error">{error}</div>}
              {info && <div role="status" className="verification-info">{info}</div>}
              <button type="submit" disabled={submitting} className="button button-gold button-full auth-submit">{submitting ? 'One moment…' : isSignup ? 'Create my workspace' : 'Sign in to workspace'} <ArrowRight size={16} /></button>
              {!isSignup && <button className="resend-verification" type="button" disabled={submitting} onClick={resendVerification}>Need to verify your email? Resend the link</button>}
            </form>
          </>}

          {!verificationSent && <div className="auth-switch">{isSignup ? 'Already have a workspace?' : `New to ${brandPrimary}?`} <button onClick={() => { setError(''); setInfo(''); onModeChange(isSignup ? 'login' : 'signup'); }}>{isSignup ? 'Sign in' : 'Create your salon website'}</button></div>}
          {verificationSent && <div className="auth-switch">Already verified? <button onClick={() => { setVerificationSent(false); setInfo(''); onModeChange('login'); }}>Sign in</button></div>}
          <p className="auth-legal">By continuing, you agree to keep your account details accurate and secure.</p>
        </div>
      </section>
    </main>
  );
}
