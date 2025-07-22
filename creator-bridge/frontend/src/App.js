import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // State management for the application
  const [stats, setStats] = useState({
    totalContent: 0,
    synced: 0,
    processing: 0,
    platforms: 0
  });
  
  const [platforms, setPlatforms] = useState([
    { 
      id: 'instagram', 
      name: 'Instagram', 
      username: '', 
      connected: false, 
      autoSync: false,
      color: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
      icon: 'IG'
    },
    { 
      id: 'tiktok', 
      name: 'TikTok', 
      username: '', 
      connected: false, 
      autoSync: false,
      color: '#000000',
      icon: 'T'
    }
  ]);
  
  const [contentLibrary, setContentLibrary] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);

  // Simulate API calls to backend
  const callBackendAPI = async (endpoint, method = 'GET', data = null) => {
    try {
      const response = await fetch(`http://localhost:5000/api${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : null,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.log('Backend not available, using mock data:', error.message);
      return null;
    }
  };

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    
    // Try to fetch real data from backend, fallback to mock data
    const backendStats = await callBackendAPI('/stats');
    
    if (backendStats) {
      setStats(backendStats);
    } else {
      // Mock data for demonstration
      setTimeout(() => {
        setStats({
          totalContent: Math.floor(Math.random() * 200) + 100,
          synced: Math.floor(Math.random() * 100) + 50,
          processing: Math.floor(Math.random() * 20) + 5,
          platforms: platforms.filter(p => p.connected).length
        });
      }, 1000);
    }
    
    setIsLoading(false);
  };

  // Handle platform connection
  const handleConnectPlatform = async (platformId, credentials) => {
    setIsLoading(true);
    
    // Simulate OAuth flow
    console.log(`Connecting to ${platformId} with credentials:`, credentials);
    
    // Mock successful connection
    setTimeout(() => {
      setPlatforms(prev => prev.map(platform => 
        platform.id === platformId 
          ? { 
              ...platform, 
              connected: true, 
              username: credentials.username || `@${platformId}_user`,
              autoSync: true
            }
          : platform
      ));
      
      setStats(prev => ({
        ...prev,
        platforms: prev.platforms + 1
      }));
      
      setShowConnectModal(false);
      setSelectedPlatform(null);
      setIsLoading(false);
      
      // Simulate content import
      importContent(platformId);
    }, 2000);
  };

  // Import content from platform
  const importContent = async (platformId) => {
    console.log(`Importing content from ${platformId}...`);
    
    // Mock content import
    const mockContent = [
      {
        id: `${platformId}_${Date.now()}`,
        platform: platformId,
        title: `Amazing ${platformId} video`,
        description: 'This is a sample video imported from social media',
        thumbnail: `https://picsum.photos/300/200?random=${Date.now()}`,
        status: 'imported',
        views: Math.floor(Math.random() * 10000),
        likes: Math.floor(Math.random() * 1000),
        createdAt: new Date().toISOString()
      }
    ];
    
    setContentLibrary(prev => [...prev, ...mockContent]);
    setStats(prev => ({
      ...prev,
      totalContent: prev.totalContent + mockContent.length
    }));
  };

  // Toggle auto-sync
  const toggleAutoSync = (platformId) => {
    setPlatforms(prev => prev.map(platform => 
      platform.id === platformId 
        ? { ...platform, autoSync: !platform.autoSync }
        : platform
    ));
  };

  // Sync content to CMS
  const syncToCMS = async (contentId) => {
    setIsLoading(true);
    
    console.log(`Syncing content ${contentId} to CMS...`);
    
    setTimeout(() => {
      setContentLibrary(prev => prev.map(content => 
        content.id === contentId 
          ? { ...content, status: 'synced' }
          : content
      ));
      
      setStats(prev => ({
        ...prev,
        synced: prev.synced + 1,
        processing: Math.max(0, prev.processing - 1)
      }));
      
      setIsLoading(false);
    }, 1500);
  };

  // Render components based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'platforms':
        return renderPlatformsTab();
      case 'content':
        return renderContentTab();
      case 'sync':
        return renderSyncTab();
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <>
      {/* Stats Cards */}
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
          <h3 style={{ color: '#2563eb', marginBottom: '10px', fontSize: '2em' }}>
            {isLoading ? '...' : stats.totalContent}
          </h3>
          <p style={{ color: '#6b7280', margin: 0 }}>Total Content</p>
        </div>
        
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#059669', marginBottom: '10px', fontSize: '2em' }}>
            {isLoading ? '...' : stats.synced}
          </h3>
          <p style={{ color: '#6b7280', margin: 0 }}>Synced</p>
        </div>
        
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#dc2626', marginBottom: '10px', fontSize: '2em' }}>
            {isLoading ? '...' : stats.processing}
          </h3>
          <p style={{ color: '#6b7280', margin: 0 }}>Processing</p>
        </div>
        
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#7c3aed', marginBottom: '10px', fontSize: '2em' }}>
            {isLoading ? '...' : stats.platforms}
          </h3>
          <p style={{ color: '#6b7280', margin: 0 }}>Platforms</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ 
        background: 'white', 
        padding: '30px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h3 style={{ color: '#1f2937', marginBottom: '20px' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('platforms')}
            style={{
              background: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Connect Platform
          </button>
          <button 
            onClick={() => setActiveTab('content')}
            style={{
              background: '#059669',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            View Content
          </button>
          <button 
            onClick={loadDashboardData}
            style={{
              background: '#7c3aed',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Refresh Data
          </button>
        </div>
      </div>
    </>
  );

  const renderPlatformsTab = () => (
    <div style={{ 
      background: 'white', 
      padding: '30px', 
      borderRadius: '8px', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ color: '#1f2937', marginBottom: '20px' }}>Platform Connections</h3>
      
      {platforms.map(platform => (
        <div key={platform.id} style={{ 
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
              width: '40px', 
              height: '40px', 
              background: platform.color, 
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              marginRight: '15px'
            }}>
              {platform.icon}
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontWeight: '500' }}>
                {platform.name}
              </p>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                {platform.connected ? platform.username : 'Not connected'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {platform.connected ? (
              <>
                <button
                  onClick={() => toggleAutoSync(platform.id)}
                  style={{
                    background: platform.autoSync ? '#dcfce7' : '#f3f4f6',
                    color: platform.autoSync ? '#166534' : '#1f2937',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Auto-sync {platform.autoSync ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={() => importContent(platform.id)}
                  style={{
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Import Now
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setSelectedPlatform(platform);
                  setShowConnectModal(true);
                }}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Connect
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderContentTab = () => (
    <div style={{ 
      background: 'white', 
      padding: '30px', 
      borderRadius: '8px', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ color: '#1f2937', marginBottom: '20px' }}>Content Library</h3>
      
      {contentLibrary.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          <p>No content imported yet.</p>
          <p>Connect a platform and import some content to get started!</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {contentLibrary.map(content => (
            <div key={content.id} style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <img 
                src={content.thumbnail} 
                alt={content.title}
                style={{ width: '100%', height: '160px', objectFit: 'cover' }}
              />
              <div style={{ padding: '15px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>{content.title}</h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#6b7280' }}>
                  {content.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    background: content.status === 'synced' ? '#dcfce7' : '#fef3c7',
                    color: content.status === 'synced' ? '#166534' : '#92400e',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}>
                    {content.status}
                  </span>
                  {content.status !== 'synced' && (
                    <button
                      onClick={() => syncToCMS(content.id)}
                      style={{
                        background: '#059669',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Sync to CMS
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSyncTab = () => (
    <div style={{ 
      background: 'white', 
      padding: '30px', 
      borderRadius: '8px', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ color: '#1f2937', marginBottom: '20px' }}>Sync Status</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <h4>CMS Destinations</h4>
        <div style={{ 
          padding: '15px', 
          border: '1px solid #e5e7eb', 
          borderRadius: '6px',
          marginBottom: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontWeight: '500' }}>JW Player</p>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Primary video platform</p>
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
        </div>
      </div>
      
      <div>
        <h4>Recent Sync Activity</h4>
        {contentLibrary.filter(c => c.status === 'synced').slice(0, 5).map(content => (
          <div key={content.id} style={{
            padding: '10px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            marginBottom: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{content.title}</span>
              <span style={{ color: '#059669', fontSize: '14px' }}>✓ Synced</span>
            </div>
          </div>
        ))}
        {contentLibrary.filter(c => c.status === 'synced').length === 0 && (
          <p style={{ color: '#6b7280' }}>No content synced yet.</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="App">
      <header style={{ backgroundColor: '#282c34', padding: '20px', color: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0' }}>🌉 Creator Content Bridge</h1>
            <p style={{ margin: 0, opacity: 0.8 }}>B2B SaaS tool for migrating social media content to owned platforms</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {isLoading && (
              <div style={{ 
                background: '#059669', 
                color: 'white', 
                padding: '8px 16px', 
                borderRadius: '6px',
                fontSize: '14px'
              }}>
                Processing...
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Navigation */}
      <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '30px' }}>
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'platforms', label: 'Platforms' },
            { id: 'content', label: 'Content' },
            { id: 'sync', label: 'Sync' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '15px 0',
                borderBottom: activeTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                color: activeTab === tab.id ? '#2563eb' : '#6b7280',
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? '500' : 'normal'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
      
      <main style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        {renderContent()}
      </main>

      {/* Connect Platform Modal */}
      {showConnectModal && selectedPlatform && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3>Connect to {selectedPlatform.name}</h3>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>
              This will simulate the OAuth connection process.
            </p>
            
            <input
              type="text"
              placeholder="Username (demo purposes)"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                marginBottom: '20px'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleConnectPlatform(selectedPlatform.id, { username: e.target.value });
                }
              }}
            />
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConnectModal(false)}
                style={{
                  background: '#f3f4f6',
                  color: '#1f2937',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleConnectPlatform(selectedPlatform.id, { username: `demo_${selectedPlatform.id}` })}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {isLoading ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;