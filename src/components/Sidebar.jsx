import { Heart, LayoutDashboard, Search, FileText, MessageSquare, Inbox, RefreshCw, Timer, Bell, Truck, Award, BarChart2, Settings, Shield, AlertCircle, Menu, X, ChevronRight } from 'lucide-react';

const NAV_ITEMS = (badges = {}) => [
  { section: 'Main', items: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'search', label: 'Organ Search', icon: Search },
    { key: 'requests', label: 'My Requests', icon: FileText, badge: badges.outgoing },
    { key: 'incoming', label: 'Incoming Requests', icon: Inbox, badge: badges.incoming },
  ]},
  { section: 'Organ Management', items: [
    { key: 'availability', label: 'Update Availability', icon: RefreshCw },
    { key: 'timeout', label: 'Timeout Tracking', icon: Timer, badge: badges.expiring },
    { key: 'alerts', label: 'Organ Alerts', icon: AlertCircle },
  ]},
  { section: 'Communication', items: [
    { key: 'communication', label: 'Communication', icon: MessageSquare, badge: badges.messages },
    { key: 'notifications', label: 'Notifications', icon: Bell, badge: badges.unreadNotifs },
  ]},
  { section: 'Operations', items: [
    { key: 'transport', label: 'Transport Tracking', icon: Truck },
    { key: 'certificates', label: 'Donor Certificates', icon: Award },
    { key: 'analytics', label: 'Analytics', icon: BarChart2 },
  ]},
  { section: 'System', items: [
    { key: 'profile', label: 'Hospital Profile', icon: Settings },
    { key: 'admin', label: 'Admin Monitor', icon: Shield },
  ]},
];

export default function Sidebar({ currentPage, onNavigate, collapsed, onToggle, requests = [], notifications = [], organs = [], user = {}, unreadChats = 0 }) {
  const badges = {
    incoming: (requests || []).filter(r => r.type === 'Incoming' && (r.status === 'pending' || r.status === 'sent')).length,
    outgoing: (requests || []).filter(r => r.type === 'Outgoing' && (r.status === 'pending' || r.status === 'sent')).length,
    expiring: (organs || []).filter(o => o.status === 'expiring' || o.status === 'critical').length,
    unreadNotifs: (notifications || []).filter(n => !n.read).length,
    messages: unreadChats
  };

  const navItems = NAV_ITEMS(badges);

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Heart size={18} color="#fff" />
        </div>
        {!collapsed && (
          <div className="sidebar-logo-text">
            <div className="sidebar-logo-title">LifeLink</div>
            <div className="sidebar-logo-sub">Hospital Network</div>
          </div>
        )}
        <button
          onClick={onToggle}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex' }}
        >
          {collapsed ? <ChevronRight size={16} /> : <X size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section} style={{ marginBottom: '8px' }}>
            {!collapsed && <div className="sidebar-section-label">{section.section}</div>}
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  className={`nav-item${currentPage === item.key ? ' active' : ''}`}
                  onClick={() => onNavigate(item.key)}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={17} className="nav-icon" />
                  {!collapsed && <span className="nav-label">{item.label}</span>}
                  {!collapsed && item.badge > 0 && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className="nav-item"
          onClick={() => onNavigate('landing')}
          title={collapsed ? 'Logout' : undefined}
          style={{ color: '#ef4444' }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {!collapsed && <span className="nav-label">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
