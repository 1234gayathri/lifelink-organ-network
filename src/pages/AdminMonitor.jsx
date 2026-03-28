import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, MessageSquare, FileText, CheckCircle, Flag, Activity } from 'lucide-react';
import StatusChip from '../components/StatusChip';

export default function AdminMonitor() {
  const [data, setData] = useState({ hospitals: [], auditLogs: [], allocations: [] });
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const res = await fetch('https://lifelink-organ-network.onrender.com/api/auth/monitor', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const d = await res.json();
        if (res.ok) setData(d.data);
      } catch (err) {
        console.error('Admin Fetch Error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  if (loading) return <div className="page-body" style={{ textAlign: 'center', padding: 100 }}>Loading national monitoring data...</div>;

  return (
    <div className="page-body">
      {/* Admin banner */}
      <div className="admin-banner">
        <Shield size={28} color="#c4b5fd" />
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16 }}>National Admin Monitoring Hub</div>
          <div style={{ color: '#c4b5fd', fontSize: 13, marginTop: 3 }}>
            Real-time oversight of LifeLink coordination network. Monitoring all hospital registries and organ allocation audit trails.
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Registered Hospitals', val: data.hospitals.length, color: '#0ea5e9' },
          { label: 'Active Chat Sessions', val: 3, color: '#0d9488' },
          { label: 'System Audit Logs', val: data.auditLogs.length, color: '#ef4444' },
          { label: 'Total Allocation Logs', val: data.allocations.length, color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} className="card card-p" style={{ textAlign: 'center', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Registered hospitals */}
        <div className="card">
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={16} color="#0d9488" /> National Hospital Registry
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 300 }}>
            {data.hospitals.map(h => (
              <div key={h.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{h.hospitalName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{h.location} &bull; {h.officialEmail}</div>
                </div>
                <span className={`chip ${h.verificationStatus === 'active' ? 'chip-safe' : 'chip-warning'}`} style={{ transform: 'scale(0.8)' }}>{h.verificationStatus}</span>
              </div>
            ))}
            {data.hospitals.length === 0 && <div style={{ padding: '20px', fontSize: 13, color: 'var(--text-muted)' }}>No registered hospitals yet.</div>}
          </div>
        </div>

        {/* Monitored chats (Simulated for demo) */}
        <div className="card">
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={16} color="#0ea5e9" /> Monitored Chat Sessions
          </div>
          {[
            { id: 'CHT-001', h1: 'Apollo Medical', h2: 'AIIMS Delhi', topic: 'Liver allocation', time: '09:25 AM' },
            { id: 'CHT-002', h1: 'Fortis Memorial', h2: 'Narayana Inst.', topic: 'Off-platform coordination', flagged: true, time: '3h ago' },
          ].map(chat => (
            <div key={chat.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-light)', background: chat.flagged ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{chat.h1} &leftrightarrow; {chat.h2}</div>
                {chat.flagged && <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>FLAGGED</span>}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{chat.topic} &bull; {chat.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* System Audit logs */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={16} color="#ef4444" /> National Audit Trail (System Activity)
        </div>
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {data.auditLogs.map(log => (
            <div key={log.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: 14 }}>
               <div style={{ fontSize: 12, color: 'var(--text-muted)', width: 80 }}>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
               <div style={{ flex: 1 }}>
                 <div style={{ fontSize: 13.5, fontWeight: 600 }}>{log.action.replace(/_/g, ' ')}</div>
                 <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{log.actorRole} &bull; {log.entityType} ({log.entityId.substring(0,8)})</div>
               </div>
               <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#0ea5e9' }}>{log.ipAddress || 'Authorized'}</div>
            </div>
          ))}
          {data.auditLogs.length === 0 && <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No system activity logged in the last 24h.</div>}
        </div>
      </div>

      {/* Allocation logs */}
      <div className="card">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={16} color="#8b5cf6" /> Live Allocation Audit Trail
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Request ID</th><th>Organ</th><th>Source</th><th>Target</th><th>Urgency</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {data.allocations.map(log => (
                <tr key={log.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#8b5cf6', fontWeight: 600 }}>{log.id.substring(0,8).toUpperCase()}</td>
                  <td style={{ fontWeight: 700 }}>{log.organ?.organType}</td>
                  <td style={{ fontSize: 12 }}>{log.sourceHospital?.hospitalName?.split(' ')[0]}</td>
                  <td style={{ fontSize: 12 }}>{log.requestingHospital?.hospitalName?.split(' ')[0]}</td>
                  <td><span className={`urgency-${log.urgencyLevel}`}>{log.urgencyLevel}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(log.requestedAt).toLocaleDateString()}</td>
                  <td><StatusChip status={log.status} /></td>
                </tr>
              ))}
              {data.allocations.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>No allocation records found in the audit trail.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
