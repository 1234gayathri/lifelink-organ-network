export default function StatusChip({ status }) {
  const map = {
    available: { bg: '#dcfce7', color: '#166534', dot: '#22c55e', label: 'Available' },
    critical: { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444', label: 'Critical' },
    expiring: { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b', label: 'Expiring' },
    expired: { bg: '#f3f4f6', color: '#4b5563', dot: '#9ca3af', label: 'Expired' },
    pending: { bg: '#e0f2fe', color: '#075985', dot: '#0ea5e9', label: 'Pending' },
    under_review: { bg: '#fff7ed', color: '#9a3412', dot: '#f97316', label: 'Under Review' },
    approved: { bg: '#dcfce7', color: '#166534', dot: '#22c55e', label: 'Approved' },
    rejected: { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444', label: 'Rejected' },
    in_transit: { bg: '#f0f9ff', color: '#075985', dot: '#0ea5e9', label: 'In Transit' },
    delivered: { bg: '#ecfdf5', color: '#065f46', dot: '#10b981', label: 'Delivered' },
    completed: { bg: '#ecfdf5', color: '#065f46', dot: '#10b981', label: 'Completed' },
    active: { bg: '#dcfce7', color: '#166534', dot: '#22c55e', label: 'Active' },
    inactive: { bg: '#f3f4f6', color: '#4b5563', dot: '#9ca3af', label: 'Inactive' },
    unavailable: { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444', label: 'Organ Unavailable' },
  };

  const cfg = map[status] || { bg: '#f3f4f6', color: '#4b5563', dot: '#9ca3af', label: status };
  return (
    <span style={{ 
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', 
      borderRadius: '999px', background: cfg.bg, color: cfg.color, 
      fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap'
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}
