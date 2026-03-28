import { useState, useEffect } from 'react';
import { AlertCircle, Bell, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import UrgencyBadge from '../components/UrgencyBadge';
import { ORGAN_TYPES, BLOOD_GROUPS, HLA_TYPES } from '../data/mockData';
import { useToast, ToastContainer } from '../components/Toast';

const INIT = { organ: '', urgency: 'high', gender: '', age: '', hlaType: '', bloodGroup: '', note: '' };

export default function Alerts({ alerts = [], setAlerts, user = {} }) {
  const [form, setForm] = useState(INIT);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [broadcast, setBroadcast] = useState(false);
  const [tab, setTab] = useState('create');
  const { toasts, addToast } = useToast();

  const set = (k, v) => { setForm(prev => ({ ...prev, [k]: v })); if (errors[k]) setErrors(prev => ({ ...prev, [k]: '' })); };


  const validate = () => {
    const e = {};
    if (!form.organ) e.organ = 'Select required organ';
    if (!form.bloodGroup) e.bloodGroup = 'Select blood group';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/alerts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          requiredOrgan: form.organ,
          urgencyLevel: form.urgency,
          gender: form.gender || 'Any',
          age: form.age === 'Any' ? 45 : (form.age ? parseInt(form.age.split('-')[0]) : 45),
          hlaType: form.hlaType || 'Any',
          bloodGroup: form.bloodGroup,
          medicalNotes: form.note || ''
        })
      });

      if (response.ok) {
        const data = await response.json();
        const newAlert = {
          ...data.data.alert,
          organ: form.organ,
          urgency: form.urgency,
          sentAt: new Date().toISOString(),
          responses: 0,
          status: 'active'
        };
        setAlerts(prev => [newAlert, ...prev]);
        setForm(INIT);
        setBroadcast(true);
        addToast('Alert broadcast to all hospitals in the network.', 'success');
        setTimeout(() => setBroadcast(false), 3000);
        setTab('history');
      } else {
        const err = await response.json();
        alert(err.message || 'Failed to broadcast alert');
      }
    } catch (error) {
      console.error('Alert error:', error);
      alert('Network error. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-body">
      <div className="section-header">
        <div className="section-title">Organ Alerts</div>
        <div className="section-desc">Broadcast urgent organ needs to the entire hospital network</div>
      </div>

      <div className="tabs" style={{ marginBottom: 20 }}>
        <button className={`tab-btn${tab === 'create' ? ' active' : ''}`} onClick={() => setTab('create')}>Create Alert</button>
        <button className={`tab-btn${tab === 'history' ? ' active' : ''}`} onClick={() => setTab('history')}>Alert History ({alerts.length})</button>
      </div>

      {tab === 'create' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div className="card card-p">
            {broadcast && (
              <div style={{ background: '#d1fae5', border: '1px solid #a7f3d0', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
                <CheckCircle size={18} color="#059669" />
                <div>
                  <div style={{ fontWeight: 700, color: '#065f46', fontSize: 13.5 }}>Alert Broadcast Successfully!</div>
                  <div style={{ fontSize: 12, color: '#047857' }}>Sent to all hospitals in the network</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, background: '#fee2e2', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={18} color="#ef4444" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>New Organ Alert</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Notify all network hospitals of urgent need</div>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Required Organ <span>*</span></label>
                  <select className={`form-select${errors.organ ? ' error' : ''}`} value={form.organ} onChange={e => set('organ', e.target.value)}>
                    <option value="">Select organ...</option>
                    {ORGAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.organ && <div className="form-error">{errors.organ}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Urgency Level <span>*</span></label>
                  <select className="form-select" value={form.urgency} onChange={e => set('urgency', e.target.value)}>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Blood Group <span>*</span></label>
                  <select className={`form-select${errors.bloodGroup ? ' error' : ''}`} value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)}>
                    <option value="">Select blood group...</option>
                    {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  {errors.bloodGroup && <div className="form-error">{errors.bloodGroup}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">HLA Type</label>
                  <select className="form-select" value={form.hlaType} onChange={e => set('hlaType', e.target.value)}>
                    <option value="">Any HLA type</option>
                    {HLA_TYPES.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Preferred Gender</label>
                  <select className="form-select" value={form.gender} onChange={e => set('gender', e.target.value)}>
                    <option value="">Any</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Age Range</label>
                  <select className="form-select" value={form.age} onChange={e => set('age', e.target.value)}>
                    <option value="">Any</option>
                    <option value="0-18">0-18</option>
                    <option value="18-40">18-40</option>
                    <option value="40-60">40-60</option>
                    <option value="60+">60+</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Additional Note</label>
                <textarea className="form-textarea" rows={3} placeholder="Any additional clinical context for the alert..." value={form.note} onChange={e => set('note', e.target.value)} style={{ resize: 'none' }} />
              </div>

              <button type="submit" className="btn btn-danger" style={{ width: '100%', padding: '12px', fontSize: 15 }} disabled={submitting}>
                {submitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                    Broadcasting...
                  </span>
                ) : <><Send size={16} /> Broadcast to All Hospitals</>}
              </button>
            </form>
          </div>

          {/* Info panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card card-p" style={{ background: 'linear-gradient(135deg, #0f172a, #0c4a6e)', color: '#fff', border: 'none' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, marginBottom: 12 }}>How Alerts Work</div>
              {[
                'Alert is instantly broadcast to all 6 registered hospitals',
                'Each hospital gets an email + in-app notification',
                'Hospitals can respond with availability or unavailability',
                'You see all responses in the Alert History tab',
                'Alert auto-expires after 24 hours if no match found',
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 13, color: '#94a3b8', alignItems: 'flex-start' }}>
                  <div style={{ width: 20, height: 20, background: 'rgba(14,165,233,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#38bdf8' }}>{i + 1}</span>
                  </div>
                  {s}
                </div>
              ))}
            </div>

            <div className="card card-p">
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Network Status</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>Network hospitals will appear here once registered.</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {alerts.map(alert => (
            <div key={alert.id} className="card card-p">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800 }}>{alert.requiredOrgan || alert.organ || 'Organ'} Alert</h3>
                    <UrgencyBadge urgency={alert.urgencyLevel || alert.urgency || 'high'} />
                    <span className={alert.status === 'active' ? 'chip chip-teal' : 'chip chip-gray'}>
                      <span className="chip-dot" />{alert.status === 'active' ? 'Active' : 'Closed'}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {alert.id} &bull; Sent {new Date(alert.createdAt || alert.sentAt || new Date()).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                {[
                  { l: 'Blood Group', v: alert.bloodGroup },
                  { l: 'HLA', v: alert.hlaType },
                  { l: 'Gender', v: alert.gender },
                  { l: 'Age', v: alert.age },
                ].map(f => (
                  <div key={f.l} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '6px 12px', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)', marginRight: 4 }}>{f.l}:</span><strong>{f.v}</strong>
                  </div>
                ))}
              </div>
              { (alert.medicalNotes || alert.note) && <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>{alert.medicalNotes || alert.note}</div> }
            </div>
          ))}
        </div>
      )}

      <ToastContainer toasts={toasts} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
