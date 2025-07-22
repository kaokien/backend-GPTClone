const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const fs = require('fs-extra');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

// Initialize services
const InstagramService = require('./services/instagramService');
const JWPlayerService = require('./services/jwPlayerService');

const instagramService = new InstagramService();
const jwPlayerService = new JWPlayerService();

// Initialize express app
const app = express();

// --- Middlewares ---
app.use(cors({
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
  credentials: true
}));
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Ensure directories exist
const ensureDirectories = async () => {
  const dirs = [
    process.env.TEMP_DIR || './temp',
    process.env.PROCESSED_DIR || './processed',
    './logs'
  ];
  
  for (const dir of dirs) {
    await fs.ensureDir(dir);
  }
};

// --- In-Memory Database (for demo - replace with MongoDB in production) ---
let appData = {
  stats: {
    totalContent: 0,
    synced: 0,
    processing: 0,
    platforms: 0
  },
  platforms: [
    {
      id: 'instagram',
      name: 'Instagram',
      connected: false,
      username: '',
      accessToken: '',
      autoSync: false,
      lastSync: null
    },
    {
      id: 'tiktok', 
      name: 'TikTok',
      connected: false,
      username: '',
      accessToken: '',
      autoSync: false,
      lastSync: null
    }
  ],
  content: [],
  syncQueue: []
};

// --- Helper Functions ---
const updateStats = () => {
  appData.stats = {
    totalContent: appData.content.length,
    synced: appData.content.filter(c => c.status === 'synced').length,
    processing: appData.content.filter(c => c.status === 'processing').length,
    platforms: appData.platforms.filter(p => p.connected).length
  };
};

// --- API Routes ---

// Basic health check route
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Creator Bridge API is running.',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: [
      'GET /api/stats',
      'GET /api/platforms',
      'GET /auth/instagram',
      'GET /auth/instagram/callback',
      'POST /api/platforms/:id/disconnect',
      'GET /api/content',
      'POST /api/content/import/:platformId',
      'POST /api/content/:id/sync',
      'GET /api/sync/status',
      'POST /api/test/connections'
    ]
  });
});

// Get dashboard statistics
app.get('/api/stats', (req, res) => {
  updateStats();
  res.json({
    ...appData.stats,
    lastUpdated: new Date().toISOString()
  });
});

// Get platform connections
app.get('/api/platforms', (req, res) => {
  // Don't expose access tokens in the response
  const platforms = appData.platforms.map(p => ({
    id: p.id,
    name: p.name,
    connected: p.connected,
    username: p.username,
    autoSync: p.autoSync,
    lastSync: p.lastSync
  }));
  
  res.json(platforms);
});

// Instagram OAuth Routes
app.get('/auth/instagram', (req, res) => {
  try {
    const authUrl = instagramService.getAuthorizationUrl();
    res.redirect(authUrl);
  } catch (error) {
    console.error('Instagram auth error:', error.message);
    res.status(500).json({ 
      error: 'Failed to initiate Instagram authentication',
      message: error.message 
    });
  }
});

