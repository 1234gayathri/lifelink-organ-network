import React from 'react';

const InstitutionalHeader = () => {
  return (
    <div style={{
      width: '100%',
      backgroundColor: '#ffffff',
      padding: '12px 40px',
      borderBottom: '3px solid #1e3a8a',
      display: 'flex',
      alignItems: 'center',
      gap: '30px',
      zIndex: 1000,
      position: 'relative',
      boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
    }}>
      {/* Logos & Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <img 
          src="https://gvpcdpgc.edu.in/wp-content/themes/gvp/images/logo.png" 
          alt="GVP LOGO" 
          style={{ height: '90px', width: 'auto' }}
          onError={(e) => { e.target.src = 'https://via.placeholder.com/90?text=GVP+LOGO'; }} 
        />
      </div>

      <div style={{ flex: 1 }}>
        <h1 style={{ 
          margin: 0, 
          color: '#243a73', 
          fontSize: '32px', 
          fontWeight: '900', 
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          lineHeight: '1.1',
          fontFamily: "'Times New Roman', Times, serif"
        }}>
          GAYATRI VIDYA PARISHAD
        </h1>
        <h2 style={{ 
          margin: '2px 0 6px 0', 
          color: '#243a73', 
          fontSize: '28px', 
          fontWeight: '800', 
          textTransform: 'uppercase',
          lineHeight: '1.1',
          fontFamily: "'Times New Roman', Times, serif"
        }}>
          COLLEGE FOR DEGREE AND PG COURSES(A)
        </h2>
        <div style={{ 
          color: '#cc3333', 
          fontSize: '14.5px', 
          fontWeight: '700', 
          lineHeight: '1.4'
        }}>
          (Affiliated to Andhra University | Reaccredited by NAAC | ISO 9001:2015)
        </div>
        <div style={{ 
          color: '#cc3333', 
          fontSize: '14.5px', 
          fontWeight: '700',
          lineHeight: '1.4'
        }}>
          (PG-MBA and UG Engineering B.Tech (CE,CSE,ECE and ME) programs are Accredited by NBA)
        </div>
        <div style={{ 
          color: '#000', 
          fontSize: '16px', 
          fontWeight: '800', 
          marginTop: '4px',
          fontFamily: "'Times New Roman', Times, serif"
        }}>
          Visakhapatnam-530045.
        </div>
      </div>
    </div>
  );
};

export default InstitutionalHeader;
