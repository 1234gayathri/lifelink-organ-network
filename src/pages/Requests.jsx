import { useState } from 'react';
import { FileText, Clock, CheckCircle, XCircle, Truck, Package, Send, Eye } from 'lucide-react';
import StatusChip from '../components/StatusChip';
import UrgencyBadge from '../components/UrgencyBadge';
import MatchBadge from '../components/MatchBadge';
import Modal from '../components/Modal';


const TIMELINE_STEPS = [
  { key: 'sent', label: 'Request Sent' },
  { key: 'received', label: 'Received by Hospital' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'approved', label: 'Approved / Rejected' },
  { key: 'transport', label: 'Transport Started' },
  { key: 'delivered', label: 'Delivered' },
];

function getStepIndex(status) {
  const map = { pending: 1, under_review: 2, approved: 3, rejected: 3, unavailable: 3, in_transit: 4, delivered: 5, completed: 5 };
  return map[status] ?? 0;
}

export default function Requests({ onNavigate, requests = [], setActiveChatId }) {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');

  const filtered = requests.filter(r => {
    if (r.type !== 'Outgoing') return false;
    if (filter === 'all') return true;
    if (filter === 'approved') return r.status === 'approved' || r.status === 'in_transit';
    if (filter === 'delivered') return r.status === 'delivered' || r.status === 'completed';
    return r.status === filter;
  });

  return (
    <div className="page-body">
      <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="section-title">My Requests</div>
          <div className="section-desc">Track all organ requests sent to other hospitals</div>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate('search')}>
          <Send size={15} /> New Request
        </button>
      </div>

      {/* Filter tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {[{ k: 'all', l: 'All' }, { k: 'pending', l: 'Pending' }, { k: 'under_review', l: 'Under Review' }, { k: 'approved', l: 'Approved' }, { k: 'delivered', l: 'Delivered' }, { k: 'rejected', l: 'Rejected' }, { k: 'unavailable', l: 'Unavailable' }].map(t => (
          <button key={t.k} className={`tab-btn${filter === t.k ? ' active' : ''}`} onClick={() => setFilter(t.k)}>{t.l}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-icon"><FileText size={28} /></div><div className="empty-title">No requests</div><div className="empty-desc">No requests match the selected filter.</div></div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(req => {
            const stepIdx = getStepIndex(req.status);
            return (
              <div key={req.id} className="card card-p">
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <MatchBadge score={req.compatibilityScore} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800 }}>{req.organ} Request</h3>
                          <StatusChip status={req.status} />
                          <UrgencyBadge urgency={req.urgency} />
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                          To: <strong>{req.targetHospital.name}</strong>
                        </div>
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#0ea5e9', fontWeight: 600 }}>{req.displayId || req.id}</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
                      {[
                        { label: 'Blood Group', val: req.bloodGroup },
                        { label: 'HLA Type', val: req.hlaType },
                        { label: 'Patient Age', val: req.patientAge + ' yrs' },
                        { label: 'Sent', val: new Date(req.sentAt).toLocaleString() },
                      ].map(f => (
                        <div key={f.label} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 12px' }}>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{f.label}</div>
                          <div style={{ fontWeight: 600, fontSize: 12 }}>{f.val}</div>
                        </div>
                      ))}
                    </div>

                    {/* Timeline */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 14, overflow: 'auto', paddingBottom: 4 }}>
                      {TIMELINE_STEPS.map((step, i) => {
                        const done = i < stepIdx;
                        const active = i === stepIdx;
                        return (
                          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < TIMELINE_STEPS.length - 1 ? 1 : 'initial' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 70 }}>
                              <div style={{
                                width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: done ? 'var(--success)' : active ? 'var(--accent)' : ((req.status === 'rejected' || req.status === 'unavailable') && i === stepIdx) ? 'var(--danger)' : 'var(--surface3)',
                                flexShrink: 0
                              }}>
                                {done ? <CheckCircle size={12} color="#fff" /> : active ? <Clock size={12} color="#fff" /> : ((req.status === 'rejected' || req.status === 'unavailable') && i === stepIdx) ? <XCircle size={12} color="#fff" /> : <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-light)', display: 'block' }} />}
                              </div>
                              <span style={{ fontSize: 10, color: done || active ? 'var(--text)' : 'var(--text-muted)', fontWeight: done || active ? 600 : 400, textAlign: 'center', whiteSpace: 'nowrap' }}>{step.label}</span>
                            </div>
                            {i < TIMELINE_STEPS.length - 1 && (
                              <div style={{ flex: 1, height: 2, background: done ? 'var(--success)' : 'var(--border)', marginTop: -12, minWidth: 20 }} />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelected(req)}><Eye size={13} /> View Details</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent)' }} onClick={() => { setActiveChatId(req.targetHospital.id); onNavigate('communication'); }}><Send size={13} /> Open Chat</button>
                      {req.status === 'approved' && (
                        <button className="btn btn-teal btn-sm" onClick={() => onNavigate('transport')}><Truck size={13} /> Track Transport</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <Modal title={`Request Details — ${selected.displayId || selected.id}`} onClose={() => setSelected(null)}>
          <div>
            <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Case Summary</div>
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.7 }}>{selected.caseSummary}</p>
            </div>
            <div className="form-group">
              <div className="form-label">Doctor Notes</div>
              <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '12px', fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>{selected.doctorNotes}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Organ', val: selected.organ },
                { label: 'Status', val: <StatusChip status={selected.status} /> },
                { label: 'Target Hospital', val: selected.targetHospital.name },
                { label: 'Compatibility', val: selected.compatibilityScore + '%' },
              ].map(f => (
                <div key={f.label} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{f.label}</div>
                  <div style={{ fontWeight: 600 }}>{f.val}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={() => { setActiveChatId(selected.targetHospital.id); setSelected(null); onNavigate('communication'); }}>Open Chat</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
