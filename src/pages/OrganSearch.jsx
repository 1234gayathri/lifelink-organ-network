import { useState, useRef, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, MessageSquare, Mail, Eye, Plus, AlertCircle, Clock, MapPin, User, CheckCircle } from 'lucide-react';
import MatchBadge from '../components/MatchBadge';
import CountdownTimer from '../components/CountdownTimer';
import StatusChip from '../components/StatusChip';
import Modal from '../components/Modal';
import { ORGAN_TYPES, BLOOD_GROUPS, HLA_TYPES } from '../data/mockData';

const SUGGESTIONS = ['Kidney O+', 'Liver A+', 'Heart B+', 'Lungs AB+', 'Pancreas O-', 'Cornea', 'Kidney B-', 'Liver O+'];

export default function OrganSearch({ onNavigate, organs, user = {} }) {
  const [organType, setOrganType] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [hlaType, setHlaType] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [donorAge, setDonorAge] = useState('');
  const [donorGender, setDonorGender] = useState('');
  const [urgency, setUrgency] = useState('');
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedOrgan, setSelectedOrgan] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const searchRef = useRef(null);



  const handleSearch = () => {
    let filtered = [...organs];

    // Step-based filters
    if (organType) filtered = filtered.filter(o => o.type === organType);
    if (bloodGroup && bloodGroup !== 'Any') {
      filtered = filtered.filter(o => o.bloodGroup === bloodGroup || o.bloodGroup === 'Any');
    }
    if (hlaType && hlaType !== 'Any') filtered = filtered.filter(o => o.hlaType === hlaType);

    // Advanced filters
    if (donorGender) filtered = filtered.filter(o => o.donorGender === donorGender);
    if (urgency) filtered = filtered.filter(o => o.status === urgency);
    if (donorAge) {
      const [min, max] = donorAge.split('-').map(Number);
      filtered = filtered.filter(o => o.donorAge >= min && o.donorAge <= max);
    }

    // Sort by compatibility by default
    filtered.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    setResults(filtered);
    setSearched(true);
  };

  // Add auto-search when filters change (Reactiveness)
  useEffect(() => {
    if (organType) {
      handleSearch();
    }
  }, [organType, bloodGroup, hlaType, donorGender, urgency, donorAge]);



  const [submitting, setSubmitting] = useState(false);
  const [requestData, setRequestData] = useState({ urgency: 'high', notes: '', caseSummary: '' });

  const handleRequest = async () => {
    if (!selectedOrgan) return;
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/requests', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          organId: selectedOrgan.id_full || selectedOrgan.id, // Ensure UUID is used
          urgencyLevel: requestData.urgency || 'high',
          patientBloodGroup: selectedOrgan.bloodGroup,
          patientHlaType: selectedOrgan.hlaType,
          patientAge: 45, // Placeholder for patient age - in real app would be from patient record
          doctorNotes: requestData.notes || 'Interested in this organ for our patient.',
          caseSummary: requestData.caseSummary || 'Standard organ request for matching donor.'
        })
      });

      if (response.ok) {
        setRequestSent(true);
        // Add toast or notification would be good here if available
        setTimeout(() => { 
          setShowRequestModal(false); 
          setRequestSent(false); 
          onNavigate('requests'); // Smooth redirect to tracking page
        }, 1800);
      } else {
        const err = await response.json();
        alert(err.message || 'Failed to send request');
      }
    } catch (error) {
      console.error('Request error:', error);
      alert('Network error while sending request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNotifyEmail = async (organ) => {
    const confirm = window.confirm(`Send formal notification email to ${organ.sourceHospital.name} regarding this ${organ.type}?`);
    if (!confirm) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/organs/${organ.id_full || organ.id}/notify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert(`Emergency email notification sent to ${organ.sourceHospital.name}! They have been alerted to your interest.`);
      } else {
        alert('Failed to send email notification. Please try the in-app chat.');
      }
    } catch (error) {
      console.error('Email notify error:', error);
      alert('Network error. Check your connection.');
    }
  };



  return (
    <div className="page-container" style={{ maxWidth: '100%' }}>
      <div className="section-header">
        <h1 className="section-title">Organ Search</h1>
        <p className="section-desc">Find compatible organs across the network</p>
      </div>

      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, #0f172a, #0c4a6e)', color: '#fff' }}>
        <div className="card-p">
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Organ Matcher</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Find compatible organs across the hospital network using step-based matching</p>
          </div>

          {/* Step-based filters */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, marginBottom: 12 }}>
            {/* Step 1: Organ type */}
            <div>
              <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Step 1: Organ Type</div>
              <select className="form-select" value={organType} onChange={e => { setOrganType(e.target.value); setBloodGroup(''); setHlaType(''); }}>
                <option value="">Select organ type...</option>
                {ORGAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Step 2: Blood group (enabled after organ) */}
            <div>
              <div style={{ color: organType ? '#64748b' : '#374151', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Step 2: Blood Group</div>
              <select className="form-select" value={bloodGroup} onChange={e => { setBloodGroup(e.target.value); setHlaType(''); }} disabled={!organType}>
                <option value="">Any blood group</option>
                {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* Step 3: HLA type (enabled after blood group) */}
            <div>
              <div style={{ color: bloodGroup ? '#64748b' : '#374151', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Step 3: HLA Type</div>
              <select className="form-select" value={hlaType} onChange={e => setHlaType(e.target.value)} disabled={!bloodGroup}>
                <option value="">Any HLA type</option>
                {HLA_TYPES.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <button className="btn btn-primary" style={{ height: 41 }} onClick={handleSearch} disabled={!organType}>
                <Search size={15} /> Search
              </button>
              <button className="btn btn-ghost" style={{ height: 41, padding: '0 12px' }} title="Reset filters" onClick={() => {
                setOrganType(''); setBloodGroup(''); setHlaType(''); 
                setDonorAge(''); setDonorGender(''); setUrgency(''); setSearched(false);
              }}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Advanced filters toggle */}
          <button onClick={() => setShowAdvanced(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} /> Advanced Filters {showAdvanced ? '(hide)' : '(show)'}
          </button>

          {showAdvanced && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
              <div>
                <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Donor Gender</div>
                <select className="form-select" value={donorGender} onChange={e => setDonorGender(e.target.value)}>
                  <option value="">Any</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Status / Urgency</div>
                <select className="form-select" value={urgency} onChange={e => setUrgency(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="available">Available</option>
                  <option value="critical">Critical (Urgent)</option>
                  <option value="expiring">Expiring Soon</option>
                </select>
              </div>
              <div>
                <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Donor Age Range</div>
                <select className="form-select" value={donorAge} onChange={e => setDonorAge(e.target.value)}>
                  <option value="">Any age</option>
                  <option value="18-30">18-30</option>
                  <option value="31-45">31-45</option>
                  <option value="46-60">46-60</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {!searched ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon"><Search size={28} /></div>
            <div className="empty-title">Start your organ search</div>
            <div className="empty-desc">Select an organ type above to begin. Results will show compatibility scores and organ details from all network hospitals.</div>
          </div>
        </div>
      ) : results.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon"><AlertCircle size={28} color="#ef4444" /></div>
            <div className="empty-title">No organs found</div>
            <div className="empty-desc">No compatible {organType || 'organ'} found with the specified criteria. Create an alert to notify all hospitals.</div>
            <button className="btn btn-danger" style={{ marginTop: 20 }} onClick={() => onNavigate('alerts')}>
              <AlertCircle size={15} /> Create Organ Alert
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              Found <strong style={{ color: 'var(--text)' }}>{results.length}</strong> organs matching your criteria
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="form-select" style={{ width: 'auto', fontSize: 12, padding: '6px 10px' }}>
                <option>Sort by: Match %</option>
                <option>Sort by: Survival Time</option>
                <option>Sort by: Distance</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {results.map(organ => (
              <div key={organ.id} className="card card-p" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <MatchBadge score={organ.compatibilityScore} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800 }}>{organ.type}</h3>
                        <StatusChip status={organ.status} />
                        {organ.status === 'critical' && <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, animation: 'pulse 1s infinite' }}>URGENT</span>}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                        Source: <strong>{organ.sourceHospital.name}</strong> &bull; {organ.sourceHospital.location}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{organ.id}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 12 }}>
                    {[
                      { label: 'Blood Group', value: organ.bloodGroup },
                      { label: 'HLA Type', value: organ.hlaType },
                      { label: 'Donor Age', value: organ.donorAge + ' yrs' },
                      { label: 'Donor Gender', value: organ.donorGender },
                      { label: 'Organ ID', value: organ.id },
                    ].map(field => (
                      <div key={field.label} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 12px' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{field.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{field.value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <CountdownTimer extractedAt={organ.extractedAt} maxStorageHours={organ.maxStorageHours} />
                  </div>

                  <div style={{ background: 'var(--accent-light)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 12.5, color: 'var(--accent)', fontWeight: 500 }}>
                    {organ.notes}
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn-sm" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }} onClick={() => setSelectedOrgan(organ)}>
                      <Eye size={14} /> View Details
                    </button>
                    {user.id !== organ.sourceHospital.id ? (
                      <>
                        <button className="btn btn-primary btn-sm" onClick={() => { setSelectedOrgan(organ); setShowRequestModal(true); }}>
                          <Plus size={14} /> Send Request
                        </button>
                        <button className="btn btn-teal btn-sm" onClick={() => onNavigate('communication')}>
                          <MessageSquare size={14} /> Start Chat
                        </button>
                        <button className="btn btn-sm" style={{ background: '#ede9fe', color: '#7c3aed', border: '1px solid #c4b5fd' }} onClick={() => handleNotifyEmail(organ)}>
                          <Mail size={14} /> Notify via Email
                        </button>
                      </>
                    ) : (
                      <div style={{ fontSize: 11, color: 'var(--accent)', background: 'var(--accent-light)', padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
                         <CheckCircle size={14} /> This organ was listed by your hospital.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Organ details modal */}
      {selectedOrgan && !showRequestModal && (
        <Modal title={`${selectedOrgan.type} — Organ Details`} onClose={() => setSelectedOrgan(null)} maxWidth="640px">
          <div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 20, alignItems: 'flex-start' }}>
              <MatchBadge score={selectedOrgan.compatibilityScore} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{selectedOrgan.type}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Source: {selectedOrgan.sourceHospital.name}</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <StatusChip status={selectedOrgan.status} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Blood Group', value: selectedOrgan.bloodGroup },
                { label: 'HLA Type', value: selectedOrgan.hlaType },
                { label: 'Donor Age', value: selectedOrgan.donorAge + ' years' },
                { label: 'Donor Gender', value: selectedOrgan.donorGender },
                { label: 'Hospital', value: selectedOrgan.sourceHospital.name },
                { label: 'Location', value: selectedOrgan.sourceHospital.location },
              ].map(f => (
                <div key={f.label} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{f.label}</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{f.value}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Survival Time</div>
              <CountdownTimer extractedAt={selectedOrgan.extractedAt} maxStorageHours={selectedOrgan.maxStorageHours} />
            </div>

            <div style={{ background: 'var(--accent-light)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px', marginBottom: 20, fontSize: 13, color: 'var(--accent)', lineHeight: 1.6 }}>
              <strong>Medical Notes:</strong> {selectedOrgan.notes}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={() => { setShowRequestModal(true); }}><Plus size={15} /> Request Organ</button>
              <button className="btn btn-teal" onClick={() => { setSelectedOrgan(null); onNavigate('communication'); }}><MessageSquare size={15} /> Open Chat</button>
              <button className="btn btn-ghost" onClick={() => setSelectedOrgan(null)}>Close</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Request modal */}
      {showRequestModal && selectedOrgan && (
        <Modal
          title={`Request ${selectedOrgan.type}`}
          onClose={() => { setShowRequestModal(false); setRequestSent(false); }}
          footer={!requestSent ? (
            <>
              <button className="btn btn-ghost" onClick={() => setShowRequestModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRequest}>Confirm & Send Request</button>
            </>
          ) : null}
        >
          {requestSent ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 60, height: 60, background: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={30} color="#059669" />
              </div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Request Sent!</div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>Your request has been sent to {selectedOrgan.sourceHospital.name}. Redirecting...</p>
            </div>
          ) : (
            <div>
              <div style={{ background: 'var(--accent-light)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{selectedOrgan.type} from {selectedOrgan.sourceHospital.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3 }}>{selectedOrgan.bloodGroup} &bull; {selectedOrgan.hlaType} &bull; Match: {selectedOrgan.compatibilityScore}%</div>
              </div>
              <div className="form-group">
                <label className="form-label">Urgency Level <span>*</span></label>
                <select className="form-select" value={requestData.urgency} onChange={e => setRequestData({...requestData, urgency: e.target.value})}>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Doctor Notes</label>
                <textarea className="form-textarea" rows={2} placeholder="Relevant patient clinical notes..." style={{ resize: 'none' }} 
                  value={requestData.notes} onChange={e => setRequestData({...requestData, notes: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Case Summary</label>
                <textarea className="form-textarea" rows={2} placeholder="Brief summary of the case..." style={{ resize: 'none' }} 
                  value={requestData.caseSummary} onChange={e => setRequestData({...requestData, caseSummary: e.target.value})} />
              </div>
              <div style={{ marginTop: 16 }}>
                <button className={`btn btn-primary w-full ${submitting ? 'loading' : ''}`} onClick={handleRequest} disabled={submitting} style={{ width: '100%' }}>
                  {submitting ? 'Sending...' : 'Confirm & Send Request'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }`}</style>
    </div>
  );
}
