import { useState } from 'react'

const APP_URL = 'https://app.fotoflow.co'

const WORKFLOW = [
  { step: 'Shoot', text: 'Capture the event.' },
  { step: 'Upload', text: 'Bring the project into FotoFlow.' },
  { step: 'Share', text: 'Give clients a beautiful gallery.' },
  { step: 'Select', text: 'Let clients choose the images they want.' },
  { step: 'Deliver', text: 'Keep the selected work moving toward final delivery.' },
]

const FEATURES = [
  {
    title: 'Project Management',
    text: 'Keep shoots, events, collections and project activity organized.',
  },
  {
    title: 'Client Galleries',
    text: 'Share polished galleries with clients and guests.',
  },
  {
    title: 'Photo Selection',
    text: 'Let clients select their final images without sending files back and forth.',
  },
  {
    title: 'Studio Workflow',
    text: 'Keep projects moving from booking through delivery.',
  },
  {
    title: 'Smart Tools',
    text: 'Use AI-assisted tools to reduce repetitive work.',
  },
  {
    title: 'Studio Management',
    text: 'Manage the operational side of a photography studio from one place.',
  },
]

const PROJECTS = [
  { name: 'Wedding — Ashna & Abhi', meta: '3 collections', status: 'Selection open' },
  { name: 'Engagement — Rahul & Anjali', meta: '2 collections', status: 'Shared' },
  { name: 'Reception — Maria & Joseph', meta: '1 collection', status: 'Delivered' },
]

const AUDIENCES = [
  {
    title: 'Wedding photographers',
    text: 'Manage every wedding from shoot to final selection without scattered tools.',
  },
  {
    title: 'Event photographers',
    text: 'Share galleries fast and collect selections while the event is still fresh.',
  },
  {
    title: 'Photography studios',
    text: 'Keep shoots, galleries and client decisions organized across the whole studio.',
  },
  {
    title: 'Teams & collaborators',
    text: 'Coordinate selections and galleries with everyone involved in delivery.',
  },
]

