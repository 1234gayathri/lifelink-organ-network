import { Bell, Sun, Moon, Menu } from 'lucide-react';

export default function Navbar({ title, subtitle, onNotifications, onToggleSidebar, darkMode, onToggleDark, notifications = [], user = {} }) {
  const unreadCount = notifications.filter(n => !n.read).length;
  const name = user.name || 'Hospital';
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('');

  return (
    <header className="navbar">
      <button className="icon-btn" onClick={onToggleSidebar} title="Toggle sidebar">
        <Menu size={18} />
      </button>

      <div className="navbar-title" style={{ flex: 1 }}>
        {title}
        {subtitle && <span className="navbar-subtitle">{subtitle}</span>}
      </div>

      <div className="navbar-actions">
        <button className="icon-btn" onClick={onToggleDark} title="Toggle dark mode">
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <button className="icon-btn" onClick={onNotifications} title="Notifications" style={{ position: 'relative' }}>
          <Bell size={17} />
          {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '8px', paddingLeft: '12px', borderLeft: '1px solid var(--border)' }}>
          <div className="avatar">{initials}</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{name.split(' ').slice(0, 2).join(' ')}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.id || '—'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
