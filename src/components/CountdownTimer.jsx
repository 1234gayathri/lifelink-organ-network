import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

function getRemainingMs(extractedAt, maxStorageHours) {
  const extracted = new Date(extractedAt).getTime();
  const expiry = extracted + maxStorageHours * 3600000;
  return expiry - Date.now();
}

function formatDuration(ms) {
  if (ms <= 0) return { h: 0, m: 0, s: 0, label: '00:00:00' };
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  const label = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return { h, m, s, label };
}

export default function CountdownTimer({ extractedAt, maxStorageHours, compact }) {
  const [remaining, setRemaining] = useState(() => getRemainingMs(extractedAt, maxStorageHours));

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(getRemainingMs(extractedAt, maxStorageHours));
    }, 1000);
    return () => clearInterval(id);
  }, [extractedAt, maxStorageHours]);

  const { label } = formatDuration(remaining);
  const totalMs = maxStorageHours * 3600000;
  const pct = Math.max(0, Math.min(100, (remaining / totalMs) * 100));
  const isExpired = remaining <= 0;
  const isCritical = !isExpired && pct <= 15;
  const isWarning = !isExpired && pct > 15 && pct <= 35;

  const color = isExpired ? '#9ca3af' : isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
  const barClass = isExpired ? 'progress-bar' : isCritical ? 'progress-bar progress-red' : isWarning ? 'progress-bar progress-orange' : 'progress-bar progress-green';

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {isCritical && <AlertTriangle size={13} color="#ef4444" />}
        <Clock size={13} color={color} />
        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '13px', color }}>{isExpired ? 'EXPIRED' : label}</span>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isCritical && <AlertTriangle size={14} color="#ef4444" />}
          <Clock size={14} color={color} />
          <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '16px', color }}>{isExpired ? 'EXPIRED' : label}</span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pct.toFixed(0)}% remaining</span>
      </div>
      <div className="progress-wrap">
        <div className={barClass} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
