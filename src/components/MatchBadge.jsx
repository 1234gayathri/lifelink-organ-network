export default function MatchBadge({ score, size }) {
  const cls = score >= 90 ? 'match-excellent' : score >= 75 ? 'match-good' : score >= 55 ? 'match-fair' : 'match-poor';
  const label = score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 55 ? 'Fair' : 'Poor';

  if (size === 'sm') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
        background: score >= 90 ? '#d1fae5' : score >= 75 ? '#e0f2fe' : score >= 55 ? '#fef3c7' : '#fee2e2',
        color: score >= 90 ? '#059669' : score >= 75 ? '#0284c7' : score >= 55 ? '#b45309' : '#dc2626',
      }}>
        {score}% {label}
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div className={`match-badge ${cls}`}>{score}%</div>
      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
    </div>
  );
}
