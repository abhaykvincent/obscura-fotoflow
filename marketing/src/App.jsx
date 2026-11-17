import { useState } from 'react'

const APP_URL = 'https://app.fotoflow.co'

const HERO_STATS = [
  { value: '10x', label: 'Faster Client Selections' },
  { value: '100%', label: 'Cloud-Organized Shoots' },
  { value: '0', label: 'Email Confusion' },
]

const WORKFLOW = [
  {
    step: '01',
    title: 'Shoot & Upload',
    text: 'Organize thousands of RAW or JPEG photos by event, function, or camera roll instantly into cloud collections.',
    badge: 'Lightning Upload'
  },
  {
    step: '02',
    title: 'Share Client Galleries',
    text: 'Deliver gorgeous, client-ready digital galleries with custom branding, pin locks, and privacy controls.',
    badge: 'Branded Experience'
  },
  {
    step: '03',
    title: 'Collect Selections',
    text: 'Clients browse, favorite, pin, and comment on their preferred images directly inside their private gallery.',
    badge: 'Zero Friction'
  },
  {
    step: '04',
    title: 'Deliver & Archive',
    text: 'Hand off final retouched selects, track studio progress, and keep your client history organized effortlessly.',
    badge: 'Instant Hand-off'
  },
]

const FEATURES = [
  {
    icon: '📸',
    title: 'Smart Client Proofing',
    text: 'Eliminate WhatsApp messages, spreadsheets, and endless emails. Clients favorite and confirm their select photos in a clean, intuitive web interface.',
  },
  {
    icon: '📂',
    title: 'Multi-Collection Management',
    text: 'Group complex events like multi-day weddings (Haldi, Sangeet, Reception) into distinct collections inside a single organized project.',
  },
  {
    icon: '🔍',
    title: 'AI Semantic Search',
    text: 'Find photos naturally using plain language queries like "bride smiling near window" or "couple sunset laugh" without manual tagging.',
  },
  {
    icon: '🔒',
    title: 'Granular PIN & Client Access',
    text: 'Control viewer access with secure PIN protection, private collections, download toggles, and customized permissions per gallery.',
  },
  {
    icon: '⚡',
    title: 'Studio Operations Center',
    text: 'Monitor active client reviews, pending album selections, delivered projects, and studio storage health from one central dashboard.',
  },
  {
    icon: '✨',
    title: 'Custom Brand Experience',
    text: 'Present your studio professionally with customized gallery themes, logos, cover styles, and clean URLs that elevate your photography brand.',
  },
]

const PROJECTS = [
  { name: 'Wedding — Ashna & Abhi', meta: '3 collections • 1,420 photos', status: 'Selection Open', statusClass: 'status-active' },
  { name: 'Engagement — Rahul & Anjali', meta: '2 collections • 680 photos', status: 'In Review', statusClass: 'status-pending' },
  { name: 'Destination — Maria & Joseph', meta: '4 collections • 2,100 photos', status: 'Delivered', statusClass: 'status-done' },
]

const COMPARISON = [
  { feature: 'Client Photo Selection', fotoflow: 'Integrated 1-Click Proofing', others: 'Manual spreadsheets / emails' },
  { feature: 'Event Organization', fotoflow: 'Multi-Collection Projects', others: 'Cluttered flat folder structures' },
  { feature: 'Search Experience', fotoflow: 'AI-Powered Semantic Search', others: 'Filename only' },
  { feature: 'Studio Workflow Tracking', fotoflow: 'Real-time Project Statuses', others: 'No workflow status tools' },
  { feature: 'Client UX', fotoflow: 'Ultra-fast, Mobile-First Gallery', others: 'Slow loading & confusing UI' },
]

