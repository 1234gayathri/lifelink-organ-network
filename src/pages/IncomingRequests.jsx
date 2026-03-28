import { useState, useEffect } from 'react';
import { Inbox, CheckCircle, XCircle, MessageSquare, Eye, Filter } from 'lucide-react';
import StatusChip from '../components/StatusChip';
import UrgencyBadge from '../components/UrgencyBadge';
import MatchBadge from '../components/MatchBadge';
import Modal from '../components/Modal';
import { useToast, ToastContainer } from '../components/Toast';

export default function IncomingRequests({ onNavigate, requests: globalRequests = [], setRequests: setGlobalRequests, setActiveChatId }) {
  const [requests, setRequestsLocal] = useState(globalRequests);

  // Sync with global if it changes
  useEffect(() => { setRequestsLocal(globalRequests); }, [globalRequests]);

  const setRequests = (updated) => {
    setRequestsLocal(updated);
    if (setGlobalRequests) setGlobalRequests(updated);
  };
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const { toasts, addToast } = useToast();

  const filtered = requests.filter(r => {
    if (r.type !== 'Incoming') return false;
    const uMatch = urgencyFilter === 'all' || r.urgency === urgencyFilter;
    let sMatch = statusFilter === 'all';
    if (!sMatch) {
      if (statusFilter === 'approved') sMatch = r.status === 'approved' || r.status === 'in_transit';
      else if (statusFilter === 'delivered') sMatch = r.status === 'delivered' || r.status === 'completed';
      else sMatch = r.status === statusFilter;
    }
    return uMatch && sMatch;
  });

  const handleAction = async (id, action, formData = {}) => {
    const status = action === 'approve' ? 'approved' : 'rejected';
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`http://localhost:5000/api/requests/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status,
          compatibilitySummary: formData.summary,
          matchQuality: formData.matchQuality,
          medicalReadiness: formData.ready,
          compatibilityScore: formData.score ?? confirmAction?.req?.compatibilityScore
        })
      });

      if (res.ok) {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
        addToast(
          action === 'approve' 
            ? 'Request approved successfully. Coordination initiated.' 
            : 'Request declined successfully.', 
          action === 'approve' ? 'success' : 'error'
        );
      } else {
        const errData = await res.json();
        addToast(errData.message || 'Operation failed', 'error');
      }
    } catch (err) {
      addToast('Network error', 'error');
    } finally {
      setConfirmAction(null);
      setSelected(null);
    }
  };

  return (
    <div className="page-body">
      <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="section-title">Incoming Requests</div>
          <div className="section-desc">Review and respond to organ requests from other hospitals</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="form-select" style={{ width: 'auto', fontSize: 12 }} value={urgencyFilter} onChange={e => setUrgencyFilter(e.target.value)}>
            <option value="all">All Urgency</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select className="form-select" style={{ width: 'auto', fontSize: 12 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="delivered">Delivered</option>
            <option value="rejected">Rejected</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-icon"><Inbox size={28} /></div><div className="empty-title">No requests</div><div className="empty-desc">No incoming requests match the selected filters.</div></div></div>
      ) : (
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Requesting Hospital</th>
                <th>Organ</th>
                <th>Blood Group</th>
                <th>Urgency</th>
                <th>Compatibility</th>
                <th>Requested At</th>
                <th>Status</th>
                <th style={{ minWidth: 200 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(req => (
                <tr key={req.id}>
                  <td>
                    <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#0ea5e9', fontWeight: 600 }}>{req.displayId || req.id}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{req.requestingHospital.name.split(' ').slice(0,2).join(' ')}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{req.requestingHospital.location}</div>
                  </td>
                  <td style={{ fontWeight: 700 }}>{req.organ}</td>
                  <td><span style={{ fontWeight: 700, color: '#0284c7' }}>{req.bloodGroup}</span></td>
                  <td><UrgencyBadge urgency={req.urgency} /></td>
                  <td>
                    <span style={{ fontWeight: 800, fontSize: 14, color: req.compatibilityScore >= 90 ? '#059669' : req.compatibilityScore >= 75 ? '#0284c7' : '#f59e0b' }}>
                      {req.compatibilityScore}%
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(req.sentAt).toLocaleDateString()}<br />{new Date(req.sentAt).toLocaleTimeString()}</td>
                  <td><StatusChip status={req.status} /></td>
                  <td>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: 6, width: 'fit-content' }}>
                      <button 
                        className="btn-icon" 
                        style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: '#fff', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                        onClick={() => setSelected(req)}
                      >
                        <Eye size={16} />
                      </button>

                      {(req.status === 'sent' || req.status === 'pending' || req.status === 'under_review') ? (
                        <>
                          <button 
                            style={{ 
                              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, 
                              background: '#ecfdf5', color: '#059669', border: '1px solid #10b981', 
                              fontSize: '12px', fontWeight: 700, cursor: 'pointer', gridRow: '1', gridColumn: '2'
                            }} 
                            onClick={() => setConfirmAction({ req, action: 'approve' })}
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button 
                            style={{ 
                              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, 
                              background: '#fef2f2', color: '#dc2626', border: '1px solid #ef4444', 
                              fontSize: '12px', fontWeight: 700, cursor: 'pointer', gridRow: '2', gridColumn: '1'
                            }} 
                            onClick={() => setConfirmAction({ req, action: 'reject' })}
                          >
                            <XCircle size={14} /> Reject
                          </button>
                          <button 
                            className="btn-icon" 
                            style={{ 
                              width: 32, height: 32, borderRadius: 8, border: '1px solid #bae6fd', 
                              background: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', 
                              justifyContent: 'center', gridRow: '2', gridColumn: '2'
                            }} 
                            onClick={() => { setActiveChatId(req.requestingHospital.id); onNavigate('communication'); }}
                          >
                            <MessageSquare size={16} />
                          </button>
                        </>
                      ) : (
                        <button 
                          className="btn-icon" 
                          style={{ 
                            width: 32, height: 32, borderRadius: 8, border: '1px solid #bae6fd', 
                            background: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', 
                            justifyContent: 'center' 
                          }} 
                          onClick={() => { setActiveChatId(req.requestingHospital.id); onNavigate('communication'); }}
                        >
                          <MessageSquare size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <Modal title={`Request — ${selected.id}`} onClose={() => setSelected(null)}>
          <div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
              <MatchBadge score={selected.compatibilityScore} />
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{selected.organ} Request</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>From: {selected.requestingHospital.name}</div>
                <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                  <StatusChip status={selected.status} />
                  <UrgencyBadge urgency={selected.urgency} />
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              {[
                { l: 'Blood Group', v: selected.bloodGroup },
                { l: 'HLA Type', v: selected.hlaType },
                { l: 'Patient Age', v: selected.patientAge + ' yrs' },
                { l: 'Hospital', v: selected.requestingHospital.location },
              ].map(f => (
                <div key={f.l} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{f.l}</div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{f.v}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--warning-light)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px', marginBottom: 12, fontSize: 13, color: 'var(--warning)', lineHeight: 1.6 }}>
              <strong>Doctor Notes:</strong> {selected.doctorNotes}
            </div>
            <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '12px', marginBottom: 16, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {selected.caseSummary}
            </div>
            {(selected.status === 'pending' || selected.status === 'under_review') && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-teal" style={{ flex: 1 }} onClick={() => { setSelected(null); setConfirmAction({ req: selected, action: 'approve' }); }}><CheckCircle size={15} /> Approve</button>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => { setSelected(null); setConfirmAction({ req: selected, action: 'reject' }); }}><XCircle size={15} /> Reject</button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Confirm action */}
      {confirmAction && (
        <Modal
          title={confirmAction.action === 'approve' ? 'Final Medical Approval' : 'Reject Request'}
          onClose={() => setConfirmAction(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setConfirmAction(null)}>Cancel</button>
              <button 
                className={`btn ${confirmAction.action === 'approve' ? 'btn-teal' : 'btn-danger'}`} 
                disabled={confirmAction.action === 'approve' && !confirmAction.formData?.ready}
                onClick={() => handleAction(confirmAction.req.id, confirmAction.action, confirmAction.formData)}
              >
                {confirmAction.action === 'approve' ? 'Verify & Finalize Approval' : 'Confirm Rejection'}
              </button>
            </>
          }
        >
          {confirmAction.action === 'approve' ? (
            <div className="form">
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 16 }}>
                Please review the compatibility and confirm medical readiness for <strong>{confirmAction.req.organ}</strong> allocation to <strong>{confirmAction.req.requestingHospital.name}</strong>.
              </p>
              
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Final Compatibility Score (%)</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Original: {confirmAction.req.compatibilityScore}%</span>
                </label>
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  className="form-input" 
                  style={{ fontWeight: 600, color: 'var(--primary)' }}
                  value={confirmAction.formData?.score ?? confirmAction.req.compatibilityScore ?? 0}
                  onChange={e => setConfirmAction({ ...confirmAction, formData: { ...confirmAction.formData, score: e.target.value } })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Match Quality Confirmation</label>
                <select 
                  className="form-select" 
                  value={confirmAction.formData?.matchQuality || 'high'} 
                  onChange={e => setConfirmAction({ ...confirmAction, formData: { ...confirmAction.formData, matchQuality: e.target.value } })}
                >
                  <option value="high">High Compatibility (Confirmed)</option>
                  <option value="medium">Medium Compatibility (Requires Clinical Supervision)</option>
                  <option value="low">Marginal Match (Specialized Prep Required)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Compatibility & Extraction Summary</label>
                <textarea 
                  className="form-input" 
                  placeholder="Enter medical verification details, extraction status, or donor-recipient match specifics..." 
                  rows={3} 
                  value={confirmAction.formData?.summary || ''}
                  onChange={e => setConfirmAction({ ...confirmAction, formData: { ...confirmAction.formData, summary: e.target.value } })}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: 'var(--success-light)', padding: '10px 14px', borderRadius: 8, marginTop: 10 }}>
                <input 
                  type="checkbox" 
                  checked={confirmAction.formData?.ready || false} 
                  onChange={e => setConfirmAction({ ...confirmAction, formData: { ...confirmAction.formData, ready: e.target.checked } })}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>I confirm medical readiness and final compatibility verification.</span>
              </label>
            </div>
          ) : (
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Are you sure you want to <strong>reject</strong> the {confirmAction.req.organ} request from <strong>{confirmAction.req.requestingHospital.name}</strong>? 
              This action will notify the requesting surgical team.
            </p>
          )}
        </Modal>
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}
