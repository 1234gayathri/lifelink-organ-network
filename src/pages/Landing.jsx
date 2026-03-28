import { Heart, Shield, Zap, Clock, BarChart2, AlertCircle, Bell, Globe, ArrowRight, CheckCircle, Lock, Activity, Users, Database } from 'lucide-react';

const FEATURES = [
  { icon: Database, color: '#0ea5e9', bg: '#e0f2fe', title: 'Centralized Medical Data', desc: 'Unified repository for organ availability, donor records, and transplant history across all registered hospitals.' },
  { icon: Lock, color: '#0d9488', bg: '#ccfbf1', title: 'Secure Hospital-Only Access', desc: 'Strict institutional authentication. Only verified hospitals with unique IDs can access the platform.' },
  { icon: Zap, color: '#f59e0b', bg: '#fef3c7', title: 'Rapid Organ Matching', desc: 'AI-assisted matching by blood group, HLA type, and medical criteria delivers compatibility scores instantly.' },
  { icon: Activity, color: '#8b5cf6', bg: '#ede9fe', title: 'Real-Time Availability', desc: 'Live organ status updates from all network hospitals with extraction time and survival countdown.' },
  { icon: Clock, color: '#ef4444', bg: '#fee2e2', title: 'Organ Timeout Tracking', desc: 'Critical countdowns for each organ with Safe, Warning, and Critical status to prevent waste.' },
  { icon: Shield, color: '#10b981', bg: '#d1fae5', title: 'Transparency & Fairness', desc: 'Every request, approval, and allocation is logged and auditable to ensure ethical distribution.' },
  { icon: Bell, color: '#f59e0b', bg: '#fef3c7', title: 'Emergency Alerts', desc: 'Broadcast urgent organ needs to all network hospitals simultaneously with one click.' },
  { icon: Globe, color: '#0ea5e9', bg: '#e0f2fe', title: 'Transport Coordination', desc: 'Real-time GPS transport tracking with ETA, route status, and emergency contacts.' },
];

const HOW_STEPS = [
  { num: 1, title: 'Hospital Registration', desc: 'Register with your unique hospital ID and institutional email. Get verified to join the network.' },
  { num: 2, title: 'Update Availability', desc: 'Post available organs with full medical details including extraction time and storage life.' },
  { num: 3, title: 'Smart Search & Match', desc: 'Search by organ type, blood group, and HLA. Get instant compatibility scores.' },
  { num: 4, title: 'Request & Communicate', desc: 'Send formal requests and communicate securely through encrypted hospital chat.' },
  { num: 5, title: 'Approve & Transport', desc: 'Approve requests and coordinate transport with live GPS tracking and ETA.' },
  { num: 6, title: 'Certificate & Analytics', desc: 'Generate digital donor certificates and review your transplant performance statistics.' },
];

export default function Landing({ onNavigate }) {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>LifeLink</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: -2 }}>Organ Coordination Network</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('login')}>Login</button>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate('signup')}>Sign Up</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <Shield size={12} />
            Hospital-Only Secure Platform
          </div>
          <h1 className="hero-title">
            Saving Lives Through<br />
            <span>Faster Organ Coordination</span>
          </h1>
          <p className="hero-desc">
            LifeLink connects authorized hospitals in a secure network to share organ availability, match patients faster, and coordinate transplants — reducing critical time loss and increasing survival rates.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => onNavigate('login')}>
              Hospital Login <ArrowRight size={16} />
            </button>
            <button className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }} onClick={() => onNavigate('signup')}>
              Register Hospital
            </button>
          </div>
        </div>
      </section>

      <div className="hero-stats">
        {[{ val: '847+', label: 'Transplants Coordinated' }, { val: '96.2%', label: 'Success Rate' }, { val: '38 min', label: 'Avg Response Time' }, { val: '120+', label: 'Hospitals Networked' }].map(s => (
          <div key={s.label}>
            <div className="hero-stat-val">{s.val}</div>
            <div className="hero-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <section className="features-section">
        <div style={{ textAlign: 'center', maxWidth: 580, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent-light)', color: 'var(--accent)', fontSize: 12, fontWeight: 600, padding: '4px 14px', borderRadius: 999, marginBottom: 16 }}>
            <Zap size={12} /> Platform Features
          </div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 800, color: 'var(--text)', lineHeight: 1.2, marginBottom: 12 }}>
            Everything hospitals need for organ coordination
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7 }}>
            A comprehensive platform designed specifically for the complex workflow of organ donation and transplant coordination.
          </p>
        </div>
        <div className="features-grid">
          {FEATURES.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="feature-card">
                <div className="feature-icon-wrap" style={{ background: f.bg, color: f.color }}>
                  <Icon size={22} />
                </div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="how-section">
        <div style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--teal-light)', color: 'var(--teal)', fontSize: 12, fontWeight: 600, padding: '4px 14px', borderRadius: 999, marginBottom: 16 }}>
            <CheckCircle size={12} /> Simple Workflow
          </div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 800, color: 'var(--text)', lineHeight: 1.2, marginBottom: 12 }}>
            How LifeLink works
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7 }}>
            From registration to successful transplant, every step is designed for speed and clinical accuracy.
          </p>
        </div>
        <div className="how-grid">
          {HOW_STEPS.map(s => (
            <div key={s.num} className="how-step">
              <div className="how-step-num">{s.num}</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '72px 48px', background: 'linear-gradient(135deg, #0f172a, #0c4a6e)', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', color: '#38bdf8', fontSize: 12, fontWeight: 600, padding: '4px 14px', borderRadius: 999, marginBottom: 20 }}>
          <Lock size={12} /> Authorized Hospitals Only
        </div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(26px,3vw,40px)', fontWeight: 800, color: '#fff', marginBottom: 16 }}>
          Join the life-saving network
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7, maxWidth: 500, margin: '0 auto 32px' }}>
          Register your hospital today and become part of a coordinated network that saves lives through faster, more transparent organ coordination.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-lg" onClick={() => onNavigate('signup')}>Register Your Hospital</button>
          <button className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} onClick={() => onNavigate('login')}>
            Existing Hospital Login
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={16} color="#fff" />
              </div>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: 'var(--text)', fontSize: 16 }}>LifeLink</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: 280 }}>A secure hospital-to-hospital organ donation coordination platform saving lives through technology.</p>
          </div>
          <div>
            <div className="footer-heading">Platform</div>
            <div className="footer-links">
              {['Organ Search', 'Transport Tracking', 'Analytics', 'Alerts System'].map(l => <span key={l} className="footer-link">{l}</span>)}
            </div>
          </div>
          <div>
            <div className="footer-heading">Support</div>
            <div className="footer-links">
              {['Documentation', 'Help Center', 'Contact Us', 'Emergency Line'].map(l => <span key={l} className="footer-link">{l}</span>)}
            </div>
          </div>
          <div>
            <div className="footer-heading">Legal</div>
            <div className="footer-links">
              {['Privacy Policy', 'Data Security', 'Hospital Agreement', 'Compliance'].map(l => <span key={l} className="footer-link">{l}</span>)}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; 2026 LifeLink Organ Coordination Network. All rights reserved.</span>
          <span style={{ color: '#475569' }}>NOTTO Compliant &bull; HIPAA Aligned &bull; ISO 27001</span>
        </div>
      </footer>
    </div>
  );
}
