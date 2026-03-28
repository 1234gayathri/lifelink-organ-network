import { useState } from 'react';
import { Bell, CheckCircle, XCircle, Clock, Truck, Award, AlertCircle, Heart, Check, CheckCheck } from 'lucide-react';
import { NOTIFICATIONS } from '../data/mockData';

const TYPE_CONFIG = {
  new_request: { icon: Heart, bg: '#e0f2fe', color: '#0284c7', label: 'New Request' },
  approval: { icon: CheckCircle, bg: '#d1fae5', color: '#059669', label: 'Approval' },
  rejection: { icon: XCircle, bg: '#fee2e2', color: '#dc2626', label: 'Rejection' },
  organ_expiring: { icon: Clock, bg: '#fef3c7', color: '#b45309', label: 'Expiring' },
  alert_response: { icon: AlertCircle, bg: '#fef3c7', color: '#b45309', label: 'Alert' },
  transport_update: { icon: Truck, bg: '#ede9fe', color: '#7c3aed', label: 'Transport' },
  certificate: { icon: Award, bg: '#d1fae5', color: '#059669', label: 'Certificate' },
};

const PRIORITY_BADGE = {
  critical: 'chip chip-critical',
  high: 'chip chip-warning',
  medium: 'chip chip-info',
  low: 'chip chip-gray',
};

function groupByDate(notifs) {
  const now = new Date();
  const today = [], yesterday = [], older = [];
  notifs.forEach(n => {
    const d = new Date(n.time);
    const diff = now - d;
    if (diff < 86400000 && d.getDate() === now.getDate()) today.push(n);
    else if (diff < 172800000) yesterday.push(n);
    else older.push(n);
  });
  const groups = [];
  if (today.length) groups.push({ label: 'Today', items: today });
  if (yesterday.length) groups.push({ label: 'Yesterday', items: yesterday });
  if (older.length) groups.push({ label: 'Earlier', items: older });
  return groups;
}

export default function Notifications({ notifications: notifs = [], setNotifications: setNotifs }) {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? notifs : filter === 'unread' ? notifs.filter(n => !n.read) : notifs.filter(n => n.type === filter);

  const markAllRead = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/notifications/read-all', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setNotifs(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const markRead = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      }
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const groups = groupByDate(filtered);
  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div className="page-body">
      <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="section-title">Notifications Center</div>
          <div className="section-desc">{unreadCount > 0 ? `${unreadCount} unread notifications` : 'All notifications read'}</div>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
            <CheckCheck size={14} /> Mark All Read
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[{ k: 'all', l: 'All' }, { k: 'unread', l: 'Unread' }, { k: 'new_request', l: 'Requests' }, { k: 'approval', l: 'Approvals' }, { k: 'organ_expiring', l: 'Expiring' }, { k: 'transport_update', l: 'Transport' }].map(t => (
          <button key={t.k} className={`tab-btn${filter === t.k ? ' active' : ''}`} style={{ padding: '6px 14px', borderRadius: 999, fontSize: 12, background: filter === t.k ? 'var(--accent)' : 'var(--surface)', color: filter === t.k ? '#fff' : 'var(--text-muted)', border: `1px solid ${filter === t.k ? 'var(--accent)' : 'var(--border)'}` }}
            onClick={() => setFilter(t.k)}>
            {t.l}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-icon"><Bell size={28} /></div><div className="empty-title">No notifications</div><div className="empty-desc">No notifications match the current filter.</div></div></div>
      ) : (
        <div className="card">
          {groups.map((group, gi) => (
            <div key={group.label}>
              <div style={{ padding: '10px 20px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', borderTop: gi > 0 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{group.label}</span>
              </div>
              {group.items.map(notif => {
                const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.new_request;
                const Icon = cfg.icon;
                return (
                  <div key={notif.id} className={`notif-item${notif.read ? '' : ' unread'}`} onClick={() => markRead(notif.id)}>
                    <div style={{ width: 40, height: 40, background: cfg.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={18} color={cfg.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
                        <span style={{ fontWeight: notif.read ? 500 : 700, fontSize: 13.5, flex: 1 }}>{notif.title}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
                          <span className={PRIORITY_BADGE[notif.priority]}>{notif.priority}</span>
                          {!notif.read && <div style={{ width: 8, height: 8, background: '#0ea5e9', borderRadius: '50%' }} />}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 4 }}>{notif.message}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{new Date(notif.time).toLocaleString()}</div>
                        {!notif.read && (
                          <button 
                            className="btn btn-ghost btn-xs" 
                            style={{ padding: '2px 8px', height: 24, fontSize: 10, borderColor: 'var(--accent)', color: 'var(--accent)' }}
                            onClick={(e) => { e.stopPropagation(); markRead(notif.id); }}
                          >
                            <Check size={12} /> Mark as Read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
