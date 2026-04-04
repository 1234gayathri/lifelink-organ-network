import { useState } from 'react';
import { Heart, Eye, EyeOff, AlertCircle, Lock, Mail, Hash, Shield, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

function validateEmail(email) {
  if (!email) return 'Email is required';

  // Allow specific test emails to bypass institutional domain rules
  const ALLOWED_TEST_EMAILS = [
    'rakotisaigayathri@gmail.com',
    'saicharishmajoga@gmail.com',
    'pravallikaramu66@gmail.com',
    'pittakalpana88@gmail.com'
  ];

  if (!ALLOWED_TEST_EMAILS.includes(email)) {
    if (email.endsWith('.com') || email.includes('@gmail') || email.includes('@yahoo') || email.includes('@hotmail') || email.includes('@outlook')) {
      return 'Personal/commercial email domains (.com) are not allowed. Use an official institutional email (e.g., .org, .edu, .gov, .in).';
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address';
  return '';
}

export default function Login({ onNavigate, onLogin }) {
  const [form, setForm] = useState({ hospitalId: '', email: '', password: '', remember: false });
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotHospitalId, setForgotHospitalId] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [savedToken, setSavedToken] = useState('');

  const set = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
    
    // Real-time validation
    if (k === 'hospitalId') {
      if (!v) setErrors(prev => ({ ...prev, hospitalId: 'Hospital ID is required' }));
      else setErrors(prev => ({ ...prev, hospitalId: '' }));
    }
    if (k === 'email') {
      const err = validateEmail(v);
      setErrors(prev => ({ ...prev, email: err }));
    }
    if (k === 'password') {
      if (!v) setErrors(prev => ({ ...prev, password: 'Password is required' }));
      else setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  const validate = () => {
    const e = {};
    if (!form.hospitalId) e.hospitalId = 'Hospital ID is required';
    const emailErr = validateEmail(form.email);
    if (emailErr) e.email = emailErr;
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const isFormValid = form.hospitalId && !validateEmail(form.email) && form.password && form.remember;

  // Step 1: Validate password with backend, then send OTP
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/hospital/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId: form.hospitalId,
          officialEmail: form.email,
          password: form.password
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (data.message && data.message.includes('Hospital ID')) {
          setErrors({ hospitalId: data.message });
        } else {
          setErrors({ email: data.message || 'Login failed' });
        }
        setLoading(false);
        return;
      }
      
      // Password correct! Save token temporarily and send OTP
      setSavedToken(data.token);

      const otpRes = await fetch(`${API_BASE_URL}/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, purpose: 'login' })
      });

      if (!otpRes.ok) {
        const otpData = await otpRes.json();
        setErrors({ email: otpData.message || 'Failed to send OTP' });
        setLoading(false);
        return;
      }

      setLoading(false);
      setOtpStep(true);
    } catch (err) {
      console.error('Login Error:', err);
      setErrors({ email: 'Network timeout. The server is taking too long to respond. Please try again.' });
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and grant access
  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) { setOtpError('Please enter the 6-digit code'); return; }
    setOtpVerifying(true);
    setOtpError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, code: otpCode, purpose: 'login' })
      });

      const data = await response.json();

      if (!response.ok) {
        setOtpError(data.message || 'OTP verification failed');
        setOtpVerifying(false);
        return;
      }

      // OTP verified! Save token and grant access
      localStorage.setItem('token', savedToken);
      setOtpVerifying(false);
      onLogin();
    } catch (err) {
      setOtpError('Network error. Is the backend running?');
      setOtpVerifying(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setOtpSending(true);
    setOtpError('');
    try {
      await fetch(`${API_BASE_URL}/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, purpose: 'login' })
      });
      setOtpSending(false);
      setOtpError('New OTP sent to your email!');
    } catch {
      setOtpSending(false);
      setOtpError('Failed to resend OTP');
    }
  };

  // OTP Verification Screen
  if (otpStep) {
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
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Two-Factor Authentication</h2>
            <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.8, marginTop: 16 }}>
              We sent a 6-digit verification code to <strong style={{ color: '#38bdf8' }}>{form.email}</strong>. Enter the code to complete login.
            </p>
          </div>
        </div>
        <div className="auth-right">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Shield size={28} color="#fff" />
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Enter Verification Code</h2>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>
              A 6-digit code was sent to <strong>{form.email}</strong>
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                style={{
                  width: 220, textAlign: 'center', fontSize: 32, fontWeight: 800,
                  letterSpacing: 12, padding: '14px 20px', borderRadius: 12,
                  border: otpError && otpError !== 'New OTP sent to your email!' ? '2px solid #ef4444' : '2px solid #e2e8f0',
                  outline: 'none', fontFamily: 'monospace',
                  background: 'var(--bg-secondary, #f8fafc)'
                }}
              />
            </div>

            {otpError && (
              <div style={{ fontSize: 13, marginBottom: 16, color: otpError.includes('sent') ? '#059669' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {otpError.includes('sent') ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                {otpError}
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: 15, marginBottom: 16 }}
              onClick={handleVerifyOtp}
              disabled={otpVerifying}
            >
              {otpVerifying ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Verifying...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}><Lock size={16} /> Verify & Login</span>
              )}
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              <button className="btn btn-ghost btn-sm" onClick={handleResendOtp} disabled={otpSending}>
                {otpSending ? 'Sending...' : 'Resend OTP'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setOtpStep(false); setOtpCode(''); setOtpError(''); }}>
                Go Back
              </button>
            </div>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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

          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 16 }}>
            Saving lives through connected hospitals
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.8, marginBottom: 40 }}>
            Join the secure hospital network coordinating organ donations and transplants across India.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: Shield, text: 'Military-grade encrypted data transmission' },
              { icon: CheckCircle, text: 'Hospital-verified access only' },
              { icon: Lock, text: 'NOTTO compliant & audit-ready' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, background: 'rgba(14,165,233,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} color="#38bdf8" />
                  </div>
                  <span style={{ color: '#cbd5e1', fontSize: 14 }}>{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 40, position: 'relative', zIndex: 1 }}>
          <div style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: '#38bdf8', fontWeight: 600, marginBottom: 6 }}>SECURITY NOTICE</div>
            <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
              This platform is exclusively for authorized medical institutions. Unauthorized access is monitored and will be reported to regulatory authorities.
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div style={{ marginBottom: 28 }}>
            <h1 className="auth-title">Hospital Login</h1>
            <p className="auth-subtitle">Enter your institutional credentials to access the organ coordination platform.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Hospital ID <span>*</span></label>
              <div className="input-wrap">
                <Hash size={16} className="input-icon-left" />
                <input
                  className={`form-input has-icon-left${errors.hospitalId ? ' error' : ''}`}
                  placeholder="e.g. HOSP-AMS-001"
                  value={form.hospitalId}
                  onChange={e => set('hospitalId', e.target.value)}
                />
              </div>
              {errors.hospitalId && <div className="form-error"><AlertCircle size={12} />{errors.hospitalId}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Official Hospital Email <span>*</span></label>
              <div className="input-wrap">
                <Mail size={16} className="input-icon-left" />
                <input
                  type="email"
                  className={`form-input has-icon-left${errors.email ? ' error' : ''}`}
                  placeholder="admin@yourhospital.org"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                />
              </div>
              {errors.email && <div className="form-error"><AlertCircle size={12} />{errors.email}</div>}
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>
                Commercial emails (.com, gmail, yahoo) are rejected. Use institutional email only.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password <span>*</span></label>
              <div className="input-wrap">
                <Lock size={16} className="input-icon-left" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`form-input has-icon-left has-icon-right${errors.password ? ' error' : ''}`}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                />
                <button type="button" className="input-icon-right" onClick={() => setShowPass(p => !p)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <div className="form-error"><AlertCircle size={12} />{errors.password}</div>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)' }}>
                <input type="checkbox" checked={form.remember} onChange={e => set('remember', e.target.checked)} style={{ accentColor: '#0ea5e9' }} />
                Remember this device
              </label>
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#0ea5e9', fontWeight: 600 }} onClick={() => setShowForgot(true)}>
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: 15 }}
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Authenticating...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Lock size={16} /> Secure Login</span>
              )}
            </button>
          </form>

          <div className="divider-text" style={{ marginTop: 24 }}>New to LifeLink?</div>

          <button className="btn btn-ghost" style={{ width: '100%', marginBottom: 20 }} onClick={() => onNavigate('signup')}>
            Register Your Hospital
          </button>

          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <CheckCircle size={14} color="#059669" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12, color: '#065f46', lineHeight: 1.5 }}>
              Demo: Use any Hospital ID, an email ending in .org/.edu/.gov, and any password to explore the platform.
            </span>
          </div>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('landing')}>
              Back to Home
            </button>
          </div>
        </div>
      </div>

      {showForgot && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: 400, padding: 24, paddingBottom: 30 }}>
            <h3 style={{ textTransform: 'uppercase', fontSize: 18, color: '#0ea5e9', marginBottom: 12 }}>Password Recovery</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              Enter your Hospital ID and official institutional email address below and we'll send you a secure link to reset your password.
            </p>
            {forgotSuccess && <div style={{ background: '#dcfce7', color: '#166534', padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 16 }}>{forgotSuccess}</div>}
            {errors.forgot && <div className="form-error" style={{ marginBottom: 16 }}>{errors.forgot}</div>}
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              setErrors({ ...errors, forgot: '' });
              setForgotSuccess('');
              if (!forgotHospitalId || !forgotEmail) {
                setErrors({ ...errors, forgot: 'Hospital ID and Email are required' });
                return;
              }
              setForgotLoading(true);
              try {
                const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ hospitalId: forgotHospitalId, officialEmail: forgotEmail })
                });
                const data = await res.json();
                if (res.ok) setForgotSuccess('A secure password reset link has been sent to your email.');
                else setErrors({ ...errors, forgot: data.message || 'Error sending recovery email' });
              } catch (err) {
                setErrors({ ...errors, forgot: 'Network error. Please try again.' });
              } finally {
                setForgotLoading(false);
              }
            }}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Hospital ID</label>
                <div style={{ position: 'relative' }}>
                  <Hash size={16} color="#64748b" style={{ position: 'absolute', top: 12, left: 12 }} />
                  <input className={`form-input${errors.forgot ? ' error' : ''}`} placeholder="e.g. HOSP-AMS-001" value={forgotHospitalId} onChange={e => setForgotHospitalId(e.target.value)} style={{ paddingLeft: 38 }} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Official Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#64748b" style={{ position: 'absolute', top: 12, left: 12 }} />
                  <input type="email" className={`form-input${errors.forgot ? ' error' : ''}`} placeholder="admin@yourhospital.org" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} style={{ paddingLeft: 38 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowForgot(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={forgotLoading}>
                  {forgotLoading ? 'Sending...' : 'Send Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
