import { useState, useEffect } from 'react';
import { RefreshCw, Plus, CheckCircle, Bell, XCircle, Clock, Truck, Award, AlertCircle, Heart, Check, CheckCheck } from 'lucide-react';
import StatusChip from '../components/StatusChip';
import CountdownTimer from '../components/CountdownTimer';
import Modal from '../components/Modal';
import { ORGAN_TYPES, BLOOD_GROUPS, HLA_TYPES } from '../data/mockData';
import { useToast, ToastContainer } from '../components/Toast';

const INIT = { organType: '', bloodGroup: '', hlaType: '', donorAge: '', donorGender: '', extractedAt: '', storageLife: '', notes: '' };

export default function UpdateAvailability({ organs, setOrgans, user, addNotification }) {
  const [form, setForm] = useState({ ...INIT, donorName: '', donorGovtId: '', donorContact: '', familyName: '', familyContact: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { toasts, addToast } = useToast();

  const set = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.organType) e.organType = 'Select organ type';
    if (!form.bloodGroup) e.bloodGroup = 'Select blood group';
    if (!form.donorAge || isNaN(Number(form.donorAge))) e.donorAge = 'Enter valid age';
    if (!form.donorGender) e.donorGender = 'Select gender';
    if (!form.extractedAt) e.extractedAt = 'Enter extraction date & time';
    if (!form.storageLife || isNaN(Number(form.storageLife))) e.storageLife = 'Enter valid storage hours';
    
    const aadharRegex = /^\d{12}$/;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
    if (!form.donorGovtId) {
      e.donorGovtId = 'Enter Govt ID (Aadhar/PAN)';
    } else {
      const cleanId = form.donorGovtId.replace(/[\s-]/g, '');
      if (!aadharRegex.test(cleanId) && !panRegex.test(cleanId)) {
        e.donorGovtId = 'Please enter a valid Aadhar (12 digits) or PAN (10 chars)';
      }
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!form.donorContact) {
      e.donorContact = 'Enter contact number';
    } else if (!phoneRegex.test(form.donorContact.replace(/[\s-]/g, ''))) {
      e.donorContact = 'Enter a valid 10-digit mobile number';
    }

    if (!form.familyContact) {
      e.familyContact = 'Enter emergency contact';
    } else if (!phoneRegex.test(form.familyContact.replace(/[\s-]/g, ''))) {
      e.familyContact = 'Enter a valid 10-digit mobile number';
    }
    
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    
    setSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/organs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          organType: form.organType,
          bloodGroup: form.bloodGroup,
          hlaType: form.hlaType || 'Not specified',
          donorAge: Number(form.donorAge),
          donorGender: form.donorGender,
          donorName: form.donorName,
          donorGovtId: form.donorGovtId,
          donorContact: form.donorContact,
          familyName: form.familyName,
          familyContact: form.familyContact,
          donorMedicalDetails: `Aadhar/PAN: ${form.donorGovtId}, Contact: ${form.donorContact}`,
          extractionTime: new Date(form.extractedAt).toISOString(),
          maxStorageMinutes: Number(form.storageLife) * 60,
          notes: form.notes || 'No additional notes.'
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        const o = result.data.organ;
        // Map raw DB object to frontend-expected format to prevent NaN rendering
        const newMappedOrgan = {
          ...o,
          id: o.id.split('-')[0] + '-' + o.id.split('-')[1].substring(0, 4).toUpperCase(),
          type: o.organType,
          extractedAt: o.extractionTime,
          maxStorageHours: Math.floor(o.maxStorageMinutes / 60),
          donorGovtId: form.donorGovtId,
          donorContact: form.donorContact,
          sourceHospital: { id: user.id, name: user.name, location: user.location }
        };

        setOrgans(prev => [newMappedOrgan, ...prev]);
        addToast(`${form.organType} successfully listed to the live network!`, 'success');
        setForm({ ...INIT, donorName: '', donorGovtId: '', donorContact: '', familyName: '', familyContact: '' });
      } else {
        addToast(result.message || 'Failed to list organ', 'error');
      }
    } catch (err) {
      addToast('Network error while saving organ', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-body">
      <div className="section-header">
        <div className="section-title">Update Organ Availability</div>
        <div className="section-desc">List newly extracted organs for the hospital network</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Form */}
        <div className="card card-p">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>List New Organ</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Add newly extracted organ to the network</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Organ Type <span>*</span></label>
                <select className={`form-select${errors.organType ? ' error' : ''}`} value={form.organType} onChange={e => set('organType', e.target.value)}>
                  <option value="">Select organ...</option>
                  {ORGAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.organType && <div className="form-error">{errors.organType}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Blood Group <span>*</span></label>
                <select className={`form-select${errors.bloodGroup ? ' error' : ''}`} value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)}>
                  <option value="">Select blood group...</option>
                  {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                {errors.bloodGroup && <div className="form-error">{errors.bloodGroup}</div>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">HLA Type</label>
              <select className="form-select" value={form.hlaType} onChange={e => set('hlaType', e.target.value)}>
                <option value="">Select HLA type (optional)...</option>
                {HLA_TYPES.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Donor Age <span>*</span></label>
                <input type="number" className={`form-input${errors.donorAge ? ' error' : ''}`} placeholder="Age in years" value={form.donorAge} onChange={e => set('donorAge', e.target.value)} min={1} max={99} />
                {errors.donorAge && <div className="form-error">{errors.donorAge}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Donor Gender <span>*</span></label>
                <select className={`form-select${errors.donorGender ? ' error' : ''}`} value={form.donorGender} onChange={e => set('donorGender', e.target.value)}>
                  <option value="">Select gender...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                {errors.donorGender && <div className="form-error">{errors.donorGender}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Extraction Date & Time <span>*</span></label>
                <input type="datetime-local" className={`form-input${errors.extractedAt ? ' error' : ''}`} value={form.extractedAt} onChange={e => set('extractedAt', e.target.value)} />
                {errors.extractedAt && <div className="form-error">{errors.extractedAt}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Storage Life (hours) <span>*</span></label>
                <input type="number" className={`form-input${errors.storageLife ? ' error' : ''}`} placeholder="e.g. 36" value={form.storageLife} onChange={e => set('storageLife', e.target.value)} min={1} max={500} />
                {errors.storageLife && <div className="form-error">{errors.storageLife}</div>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Additional Medical Notes</label>
              <textarea className="form-textarea" rows={2} placeholder="Any relevant clinical details..." value={form.notes} onChange={e => set('notes', e.target.value)} style={{ resize: 'none' }} />
            </div>

            <div style={{ background: 'rgba(14, 165, 233, 0.05)', border: '1px solid rgba(14, 165, 233, 0.1)', borderRadius: 10, padding: '14px', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', color: '#0ea5e9', letterSpacing: '0.05em', marginBottom: 12 }}>Donor Personal Identity (Protected)</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Donor Full Name</label>
                  <input className="form-input" placeholder="Legal full name" value={form.donorName} onChange={e => set('donorName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Donor Mobile / Contact <span>*</span></label>
                  <input className={`form-input${errors.donorContact ? ' error' : ''}`} placeholder="Phone number" value={form.donorContact} onChange={e => set('donorContact', e.target.value)} />
                  {errors.donorContact && <div className="form-error">{errors.donorContact}</div>}
                </div>
              </div>
              <div className="form-row" style={{ marginTop: 12 }}>
                <div className="form-group">
                  <label className="form-label">Guardian / Family Name</label>
                  <input className="form-input" placeholder="Primary contact person" value={form.familyName} onChange={e => set('familyName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Family Mobile / Contact <span>*</span></label>
                  <input className={`form-input${errors.familyContact ? ' error' : ''}`} placeholder="Family contact number" value={form.familyContact} onChange={e => set('familyContact', e.target.value)} />
                  {errors.familyContact && <div className="form-error">{errors.familyContact}</div>}
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Govt ID (Aadhar/PAN) <span>*</span></label>
                <input 
                  className={`form-input${errors.donorGovtId ? ' error' : ''}`} 
                  placeholder="ID Number for verification" 
                  value={form.donorGovtId} 
                  onChange={e => set('donorGovtId', e.target.value)} 
                />
                {errors.donorGovtId && <div className="form-error">{errors.donorGovtId}</div>}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={submitting}>
              {submitting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Posting...
                </span>
              ) : <span><Plus size={16} style={{ display: 'inline', marginRight: 6 }} />Post Organ Availability</span>}
            </button>
          </form>
        </div>

        {/* Currently available organs */}
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Currently Available Organs ({organs.filter(o => o.status === 'available').length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {organs.map(organ => (
              <div key={organ.id} className="card" style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15 }}>{organ.type}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{organ.bloodGroup} &bull; {organ.hlaType} &bull; {organ.donorGender}, {organ.donorAge}y</div>
                  </div>
                  <StatusChip status={organ.status} />
                </div>
                <CountdownTimer extractedAt={organ.extractedAt} maxStorageHours={organ.maxStorageHours} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
