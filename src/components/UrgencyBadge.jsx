export default function UrgencyBadge({ urgency }) {
  const cls = urgency === 'critical' ? 'urgency-critical' : urgency === 'high' ? 'urgency-high' : urgency === 'medium' ? 'urgency-medium' : 'urgency-low';
  const label = urgency ? urgency.charAt(0).toUpperCase() + urgency.slice(1) : 'N/A';
  return <span className={cls}>{label}</span>;
}