function Logo() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect x="2" y="2" width="28" height="28" rx="7" fill="#4d932f" />
      <rect x="8" y="8" width="16" height="16" rx="3" fill="none" stroke="#a9dd63" strokeWidth="2" />
      <circle cx="16" cy="16" r="4" fill="#a9dd63" />
    </svg>
  )
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header className="nav">
        <div className="container nav-inner">
          <a className="brand" href="#top" aria-label="FotoFlow home">
            <Logo />
            FotoFlow
          </a>
          <nav aria-label="Primary">
            <ul className={`nav-links${menuOpen ? ' open' : ''}`}>
              <li>
                <a href="#product" onClick={() => setMenuOpen(false)}>
                  Product
                </a>
              </li>
              <li>
                <a href="#workflow" onClick={() => setMenuOpen(false)}>
                  Workflow
                </a>
              </li>
              <li>
                <a href="#features" onClick={() => setMenuOpen(false)}>
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" onClick={() => setMenuOpen(false)}>
                  Pricing
                </a>
              </li>
            </ul>
          </nav>
          <a className="btn btn-primary nav-cta" href={APP_URL}>
            Get Started
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
      </header>

      <main id="top">
        <section className="hero">
          <div className="container">
            <p className="tagline">Shoot. Select. Share.</p>
            <h1>From shoot to selection, all in one flow.</h1>
            <p className="hero-sub">
              FotoFlow helps wedding and event photographers manage projects, share galleries,
              collect client selections, and keep the studio workflow moving.
            </p>
            <div className="hero-ctas">
              <a className="btn btn-primary" href={APP_URL}>
                Get Started
              </a>
              <a className="btn btn-secondary" href="#workflow">
                Explore the workflow
              </a>
            </div>
            <p className="hero-note">Photography workflow software for event photographers.</p>
          </div>
        </section>

        <section className="block" id="workflow" aria-labelledby="workflow-title">
          <div className="container">
            <p className="section-kicker">Workflow</p>
            <h2 className="section-title" id="workflow-title">
              One workflow. From shoot to delivery.
            </h2>
            <ol className="workflow">
              {WORKFLOW.map((item) => (
                <li key={item.step}>
                  <span className="workflow-step">{item.step}</span>
                  <h3>{item.step}</h3>
                  <p>{item.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="block" id="features" aria-labelledby="features-title">
          <div className="container">
            <p className="section-kicker">Features</p>
            <h2 className="section-title" id="features-title">
              Everything around the photographer&apos;s workflow.
            </h2>
            <div className="features">
              {FEATURES.map((f) => (
                <article className="feature-card" key={f.title}>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="block" id="product" aria-labelledby="product-title">
          <div className="container">
            <p className="section-kicker">Product</p>
            <h2 className="section-title" id="product-title">
              A studio view of every project.
            </h2>
            <p className="section-sub">
              Projects, collections and client selections in one place — designed for the way
              photographers actually work.
            </p>
            <div className="preview-shell" role="img" aria-label="Illustrative preview of the FotoFlow projects dashboard">
              <div className="preview-bar" aria-hidden="true">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
                <span className="preview-url">app.fotoflow.co</span>
              </div>
              <div className="preview-body" aria-hidden="true">
                <div className="preview-side">
                  <strong>FotoFlow</strong>
                  <span className="active">Projects</span>
                  <span>Galleries</span>
                  <span>Selections</span>
                  <span>Studio</span>
                </div>
                <div className="preview-main">
                  <div className="preview-stats">
                    <div className="stat">
                      <b>800</b>
                      <small>Photos</small>
                    </div>
                    <div className="stat">
                      <b>124</b>
                      <small>Selected</small>
                    </div>
                    <div className="stat">
                      <b>3</b>
                      <small>Collections</small>
                    </div>
                  </div>
                  {PROJECTS.map((p) => (
                    <div className="project-row" key={p.name}>
                      <div>
                        <div>{p.name}</div>
                        <small>{p.meta}</small>
                      </div>
                      <span className="status">{p.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="preview-caption">Illustrative preview of the FotoFlow workspace.</p>
          </div>
        </section>

        <section className="block" id="who" aria-labelledby="who-title">
          <div className="container">
            <p className="section-kicker">Who it&apos;s for</p>
            <h2 className="section-title" id="who-title">
              Built for photographers who manage more than photos.
            </h2>
            <div className="who-grid">
              {AUDIENCES.map((a) => (
                <article className="who-card" key={a.title}>
                  <h3>{a.title}</h3>
                  <p>{a.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="block" id="pricing" aria-labelledby="pricing-title">
          <div className="container">
            <div className="pricing-box">
              <p className="section-kicker">Pricing</p>
              <h2 id="pricing-title">Simple plans for growing studios.</h2>
              <p>Flexible plans designed around your studio.</p>
              <a className="btn btn-secondary" href={APP_URL}>
                Talk to us
              </a>
            </div>
          </div>
        </section>

        <section className="block" id="get-started" aria-labelledby="cta-title">
          <div className="container">
            <div className="cta-box">
              <h2 id="cta-title">Ready to simplify your photography workflow?</h2>
              <p>Bring your projects, galleries and client selections into one flow.</p>
              <a className="btn btn-primary" href={APP_URL}>
                Get Started
              </a>
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
                FotoFlow
              </a>
              <p>Shoot. Select. Share.</p>
            </div>
            <nav className="footer-links" aria-label="Footer">
              <ul>
                <li>
                  <a href="#product">Product</a>
                </li>
                <li>
                  <a href="#workflow">Workflow</a>
                </li>
                <li>
                  <a href="#features">Features</a>
                </li>
                <li>
                  <a href="#pricing">Pricing</a>
                </li>
              </ul>
              <ul>
                <li>
                  <a href="https://fotoflow.co">fotoflow.co</a>
                </li>
                <li>
                  <a href={APP_URL}>app.fotoflow.co</a>
                </li>
              </ul>
            </nav>
          </div>
          <p className="copyright">© 2026 FotoFlow. All rights reserved.</p>
        </div>
      </footer>
    </>
  )
}
