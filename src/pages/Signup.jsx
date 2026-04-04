import { useState } from 'react';
import { Heart, Eye, EyeOff, AlertCircle, Lock, Mail, Hash, MapPin, Phone, User, Building, CheckCircle, Shield } from 'lucide-react';
import { API_BASE_URL } from '../config';

function validateEmail(email) {
  if (!email) return 'Email is required';
  
  const eClean = email.toLowerCase().trim();
  const ALLOWED_TEST_EMAILS = [
    'rakotisaigayathri@gmail.com',
    'saicharishmajoga@gmail.com',
    'pravallikaramu66@gmail.com',
    'pittakalpana88@gmail.com'
  ];

  if (!ALLOWED_TEST_EMAILS.includes(eClean)) {
    if (eClean.endsWith('.com') || /(@gmail|@yahoo|@hotmail|@outlook)/i.test(eClean)) {
      return 'Commercial email (.com, gmail, yahoo, hotmail) not allowed. Use official hospital email.';
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address';
  return '';
}

const INITIAL = { hospitalName: '', hospitalId: '', email: '', contactPerson: '', phone: '', location: '', password: '', confirmPassword: '', agreed: false };

export default function Signup({ onNavigate }) {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
    
    // Real-time validation for a better experience
    if (k === 'email') {
      const err = validateEmail(v);
      setErrors(prev => ({ ...prev, email: err }));
    } else if (errors[k]) {
      setErrors(prev => ({ ...prev, [k]: '' }));
    }
  };

  const validate = () => {
    const e = {};
    if (!form.hospitalName.trim()) e.hospitalName = 'Hospital name is required';
    if (!form.hospitalId.trim()) e.hospitalId = 'Hospital ID is required';
    const emailErr = validateEmail(form.email);
    if (emailErr) e.email = emailErr;
    if (!form.contactPerson.trim()) e.contactPerson = 'Contact person name is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    if (!form.location.trim()) e.location = 'Hospital location is required';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.agreed) e.agreed = 'You must confirm hospital authorization';
    return e;
  };

  const isFormValid = form.hospitalName.trim() && 
                    form.hospitalId.trim() && 
                    !validateEmail(form.email) && 
                    form.contactPerson.trim() && 
                    form.phone.trim() && 
                    form.location.trim() && 
                    form.password.length >= 8 && 
                    form.password === form.confirmPassword && 
                    form.agreed;

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/hospital/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalName: form.hospitalName,
          hospitalId: form.hospitalId,
          officialEmail: form.email,
          contactPerson: form.contactPerson,
          phoneNumber: form.phone,
          location: form.location,
          password: form.password
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        setErrors({ email: data.message || 'Registration failed' });
        setLoading(false);
        return;
      }
      
      setLoading(false);
      setSuccess(true);
    } catch (err) {
      setErrors({ email: 'Network error. Is the backend running?' });
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-left">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
              <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={18} color="#fff" />
              </div>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#fff', fontSize: 18 }}>LifeLink</span>
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Welcome to the network</h2>
          </div>
        </div>
        <div className="auth-right">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, background: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckCircle size={36} color="#059669" />
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Registration Submitted!</h2>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
              Your hospital registration for <strong>{form.hospitalName}</strong> has been submitted. Our verification team will review your application and activate your account within 24-48 hours. You will receive a confirmation at <strong>{form.email}</strong>.
            </p>
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '14px 18px', marginBottom: 28, textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', marginBottom: 8 }}>NEXT STEPS</div>
              {['Check your institutional email for verification link', 'Submit required hospital accreditation documents', 'Complete NOTTO registration verification', 'Your account will be activated by the admin team'].map(s => (
                <div key={s} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: '#0c4a6e' }}>
                  <CheckCircle size={14} color="#0ea5e9" style={{ flexShrink: 0, marginTop: 1 }} />
                  {s}
                </div>
              ))}
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }} onClick={() => onNavigate('login')}>Go to Login</button>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('landing')}>Back to Home</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={18} color="#fff" />
            </div>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#fff', fontSize: 18 }}>LifeLink</span>
          </div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 16 }}>Register your hospital</h2>
          <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.8, marginBottom: 40 }}>
            Join the secure organ coordination network. Hospital verification is required for activation.
          </p>
          <div style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Shield size={16} color="#38bdf8" style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
                All registrations are manually verified by our compliance team before activation. Commercial email addresses are not accepted.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right" style={{ overflowY: 'auto' }}>
        <div className="auth-card">
          <h1 className="auth-title">Hospital Registration</h1>
          <p className="auth-subtitle">All fields are required. Use official hospital credentials only.</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Hospital Name <span>*</span></label>
                <div className="input-wrap">
                  <Building size={15} className="input-icon-left" />
                  <input className={`form-input has-icon-left${errors.hospitalName ? ' error' : ''}`} placeholder="Full hospital name" value={form.hospitalName} onChange={e => set('hospitalName', e.target.value)} />
                </div>
                {errors.hospitalName && <div className="form-error"><AlertCircle size={12} />{errors.hospitalName}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Hospital ID <span>*</span></label>
                <div className="input-wrap">
                  <Hash size={15} className="input-icon-left" />
                  <input className={`form-input has-icon-left${errors.hospitalId ? ' error' : ''}`} placeholder="e.g. HOSP-XYZ-001" value={form.hospitalId} onChange={e => set('hospitalId', e.target.value)} />
                </div>
                {errors.hospitalId && <div className="form-error"><AlertCircle size={12} />{errors.hospitalId}</div>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Official Institutional Email <span>*</span></label>
              <div className="input-wrap">
                <Mail size={15} className="input-icon-left" />
                <input type="email" className={`form-input has-icon-left${errors.email ? ' error' : ''}`} placeholder="transplant@yourhospital.org" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              {errors.email && <div className="form-error"><AlertCircle size={12} />{errors.email}</div>}
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Commercial (.com, gmail, yahoo) emails are rejected</div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Contact Person <span>*</span></label>
                <div className="input-wrap">
                  <User size={15} className="input-icon-left" />
                  <input className={`form-input has-icon-left${errors.contactPerson ? ' error' : ''}`} placeholder="Dr. Full Name" value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} />
                </div>
                {errors.contactPerson && <div className="form-error"><AlertCircle size={12} />{errors.contactPerson}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number <span>*</span></label>
                <div className="input-wrap">
                  <Phone size={15} className="input-icon-left" />
                  <input className={`form-input has-icon-left${errors.phone ? ' error' : ''}`} placeholder="+91-XXXXX-XXXXX" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
                {errors.phone && <div className="form-error"><AlertCircle size={12} />{errors.phone}</div>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Hospital Location <span>*</span></label>
              <div className="input-wrap">
                <MapPin size={15} className="input-icon-left" />
                <input className={`form-input has-icon-left${errors.location ? ' error' : ''}`} placeholder="City, State" value={form.location} onChange={e => set('location', e.target.value)} />
              </div>
              {errors.location && <div className="form-error"><AlertCircle size={12} />{errors.location}</div>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password <span>*</span></label>
                <div className="input-wrap">
                  <Lock size={15} className="input-icon-left" />
                  <input type={showPass ? 'text' : 'password'} className={`form-input has-icon-left has-icon-right${errors.password ? ' error' : ''}`} placeholder="Min 8 characters" value={form.password} onChange={e => set('password', e.target.value)} />
                  <button type="button" className="input-icon-right" onClick={() => setShowPass(p => !p)}>{showPass ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                </div>
                {errors.password && <div className="form-error"><AlertCircle size={12} />{errors.password}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password <span>*</span></label>
                <div className="input-wrap">
                  <Lock size={15} className="input-icon-left" />
                  <input type={showConfirm ? 'text' : 'password'} className={`form-input has-icon-left has-icon-right${errors.confirmPassword ? ' error' : ''}`} placeholder="Re-enter password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
                  <button type="button" className="input-icon-right" onClick={() => setShowConfirm(p => !p)}>{showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                </div>
                {errors.confirmPassword && <div className="form-error"><AlertCircle size={12} />{errors.confirmPassword}</div>}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.agreed} onChange={e => set('agreed', e.target.checked)} style={{ marginTop: 3, accentColor: '#0ea5e9', width: 16, height: 16, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  I confirm that <strong>{form.hospitalName || 'our hospital'}</strong> is an authorized medical institution with valid NOTTO registration, and I am authorized to register on behalf of this institution.
                </span>
              </label>
              {errors.agreed && <div className="form-error" style={{ marginTop: 6 }}><AlertCircle size={12} />{errors.agreed}</div>}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: 15 }} disabled={loading || !isFormValid}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Submitting Registration...
                </span>
              ) : 'Register Hospital'}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center', display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('login')}>Already registered? Login</button>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('landing')}>Back to Home</button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
