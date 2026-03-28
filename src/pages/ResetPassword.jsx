import { useState } from 'react';
import { Lock, CheckCircle } from 'lucide-react';

export default function ResetPassword({ onNavigate }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const token = window.location.pathname.split('/reset-password/')[1];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.message || 'Error resetting password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ margin: 'auto', width: '100%', maxWidth: 400, padding: 20 }}>
        <div className="card" style={{ padding: 30, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Reset Password</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Create a new password for your account</p>
          </div>
          
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 18, color: '#065f46', marginBottom: 12 }}>Password Reset Complete</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Your password has been successfully updated. You can now login with your new credentials.</p>
              <button className="btn btn-primary" style={{ width: '100%', padding: 12 }} onClick={() => { window.location.href = '/'; }}>
                Return to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}
              
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#64748b" style={{ position: 'absolute', top: 12, left: 12 }} />
                  <input type="password" required className={`form-input${error ? ' error' : ''}`} placeholder="Must be at least 6 characters" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingLeft: 38 }} minLength={6} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#64748b" style={{ position: 'absolute', top: 12, left: 12 }} />
                  <input type="password" required className={`form-input${error ? ' error' : ''}`} placeholder="Confirm your new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ paddingLeft: 38 }} minLength={6} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: 15 }} disabled={loading}>
                {loading ? 'Updating...' : 'Save New Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
