import { useState, useEffect } from 'react';
import { Heart, Activity, CheckCircle, Clock, Bell, Search, RefreshCw, Inbox, AlertCircle, Truck, TrendingUp, TrendingDown } from 'lucide-react';
import CountdownTimer from '../components/CountdownTimer';
import StatusChip from '../components/StatusChip';


function AnimatedCounter({ target, duration = 1500 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(id); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);
  return <span>{count.toLocaleString()}</span>;
}

// RECENT_ACTIVITY will be calculated dynamically within the component now


export default function Dashboard({ onNavigate, organs = [], requests = [], user = {}, stats = { totalOrgans: 0, totalHospitals: 1, activeAlerts: 0 } }) {
  const expiringOrgans = (organs || []).filter(o => o.status === 'expiring' || o.status === 'critical').slice(0, 3);
  const myOrgans = (organs || []).filter(o => o.sourceHospital?.id === user.id);
  const myRequests = (requests || []).filter(r => r.type === 'Incoming');
  
  // Dynamic Activity Feed
  const RECENT_ACTIVITY = [
    ...(organs || []).filter(o => o.sourceHospital?.id === user.id).map(o => ({
      label: `Listed new ${o.type}`,
      time: new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      done: true
    })),
    ...(requests || []).filter(r => r.type === 'Incoming').map(r => ({
      label: `Received ${r.organ} request`,
      time: new Date(r.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      active: r.status === 'sent'
    }))
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

  // Dynamic KPIs
  const avgCompatibility = (requests || []).length 
    ? Math.round((requests || []).reduce((acc, r) => acc + (r.compatibilityScore || 0), 0) / (requests || []).length) 
    : 0;
  
  const approvalRate = (requests || []).length 
    ? Math.round(((requests || []).filter(r => r.status === 'approved').length / (requests || []).length) * 100) 
    : 0;
  
  const avgResponseTime = (requests || []).filter(r => r.respondedAt).length
    ? Math.round((requests || []).filter(r => r.respondedAt).reduce((acc, r) => acc + (new Date(r.respondedAt) - new Date(r.sentAt)) / 60000, 0) / requests.filter(r => r.respondedAt).length)
    : 0;

  return (
    <div className="page-body">
      {/* Welcome banner */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a, #0c4a6e)', borderRadius: 16, padding: '24px 32px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='20' cy='20' r='8'/%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>Welcome back,</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{user.name || 'Hospital'}</div>
          <div style={{ color: '#64748b', fontSize: 13 }}>{user.id || '—'} &bull; {user.location || ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 24, position: 'relative', zIndex: 1 }}>
          {[{ val: myOrgans.length, label: 'Your Listings', suffix: '' }, { val: stats.totalOrgans, label: 'Global Network Inventory', suffix: '' }].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#38bdf8' }}>
                <AnimatedCounter target={s.val} />{s.suffix}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stat grid */}
      <div className="stat-grid">
        {[
          { label: 'Network Inventory', value: stats.totalOrgans, change: 'Active organs', color: 'teal', icon: Heart, up: null },
          { label: 'Incoming Requests', value: myRequests.length, change: 'To action', color: 'orange', icon: Activity, up: null },
          { label: 'Expiring Organs', value: expiringOrgans.length, change: expiringOrgans.length > 0 ? 'Urgent Action' : 'All clear', color: 'red', icon: Clock, up: false },
          { label: 'Network Alerts', value: stats.activeAlerts, change: 'In last 24h', color: stats.activeAlerts > 0 ? 'red' : 'purple', icon: Bell, up: null },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className={`stat-icon-wrap ${s.color}`}><Icon size={20} /></div>
              <div className="stat-value"><AnimatedCounter target={s.value} /></div>
              <div className="stat-label">{s.label}</div>
              <div className={`stat-change${s.up === false ? ' down' : ''}`}>
                {s.up === true ? <TrendingUp size={11} style={{ display: 'inline' }} /> : s.up === false ? <TrendingDown size={11} style={{ display: 'inline' }} /> : null}
                {' '}{s.change}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="card card-p" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Quick Actions</div>
            <div className="card-subtitle">Common tasks for organ coordination</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {[
            { label: 'Search Organ', icon: Search, color: '#0ea5e9', bg: '#e0f2fe', page: 'search' },
            { label: 'Update Availability', icon: RefreshCw, color: '#0d9488', bg: '#ccfbf1', page: 'availability' },
            { label: 'Incoming Requests', icon: Inbox, color: '#8b5cf6', bg: '#ede9fe', page: 'incoming' },
            { label: 'Send Alert', icon: AlertCircle, color: '#ef4444', bg: '#fee2e2', page: 'alerts' },
            { label: 'Track Transport', icon: Truck, color: '#f59e0b', bg: '#fef3c7', page: 'transport' },
          ].map(action => {
            const Icon = action.icon;
            return (
              <button key={action.label} onClick={() => onNavigate(action.page)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
                onMouseOver={e => { e.currentTarget.style.background = action.bg; e.currentTarget.style.borderColor = action.color; }}
                onMouseOut={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <div style={{ width: 44, height: 44, background: action.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color={action.color} />
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', textAlign: 'center' }}>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Expiring organs countdown */}
        <div className="card card-p">
          <div className="card-header">
            <div>
              <div className="card-title">Expiring Organs</div>
              <div className="card-subtitle">Organs requiring urgent attention</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('timeout')}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {expiringOrgans.length > 0 ? expiringOrgans.map(org => (
              <div key={org.id} style={{ padding: '14px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{org.type}</div>
                  <StatusChip status={org.status} expiry={org.expiryTime} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{org.bloodGroup} &bull; {org.hlaType} &bull; {org.sourceHospital?.name?.split(' ')?.slice(0,2)?.join(' ') || 'Hospital'}</div>
                <CountdownTimer extractedAt={org.extractedAt} maxStorageMinutes={org.maxStorageMinutes} />
              </div>
            )) : (
              <div className="empty-state" style={{ padding: '30px 20px' }}>
                <CheckCircle size={28} color="#10b981" />
                <p style={{ marginTop: 8, fontSize: 13 }}>No organs expiring soon</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card card-p">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Activity</div>
              <div className="card-subtitle">Latest events on your account</div>
            </div>
          </div>
          <div className="timeline">
            {RECENT_ACTIVITY.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)' }}>
                No recent activity to show.
              </div>
            ) : RECENT_ACTIVITY.map((item, i) => (
              <div key={i} className="timeline-item">
                <div className={`timeline-dot${item.done ? ' done' : item.active ? ' active' : ' pending'}`} />
                <div className="timeline-label">{item.label}</div>
                <div className="timeline-time">{item.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Incoming requests summary */}
      <div className="card card-p">
        <div className="card-header">
          <div>
            <div className="card-title">Incoming Requests</div>
            <div className="card-subtitle">Requests requiring your response</div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => onNavigate('incoming')}>View All</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Organ</th>
                <th>Requesting Hospital</th>
                <th>Urgency</th>
                <th>Match</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {myRequests.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)' }}>
                    No incoming requests at this time.
                  </td>
                </tr>
              ) : myRequests.slice(0, 3).map(req => (
                <tr key={req.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#0ea5e9', fontWeight: 600 }}>{req.id}</td>
                  <td style={{ fontWeight: 600 }}>{req.organ}</td>
                  <td style={{ fontSize: 12.5 }}>{req.requestingHospital?.name?.split(' ')?.slice(0, 2)?.join(' ') || 'Hospital'}</td>
                  <td><span className={`urgency-${req.urgency}`}>{req.urgency.charAt(0).toUpperCase() + req.urgency.slice(1)}</span></td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: 13, color: req.compatibilityScore >= 90 ? '#059669' : req.compatibilityScore >= 75 ? '#0284c7' : '#f59e0b' }}>
                      {req.compatibilityScore}%
                    </span>
                  </td>
                  <td><StatusChip status={req.status} /></td>
                  <td>
                    <button className="btn btn-primary btn-xs" onClick={() => onNavigate('incoming')}>Review</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mini analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 20 }}>
        {[
          { label: 'Matching Efficiency', value: `${avgCompatibility}%`, sub: 'Avg compatibility score', color: '#0ea5e9' },
          { label: 'Approval Rate', value: `${approvalRate}%`, sub: 'Requests approved', color: '#10b981' },
          { label: 'Avg Response Time', value: `${avgResponseTime}m`, sub: 'Per request', color: '#f59e0b' },
        ].map(k => (
          <div key={k.label} className="card card-p" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontFamily: 'Syne, sans-serif', fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>{k.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{k.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
