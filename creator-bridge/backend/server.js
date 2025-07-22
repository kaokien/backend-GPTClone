const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

// Load environment variables from .env file
dotenv.config();

// Initialize express app
const app = express();

// --- Middlewares ---
app.use(cors());
app.use(helmet());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// --- In-Memory Database (for demo purposes) ---
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
      autoSync: false,
      lastSync: null
    },
    {
      id: 'tiktok', 
      name: 'TikTok',
      connected: false,
      username: '',
      autoSync: false,
      lastSync: null
    }
  ],
  content: [],
  syncQueue: []
};

// --- Helper Functions ---
const generateMockContent = (platformId, count = 1) => {
  const content = [];
  for (let i = 0; i < count; i++) {
    content.push({
      id: `${platformId}_${Date.now()}_${i}`,
      platform: platformId,
      title: `${platformId} Video ${i + 1}`,
      description: `This is a sample video imported from ${platformId}`,
      thumbnail: `https://picsum.photos/300/200?random=${Date.now() + i}`,
      status: 'imported',
      views: Math.floor(Math.random() * 10000),
      likes: Math.floor(Math.random() * 1000),
      hashtags: ['#content', '#video', `#${platformId}`],
      createdAt: new Date().toISOString(),
      importedAt: new Date().toISOString()
    });
  }
  return content;
};

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
    version: '1.0.0',
    endpoints: [
      'GET /api/stats',
      'GET /api/platforms',
      'POST /api/platforms/:id/connect',
      'POST /api/platforms/:id/disconnect',
      'GET /api/content',
      'POST /api/content/import',
      'POST /api/content/:id/sync',
      'GET /api/sync/status'
    ]
  });
});

// Get dashboard statistics
app.get('/api/stats', (req, res) => {
  updateStats();
  res.json(appData.stats);
});

// Get platform connections
app.get('/api/platforms', (req, res) => {
  res.json(appData.platforms);
});

// Connect to a platform
app.post('/api/platforms/:id/connect', (req, res) => {
  const { id } = req.params;
  const { username, accessToken } = req.body;
  
  const platform = appData.platforms.find(p => p.id === id);
  if (!platform) {
    return res.status(404).json({ error: 'Platform not found' });
  }
  
  // Simulate OAuth connection
  platform.connected = true;
  platform.username = username || `@demo_${id}`;
  platform.autoSync = true;
  platform.lastSync = new Date().toISOString();
  
  // Generate some mock content for the newly connected platform
  const mockContent = generateMockContent(id, Math.floor(Math.random() * 5) + 1);
  appData.content.push(...mockContent);
  
  updateStats();
  
  res.json({
    success: true,
    message: `Successfully connected to ${platform.name}`,
    platform: platform,
    importedContent: mockContent.length
  });
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
  platform.autoSync = false;
  platform.lastSync = null;
  
  updateStats();
  
  res.json({
    success: true,
    message: `Disconnected from ${platform.name}`,
    platform: platform
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
    platform: platform
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
app.post('/api/content/import', (req, res) => {
  const { platformId, count = 1 } = req.body;
  
  const platform = appData.platforms.find(p => p.id === platformId);
  if (!platform) {
    return res.status(404).json({ error: 'Platform not found' });
  }
  
  if (!platform.connected) {
    return res.status(400).json({ error: 'Platform is not connected' });
  }
  
  const newContent = generateMockContent(platformId, parseInt(count));
  appData.content.push(...newContent);
  
  platform.lastSync = new Date().toISOString();
  updateStats();
  
  res.json({
    success: true,
    message: `Imported ${newContent.length} content items from ${platform.name}`,
    content: newContent,
    stats: appData.stats
  });
});

// Sync content to CMS
app.post('/api/content/:id/sync', (req, res) => {
  const { id } = req.params;
  const { destination = 'jwplayer' } = req.body;
  
  const content = appData.content.find(c => c.id === id);
  if (!content) {
    return res.status(404).json({ error: 'Content not found' });
  }
  
  if (content.status === 'synced') {
    return res.status(400).json({ error: 'Content is already synced' });
  }
  
  // Simulate sync process
  content.status = 'processing';
  
  // Add to sync queue
  appData.syncQueue.push({
    contentId: id,
    destination: destination,
    startedAt: new Date().toISOString(),
    status: 'processing'
  });
  
  // Simulate async processing
  setTimeout(() => {
    content.status = 'synced';
    content.syncedAt = new Date().toISOString();
    content.syncedTo = destination;
    
    // Update sync queue
    const queueItem = appData.syncQueue.find(q => q.contentId === id);
    if (queueItem) {
      queueItem.status = 'completed';
      queueItem.completedAt = new Date().toISOString();
    }
    
    updateStats();
  }, 2000); // 2 second delay to simulate processing
  
  updateStats();
  
  res.json({
    success: true,
    message: `Started syncing "${content.title}" to ${destination}`,
    content: content,
    queuePosition: appData.syncQueue.length
  });
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
      items: processingQueue
    },
    recentCompletions: recentCompletions,
    stats: appData.stats
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

app.listen(PORT, () => {
  console.log(`🚀 Creator Bridge API Server is running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔗 API Endpoints: http://localhost:${PORT}/api/`);
  console.log(`🔥 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialize with some sample data for demonstration
  if (process.env.NODE_ENV !== 'production') {
    console.log('🎭 Loading demo data...');
    
    // Add some initial content for demo
    const demoContent = [
      ...generateMockContent('instagram', 3),
      ...generateMockContent('tiktok', 2)
    ];
    
    // Mark some as synced for demo
    demoContent[0].status = 'synced';
    demoContent[0].syncedAt = new Date().toISOString();
    demoContent[1].status = 'processing';
    
    appData.content = demoContent;
    updateStats();
    
    console.log(`✨ Demo data loaded: ${demoContent.length} content items`);
  }
});