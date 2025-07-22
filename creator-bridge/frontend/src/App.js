import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        {/* Navigation */}
        <nav style={{
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '64px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div>
            <h1 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#1f2937'
            }}>🌉 Creator Bridge</h1>
          </div>
          <div>
            <button className="btn">
              Connect Platform
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <div className="container">
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Content</div>
              <div className="stat-number">156</div>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>Videos imported</p>
            </div>
            
            <div className="stat-card">
              <div className="stat-label">Synced</div>
              <div className="stat-number">89</div>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>Successfully deployed</p>
            </div>
            
            <div className="stat-card">
              <div className="stat-label">Processing</div>
              <div className="stat-number">12</div>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>Currently processing</p>
            </div>
            
            <div className="stat-card">
              <div className="stat-label">Platforms</div>
              <div className="stat-number">3</div>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>Connected accounts</p>
            </div>
          </div>

          {/* Welcome Section */}
          <div className="card">
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <h1 style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>
                Welcome to Creator Content Bridge
              </h1>
              <p style={{ fontSize: '1.2em', color: '#6b7280', marginBottom: '40px' }}>
                Your B2B SaaS solution for migrating social media content to owned platforms
              </p>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '30px', 
                maxWidth: '800px', 
                margin: '0 auto' 
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    backgroundColor: '#dbeafe', 
                    borderRadius: '8px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 16px',
                    fontSize: '24px'
                  }}>
                    🔗
                  </div>
                  <h3 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>Connect Platforms</h3>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>Link Instagram & TikTok accounts</p>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    backgroundColor: '#dcfce7', 
                    borderRadius: '8px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 16px',
                    fontSize: '24px'
                  }}>
                    📥
                  </div>
                  <h3 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>Import Content</h3>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>Extract videos & metadata</p>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    backgroundColor: '#ede9fe', 
                    borderRadius: '8px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 16px',
                    fontSize: '24px'
                  }}>
                    ✏️
                  </div>
                  <h3 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>Edit & Stage</h3>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>Optimize for SEO & branding</p>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    backgroundColor: '#fef3c7', 
                    borderRadius: '8px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 16px',
                    fontSize: '24px'
                  }}>
                    🚀
                  </div>
                  <h3 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>Deploy to CMS</h3>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>Sync to JW Player & more</p>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Connections */}
          <div className="card">
            <h2 style={{ fontSize: '1.5em', fontWeight: '600', color: '#1f2937', marginBottom: '20px' }}>
              Connected Platforms
            </h2>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  background: 'linear-gradient(45deg, #8b5cf6, #ec4899)', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white', 
                  fontWeight: 'bold',
                  marginRight: '16px'
                }}>
                  IG
                </div>
                <div>
                  <p style={{ fontWeight: '500', color: '#1f2937', margin: '0 0 4px 0' }}>@creative_agency</p>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>Instagram • Connected</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  padding: '4px 8px', 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  backgroundColor: '#dcfce7', 
                  color: '#166534', 
                  borderRadius: '12px' 
                }}>
                  Auto-sync ON
                </span>
                <button style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                  ⚙️
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  backgroundColor: 'black', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white', 
                  fontWeight: 'bold',
                  marginRight: '16px'
                }}>
                  T
                </div>
                <div>
                  <p style={{ fontWeight: '500', color: '#1f2937', margin: '0 0 4px 0' }}>@viral_content</p>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>TikTok • Connected</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  padding: '4px 8px', 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  backgroundColor: '#f3f4f6', 
                  color: '#1f2937', 
                  borderRadius: '12px' 
                }}>
                  Auto-sync OFF
                </span>
                <button style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                  ⚙️
                </button>
              </div>
            </div>
          </div>

          {/* Demo Features */}
          <div className="card">
            <h2 style={{ fontSize: '1.5em', fontWeight: '600', color: '#1f2937', marginBottom: '20px' }}>
              Demo Features
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div>
                <h3 style={{ color: '#2563eb', marginBottom: '8px' }}>🔐 OAuth Integration</h3>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>Secure Instagram and TikTok account connections with proper token management.</p>
              </div>
              <div>
                <h3 style={{ color: '#059669', marginBottom: '8px' }}>📥 Content Extraction</h3>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>Automatic video download with metadata including captions, hashtags, and stats.</p>
              </div>
              <div>
                <h3 style={{ color: '#7c3aed', marginBottom: '8px' }}>✏️ Metadata Editor</h3>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>Edit titles, descriptions, and tags for SEO optimization before publishing.</p>
              </div>
              <div>
                <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>🚀 CMS Deployment</h3>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>Seamless sync to JW Player and other video platforms with status tracking.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;