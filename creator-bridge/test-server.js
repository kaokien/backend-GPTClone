const http = require('http');

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Handle OPTIONS requests for CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Route handling
  const url = req.url;
  const method = req.method;

  console.log(`${method} ${url}`);

  if (url === '/' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      message: 'Creator Bridge API is running!',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }));
  } else if (url === '/api/health' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    }));
  } else if (url.startsWith('/api/auth/') && method === 'POST') {
    // Simulate auth endpoints
    const endpoint = url.split('/').pop();
    res.writeHead(200);
    res.end(JSON.stringify({
      message: `${endpoint} endpoint simulated`,
      success: true,
      data: { token: 'mock-jwt-token', user: { id: 1, email: 'demo@example.com' } }
    }));
  } else if (url.startsWith('/api/platforms/') && method === 'GET') {
    // Simulate platform endpoints
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'Platform connections endpoint',
      connections: [
        { id: 1, platform: 'instagram', status: 'connected', handle: '@demo_account' },
        { id: 2, platform: 'tiktok', status: 'connected', handle: '@demo_tiktok' }
      ]
    }));
  } else if (url.startsWith('/api/content/') && method === 'GET') {
    // Simulate content endpoints
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'Content management endpoint',
      content: [
        {
          id: 1,
          title: 'Sample Instagram Reel',
          platform: 'instagram',
          status: 'ready',
          thumbnailUrl: 'https://via.placeholder.com/400x600?text=Reel+1',
          importedAt: new Date().toISOString()
        },
        {
          id: 2,
          title: 'Sample TikTok Video',
          platform: 'tiktok',
          status: 'synced',
          thumbnailUrl: 'https://via.placeholder.com/400x600?text=TikTok+1',
          importedAt: new Date().toISOString()
        }
      ],
      total: 2
    }));
  } else {
    // 404 for unknown routes
    res.writeHead(404);
    res.end(JSON.stringify({
      error: 'Route not found',
      path: url,
      method: method
    }));
  }
});

const PORT = process.env.PORT || 5004;

server.listen(PORT, () => {
  console.log(`🚀 Creator Bridge Test Server running on port ${PORT}`);
  console.log(`📍 Available at: http://localhost:${PORT}`);
  console.log(`🧪 Test endpoints:`);
  console.log(`   GET  /                    - Health check`);
  console.log(`   GET  /api/health          - Detailed health`);
  console.log(`   POST /api/auth/login      - Simulate login`);
  console.log(`   GET  /api/platforms/      - Platform connections`);
  console.log(`   GET  /api/content/        - Content management`);
  console.log(`\n💡 Use Ctrl+C to stop the server`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