app.get('/auth/instagram/callback', async (req, res) => {
  try {
    const { code, error, error_description } = req.query;
    
    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL}?error=${encodeURIComponent(error_description || error)}`);
    }
    
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}?error=No authorization code received`);
    }
    
    console.log('Exchanging Instagram authorization code for access token...');
    
    // Exchange code for access token
    const tokenData = await instagramService.exchangeCodeForToken(code);
    
    // Get user profile
    const profile = await instagramService.getUserProfile(tokenData.access_token);
    
    // Update platform connection
    const platform = appData.platforms.find(p => p.id === 'instagram');
    if (platform) {
      platform.connected = true;
      platform.username = `@${profile.username}`;
      platform.accessToken = tokenData.access_token;
      platform.autoSync = true;
      platform.lastSync = new Date().toISOString();
    }
    
    updateStats();
    
    console.log(`Instagram connected successfully: ${profile.username}`);
    
    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL}?platform=instagram&status=connected&username=${profile.username}`);
    
  } catch (error) {
    console.error('Instagram callback error:', error.message);
    res.redirect(`${process.env.FRONTEND_URL}?error=${encodeURIComponent(error.message)}`);
  }
});

// Disconnect from a platform
app.post('/api/platforms/:id/disconnect', (req, res) => {
  const { id } = req.params;
  
  const platform = appData.platforms.find(p => p.id === id);
  if (!platform) {
    return res.status(404).json({ error: 'Platform not found' });
  }
  
  platform.connected = false;
  platform.username = '';
  platform.accessToken = '';
  platform.autoSync = false;
  platform.lastSync = null;
  
  updateStats();
  
  res.json({
    success: true,
    message: `Disconnected from ${platform.name}`,
    platform: {
      id: platform.id,
      name: platform.name,
      connected: platform.connected
    }
  });
});

// Toggle auto-sync for a platform
app.post('/api/platforms/:id/toggle-sync', (req, res) => {
  const { id } = req.params;
  
  const platform = appData.platforms.find(p => p.id === id);
  if (!platform) {
    return res.status(404).json({ error: 'Platform not found' });
  }
  
  if (!platform.connected) {
    return res.status(400).json({ error: 'Platform is not connected' });
  }
  
  platform.autoSync = !platform.autoSync;
  
  res.json({
    success: true,
    message: `Auto-sync ${platform.autoSync ? 'enabled' : 'disabled'} for ${platform.name}`,
    platform: {
      id: platform.id,
      name: platform.name,
      autoSync: platform.autoSync
    }
  });
});

// Get content library
app.get('/api/content', (req, res) => {
  const { platform, status, limit = 50, offset = 0 } = req.query;
  
  let filteredContent = appData.content;
  
  if (platform) {
    filteredContent = filteredContent.filter(c => c.platform === platform);
  }
  
  if (status) {
    filteredContent = filteredContent.filter(c => c.status === status);
  }
  
  const total = filteredContent.length;
  const paginatedContent = filteredContent
    .slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  
  res.json({
    content: paginatedContent,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: parseInt(offset) + parseInt(limit) < total
    }
  });
});

// Import content from a platform
app.post('/api/content/import/:platformId', async (req, res) => {
  const { platformId } = req.params;
  const { count = 5 } = req.body;
  
  try {
    const platform = appData.platforms.find(p => p.id === platformId);
    if (!platform) {
      return res.status(404).json({ error: 'Platform not found' });
    }
    
    if (!platform.connected || !platform.accessToken) {
      return res.status(400).json({ 
        error: 'Platform is not connected or missing access token',
        requiresAuth: true,
        authUrl: platformId === 'instagram' ? '/auth/instagram' : null
      });
    }
    
    console.log(`Starting import from ${platform.name}...`);
    
    if (platformId === 'instagram') {
      // Import from Instagram using real API
      const mediaData = await instagramService.getUserMedia(platform.accessToken, count);
      const processedMedia = [];
      
      for (const media of mediaData.data) {
        try {
          if (['VIDEO', 'CAROUSEL_ALBUM'].includes(media.media_type)) {
            console.log(`Processing Instagram media: ${media.id}`);
            const processed = await instagramService.processMediaForImport(media, platform.accessToken);
            
            // Add to our content library
            appData.content.push({
              ...processed,
              status: 'imported',
              syncDestinations: []
            });
            
            processedMedia.push(processed);
          }
        } catch (error) {
          console.warn(`Skipping media ${media.id}:`, error.message);
        }
      }
      
      platform.lastSync = new Date().toISOString();
      updateStats();
      
      res.json({
        success: true,
        message: `Imported ${processedMedia.length} videos from ${platform.name}`,
        content: processedMedia,
        stats: appData.stats
      });
      
    } else {
      // For other platforms, return error for now
      res.status(400).json({ 
        error: `Import not yet implemented for ${platform.name}` 
      });
    }
    
  } catch (error) {
    console.error('Import error:', error.message);
    res.status(500).json({ 
      error: 'Failed to import content', 
      message: error.message 
    });
  }
});

// Sync content to CMS
app.post('/api/content/:id/sync', async (req, res) => {
  const { id } = req.params;
  const { destination = 'jwplayer' } = req.body;
  
  try {
    const content = appData.content.find(c => c.id === id);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    if (content.status === 'synced') {
      return res.status(400).json({ error: 'Content is already synced' });
    }
    
    console.log(`Starting sync of "${content.title}" to ${destination}...`);
    
    // Update status to processing
    content.status = 'processing';
    
    // Add to sync queue
    const queueItem = {
      contentId: id,
      destination: destination,
      startedAt: new Date().toISOString(),
      status: 'processing'
    };
    appData.syncQueue.push(queueItem);
    
    updateStats();
    
    // Start async processing
    if (destination === 'jwplayer') {
      // Use real JW Player API
      jwPlayerService.processInstagramVideo(content)
        .then(result => {
          console.log(`Successfully synced to JW Player: ${result.id}`);
          
          // Update content status
          content.status = 'synced';
          content.syncedAt = new Date().toISOString();
          content.syncedTo = destination;
          content.jwPlayerData = result;
          
          // Update sync queue
          queueItem.status = 'completed';
          queueItem.completedAt = new Date().toISOString();
          queueItem.result = result;
          
          updateStats();
        })
        .catch(error => {
          console.error(`Failed to sync to JW Player:`, error.message);
          
          // Update content status
          content.status = 'error';
          content.errorMessage = error.message;
          
          // Update sync queue
          queueItem.status = 'failed';
          queueItem.completedAt = new Date().toISOString();
          queueItem.error = error.message;
          
          updateStats();
        });
    } else {
      // For other destinations, simulate processing
      setTimeout(() => {
        content.status = 'synced';
        content.syncedAt = new Date().toISOString();
        content.syncedTo = destination;
        
        queueItem.status = 'completed';
        queueItem.completedAt = new Date().toISOString();
        
        updateStats();
      }, 3000);
    }
    
    res.json({
      success: true,
      message: `Started syncing "${content.title}" to ${destination}`,
      content: {
        id: content.id,
        title: content.title,
        status: content.status
      },
      queuePosition: appData.syncQueue.length
    });
    
  } catch (error) {
    console.error('Sync error:', error.message);
    res.status(500).json({ 
      error: 'Failed to start sync', 
      message: error.message 
    });
  }
});

// Bulk sync content
app.post('/api/content/bulk-sync', (req, res) => {
  const { contentIds, destination = 'jwplayer' } = req.body;
  
  if (!Array.isArray(contentIds) || contentIds.length === 0) {
    return res.status(400).json({ error: 'contentIds must be a non-empty array' });
  }
  
  const results = [];
  
  contentIds.forEach(id => {
    const content = appData.content.find(c => c.id === id);
    if (content && content.status !== 'synced') {
      content.status = 'processing';
      
      appData.syncQueue.push({
        contentId: id,
        destination: destination,
        startedAt: new Date().toISOString(),
        status: 'processing'
      });
      
      results.push({ id, status: 'queued' });
      
      // Simulate async processing
      setTimeout(() => {
        content.status = 'synced';
        content.syncedAt = new Date().toISOString();
        content.syncedTo = destination;
        
        const queueItem = appData.syncQueue.find(q => q.contentId === id);
        if (queueItem) {
          queueItem.status = 'completed';
          queueItem.completedAt = new Date().toISOString();
        }
        
        updateStats();
      }, Math.random() * 5000 + 1000); // Random delay between 1-6 seconds
    } else if (content && content.status === 'synced') {
      results.push({ id, status: 'already_synced' });
    } else {
      results.push({ id, status: 'not_found' });
    }
  });
  
  updateStats();
  
  res.json({
    success: true,
    message: `Queued ${results.filter(r => r.status === 'queued').length} items for sync`,
    results: results,
    queueLength: appData.syncQueue.filter(q => q.status === 'processing').length
  });
});

// Get sync status and queue
app.get('/api/sync/status', (req, res) => {
  const processingQueue = appData.syncQueue.filter(q => q.status === 'processing');
  const recentCompletions = appData.syncQueue
    .filter(q => q.status === 'completed')
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 10);
  
  res.json({
    queue: {
      processing: processingQueue.length,
      completed: appData.syncQueue.filter(q => q.status === 'completed').length,
      failed: appData.syncQueue.filter(q => q.status === 'failed').length,
      items: processingQueue
    },
    recentCompletions: recentCompletions,
    stats: appData.stats
  });
});

// Test API connections
app.post('/api/test/connections', async (req, res) => {
  const results = {};
  
  // Test Instagram connection (if configured)
  if (process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET) {
    try {
      const authUrl = instagramService.getAuthorizationUrl();
      results.instagram = {
        configured: true,
        authUrl: authUrl,
        message: 'Instagram API credentials configured'
      };
    } catch (error) {
      results.instagram = {
        configured: false,
        error: error.message
      };
    }
  } else {
    results.instagram = {
      configured: false,
      message: 'Instagram API credentials not configured'
    };
  }
  
  // Test JW Player connection
  try {
    const jwTest = await jwPlayerService.testConnection();
    results.jwplayer = jwTest;
  } catch (error) {
    results.jwplayer = {
      success: false,
      error: error.message,
      message: 'JW Player API credentials not configured or invalid'
    };
  }
  
  res.json({
    success: true,
    connections: results,
    timestamp: new Date().toISOString()
  });
});

// Get content metadata for editing
app.get('/api/content/:id', (req, res) => {
  const { id } = req.params;
  
  const content = appData.content.find(c => c.id === id);
  if (!content) {
    return res.status(404).json({ error: 'Content not found' });
  }
  
  res.json(content);
});

// Update content metadata
app.put('/api/content/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const content = appData.content.find(c => c.id === id);
  if (!content) {
    return res.status(404).json({ error: 'Content not found' });
  }
  
  // Update allowed fields
  const allowedFields = ['title', 'description', 'hashtags', 'customThumbnail'];
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      content[field] = updates[field];
    }
  });
  
  content.updatedAt = new Date().toISOString();
  
  res.json({
    success: true,
    message: 'Content updated successfully',
    content: content
  });
});

// Delete content
app.delete('/api/content/:id', (req, res) => {
  const { id } = req.params;
  
  const index = appData.content.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Content not found' });
  }
  
  const deletedContent = appData.content.splice(index, 1)[0];
  updateStats();
  
  res.json({
    success: true,
    message: 'Content deleted successfully',
    content: deletedContent
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

// --- Server Initialization ---
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Ensure required directories exist
    await ensureDirectories();
    
    app.listen(PORT, () => {
      console.log(`🚀 Creator Bridge API Server is running on port ${PORT}`);
      console.log(`📊 Dashboard: http://localhost:${PORT}`);
      console.log(`🔗 API Endpoints: http://localhost:${PORT}/api/`);
      console.log(`🔥 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📸 Instagram OAuth: http://localhost:${PORT}/auth/instagram`);
      
      // Check API configuration
      if (!process.env.INSTAGRAM_APP_ID) {
        console.warn('⚠️  Instagram API not configured - set INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET');
      }
      
      if (!process.env.JW_PLAYER_API_KEY) {
        console.warn('⚠️  JW Player API not configured - set JW_PLAYER_API_KEY and JW_PLAYER_API_SECRET');
      }
      
      console.log('✨ Ready for real Instagram → JW Player content migration!');
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();