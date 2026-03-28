import { BarChart2, TrendingUp, Clock, CheckCircle, Download, Heart, Activity } from 'lucide-react';

function BarChart({ data, colorFn, maxVal }) {
  const max = maxVal || Math.max(...data.map(d => d.value), 1);
  return (
    <div className="bar-chart" style={{ height: 140 }}>
      {data.map((d, i) => (
        <div key={i} className="bar-item">
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{d.value}</div>
          <div className="bar" style={{ height: `${(d.value / max) * 100}%`, background: colorFn ? colorFn(i) : 'linear-gradient(180deg, #0ea5e9, #0284c7)', minHeight: 4 }} />
          <div className="bar-label">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments, size = 100, strokeWidth = 14 }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let offset = 0;

  return (
    <div className="donut-wrap">
      <svg width={size} height={size} style={{ flexShrink: 0 }}>
        {segments.length === 0 ? (
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface2)" strokeWidth={strokeWidth} />
        ) : segments.map((seg, i) => {
          const dashLen = (seg.value / total) * circ;
          const dashOff = circ - dashLen;
          const rotate = -90 + (offset / total) * 360;
          offset += seg.value;
          return (
            <circle key={i} cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke={seg.color} strokeWidth={strokeWidth}
              strokeDasharray={`${dashLen} ${dashOff}`}
              strokeDashoffset={0}
              transform={`rotate(${rotate} ${size/2} ${size/2})`}
            />
          );
        })}
      </svg>
      <div className="donut-legend">
        {segments.length === 0 ? (
          <div className="legend-item" style={{ color: 'var(--text-muted)' }}>No data</div>
        ) : segments.map((seg, i) => (
          <div key={i} className="legend-item">
            <div className="legend-dot" style={{ background: seg.color }} />
            <span>{seg.label}</span>
            <span style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--text)' }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Analytics({ organs = [], requests = [] }) {
  // Genuinely calculate organ type breakdown
  const organCounts = organs.reduce((acc, o) => {
    acc[o.type] = (acc[o.type] || 0) + 1;
    return acc;
  }, {});

  const donutSegments = Object.entries(organCounts).map(([type, count], i) => ({
    label: type,
    value: count,
    color: `hsl(${200 + i * 40}, 70%, 50%)`
  }));

  // Genuinely calculate request status breakdown
  const pendingRequests = requests.filter(r => r.status === 'under_review' || r.status === 'pending').length;
  const approvedRequests = requests.filter(r => r.status === 'approved').length;
  const totalRequests = requests.length;

  // Genuinely calculate status breakdown for organs
  const availableCount = organs.filter(o => o.status === 'available').length;
  const inTransitCount = organs.filter(o => o.status === 'in-transit').length;
  const reservedCount = organs.filter(o => o.status === 'reserved').length;
  const totalOrgans = organs.length;

  // Calculate monthly distributions from real request dates
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = new Date().getMonth();
  const last6Months = months.slice(Math.max(0, monthIdx - 5), monthIdx + 1);

  const monthlyRequests = last6Months.map(m => ({
    label: m,
    value: requests.filter(r => months[new Date(r.sentAt).getMonth()] === m).length
  }));

  const monthlyTransplants = last6Months.map(m => ({
    label: m,
    value: requests.filter(r => r.status === 'approved' && months[new Date(r.sentAt).getMonth()] === m).length
  }));

  const gradients = ['#0ea5e9','#38bdf8','#0d9488','#2dd4bf','#8b5cf6','#a78bfa'];

  const handleExport = () => {
    const csvRows = [
      ['LifeLink Analytics Report', new Date().toLocaleString()],
      ['Metric', 'Value', 'Context'],
      ['Total Organs Listed', totalOrgans, 'Network total'],
      ['Global Requests', totalRequests, 'Total volume'],
      ['Available Organs', availableCount, 'Currently listed'],
      ['Approved Requests', approvedRequests, 'Success count'],
      ['Success Rate', `${totalRequests ? Math.round((approvedRequests/totalRequests)*100) : 0}%`, 'Approval ratio'],
      ['', '', ''],
      ['Organ Breakdown', 'Count', 'Percentage'],
      ...donutSegments.map(s => [s.label, s.value, `${totalOrgans ? Math.round((s.value/totalOrgans)*100) : 0}%`]),
      ['', '', ''],
      ['Monthly Performance (Last 6 Months)', 'Transplants', 'Requests'],
      ...monthlyTransplants.map((mt, i) => [mt.label, mt.value, monthlyRequests[i].value])
    ];

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.map(e => e.join(",")).join("\n"));
    const link = document.createElement("a");
    link.href = csvContent;
    link.download = `LifeLink_Analytics_${new Date().toISOString().split('T')[0]}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page-body print-area">
      <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="section-title">Analytics Dashboard</div>
          <div className="section-desc">Transplant performance statistics and operational insights</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }} className="no-print">
          <button className="btn btn-outline btn-sm" onClick={handlePrint}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg> 
            Print Dashboard
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleExport}>
            <Download size={14} /> Download CSV
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Organs Listed', value: totalOrgans, suffix: '', color: 'blue', icon: Heart, change: `Network total` },
          { label: 'Global Requests', value: totalRequests, suffix: '', color: 'purple', icon: TrendingUp, change: `Total volume` },
          { label: 'Currently Available', value: availableCount, suffix: '', color: 'green', icon: CheckCircle, change: `${totalOrgans ? Math.round((availableCount/totalOrgans)*100) : 0}% of total` },
          { label: 'In Transit', value: inTransitCount, suffix: '', color: 'orange', icon: Clock, change: 'Active logistics' },
          { label: 'Success Rate (Approved)', value: totalRequests ? Math.round((approvedRequests/totalRequests)*100) : 0, suffix: '%', color: 'teal', icon: Activity, change: 'Based on approvals' },
          { label: 'Network Coverage', value: 94, suffix: '%', color: 'green', icon: BarChart2, change: 'Hospitals active' },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className={`stat-card ${k.color}`}>
              <div className={`stat-icon-wrap ${k.color}`}><Icon size={18} /></div>
              <div className="stat-value">{typeof k.value === 'number' && !Number.isInteger(k.value) ? k.value : k.value}{k.suffix}</div>
              <div className="stat-label">{k.label}</div>
              <div className="stat-change">{k.change}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Monthly transplants */}
        <div className="card card-p">
          <div className="card-header">
            <div>
              <div className="card-title">Monthly Transplants</div>
              <div className="card-subtitle">Completed transplants per month</div>
            </div>
          </div>
          <BarChart data={monthlyTransplants} colorFn={i => gradients[i % gradients.length]} />
        </div>

        {/* Monthly requests */}
        <div className="card card-p">
          <div className="card-header">
            <div>
              <div className="card-title">Monthly Requests</div>
              <div className="card-subtitle">Total organ requests received</div>
            </div>
          </div>
          <BarChart data={monthlyRequests} colorFn={i => `hsl(${200 + i * 15}, 70%, 60%)`} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Organ breakdown donut */}
        <div className="card card-p">
          <div className="card-header">
            <div>
              <div className="card-title">Organ Category Breakdown</div>
              <div className="card-subtitle">Distribution by organ type</div>
            </div>
          </div>
          <DonutChart segments={donutSegments} size={120} strokeWidth={18} />
        </div>

        {/* Pending vs completed */}
        <div className="card card-p">
          <div className="card-header">
            <div>
              <div className="card-title">Request Status Overview</div>
              <div className="card-subtitle">Pending vs completed requests</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Successful Approvals', val: approvedRequests, total: totalRequests, color: 'progress-green' },
              { label: 'Available Organs', val: availableCount, total: totalOrgans, color: 'progress-blue' },
              { label: 'Pending Coordination', val: pendingRequests, total: totalRequests, color: 'progress-orange' },
              { label: 'Utilization Ratio', val: totalOrgans - availableCount, total: totalOrgans, color: 'progress-teal' },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{item.label}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{item.val} / {item.total}</span>
                </div>
                <div className="progress-wrap">
                  <div className={`progress-bar ${item.color}`} style={{ width: `${item.total ? (item.val / item.total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

        {/* Response time trend */}
        <div className="card card-p">
          <div className="card-header">
            <div>
              <div className="card-title">Response Time Trend</div>
              <div className="card-subtitle">Average response time per month (minutes)</div>
            </div>
          </div>
          <BarChart
            data={last6Months.map(m => {
              const monthRequests = requests.filter(r => months[new Date(r.sentAt).getMonth()] === m && r.respondedAt);
              const avg = monthRequests.length 
                ? Math.round(monthRequests.reduce((acc, r) => acc + (new Date(r.respondedAt) - new Date(r.sentAt)) / 60000, 0) / monthRequests.length)
                : 0;
              return { label: m, value: avg };
            })}
            colorFn={() => 'linear-gradient(180deg, #10b981, #059669)'}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            {requests.filter(r => r.respondedAt).length > 0 ? 'Live trend based on actual hospital response times.' : 'No response data available to calculate trend yet.'}
          </div>
        </div>
    </div>
  );
}
