import { useState, useEffect } from 'react';
import { Timer, AlertTriangle, Clock, Filter } from 'lucide-react';
import CountdownTimer from '../components/CountdownTimer';
import StatusChip from '../components/StatusChip';


function getTimeStatus(extractedAt, maxStorageMinutes, now) {
  if (!extractedAt) return 'safe';
  const finalMaxMinutes = maxStorageMinutes || 0;
  const extracted = new Date(extractedAt).getTime();
  if (isNaN(extracted)) return 'safe';
  
  const expiry = extracted + finalMaxMinutes * 60000;
  const remaining = expiry - now;
  const totalMs = finalMaxMinutes * 60000 || 1; 
  const pct = (remaining / totalMs) * 100;
  
  if (remaining <= 0) return 'expired';
  if (pct <= 15) return 'critical';
  if (pct <= 35) return 'expiring';
  return 'safe';
}

export default function TimeoutTracking({ organs = [] }) {
  const [sortBy, setSortBy] = useState('remaining');
  const [filter, setFilter] = useState('all');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000 * 30);
    return () => clearInterval(id);
  }, []);

  const organsWithStatus = organs.map(o => ({
    ...o,
    timeStatus: getTimeStatus(o.extractedAt, o.maxStorageMinutes, now),
  }));

  const filtered = filter === 'all' ? organsWithStatus : organsWithStatus.filter(o => o.timeStatus === filter);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'remaining') {
      const aExt = (a.extractedAt && !isNaN(new Date(a.extractedAt).getTime())) ? new Date(a.extractedAt).getTime() : now;
      const bExt = (b.extractedAt && !isNaN(new Date(b.extractedAt).getTime())) ? new Date(b.extractedAt).getTime() : now;
      const aRem = aExt + (a.maxStorageMinutes || 0) * 60000 - now;
      const bRem = bExt + (b.maxStorageMinutes || 0) * 60000 - now;
      return aRem - bRem;
    }
    return (a.type || '').localeCompare(b.type || '');
  });

  const counts = {
    safe: organsWithStatus.filter(o => o.timeStatus === 'safe').length,
    expiring: organsWithStatus.filter(o => o.timeStatus === 'expiring').length,
    critical: organsWithStatus.filter(o => o.timeStatus === 'critical').length,
    expired: organsWithStatus.filter(o => o.timeStatus === 'expired').length,
  };

  const statusColors = {
    safe: { bg: '#dcfce7', border: '#bbf7d0', text: '#166534', label: 'Safe' },
    expiring: { bg: '#fef3c7', border: '#fde68a', text: '#92400e', label: 'Expiring Soon' },
    critical: { bg: '#fee2e2', border: '#fecaca', text: '#991b1b', label: 'Critical' },
    expired: { bg: '#f3f4f6', border: '#e5e7eb', text: '#4b5563', label: 'Expired' },
  };

  return (
    <div className="page-body">
      <div className="section-header">
        <div className="section-title">Organ Timeout Tracking</div>
        <div className="section-desc">Monitor survival time and storage life for all available organs</div>
      </div>

      {/* Summary stat cards */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        {Object.entries(counts).map(([status, count]) => {
          const cfg = statusColors[status];
          return (
            <div key={status} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12, padding: '16px 20px', cursor: 'pointer' }} onClick={() => setFilter(status)}>
              <div style={{ fontSize: 28, fontFamily: 'Syne, sans-serif', fontWeight: 800, color: cfg.text }}>{count}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: cfg.text, marginTop: 4 }}>{cfg.label}</div>
            </div>
          );
        })}
      </div>

      {/* Critical alert banner */}
      {counts.critical > 0 && (
        <div style={{ background: 'linear-gradient(135deg, #fee2e2, #fecaca)', border: '1px solid #f87171', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={20} color="#b91c1c" />
          <div>
            <div style={{ fontWeight: 700, color: '#b91c1c', fontSize: 14 }}>Critical Organs Require Immediate Action</div>
            <div style={{ fontSize: 13, color: '#7f1d1d', marginTop: 2 }}>
              {counts.critical} organ(s) have less than 15% storage time remaining. Urgent allocation needed.
            </div>
          </div>
        </div>
      )}

      {/* Filter & sort bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <div className="tabs">
          {[{ k: 'all', l: 'All' }, { k: 'critical', l: 'Critical' }, { k: 'expiring', l: 'Expiring' }, { k: 'safe', l: 'Safe' }, { k: 'expired', l: 'Expired' }].map(t => (
            <button key={t.k} className={`tab-btn${filter === t.k ? ' active' : ''}`} onClick={() => setFilter(t.k)}>{t.l}</button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={14} color="var(--text-muted)" />
          <select className="form-select" style={{ width: 'auto', fontSize: 12 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="remaining">Sort by: Remaining Time</option>
            <option value="type">Sort by: Organ Type</option>
          </select>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-icon"><Timer size={28} /></div><div className="empty-title">No organs in this category</div></div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {sorted.map(organ => {
            const cfg = statusColors[organ.timeStatus] || statusColors.safe;
            return (
              <div key={organ.id} className="card" style={{ border: `1px solid ${cfg.border}`, overflow: 'hidden' }}>
                {/* Color top bar */}
                <div style={{ height: 4, background: organ.timeStatus === 'critical' ? '#ef4444' : organ.timeStatus === 'expiring' ? '#f59e0b' : organ.timeStatus === 'expired' ? '#9ca3af' : '#10b981' }} />
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, marginBottom: 3 }}>{organ.type}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{organ.id} &bull; {organ.bloodGroup} &bull; {organ.donorGender}, {organ.donorAge}y</div>
                    </div>
                    <div>
                      <span style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 5 }}>
                        {organ.timeStatus === 'critical' && <AlertTriangle size={11} />}
                        {cfg.label}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                    <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Extracted</div>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{new Date(organ.extractedAt).toLocaleString()}</div>
                    </div>
                      <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 12px' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Max Minutes</div>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{organ.maxStorageMinutes}</div>
                      </div>
                    </div>

                    <CountdownTimer extractedAt={organ.extractedAt} maxStorageMinutes={organ.maxStorageMinutes || (24 * 60)} />

                  <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--text-muted)' }}>
                    {organ.sourceHospital?.name || 'Network Hospital'} &bull; {organ.sourceHospital?.location || 'Unknown Location'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
