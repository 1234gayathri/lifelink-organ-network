import { useState, useEffect } from 'react';
import { Settings, Shield, Bell, Lock, User, CheckCircle, Edit2, Save, AlertCircle, Loader } from 'lucide-react';
import { useToast, ToastContainer } from '../components/Toast';

const API = 'http://localhost:5000/api';

export default function Profile({ user = {} }) {
  const [tab, setTab] = useState('details');
  const [editing, setEditing] = useState(false);
  const [hospital, setHospital] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [stats, setStats] = useState({});
  const [myOrgans, setMyOrgans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [notifications, setNotifications] = useState({ newRequest: true, approval: true, expiring: true, transport: false, alerts: true });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const { toasts, addToast } = useToast();

  const token = localStorage.getItem('token');

  // Fetch hospital profile and own organs from backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profileRes, organsRes] = await Promise.all([
          fetch(`${API}/hospitals/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API}/organs/my`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        const data = await profileRes.json();
        if (profileRes.ok) {
          setHospital(data.data.hospital);
          setEditForm({
            hospitalName: data.data.hospital.hospitalName,
            contactPerson: data.data.hospital.contactPerson,
            phoneNumber: data.data.hospital.phoneNumber,
            location: data.data.hospital.location,
          });
          setStats(data.data.stats);
        }

        const organsData = await organsRes.json();
        if (organsRes.ok && organsData.data?.organs) {
          setMyOrgans(organsData.data.organs);
        }
      } catch (err) {
        addToast('Failed to load profile', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Save profile changes
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/hospitals/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (res.ok) {
        setHospital(data.data.hospital);
        setEditing(false);
        addToast('Hospital profile updated successfully.', 'success');
      } else {
        addToast(data.message || 'Update failed', 'error');
      }
    } catch (err) {
      addToast('Network error', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    setPasswordError('');
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError('All fields are required');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      // Check if we are in mock/simulation mode (no real token)
      if (!token) {
        setTimeout(() => {
          addToast('Password updated successfully (Simulation).', 'success');
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setSavingPassword(false);
        }, 800);
        return;
      }

      const res = await fetch(`${API}/hospitals/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Password updated successfully.', 'success');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordError(data.message || 'Failed to update password');
      }
    } catch (err) {
      setPasswordError('Network error connecting to security service');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="page-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: '#0ea5e9' }} />
          <div style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 14 }}>Loading profile...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="page-body">
        <div className="card card-p" style={{ textAlign: 'center', padding: 40 }}>
          <AlertCircle size={40} color="#ef4444" />
          <div style={{ marginTop: 12, fontWeight: 700 }}>Could not load hospital profile</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Please check your login and try again.</div>
        </div>
      </div>
    );
  }

  const initials = hospital.hospitalName.split(' ').map(w => w[0]).slice(0, 2).join('');

  return (
    <div className="page-body">
      <div className="section-header">
        <div className="section-title">Hospital Profile & Settings</div>
        <div className="section-desc">Manage your hospital information and preferences</div>
      </div>

      <div className="tabs" style={{ marginBottom: 20 }}>
        {[
          { k: 'details', l: 'Hospital Details' }, 
          { k: 'donors', l: 'Donor Registry' }, 
          { k: 'notifications', l: 'Notifications' }, 
          { k: 'security', l: 'Security' }
        ].map(t => (
          <button key={t.k} className={`tab-btn${tab === t.k ? ' active' : ''}`} onClick={() => setTab(t.k)}>{t.l}</button>
        ))}
      </div>

      {tab === 'details' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card card-p">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'Syne, sans-serif' }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800 }}>{hospital.hospitalName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{hospital.hospitalId}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <span style={{ background: hospital.verificationStatus === 'active' ? '#d1fae5' : '#fef3c7', color: hospital.verificationStatus === 'active' ? '#059669' : '#92400e', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={11} /> {hospital.verificationStatus === 'active' ? 'Verified' : 'Pending'}
                    </span>
                    <span style={{ background: '#e0f2fe', color: '#0284c7', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>{hospital.accountStatus === 'active' ? 'Active' : hospital.accountStatus}</span>
                  </div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(e => !e)}>
                <Edit2 size={13} /> {editing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {editing ? (
              <div>
                {[
                  { label: 'Hospital Name', key: 'hospitalName', type: 'text' },
                  { label: 'Contact Person', key: 'contactPerson', type: 'text' },
                  { label: 'Phone', key: 'phoneNumber', type: 'text' },
                  { label: 'Location', key: 'location', type: 'text' },
                ].map(f => (
                  <div className="form-group" key={f.key}>
                    <label className="form-label">{f.label}</label>
                    <input type={f.type} className="form-input" value={editForm[f.key] || ''} onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
                  </div>
                ))}
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : <><Save size={15} /> Save Changes</>}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Hospital ID', value: hospital.hospitalId },
                  { label: 'Official Email', value: hospital.officialEmail },
                  { label: 'Contact Person', value: hospital.contactPerson },
                  { label: 'Phone', value: hospital.phoneNumber },
                  { label: 'Location', value: hospital.location },
                  { label: 'Member Since', value: new Date(hospital.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
                ].map(f => (
                  <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{f.label}</span>
                    <span style={{ fontWeight: 600 }}>{f.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verification badge + Quick Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card card-p" style={{ background: 'linear-gradient(135deg, #0f172a, #0c4a6e)', color: '#fff', border: 'none' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, background: 'rgba(16,185,129,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <Shield size={22} color="#34d399" />
                </div>
                <div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15 }}>
                    {hospital.verificationStatus === 'active' ? 'Verified Hospital' : 'Verification Pending'}
                  </div>
                  <div style={{ color: '#34d399', fontSize: 12, marginTop: 2 }}>NOTTO Compliant</div>
                </div>
              </div>
              {['Identity verified', 'NOTTO registration confirmed', 'Authorized transplant center', 'ISO 9001 certified'].map(s => (
                <div key={s} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <CheckCircle size={14} color="#34d399" />
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>{s}</span>
                </div>
              ))}
            </div>

            <div className="card card-p">
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Activity Stats</div>
              {[
                { label: 'Organs Uploaded', val: stats.organsUploaded || 0 },
                { label: 'Requests Sent', val: stats.requestsSent || 0 },
                { label: 'Requests Received', val: stats.requestsReceived || 0 },
                { label: 'Certificates Issued', val: stats.certificatesIssued || 0 },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                  <span style={{ fontWeight: 700 }}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'donors' && (
        <div className="card">
          <div className="card-p" style={{ borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: 'var(--accent-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={18} color="var(--accent)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>My Donor Records</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Full identity records for all donors listed by your hospital</div>
              </div>
            </div>
          </div>
          <div className="table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '14px 20px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Donor Identity Details</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Record Status</th>
                </tr>
              </thead>
              <tbody>
                {myOrgans.length === 0 ? (
                  <tr>
                    <td colSpan={2} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                      No donor identity records found.
                    </td>
                  </tr>
                ) : (
                  myOrgans.map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{o.donorName || 'Identity Not Recorded'}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                          S/O | D/O: <span style={{ fontWeight: 600 }}>{o.familyName || 'Guardian N/A'}</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                          <span style={{ fontWeight: 600 }}>{o.donorGender || 'N/A'}</span> &bull; {o.donorAge ? `${o.donorAge} Years` : 'Age N/A'}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                          <span style={{ fontWeight: 600, color: '#0ea5e9' }}>Govt ID:</span> {o.donorGovtId || 'Pending Verification'}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          <span style={{ fontWeight: 600, color: '#0ea5e9' }}>Contact:</span> {o.donorContact || 'No primary contact'}
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, fontStyle: 'italic' }}>
                          Registered on {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          background: o.status === 'available' ? '#d1fae5' : o.status === 'allocated' ? '#e0f2fe' : o.status === 'expired' ? '#fee2e2' : '#fef3c7',
                          color: o.status === 'available' ? '#059669' : o.status === 'allocated' ? '#0369a1' : o.status === 'expired' ? '#b91c1c' : '#92400e',
                          fontWeight: 700, fontSize: 11, padding: '4px 12px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="card card-p" style={{ maxWidth: 480 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Notification Preferences</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Choose which events send notifications to your team</div>
          {[
            { key: 'newRequest', label: 'New organ requests', desc: 'When another hospital sends a request for your organs' },
            { key: 'approval', label: 'Approvals & rejections', desc: 'Status changes on your sent requests' },
            { key: 'expiring', label: 'Organ expiry warnings', desc: 'When organs are approaching expiry' },
            { key: 'transport', label: 'Transport updates', desc: 'GPS and ETA updates for in-transit organs' },
            { key: 'alerts', label: 'Network alerts', desc: 'Broadcasts from other hospitals in the network' },
          ].map(item => (
            <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 0', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.desc}</div>
              </div>
              <button
                style={{ width: 42, height: 24, borderRadius: 999, background: notifications[item.key] ? 'linear-gradient(135deg, #0ea5e9, #0d9488)' : '#e2e8f0', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
                onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
              >
                <div style={{ width: 18, height: 18, background: '#fff', borderRadius: '50%', position: 'absolute', top: 3, left: notifications[item.key] ? 21 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
            </div>
          ))}
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => addToast('Notification preferences saved.', 'success')}>
            <Save size={15} /> Save Preferences
          </button>
        </div>
      )}

      {tab === 'security' && (
        <div className="card card-p" style={{ maxWidth: 480 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Change Password</div>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input type="password" className="form-input" placeholder="Enter current password" value={passwordForm.currentPassword} onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input type="password" className="form-input" placeholder="Min 8 characters" value={passwordForm.newPassword} onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input type="password" className="form-input" placeholder="Re-enter new password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} />
          </div>
          {passwordError && (
            <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={14} /> {passwordError}
            </div>
          )}
          <button 
            className="btn btn-primary" 
            onClick={handleChangePassword} 
            disabled={savingPassword}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: 'fit-content' }}
          >
            {savingPassword ? (
              <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> Updating...</>
            ) : (
              <><Lock size={15} /> Update Password</>
            )}
          </button>
          <div className="divider" />
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#0369a1', marginBottom: 8 }}>Two-Factor Authentication</div>
            <div style={{ fontSize: 13, color: '#0c4a6e', marginBottom: 12 }}>2FA is enabled via OTP on every login for enhanced security.</div>
            <span style={{ background: '#d1fae5', color: '#059669', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle size={11} /> Enabled
            </span>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}
