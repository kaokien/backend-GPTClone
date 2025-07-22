import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header style={{ backgroundColor: '#282c34', padding: '20px', color: 'white', textAlign: 'center' }}>
        <h1>🌉 Creator Content Bridge</h1>
        <p>B2B SaaS tool for migrating social media content to owned platforms</p>
      </header>
      
      <main style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px', 
          marginBottom: '40px' 
        }}>
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#2563eb', marginBottom: '10px' }}>156</h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Total Content</p>
          </div>
          
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#059669', marginBottom: '10px' }}>89</h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Synced</p>
          </div>
          
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#dc2626', marginBottom: '10px' }}>12</h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Processing</p>
          </div>
          
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#7c3aed', marginBottom: '10px' }}>3</h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Platforms</p>
          </div>
        </div>
        
        <div style={{ 
          background: 'white', 
          padding: '40px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>
            Welcome to Creator Content Bridge
          </h2>
          <p style={{ color: '#6b7280', fontSize: '18px', marginBottom: '30px' }}>
            Your complete solution for migrating social media content to owned platforms
          </p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '20px',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <div>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔗</div>
              <h4 style={{ color: '#1f2937' }}>Connect Platforms</h4>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>Instagram & TikTok integration</p>
            </div>
            
            <div>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>📥</div>
              <h4 style={{ color: '#1f2937' }}>Import Content</h4>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>Extract videos & metadata</p>
            </div>
            
            <div>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>✏️</div>
              <h4 style={{ color: '#1f2937' }}>Edit & Stage</h4>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>Optimize for SEO</p>
            </div>
            
            <div>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🚀</div>
              <h4 style={{ color: '#1f2937' }}>Deploy to CMS</h4>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>JW Player & more</p>
            </div>
          </div>
          
          <button style={{
            background: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer',
            marginTop: '30px'
          }}>
            Get Started
          </button>
        </div>
        
        <div style={{ 
          background: 'white', 
          padding: '30px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginTop: '30px'
        }}>
          <h3 style={{ color: '#1f2937', marginBottom: '20px' }}>Platform Status</h3>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '15px', 
            border: '1px solid #e5e7eb', 
            borderRadius: '6px',
            marginBottom: '15px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                background: 'linear-gradient(45deg, #8b5cf6, #ec4899)', 
                borderRadius: '6px',
                marginRight: '12px'
              }}></div>
              <div>
                <p style={{ margin: '0 0 2px 0', fontWeight: '500' }}>Instagram</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>@creative_agency</p>
              </div>
            </div>
            <span style={{ 
              background: '#dcfce7', 
              color: '#166534', 
              padding: '4px 8px', 
              borderRadius: '12px', 
              fontSize: '12px' 
            }}>
              Connected
            </span>
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '15px', 
            border: '1px solid #e5e7eb', 
            borderRadius: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                backgroundColor: 'black', 
                borderRadius: '6px',
                marginRight: '12px'
              }}></div>
              <div>
                <p style={{ margin: '0 0 2px 0', fontWeight: '500' }}>TikTok</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>@viral_content</p>
              </div>
            </div>
            <span style={{ 
              background: '#fef3c7', 
              color: '#92400e', 
              padding: '4px 8px', 
              borderRadius: '12px', 
              fontSize: '12px' 
            }}>
              Pending
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;