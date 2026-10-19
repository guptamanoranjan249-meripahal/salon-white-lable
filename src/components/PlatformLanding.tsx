import { ArrowDown, ArrowRight, Check, Globe2, Layers3, Palette, ShieldCheck, Sparkles, WandSparkles } from 'lucide-react';

interface PlatformLandingProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  isSignedIn?: boolean;
}

const capabilities = [
  {
    icon: Palette,
    title: 'A brand that feels like yours',
    description: 'Add your logo, photography, colors, voice, and the details clients need to find you.',
  },
  {
    icon: Layers3,
    title: 'Your own menu and team',
    description: 'Set every service, price, duration, and team profile. Nothing is shared between salons.',
  },
  {
    icon: Globe2,
    title: 'A link that belongs to you',
    description: 'Publish at a clean salon URL, with wildcard subdomains available for your own domain.',
  },
];

export default function PlatformLanding({ onGetStarted, onSignIn, isSignedIn = false }: PlatformLandingProps) {
  return (
    <div className="platform-shell min-h-screen text-white">
      <header className="platform-nav">
        <a href="/" className="brand-lockup" aria-label="Nexora home">
          <span className="brand-mark"><Sparkles size={17} /></span>
          <span><strong>NEXORA</strong><small>SALON STUDIO</small></span>
        </a>
        <nav className="platform-nav-links" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
          <button className="nav-login" onClick={onSignIn}>{isSignedIn ? 'Your workspace' : 'Sign in'}</button>
          <button className="button button-small button-gold" onClick={onGetStarted}>{isSignedIn ? 'Open dashboard' : 'Create your site'} <ArrowRight size={15} /></button>
        </nav>
      </header>

      <main>
        <section className="platform-hero">
          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />
          <div className="platform-hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> THE INDEPENDENT SALON WEBSITE BUILDER</div>
            <h1>Your salon.<br /><em>Your story.</em><br />Your own corner<br className="hero-mobile-break" /> of the web.</h1>
            <p>Build a beautiful, bookable website that feels like your salon. Set up your brand, menu, team, and contact details in one calm, easy workspace.</p>
            <div className="hero-actions">
              <button className="button button-gold button-large" onClick={onGetStarted}>{isSignedIn ? 'Open your workspace' : 'Start building for free'} <ArrowRight size={17} /></button>
              <a className="quiet-link" href="#how-it-works">See how it works <ArrowDown size={14} /></a>
            </div>
            <div className="hero-trust"><span><Check size={14} /> No design skills needed</span><i /> <span><ShieldCheck size={14} /> Your data stays yours</span></div>
          </div>

          <div className="platform-preview-wrap" aria-label="A preview of the website editor">
            <div className="preview-orbit orbit-one" /><div className="preview-orbit orbit-two" />
            <div className="editor-window">
              <div className="editor-window-top"><span className="window-dots"><i /><i /><i /></span><span className="window-address"><ShieldCheck size={11} /> yourstudio.yourdomain.com</span><span className="window-status"><span /> LIVE PREVIEW</span></div>
              <div className="sample-site">
                <div className="sample-site-nav"><span className="sample-monogram">✳</span><span className="sample-brand">YOUR STUDIO</span><span className="sample-links">STORY&nbsp;&nbsp;&nbsp; SERVICES&nbsp;&nbsp;&nbsp; VISIT</span><span className="sample-book">BOOK A VISIT <ArrowRight size={12} /></span></div>
                <div className="sample-site-hero">
                  <div className="sample-arch"><div className="arch-inner"><div className="arch-sun" /><div className="arch-leaf leaf-left" /><div className="arch-leaf leaf-right" /><div className="arch-stem" /></div></div>
                  <div className="sample-caption"><span>YOUR SALON, YOUR WAY</span><h2>A little space<br />to feel like you.</h2><p>Make room for the things that make your salon special.</p><span className="sample-outline-cta">DISCOVER YOUR MENU <ArrowRight size={11} /></span></div>
                  <div className="sample-decoration">✦</div>
                </div>
                <div className="sample-service-row"><span>THE MENU</span><div className="sample-service-line" /><span>MADE BY YOU</span></div>
                <div className="sample-service-cards"><div><span className="sample-card-image" /><span className="sample-card-line" /><span className="sample-card-short" /></div><div><span className="sample-card-image sample-card-image-two" /><span className="sample-card-line" /><span className="sample-card-short" /></div><div><span className="sample-card-image sample-card-image-three" /><span className="sample-card-line" /><span className="sample-card-short" /></div></div>
              </div>
            </div>
            <div className="floating-note note-one"><span className="note-icon"><Palette size={15} /></span><span>Every detail is<br /><strong>yours to shape</strong></span></div>
            <div className="floating-note note-two"><span className="note-icon note-icon-soft"><Globe2 size={15} /></span><span>Your site, live at<br /><strong>your own URL</strong></span></div>
          </div>
          <div className="platform-scroll-cue"><span /> SCROLL TO EXPLORE</div>
        </section>

        <section className="platform-proof" id="features">
          <div className="platform-proof-head"><span className="eyebrow">A SIMPLE WAY TO SHOW UP ONLINE</span><h2>Everything you need.<br /><em>Nothing you don't.</em></h2><p>One workspace for the brand you have already built—and the bookings still to come.</p></div>
          <div className="capability-grid">
            {capabilities.map(({ icon: Icon, title, description }, index) => (
              <article className="capability-card" key={title}>
                <span className="capability-number">0{index + 1}</span>
                <span className="capability-icon"><Icon size={19} /></span>
                <h3>{title}</h3><p>{description}</p>
                <span className="capability-arrow"><ArrowRight size={15} /></span>
              </article>
            ))}
          </div>
        </section>

        <section className="platform-how" id="how-it-works">
          <div className="how-copy"><span className="eyebrow">FROM FIRST CLICK TO LIVE LINK</span><h2>Set it up<br /><em>at your pace.</em></h2><p>Start with the essentials, make it yours, and publish only when you are ready.</p><button className="button button-gold" onClick={onGetStarted}>Create my website <ArrowRight size={16} /></button></div>
          <div className="how-steps"><div><span>01</span><div><h3>Create your account</h3><p>Claim your salon name and a unique website address.</p></div><Check size={16} /></div><div><span>02</span><div><h3>Make it yours</h3><p>Add your photos, services, people, colors, and story.</p></div><WandSparkles size={16} /></div><div><span>03</span><div><h3>Preview, save, publish</h3><p>See the full website before it goes live. Your draft stays private.</p></div><Globe2 size={16} /></div></div>
        </section>
      </main>

      <footer className="platform-footer"><a href="/" className="brand-lockup"><span className="brand-mark"><Sparkles size={15} /></span><span><strong>NEXORA</strong><small>SALON STUDIO</small></span></a><span>Built for independent salons and the people behind them.</span><button className="footer-link" onClick={onSignIn}>Already have an account? Sign in <ArrowRight size={13} /></button></footer>
    </div>
  );
}
