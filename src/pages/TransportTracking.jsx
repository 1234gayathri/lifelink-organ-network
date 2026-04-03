import { useState, useEffect } from 'react';
import { Truck, MapPin, Clock, Zap, Phone, CheckCircle, Circle, Navigation, AlertCircle, PlayCircle, Edit3 } from 'lucide-react';
import Modal from '../components/Modal';

export default function TransportTracking({ transportRecords = [], setTransportRecords, user }) {
  const [elapsed, setElapsed] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ vehicleType: '', pilot: '', emergencyContact: '', organCondition: '', totalDistance: 0 });
  const record = transportRecords[0];
  const canEdit = record && user && record.sourceHospitalId === user.id;

  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!record) return <div className="page-body">No active transport records.</div>;

  const handleEditOpen = () => {
    setEditForm({
      vehicleType: record.vehicleType || '',
      pilot: record.pilot || '',
      emergencyContact: record.emergencyContact || '',
      organCondition: record.organCondition || '',
      totalDistance: record.distance || 0
    });
    setEditMode(true);
  };

  const handleUpdateDetails = async () => {
    // Basic validation
    if (!editForm.vehicleType || !editForm.pilot || !editForm.emergencyContact || !editForm.organCondition) {
      alert('All fields are required.');
      return;
    }

    const newTotalDist = Number(editForm.totalDistance);
    if (isNaN(newTotalDist) || newTotalDist <= 0) {
      alert('Please enter a valid total distance greater than 0.');
      return;
    }

    if (newTotalDist < (record.distanceCovered || 0)) {
      alert(`Total distance cannot be less than the distance already covered (${record.distanceCovered} km).`);
      return;
    }

    // Basic phone validation (10+ digits)
    const phoneCleaner = editForm.emergencyContact.replace(/\D/g, '');
    if (phoneCleaner.length < 10) {
      alert('Please enter a valid emergency contact number (at least 10 digits).');
      return;
    }

    try {
      const res = await fetch(`https://lifelink-organ-network.onrender.com/api/transports/${record.id}/checkpoint`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          vehicleType: editForm.vehicleType,
          pilotName: editForm.pilot,
          emergencyContact: editForm.emergencyContact,
          organConditionStatus: editForm.organCondition,
          totalDistanceKm: newTotalDist
        })
      });

      if (res.ok) {
        setTransportRecords(prev => {
          const nextRecords = [...prev];
          const r = { ...nextRecords[0] };
          r.vehicleType = editForm.vehicleType;
          r.pilot = editForm.pilot;
          r.emergencyContact = editForm.emergencyContact;
          r.organCondition = editForm.organCondition;
          r.distance = newTotalDist;
          nextRecords[0] = r;
          return nextRecords;
        });
        setEditMode(false);
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Failed to update transport details.');
      }
    } catch (err) {
      console.error('Update details error:', err);
      alert('A network error occurred while updating transport details.');
    }
  };

  const handleUpdateCheckpoint = async () => {
    const nextIdx = record.checkpoints.findIndex(cp => !cp.done);
    if (nextIdx === -1) return;

    const newCheckpoints = [...record.checkpoints];
    newCheckpoints[nextIdx] = { 
      ...newCheckpoints[nextIdx], 
      done: true, 
      time: new Date().toISOString() 
    };

    const allDone = newCheckpoints.every(cp => cp.done);

    try {
      const res = await fetch(`https://lifelink-organ-network.onrender.com/api/transports/${record.id}/checkpoint`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ checkpoints: newCheckpoints })
      });

      if (res.ok) {
        const data = await res.json();
        setTransportRecords(prev => {
          const nextRecords = [...prev];
          const r = { ...nextRecords[0] };
          r.checkpoints = newCheckpoints;

          if (data.data?.deliveryCompleted || allDone) {
            // Delivery complete — fill bar and update status
            r.distanceCovered = r.distance;
            r.status = 'delivered';
          } else {
            const totalSteps = newCheckpoints.length;
            r.distanceCovered = Math.min(r.distance, Math.round(((nextIdx + 1) / totalSteps) * r.distance));
          }

          nextRecords[0] = r;
          return nextRecords;
        });
      }
    } catch (err) {
      console.error('Update checkpoint error:', err);
    }
  };

  const startTs = record.startedAt ? new Date(record.startedAt).getTime() : Date.now();
  const totalElapsed = Math.max(0, Math.floor((Date.now() - startTs) / 1000));
  const h = Math.floor(totalElapsed / 3600);
  const m = Math.floor((totalElapsed % 3600) / 60);
  const s = totalElapsed % 60;
  const elapsedStr = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

  const eta = record.eta ? new Date(record.eta) : null;
  const etaMin = eta ? Math.max(0, Math.round((eta.getTime() - Date.now()) / 60000)) : 0;

  const pct = record.distance > 0 ? Math.min(100, Math.max(0, (record.distanceCovered / record.distance) * 100)) : 0;

  return (
    <div className="page-body">
      <div className="section-header">
        <div className="section-title">Transport Tracking</div>
        <div className="section-desc">Real-time organ transport status and GPS tracking</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        {/* Map */}
        <div className="map-placeholder" style={{ height: 400, borderRadius: 16 }}>
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, width: '100%' }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Origin</div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{record.sourceHospital?.name || 'Origin Hospital'}</div>
                <div style={{ color: '#64748b', fontSize: 12 }}>{record.sourceHospital?.location || 'Origin City'}</div>
              </div>
              <div style={{ flex: 1, margin: '0 20px', position: 'relative' }}>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 999, position: 'relative' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: 999, transition: 'width 0.3s' }} />
                  <div style={{ position: 'absolute', top: '50%', left: `${pct}%`, transform: 'translate(-50%, -50%)' }}>
                    <div style={{ width: 32, height: 32, background: '#0ea5e9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff', boxShadow: '0 0 20px rgba(14,165,233,0.5)', animation: 'pulse 2s infinite' }}>
                      <Truck size={14} color="#fff" />
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Destination</div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{record.destHospital?.name || 'Destination Hospital'}</div>
                <div style={{ color: '#64748b', fontSize: 12 }}>{record.destHospital?.location || 'Destination City'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 32, justifyContent: 'center' }}>
              {[
                { label: 'Distance Covered', val: `${record.distanceCovered} km` },
                { label: 'Total Distance', val: `${record.distance} km` },
                { label: 'ETA', val: `${etaMin} min` },
                { label: 'Elapsed', val: elapsedStr },
              ].map(stat => (
                <div key={stat.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#38bdf8' }}>{stat.val}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 10, padding: '10px 16px', display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
              <Navigation size={14} color="#38bdf8" />
              <span style={{ fontSize: 13, color: '#94a3b8' }}>Live GPS tracking via Medical Aerial Corridor 7</span>
            </div>
          </div>
        </div>

        {/* Details panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status card */}
          <div className="card card-p">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Transport Status</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {canEdit && (
                  <button className="btn-icon" onClick={handleEditOpen} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)' }} title="Edit Transport Details"><Edit3 size={13} color="var(--text-muted)" /></button>
                )}
                {record.status === 'delivered' ? (
                  <span className="chip chip-success"><span className="chip-dot" />Delivered</span>
                ) : record.status === 'pending' ? (
                  <span className="chip chip-warning"><span className="chip-dot" />Pending Dispatch</span>
                ) : (
                  <span className="chip chip-info"><span className="chip-dot" />In Transit</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Organ', val: record.organ },
                { label: 'Vehicle', val: record.vehicleType },
                { label: 'Pilot / Driver', val: record.pilot },
                { label: 'Organ Condition', val: record.organCondition },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{f.label}</span>
                  <span style={{ fontWeight: 600 }}>{f.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="card card-p">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Journey Progress</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>{record.distanceCovered} km covered</span>
              <span style={{ color: 'var(--text-muted)' }}>{record.distance - record.distanceCovered} km remaining</span>
            </div>
            <div className="progress-wrap" style={{ height: 10 }}>
              <div className="progress-bar progress-teal" style={{ width: `${pct}%` }} />
            </div>
            <div style={{ textAlign: 'center', marginTop: 8, fontSize: 13, fontWeight: 600, color: '#0d9488' }}>{pct.toFixed(0)}% Complete</div>
          </div>

          {/* Emergency contact */}
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <AlertCircle size={15} color="#b91c1c" />
              <span style={{ fontWeight: 700, fontSize: 13, color: '#b91c1c' }}>Emergency Contact</span>
            </div>
            <div style={{ fontSize: 13, color: '#7f1d1d' }}>Transport Coordinator</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800, color: '#b91c1c', marginTop: 4 }}>
              {record.emergencyContact}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="card card-p" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Transport Timeline</div>
          {canEdit && (
            <button 
              className="btn btn-primary btn-sm" 
              onClick={handleUpdateCheckpoint}
              disabled={record.checkpoints.every(cp => cp.done)}
            >
              <PlayCircle size={14} /> Update Next Checkpoint
            </button>
          )}
        </div>
        <div className="timeline">
          {record.checkpoints.map((cp, i) => (
            <div key={i} className="timeline-item">
              <div className={`timeline-dot${cp.done ? ' done' : i === record.checkpoints.findIndex(c => !c.done) ? ' active' : ' pending'}`} />
              <div className="timeline-label">{cp.label}</div>
              <div className="timeline-time">{new Date(cp.time).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Details Modal */}
      {editMode && (
        <Modal title="Update Transport Details" onClose={() => setEditMode(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 13 }}>Vehicle Type</label>
              <input type="text" className="form-input" placeholder="e.g., Medical Helicopter, Ground Ambulance" value={editForm.vehicleType} onChange={e => setEditForm(f => ({ ...f, vehicleType: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 13 }}>Pilot / Driver Name & ID</label>
              <input type="text" className="form-input" placeholder="e.g., Capt. Rajesh / DL-9928" value={editForm.pilot} onChange={e => setEditForm(f => ({ ...f, pilot: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 13 }}>Primary Emergency Contact</label>
              <input type="text" className="form-input" placeholder="e.g., +91 98765 43210 (Dr. Smith)" value={editForm.emergencyContact} onChange={e => setEditForm(f => ({ ...f, emergencyContact: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label className="form-label" style={{ fontSize: 13 }}>Organ Condition Status</label>
              <input type="text" className="form-input" placeholder="e.g., Stable, Maintained at 4°C" value={editForm.organCondition} onChange={e => setEditForm(f => ({ ...f, organCondition: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label className="form-label" style={{ fontSize: 13 }}>Total Transit Distance (km)</label>
              <input type="number" className="form-input" placeholder="e.g., 250" value={editForm.totalDistance} onChange={e => setEditForm(f => ({ ...f, totalDistance: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={handleUpdateDetails}>Save Details</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(false)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      <style>{`@keyframes pulse { 0%,100%{box-shadow: 0 0 0 0 rgba(14,165,233,0.7)} 70%{box-shadow: 0 0 0 10px rgba(14,165,233,0)} }`}</style>
    </div>
  );
}
