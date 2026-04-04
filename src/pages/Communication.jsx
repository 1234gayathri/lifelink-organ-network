import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Mail, Send, Paperclip, Shield, Search, CheckCheck, X, User, AlertCircle, Loader } from 'lucide-react';
import { API_BASE_URL } from '../config';

const API = API_BASE_URL;

export default function Communication({ user, activeChatId, setActiveChatId }) {
  const [tab, setTab] = useState('chat');
  const [hospitals, setHospitals] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeHospitalId, setActiveHospitalId] = useState(activeChatId || null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [composeForm, setComposeForm] = useState({ targetId: '', subject: '', message: '' });
  const [sentMails, setSentMails] = useState([]);
  
  const token = localStorage.getItem('token');
  const msgEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle cross-page chat activation
  useEffect(() => {
    if (activeChatId) {
      setActiveHospitalId(activeChatId);
      // Optional: Clear after opening to allow navigation away
    }
  }, [activeChatId]);

  // Fetch conversations and hospitals
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [hRes, cRes] = await Promise.all([
          fetch(`${API}/hospitals`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API}/chat/conversations`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        const hData = await hRes.json();
        const cData = await cRes.json();
        
        if (hRes.ok) setHospitals(hData.data.hospitals);
        if (cRes.ok) setConversations(cData.data.conversations);
      } catch (err) {
        console.error('Fetch init error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [token]);

  // Load messages for active chat
  useEffect(() => {
    if (!activeHospitalId) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API}/chat/${activeHospitalId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setMessages(data.data.messages);
      } catch (err) {
        console.error('Fetch messages error:', err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll for messages every 5s
    return () => clearInterval(interval);
  }, [activeHospitalId, token]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeHospitalId) return;

    setSending(true);
    try {
      const res = await fetch(`${API}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetHospitalId: activeHospitalId, content: newMessage })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.data.message]);
        setNewMessage('');
        
        // Refresh conversations to update sidebar last message
        const cRes = await fetch(`${API}/chat/conversations`, { headers: { 'Authorization': `Bearer ${token}` } });
        const cData = await cRes.json();
        if (cRes.ok) setConversations(cData.data.conversations);
      } else {
        const errData = await res.json();
        alert('Failed to send message: ' + (errData.message || 'Server error'));
      }
    } catch (err) {
      console.error('Send message error:', err);
      alert('Network error. Check your connection.');
    } finally {
      setSending(false);
    }
  };

  const handleSendEmail = async () => {
    if (!composeForm.targetId || !composeForm.subject || !composeForm.message) {
      alert('Please fill all fields');
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${API}/hospitals/communicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hospitalId: composeForm.targetId,
          subject: composeForm.subject,
          message: composeForm.message
        })
      });
      if (res.ok) {
        const target = hospitals.find(h => h.id === composeForm.targetId);
        setSentMails(prev => [{
            id: Date.now(),
            to: target?.hospitalName,
            subject: composeForm.subject,
            sentAt: new Date().toISOString()
        }, ...prev]);
        setShowCompose(false);
        setComposeForm({ targetId: '', subject: '', message: '' });
        alert('Email sent successfully!');
      } else {
        alert('Failed to send email');
      }
    } catch (err) {
      alert('Network error. Check your connection.');
    } finally {
      setSending(false);
    }
  };

  const activeHospital = hospitals.find(h => h.id === activeHospitalId);

  return (
    <div className="page-body">
      <div className="section-header">
        <div className="section-title">Communication Hub</div>
        <div className="section-desc">Secure P2P communication for surgical coordination</div>
      </div>

      <div className="tabs" style={{ marginBottom: 20 }}>
        <button className={`tab-btn${tab === 'chat' ? ' active' : ''}`} onClick={() => setTab('chat')}>
          <MessageSquare size={14} style={{ display: 'inline', marginRight: 6 }} /> Private Chat
        </button>
        <button className={`tab-btn${tab === 'email' ? ' active' : ''}`} onClick={() => setTab('email')}>
          <Mail size={14} style={{ display: 'inline', marginRight: 6 }} /> Email Notifications
        </button>
      </div>

      {tab === 'chat' ? (
        <div className="card" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', height: 620, overflow: 'hidden' }}>
          {/* Sidebar */}
          <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input has-icon-left" style={{ fontSize: 13, padding: '7px 14px 7px 32px' }} placeholder="Search network..." />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '10px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Conversations</div>
              {loading ? (
                 <div style={{ textAlign: 'center', padding: 20 }}><Loader size={20} className="spin" /></div>
              ) : conversations.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No active threads. Start a new chat below.</div>
              ) : (
                conversations.map(c => (
                  <div key={c.id} 
                    onClick={() => setActiveHospitalId(c.otherHospital.id)}
                    className={`chat-item${activeHospitalId === c.otherHospital.id ? ' active' : ''}`}
                    style={{ padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, background: 'var(--surface2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: 'var(--accent)' }}>
                      {c.otherHospital.hospitalName.substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{c.otherHospital.hospitalName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {c.lastMessage?.content || 'No messages yet'}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              <div style={{ padding: '16px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderTop: '1px solid var(--border)', marginTop: 10 }}>All Hospitals</div>
              {hospitals.filter(h => h.id !== user.id).map(h => (
                <div key={h.id} 
                  onClick={() => setActiveHospitalId(h.id)}
                  className={`chat-item${activeHospitalId === h.id ? ' active' : ''}`}
                  style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 32, height: 32, background: 'var(--surface2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11 }}>
                    {h.hospitalName.substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{h.hospitalName}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Window */}
          <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface2)' }}>
            {activeHospitalId ? (
              <>
                <div style={{ padding: '16px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, background: 'var(--accent-light)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--accent)' }}>
                    {activeHospital?.hospitalName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{activeHospital?.hospitalName}</div>
                    <div style={{ fontSize: 12, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} /> Connected
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {messages.map(m => {
                    const isMe = m.senderId === user.id;
                    return (
                      <div key={m.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                        <div style={{ 
                          padding: '10px 14px', 
                          borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: isMe ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' : 'var(--surface)',
                          color: isMe ? '#fff' : 'var(--text)',
                          fontSize: 13.5,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                          lineHeight: 1.5
                        }}>
                          {m.content}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, textAlign: isMe ? 'right' : 'left' }}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isMe && m.isRead && <span style={{ marginLeft: 6, color: '#10b981' }}><CheckCheck size={12} style={{ display: 'inline' }} /></span>}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={msgEndRef} />
                </div>

                <div style={{ padding: '16px 20px', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
                  <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 10 }}>
                    <input 
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      className="form-input" 
                      placeholder={`Message ${activeHospital?.hospitalName}...`} 
                      style={{ border: 'none', background: 'var(--surface2)', borderRadius: 12 }}
                    />
                    <button type="submit" className="btn btn-primary" disabled={!newMessage.trim() || sending} style={{ borderRadius: 12, width: 44, height: 44, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 16 }}>
                <div style={{ width: 80, height: 80, background: 'var(--surface)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={32} opacity={0.3} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 16 }}>Your Medical Chat Hub</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>Select a hospital to coordinate organ transplants privately.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Sent Email Notifications</div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCompose(true)}>
              <Mail size={14} /> Compose Official Email
            </button>
          </div>
          {sentMails.length === 0 ? (
            <div style={{ padding: '100px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              <Mail size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <div>Your sent emails will appear here.</div>
              <p style={{ fontSize: 12, marginTop: 8 }}>Send urgent coordination messages directly to hospital inboxes.</p>
            </div>
          ) : (
            <div style={{ padding: 10 }}>
              {sentMails.map(mail => (
                <div key={mail.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{mail.subject}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>To: {mail.to}</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(mail.sentAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: 500, maxWidth: '90%', animation: 'slideUp 0.3s ease-out' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontFamily: 'Syne, sans-serif' }}>Compose Official Email</div>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowCompose(false)} />
            </div>
            <div className="card-p">
              <div className="form-group">
                <label className="form-label">Recipient Hospital</label>
                <select className="form-select" value={composeForm.targetId} onChange={e => setComposeForm({...composeForm, targetId: e.target.value})}>
                  <option value="">Select hospital...</option>
                  {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospitalName} ({h.location})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input className="form-input" placeholder="e.g. Urgent Coordination for Kidney O+" value={composeForm.subject} onChange={e => setComposeForm({...composeForm, subject: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Message Content</label>
                <textarea className="form-textarea" rows={6} placeholder="Type your formal message here..." value={composeForm.message} onChange={e => setComposeForm({...composeForm, message: e.target.value})} style={{ resize: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowCompose(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSendEmail} disabled={sending}>
                  {sending ? 'Sending...' : <><Send size={15} /> Send Official Email</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .chat-item:hover { background: var(--surface2); }
        .chat-item.active { background: rgba(14, 165, 233, 0.1); border-left: 3px solid #0ea5e9; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
