import { useState } from 'react';
import { Award, Download, Printer, Shield, CheckCircle, Heart } from 'lucide-react';

export default function Certificates({ user = {}, certificates = [] }) {
  const [selected, setSelected] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [donorName, setDonorName] = useState('');

  const handleSelect = (cert) => {
    setSelected(cert);
    setDonorName(cert.organ?.donorName || '');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = (cert) => {
    setDownloading(true);
    
    const generatePdf = () => {
      try {
        const element = document.getElementById('certificate-print-area');
        const originalBorder = element.style.border;
        element.style.border = 'none';
        element.style.boxShadow = 'none';
        
        const opt = {
          margin:       8,
          filename:     `LifeLink_Certificate_${cert.id}.pdf`,
          image:        { type: 'jpeg', quality: 1.0 },
          html2canvas:  { scale: 2, useCORS: true, logging: false },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' },
          pagebreak:    { mode: 'avoid-all' }
        };

        // Scale the element down to prevent page breaks
        element.style.transform = 'scale(0.85)';
        element.style.transformOrigin = 'top center';

        window.html2pdf().set(opt).from(element).save().then(() => {
          element.style.border = originalBorder;
          element.style.boxShadow = '';
          element.style.transform = '';
          setDownloading(false);
        }).catch(err => {
          console.error('PDF generation error:', err);
          element.style.border = originalBorder;
          element.style.transform = '';
          setDownloading(false);
        });
      } catch (err) {
        console.error('Error initiating PDF:', err);
        setDownloading(false);
      }
    };
    
    if (window.html2pdf) {
      generatePdf();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = generatePdf;
      script.onerror = () => {
        alert('Failed to load PDF library. Please check your internet connection or use the Print function instead.');
        setDownloading(false);
      };
      document.body.appendChild(script);
    }
  };

  return (
    <div className="page-body">
      <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="section-title">Donor Certificates</div>
          <div className="section-desc">Official digital certificates for organ donations coordinated through LifeLink</div>
        </div>
      </div>

      {selected ? (
        <div>
          {/* Actions */}
          <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20, alignItems: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>Back to List</button>
            <div style={{ flex: 1 }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Issue To:</span>
              <input 
                type="text" 
                className="form-input" 
                style={{ width: 220, padding: '6px 10px', fontSize: 13 }} 
                placeholder="Enter Donor Full Name..." 
                value={donorName}
                onChange={e => setDonorName(e.target.value)}
              />
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => handleDownload(selected)} disabled={downloading}>
              {downloading ? 'Preparing PDF...' : <><Download size={14} /> Download PDF</>}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handlePrint}><Printer size={14} /> Print</button>
          </div>

          {/* Certificate preview */}
          <div className="certificate" id="certificate-print-area">
            <div className="cert-corner tl" />
            <div className="cert-corner tr" />
            <div className="cert-corner bl" />
            <div className="cert-corner br" />

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Heart size={24} color="#fff" />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: '#0f172a' }}>LifeLink</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Organ Coordination Network</div>
                </div>
              </div>

              <div style={{ borderTop: '2px solid #d4a84b', borderBottom: '2px solid #d4a84b', padding: '14px 0', margin: '0 20px' }}>
                <div style={{ fontSize: 11, letterSpacing: '0.2em', color: '#b45309', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Certificate of</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: '#0f172a', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{(selected.organType || 'ORGAN').toUpperCase()} DONATION</div>
              </div>
            </div>

            {/* Body */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <p style={{ fontSize: 13.5, color: '#b45309', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                In profound gratitude and deepest appreciation, we honor:
              </p>
              <h2 style={{ fontSize: 28, color: '#0f172a', fontFamily: 'Syne, sans-serif', fontWeight: 800, margin: '0 0 20px 0' }}>
                {donorName || "……………………………"}
              </h2>
              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.9, marginBottom: 28 }}>
                This is to certify that the organ donation listed herein was coordinated and processed through the <strong>LifeLink Organ Coordination Network</strong>. Your heroic and selfless contribution has given the ultimate gift of life, and for this, humanity remains forever grateful.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24, textAlign: 'left' }}>
                {[
                  { label: 'Organ Donated', value: selected.organType },
                  { label: 'Donating Hospital', value: selected.hospitalName },
                  { label: 'Date of Donation', value: new Date(selected.donationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
                  { label: 'Certificate Date', value: new Date(selected.certificateDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
                  { label: 'Certificate ID', value: selected.id },
                  { label: 'NOTTO Reg. No.', value: selected.registrationNo },
                ].map(f => (
                  <div key={f.label} style={{ borderBottom: '1px solid #e2d9b3', paddingBottom: 10 }}>
                    <div style={{ fontSize: 11, color: '#b45309', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{f.label}</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Signature */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, paddingTop: 20, borderTop: '1px solid #e2d9b3' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: 48, borderBottom: '1px solid #0f172a', marginBottom: 6 }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{selected.issuedBy}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{selected.hospitalName}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: 48, borderBottom: '1px solid #0f172a', marginBottom: 6, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 4 }}>
                  <Shield size={24} color="#0ea5e9" />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>LifeLink Administrator</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Verified Digital Signature</div>
              </div>
            </div>

            {/* Footer strip */}
            <div style={{ marginTop: 24, background: 'linear-gradient(135deg, #0f172a, #0c4a6e)', borderRadius: 8, padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: 11 }}>NOTTO Compliant &bull; Digitally Verified &bull; Tamper-Proof</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={13} color="#10b981" />
                <span style={{ color: '#10b981', fontSize: 11, fontWeight: 600 }}>Authenticated</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {certificates.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1/-1' }}>
              <Award size={40} color="#d4a84b" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>No Certificates Yet</div>
              <div style={{ fontSize: 13 }}>Certificates will appear here once organ donations are completed and verified.</div>
            </div>
          ) : certificates.map(cert => (
            <div key={cert.id} className="card card-p" style={{ cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border)' }}
              onClick={() => handleSelect(cert)}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = '#d4a84b'; }}
              onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #fef3c7, #fde68a)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #d4a84b' }}>
                  <Award size={22} color="#b45309" />
                </div>
                <span style={{ background: '#d1fae5', color: '#059669', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 999 }}>Issued</span>
              </div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{cert.organType} Donation</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>{cert.hospitalName}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                {[{ l: 'Date', v: new Date(cert.donationDate).toLocaleDateString() }, { l: 'Cert ID', v: cert.id.split('-').pop() }].map(f => (
                  <div key={f.l} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '6px 10px', fontSize: 12 }}>
                    <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>{f.l}</div>
                    <div style={{ fontWeight: 700 }}>{f.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-xs" onClick={e => { e.stopPropagation(); handleSelect(cert); }}>View Certificate</button>
                <button className="btn btn-ghost btn-xs" onClick={e => { e.stopPropagation(); handleDownload(cert); }} title="Quick Download"><Download size={12} /></button>
                <button className="btn btn-ghost btn-xs" onClick={e => { e.stopPropagation(); handleSelect(cert); setTimeout(handlePrint, 50); }} title="Quick Print"><Printer size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`
        @media print {
          .sidebar, .navbar, .no-print, .section-header, .float-help { display: none !important; }
          .main-content { margin: 0 !important; padding: 0 !important; background: white !important; }
          .page-body { padding: 0 !important; margin: 0 !important; }
          .certificate { 
            box-shadow: none !important; 
            border: 2px solid #d4a84b !important; 
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 800px !important;
          }
          body { background: white !important; -webkit-print-color-adjust: exact; }
          .cert-corner { border-color: #d4a84b !important; }
        }
      `}</style>
    </div>
  );
}
