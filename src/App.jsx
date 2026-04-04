import { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { ORGANS, NOTIFICATIONS, REQUESTS, TRANSPORT_RECORDS } from './data/mockData';
import { API_BASE_URL } from './config';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import OrganSearch from './pages/OrganSearch';
import Requests from './pages/Requests';
import IncomingRequests from './pages/IncomingRequests';
import Communication from './pages/Communication';
import UpdateAvailability from './pages/UpdateAvailability';
import TimeoutTracking from './pages/TimeoutTracking';
import Alerts from './pages/Alerts';
import Notifications from './pages/Notifications';
import TransportTracking from './pages/TransportTracking';
import Certificates from './pages/Certificates';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import AdminMonitor from './pages/AdminMonitor';
import ResetPassword from './pages/ResetPassword';

const PAGE_META = {
    dashboard: { title: 'Dashboard', subtitle: 'Welcome back, Apollo Medical Systems' },
    search: { title: 'Organ Search', subtitle: 'Find compatible organs across the network' },
    requests: { title: 'My Requests', subtitle: 'Track sent organ requests' },
    incoming: { title: 'Incoming Requests', subtitle: 'Review and respond to requests' },
    communication: { title: 'Communication', subtitle: 'Chat and email with other hospitals' },
    availability: { title: 'Update Availability', subtitle: 'List newly available organs' },
    timeout: { title: 'Timeout Tracking', subtitle: 'Monitor organ survival times' },
    alerts: { title: 'Organ Alerts', subtitle: 'Broadcast urgent needs to the network' },
    notifications: { title: 'Notifications', subtitle: 'All your system notifications' },
    transport: { title: 'Transport Tracking', subtitle: 'Live organ transport status' },
    certificates: { title: 'Donor Certificates', subtitle: 'Digital donation certificates' },
    analytics: { title: 'Analytics', subtitle: 'Performance statistics and insights' },
    profile: { title: 'Hospital Profile', subtitle: 'Manage settings and preferences' },
    admin: { title: 'Admin Monitor', subtitle: 'System-wide monitoring dashboard' },
};

const PAGE_COMPONENTS = {
    dashboard: Dashboard,
    search: OrganSearch,
    requests: Requests,
    incoming: IncomingRequests,
    communication: Communication,
    availability: UpdateAvailability,
    timeout: TimeoutTracking,
    alerts: Alerts,
    notifications: Notifications,
    transport: TransportTracking,
    certificates: Certificates,
    analytics: Analytics,
    profile: Profile,
    admin: AdminMonitor,
};

export default function App() {
    const [page, setPage] = useState(() => {
        const path = window.location.pathname;
        if (path.startsWith('/reset-password/')) {
            return 'reset-password';
        }
        const savedPage = localStorage.getItem('currentPage');
        const token = localStorage.getItem('token');
        if (token && savedPage) return savedPage;
        return 'landing';
    });
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        const path = window.location.pathname;
        if (path.startsWith('/reset-password/')) {
            localStorage.removeItem('token');
            localStorage.removeItem('currentPage');
            return false;
        }
        return !!localStorage.getItem('token');
    });
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth < 768);
    const [stats, setStats] = useState({ totalOrgans: 0, totalHospitals: 1, activeAlerts: 0 });
    const [currentUser, setCurrentUser] = useState({ id: 'HOSP-001', name: 'Apollo Medical Systems' });
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('darkMode') === 'true';
    });
    const [organs, setOrgans] = useState(ORGANS);
    const [requests, setRequests] = useState(REQUESTS);
    const [transportRecords, setTransportRecords] = useState(TRANSPORT_RECORDS);
    const [certificates, setCertificates] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [unreadChats, setUnreadChats] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const responses = await Promise.all([
                    fetch(`${API_BASE_URL}/notifications`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_BASE_URL}/transports/my`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_BASE_URL}/certificates/my`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_BASE_URL}/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_BASE_URL}/organs`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_BASE_URL}/organs/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_BASE_URL}/requests/incoming`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_BASE_URL}/requests/outgoing`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_BASE_URL}/alerts`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_BASE_URL}/chat/unread-count`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (responses.some(r => r.status === 401)) {
                    handleLogout();
                    return;
                }

                const [notifRes, transRes, certRes, meRes, organsRes, statsRes, incReqRes, outReqRes, alertsRes, chatRes] = responses;

                if (chatRes && chatRes.ok) {
                    const chatData = await chatRes.json();
                    setUnreadChats(chatData.data.unreadCount || 0);
                }

                if (notifRes.ok) {
                    const notifData = await notifRes.json();
                    if (notifData.status === 'success' && notifData.data?.notifications) {
                        setNotifications(notifData.data.notifications.map(n => ({ ...n, read: n.isRead, time: n.createdAt })));
                    }
                }

                if (meRes.ok) {
                    const meData = await meRes.json();
                    if (meData.status === 'success' && meData.data?.user) {
                        setCurrentUser({
                            id: meData.data.user.id,
                            readableId: meData.data.user.hospitalId,
                            name: meData.data.user.hospitalName,
                            location: meData.data.user.location || 'Unknown Location'
                        });
                    }
                }

                if (organsRes.ok) {
                    const organsData = await organsRes.json();
                    if (organsData.status === 'success') {
                        setOrgans((organsData.data?.organs || []).map(o => ({
                            ...o,
                            id_full: o.id,
                            id: (o.id || '').split('-')[0] + '-' + ((o.id || '').split('-')[1] || '0000').substring(0, 4).toUpperCase(),
                            type: o.organType || 'Unknown',
                            extractedAt: o.extractionTime,
                            bloodGroup: o.bloodGroup || 'N/A',
                            hlaType: o.hlaType || 'N/A',
                            donorAge: o.donorAge || 0,
                            donorGender: o.donorGender || 'N/A',
                            status: o.status || 'available',
                            sourceHospital: {
                                id: o.sourceHospitalId,
                                name: o.sourceHospital?.hospitalName || 'Network Hospital',
                                location: o.sourceHospital?.location || 'Unknown Location',
                            }
                        })));
                    }
                }

                const transportedRequestIds = new Set();
                if (transRes.ok) {
                    const transData = await transRes.json();
                    if (transData.status === 'success' && transData.data?.transports) {
                        transData.data.transports.forEach(t => {
                            if (t.requestId) transportedRequestIds.add(t.requestId);
                        });
                        setTransportRecords(transData.data.transports.map(t => ({
                            ...t,
                            organ: t.organ?.organType || 'Unknown',
                            hospital: t.destination?.hospitalName || 'Target Hospital',
                            sourceHospital: {
                                name: t.source?.hospitalName || 'Origin Hospital',
                                location: t.source?.location || 'Origin City'
                            },
                            destHospital: {
                                name: t.destination?.hospitalName || 'Destination Hospital',
                                location: t.destination?.location || 'Destination City'
                            },
                            checkpoints: (t.checkpoints && t.checkpoints.length > 0) ? t.checkpoints : [
                                { label: 'Dispatch from Source Hospital', time: t.departureTime || t.createdAt || new Date().toISOString(), done: t.status !== 'pending' },
                                { label: 'In Transit via Medical Corridor', time: new Date(new Date(t.createdAt).getTime() + 1800000).toISOString(), done: false },
                                { label: 'Approaching Destination City', time: new Date(new Date(t.createdAt).getTime() + 5400000).toISOString(), done: false },
                                { label: 'Delivered to Surgical Team', time: new Date(new Date(t.createdAt).getTime() + 7200000).toISOString(), done: false }
                            ],
                            distance: t.totalDistanceKm || 100,
                            distanceCovered: Math.max(0, Math.min(t.totalDistanceKm || 0, (t.totalDistanceKm || 0) - (t.remainingDistanceKm || 0))),
                            startedAt: (t.status === 'pending' || !t.departureTime) ? null : t.departureTime,
                            eta: t.estimatedArrivalTime,
                            vehicleType: t.vehicleType || 'Medical Courier',
                            pilot: t.pilotName || 'Assigned Pilot',
                            emergencyContact: t.emergencyContact || 'N/A',
                            organCondition: t.organConditionStatus || 'Stable'
                        })));
                    }
                }

                if (certRes.ok) {
                    const certData = await certRes.json();
                    if (certData.status === 'success' && certData.data?.certificates) {
                        setCertificates(certData.data.certificates.map(c => ({
                            ...c,
                            hospitalName: c.source?.hospitalName || 'Source Hospital',
                            donationDate: c.issuedAt,
                            certificateDate: c.issuedAt,
                            issuedBy: c.source?.contactPerson || 'Transplant Surgeon',
                            registrationNo: c.certificateNumber
                        })));
                    }
                }

                if (alertsRes.ok) {
                    const aData = await alertsRes.json();
                    if (aData.status === 'success') setAlerts(aData.data.alerts);
                }

                if (statsRes.ok) {
                    const sData = await statsRes.json();
                    if (sData.status === 'success') setStats(sData.data);
                }

                let allRequests = [];
                if (incReqRes.ok) {
                    const incData = await incReqRes.json();
                    if (incData.status === 'success' && incData.data?.requests) {
                        allRequests = [...allRequests, ...incData.data.requests.map(r => {
                            let derivedStatus = ((r.status === 'sent' || r.status === 'pending' || r.status === 'under_review') && (r.organ?.status === 'expired' || r.organ?.status === 'allocated' || r.organ?.status === 'completed')) ? 'unavailable' : r.status;
                            if (derivedStatus === 'approved' && transportedRequestIds.has(r.id)) derivedStatus = 'in_transit';
                            return {
                                ...r,
                                id: r.id,
                                displayId: (r.id || '').split('-')[0] + '-' + ((r.id || '').split('-')[1] || '0000').substring(0, 4).toUpperCase(),
                                organ: r.organ?.organType || 'Unknown Organ',
                                status: derivedStatus,
                                requestingHospital: {
                                    id: r.requestingHospital?.id,
                                    name: r.requestingHospital?.hospitalName || 'Network Hospital',
                                    location: r.requestingHospital?.location || 'Unknown'
                                },
                                compatibilityScore: r.compatibilityScore || (Math.floor(Math.random() * 30) + 70),
                                patientAge: r.patientAge || 0,
                                bloodGroup: r.patientBloodGroup || 'N/A',
                                hlaType: r.patientHlaType || 'N/A',
                                urgency: r.urgencyLevel || 'medium',
                                sentAt: r.requestedAt || new Date().toISOString(),
                                type: 'Incoming'
                            };
                        })];
                    }
                }

                if (outReqRes.ok) {
                    const outData = await outReqRes.json();
                    if (outData.status === 'success' && outData.data?.requests) {
                        allRequests = [...allRequests, ...outData.data.requests.map(r => {
                            let derivedStatus = ((r.status === 'sent' || r.status === 'pending' || r.status === 'under_review') && (r.organ?.status === 'expired' || r.organ?.status === 'allocated' || r.organ?.status === 'completed')) ? 'unavailable' : r.status;
                            if (derivedStatus === 'approved' && transportedRequestIds.has(r.id)) derivedStatus = 'in_transit';
                            return {
                                ...r,
                                id: r.id,
                                displayId: (r.id || '').split('-')[0] + '-' + ((r.id || '').split('-')[1] || '0000').substring(0, 4).toUpperCase(),
                                organ: r.organ?.organType || 'Unknown Organ',
                                status: derivedStatus,
                                targetHospital: {
                                    id: r.sourceHospital?.id,
                                    name: r.sourceHospital?.hospitalName || 'Network Hospital',
                                    location: r.sourceHospital?.location || 'Unknown'
                                },
                                compatibilityScore: r.compatibilityScore || (Math.floor(Math.random() * 30) + 70),
                                patientAge: r.patientAge || 0,
                                bloodGroup: r.patientBloodGroup || 'N/A',
                                hlaType: r.patientHlaType || 'N/A',
                                urgency: r.urgencyLevel || 'medium',
                                sentAt: r.requestedAt || new Date().toISOString(),
                                type: 'Outgoing'
                            };
                        })];
                    }
                }
                setRequests(allRequests);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        let interval;
        if (isLoggedIn) {
            fetchData();
            interval = setInterval(fetchData, 15000); // Poll every 15 seconds
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isLoggedIn]);

    const addNotification = async (notif) => {
        // For now, keep local addition for UI snappiness, 
        // but in a real app, you'd POST to backend and fetch
        const newNotif = {
            id: 'NOTIF-' + Date.now(),
            time: new Date().toISOString(),
            read: false,
            priority: 'medium',
            ...notif
        };
        setNotifications(prev => [newNotif, ...prev]);
    };

    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [darkMode]);

    const toggleDarkMode = () => {
        setDarkMode(prev => {
            const next = !prev;
            localStorage.setItem('darkMode', next);
            return next;
        });
    };

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
        } catch (e) {
            // Ignore errors - always log out locally
        }
        localStorage.removeItem('token');
        localStorage.removeItem('currentPage');
        setIsLoggedIn(false);
        setPage('landing');
    };

    const navigate = (dest) => {
        if (dest === 'landing') {
            handleLogout();
            return;
        }
        localStorage.setItem('currentPage', dest);
        setPage(dest);
    };

    const handleLogin = () => {
        setIsLoggedIn(true);
        setPage('dashboard');
        localStorage.setItem('currentPage', 'dashboard');
    };

    // Always allow password reset regardless of login state (clears old sessions)
    if (page === 'reset-password') {
        return <ResetPassword onNavigate={navigate} />;
    }

    // Public pages
    if (!isLoggedIn) {
        if (page === 'login') return <Login onNavigate={navigate} onLogin={handleLogin} />;
        if (page === 'signup') return <Signup onNavigate={navigate} />;
        return <Landing onNavigate={navigate} />;
    }

    const meta = PAGE_META[page] || PAGE_META.dashboard;
    const PageComponent = PAGE_COMPONENTS[page] || Dashboard;

    return (
        <div className={`app-shell${darkMode ? ' dark-mode' : ''}`}>
            <Sidebar
                currentPage={page}
                onNavigate={navigate}
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(function (p) { return !p; })}
                requests={requests}
                notifications={notifications}
                organs={organs}
                user={currentUser}
                unreadChats={unreadChats}
            />

            <div className={'main-content' + (sidebarCollapsed ? ' sidebar-collapsed' : '')}>
                <Navbar
                    title={meta.title}
                    subtitle={meta.subtitle}
                    onNotifications={() => navigate('notifications')}
                    onToggleSidebar={() => setSidebarCollapsed(function (p) { return !p; })}
                    darkMode={darkMode}
                    onToggleDark={toggleDarkMode}
                    notifications={notifications}
                    user={currentUser}
                />

                <main style={{ flex: 1, overflowY: 'auto' }}>
                    <PageComponent
                        onNavigate={navigate}
                        organs={organs}
                        setOrgans={setOrgans}
                        requests={requests}
                        setRequests={setRequests}
                        transportRecords={transportRecords}
                        setTransportRecords={setTransportRecords}
                        certificates={certificates}
                        setCertificates={setCertificates}
                        alerts={alerts}
                        setAlerts={setAlerts}
                        user={currentUser}
                        notifications={notifications}
                        setNotifications={setNotifications}
                        addNotification={addNotification}
                        stats={stats}
                        activeChatId={activeChatId}
                        setActiveChatId={setActiveChatId}
                    />
                </main>
            </div>

            <button className="float-help" title="Help and Support" aria-label="Open help">
                <HelpCircle size={22} />
            </button>
        </div>
    );
}