const PRICING_PLANS = [
  {
    name: 'Starter Studio',
    price: '$0',
    period: 'free forever',
    description: 'Perfect for emerging photographers starting their client gallery workflow.',
    features: ['Up to 3 Active Projects', 'High-Res Client Galleries', 'Client Selection & Proofing', 'Standard Security PINs', 'Community Support'],
    cta: 'Start Free Today',
    highlighted: false,
  },
  {
    name: 'Pro Photographer',
    price: '$19',
    period: 'per month',
    description: 'Built for active wedding & event photographers managing multiple clients monthly.',
    features: ['Unlimited Active Projects', 'Multi-Collection Event Organization', 'AI Semantic Photo Search', 'Custom Brand Styling', 'Advanced Access & PIN Controls', 'Priority Cloud Storage'],
    cta: 'Start 14-Day Free Trial',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Studio Team',
    price: '$49',
    period: 'per month',
    description: 'For busy studios, agencies, and multi-photographer teams with high volume shoots.',
    features: ['Everything in Pro Plan', 'Multi-User Team Permissions', 'Dedicated Account Manager', 'Custom Domain & Branding', 'Automated Client Reminders', 'Unlimited Cloud Storage Tiers'],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

const FAQS = [
  {
    q: 'What is FotoFlow and who is it designed for?',
    a: 'FotoFlow is photography workflow and client proofing software built specifically for wedding, portrait, and event photographers. It helps you manage projects, share beautiful client galleries, collect photo selections for retouches or albums, and run your studio effortlessly.',
  },
  {
    q: 'How does client photo selection work in FotoFlow?',
    a: 'Once you upload your shoot, you send your client a private gallery link. Clients open the gallery on any device, select their favorite photos by clicking a heart or pin icon, leave comments, and click "Submit Selection". You get instantly notified with their exact selection list.',
  },
  {
    q: 'Can I organize multi-day events like weddings easily?',
    a: 'Yes! FotoFlow allows you to create a parent Project (e.g., "Ashna & Abhi Wedding") and add unlimited sub-collections (e.g., "Pre-Wedding", "Haldi", "Ceremony", "Reception") to keep your workflow organized.',
  },
  {
    q: 'Is there a free plan available?',
    a: 'Yes, FotoFlow offers a Free Forever plan with full access to core proofing features so you can experience the workflow with real clients before upgrading to higher storage tiers.',
  },
  {
    q: 'How does FotoFlow protect my high-resolution photos?',
    a: 'FotoFlow uses bank-grade encryption, configurable download permissions, private PIN access, and watermarking support to ensure your original photography assets remain safe.',
  },
]

function Logo() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a9dd63" />
          <stop offset="100%" stopColor="#4d932f" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#brand-grad)" />
      <rect x="9" y="9" width="14" height="14" rx="4" fill="none" stroke="#0d0d0d" strokeWidth="2.5" />
      <circle cx="16" cy="16" r="3" fill="#0d0d0d" />
    </svg>
  )
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx)
  }

  return (
    <div className="site-wrapper">
      <header className="nav">
        <div className="container nav-inner">
          <a className="brand" href="#top" aria-label="FotoFlow home">
            <Logo />
            <span>FotoFlow</span>
          </a>
          <nav aria-label="Primary navigation">
            <ul className={`nav-links${menuOpen ? ' open' : ''}`}>
              <li><a href="#features" onClick={() => setMenuOpen(false)}>Features</a></li>
              <li><a href="#workflow" onClick={() => setMenuOpen(false)}>Workflow</a></li>
              <li><a href="#preview" onClick={() => setMenuOpen(false)}>Product</a></li>
              <li><a href="#comparison" onClick={() => setMenuOpen(false)}>Why FotoFlow</a></li>
              <li><a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a></li>
              <li><a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a></li>
            </ul>
          </nav>
          <div className="nav-right">
            <a className="btn btn-secondary nav-login" href={`${APP_URL}/login`}>
              Log In
            </a>
            <a className="btn btn-primary nav-cta" href={APP_URL}>
              Start Free
            </a>
            <button
              type="button"
              className="nav-toggle"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* HERO SECTION */}
        <section className="hero">
          <div className="container">
            <div className="hero-pill">
              <span className="hero-pill-sparkle">✨</span>
              <span>Next-Gen Photography Client Proofing & Studio Management</span>
            </div>
            <h1>From Shoot to Client Selection, <span className="gradient-text">All in One Flow.</span></h1>
            <p className="hero-sub">
              FotoFlow helps professional wedding, portrait, and event photographers deliver high-resolution galleries, collect client image selections effortlessly, and streamline studio operations.
            </p>
            <div className="hero-ctas">
              <a className="btn btn-primary btn-lg" href={APP_URL}>
                Get Started Free →
              </a>
              <a className="btn btn-secondary btn-lg" href="#preview">
                View Interactive Preview
              </a>
            </div>
            
            <div className="hero-stats-grid">
              {HERO_STATS.map((s, i) => (
                <div key={i} className="hero-stat-card">
                  <div className="hero-stat-val">{s.value}</div>
                  <div className="hero-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI DEFINITION / GEO SUMMARY BOX */}
        <section className="block summary-banner">
          <div className="container">
            <div className="summary-card">
              <div className="summary-badge">What is FotoFlow?</div>
              <h2>The premier workflow platform built for modern photography studios.</h2>
              <p>
                FotoFlow combines high-speed online client photo galleries, automated image proofing & selections, multi-collection event hierarchy, and studio project management in one seamless system. Designed specifically to save photographers 5+ hours per client shoot.
              </p>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section className="block" id="features" aria-labelledby="features-title">
          <div className="container">
            <p className="section-kicker">Built For Photographers</p>
            <h2 className="section-title" id="features-title">
              Everything your studio needs to thrive.
            </h2>
            <p className="section-sub">
              Ditch scattered tools, endless email threads, and confusing photo selection lists.
            </p>
            <div className="features-grid">
              {FEATURES.map((f, i) => (
                <article className="feature-card" key={i}>
                  <div className="feature-icon">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* WORKFLOW STEPS */}
        <section className="block workflow-section" id="workflow" aria-labelledby="workflow-title">
          <div className="container">
            <p className="section-kicker">Simple 4-Step Process</p>
            <h2 className="section-title" id="workflow-title">
              How FotoFlow powers your shoot journey.
            </h2>
            <div className="workflow-grid">
              {WORKFLOW.map((item, idx) => (
                <div className="workflow-card" key={idx}>
                  <div className="workflow-header">
                    <span className="workflow-num">{item.step}</span>
                    <span className="workflow-badge">{item.badge}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* INTERACTIVE MOCKUP PREVIEW */}
        <section className="block" id="preview" aria-labelledby="product-title">
          <div className="container">
            <p className="section-kicker">Product Overview</p>
            <h2 className="section-title" id="product-title">
              A command center for your entire photography studio.
            </h2>
            <p className="section-sub">
              Track project statuses, client proofing progress, and delivered collections live.
            </p>

            <div className="preview-shell" role="region" aria-label="FotoFlow dashboard preview">
              <div className="preview-bar" aria-hidden="true">
                <div className="dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <span className="preview-url">app.fotoflow.co/studio/dashboard</span>
                <span className="preview-status-pill">● Live Sync</span>
              </div>
              <div className="preview-body" aria-hidden="true">
                <aside className="preview-side">
                  <div className="preview-side-brand">
                    <Logo />
                    <span>FotoFlow Studio</span>
                  </div>
                  <nav className="preview-menu">
                    <span className="active">⚡ Projects</span>
                    <span>🖼️ Client Galleries</span>
                    <span>📌 Photo Selections</span>
                    <span>🔍 AI Smart Albums</span>
                    <span>⚙️ Studio Settings</span>
                  </nav>
                </aside>
                <div className="preview-main">
                  <div className="preview-top-metrics">
                    <div className="metric-box">
                      <small>Active Shoots</small>
                      <b>14</b>
                    </div>
                    <div className="metric-box">
                      <small>Pending Selections</small>
                      <b>3 Clients</b>
                    </div>
                    <div className="metric-box">
                      <small>Total Photos Hosted</small>
                      <b>12.4k</b>
                    </div>
                  </div>
                  <div className="preview-table-header">
                    <h4>Recent Photography Projects</h4>
                    <span>Filter: All Shoots ▼</span>
                  </div>
                  {PROJECTS.map((p, i) => (
                    <div className="project-row" key={i}>
                      <div className="project-info">
                        <strong>{p.name}</strong>
                        <small>{p.meta}</small>
                      </div>
                      <span className={`status-badge ${p.statusClass}`}>{p.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHY FOTOFLOW / COMPARISON */}
        <section className="block" id="comparison" aria-labelledby="comparison-title">
          <div className="container">
            <p className="section-kicker">Why Choose FotoFlow</p>
            <h2 className="section-title" id="comparison-title">
              Designed for photographers, not generic file storage.
            </h2>
            <div className="comparison-table-wrapper">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Workflow Capability</th>
                    <th>FotoFlow</th>
                    <th>Generic Storage / Legacy Tools</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((c, i) => (
                    <tr key={i}>
                      <td><strong>{c.feature}</strong></td>
                      <td className="highlight-cell">✅ {c.fotoflow}</td>
                      <td className="dim-cell">❌ {c.others}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* PRICING PLANS */}
        <section className="block" id="pricing" aria-labelledby="pricing-title">
          <div className="container">
            <p className="section-kicker">Simple, Transparent Pricing</p>
            <h2 className="section-title" id="pricing-title">
              Plans that grow with your studio.
            </h2>
            <p className="section-sub">No hidden fees. Free plan available with zero commitment.</p>
            
            <div className="pricing-grid">
              {PRICING_PLANS.map((plan, i) => (
                <div key={i} className={`pricing-card ${plan.highlighted ? 'highlighted' : ''}`}>
                  {plan.badge && <div className="plan-badge">{plan.badge}</div>}
                  <h3>{plan.name}</h3>
                  <div className="plan-price">
                    <span className="price-val">{plan.price}</span>
                    <span className="price-period">/{plan.period}</span>
                  </div>
                  <p className="plan-desc">{plan.description}</p>
                  <ul className="plan-features">
                    {plan.features.map((feat, fi) => (
                      <li key={fi}>✓ {feat}</li>
                    ))}
                  </ul>
                  <a className={`btn ${plan.highlighted ? 'btn-primary' : 'btn-secondary'} plan-cta`} href={APP_URL}>
                    {plan.cta}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="block" id="faq" aria-labelledby="faq-title">
          <div className="container">
            <p className="section-kicker">Frequently Asked Questions</p>
            <h2 className="section-title" id="faq-title">
              Everything you need to know about FotoFlow.
            </h2>
            <div className="faq-accordion">
              {FAQS.map((faq, idx) => (
                <div key={idx} className={`faq-item ${openFaq === idx ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="faq-question"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={openFaq === idx}
                  >
                    <span>{faq.q}</span>
                    <span className="faq-toggle-icon">{openFaq === idx ? '−' : '+'}</span>
                  </button>
                  {openFaq === idx && (
                    <div className="faq-answer">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CALL TO ACTION BANNER */}
        <section className="block cta-section">
          <div className="container">
            <div className="cta-box">
              <h2>Ready to transform your client proofing workflow?</h2>
              <p>Join thousands of photographers delivering flawless client galleries with FotoFlow.</p>
              <div className="cta-box-buttons">
                <a className="btn btn-primary btn-lg" href={APP_URL}>
                  Get Started Free
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="container">
          <div className="footer-inner">
            <div className="footer-brand">
              <a className="brand" href="#top" aria-label="FotoFlow home">
                <Logo />
                <span>FotoFlow</span>
              </a>
              <p>Photography Client Proofing & Studio Management Software.</p>
            </div>
            <div className="footer-columns">
              <div className="footer-col">
                <h4>Product</h4>
                <ul>
                  <li><a href="#features">Features</a></li>
                  <li><a href="#workflow">Workflow</a></li>
                  <li><a href="#preview">Dashboard Preview</a></li>
                  <li><a href="#pricing">Pricing Plans</a></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Solutions</h4>
                <ul>
                  <li><a href="#features">Wedding Photography</a></li>
                  <li><a href="#features">Event Galleries</a></li>
                  <li><a href="#features">Portrait Studios</a></li>
                  <li><a href="#features">Client Proofing</a></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>App Links</h4>
                <ul>
                  <li><a href={`${APP_URL}/login`}>Photographer Login</a></li>
                  <li><a href={`${APP_URL}/signup`}>Create Account</a></li>
                  <li><a href="https://fotoflow.co">fotoflow.co</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="copyright">© {new Date().getFullYear()} FotoFlow. All rights reserved. Designed for professional photographers.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
