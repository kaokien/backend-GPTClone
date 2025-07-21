const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { InstagramService } = require('../services/InstagramService');
const { TikTokService } = require('../services/TikTokService');

const router = express.Router();

// Get all connected platforms for current user
router.get('/connections', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('platformConnections');
    
    const connections = user.platformConnections.filter(conn => conn.isActive).map(conn => ({
      id: conn._id,
      platform: conn.platform,
      accountHandle: conn.accountHandle,
      connectedAt: conn.connectedAt,
      lastSyncAt: conn.lastSyncAt,
      autoSync: conn.autoSync
    }));

    res.json({
      connections,
      total: connections.length
    });
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({
      error: 'Failed to fetch platform connections',
      message: error.message
    });
  }
});

// Instagram OAuth Flow
router.get('/instagram/connect', authenticateToken, (req, res) => {
  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
  const scope = 'user_profile,user_media';
  
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${req.userId}`;
  
  res.json({
    authUrl,
    message: 'Redirect user to this URL to connect Instagram account'
  });
});

// Instagram OAuth Callback
router.get('/instagram/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query;
    
    if (!code || !userId) {
      return res.status(400).json({
        error: 'Missing authorization code or user state'
      });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', {
      client_id: process.env.INSTAGRAM_CLIENT_ID,
      client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
      code
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, user_id } = tokenResponse.data;

    // Get user profile information
    const profileResponse = await axios.get(`https://graph.instagram.com/me?fields=id,username&access_token=${access_token}`);
    const { username } = profileResponse.data;

    // Save connection to user
    const user = await User.findById(userId);
    
    // Remove existing Instagram connection if any
    user.platformConnections = user.platformConnections.filter(conn => 
      conn.platform !== 'instagram' || conn.accountId !== user_id
    );

    // Add new connection
    user.platformConnections.push({
      platform: 'instagram',
      accountId: user_id,
      accountHandle: username,
      accessToken: access_token,
      connectedAt: new Date(),
      isActive: true
    });

    await user.save();

    // Redirect to frontend success page
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=instagram&account=${username}`);
  } catch (error) {
    console.error('Instagram callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=instagram_connection_failed`);
  }
});

// TikTok OAuth Flow
router.get('/tiktok/connect', authenticateToken, (req, res) => {
  const clientKey = process.env.TIKTOK_CLIENT_ID;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;
  const scope = 'user.info.basic,video.list';
  
  const authUrl = `https://www.tiktok.com/auth/authorize/?client_key=${clientKey}&response_type=code&scope=${scope}&redirect_uri=${redirectUri}&state=${req.userId}`;
  
  res.json({
    authUrl,
    message: 'Redirect user to this URL to connect TikTok account'
  });
});

// TikTok OAuth Callback
router.get('/tiktok/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query;
    
    if (!code || !userId) {
      return res.status(400).json({
        error: 'Missing authorization code or user state'
      });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://open-api.tiktok.com/oauth/access_token/', {
      client_key: process.env.TIKTOK_CLIENT_ID,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.TIKTOK_REDIRECT_URI
    });

    const { access_token, open_id, refresh_token, expires_in } = tokenResponse.data.data;

    // Get user profile information
    const profileResponse = await axios.post('https://open-api.tiktok.com/user/info/', {
      access_token,
      open_id
    });

    const { display_name, username } = profileResponse.data.data.user;

    // Save connection to user
    const user = await User.findById(userId);
    
    // Remove existing TikTok connection if any
    user.platformConnections = user.platformConnections.filter(conn => 
      conn.platform !== 'tiktok' || conn.accountId !== open_id
    );

    // Add new connection
    user.platformConnections.push({
      platform: 'tiktok',
      accountId: open_id,
      accountHandle: username || display_name,
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpiry: new Date(Date.now() + expires_in * 1000),
      connectedAt: new Date(),
      isActive: true
    });

    await user.save();

    // Redirect to frontend success page
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=tiktok&account=${username || display_name}`);
  } catch (error) {
    console.error('TikTok callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=tiktok_connection_failed`);
  }
});

// Disconnect platform
router.delete('/disconnect/:platform/:connectionId', authenticateToken, async (req, res) => {
  try {
    const { platform, connectionId } = req.params;
    
    const user = await User.findById(req.userId);
    const connection = user.platformConnections.id(connectionId);
    
    if (!connection || connection.platform !== platform) {
      return res.status(404).json({
        error: 'Platform connection not found'
      });
    }

    // Mark as inactive instead of deleting (for audit trail)
    connection.isActive = false;
    await user.save();

    res.json({
      message: `${platform} account disconnected successfully`
    });
  } catch (error) {
    console.error('Disconnect platform error:', error);
    res.status(500).json({
      error: 'Failed to disconnect platform',
      message: error.message
    });
  }
});

// Toggle auto-sync for a platform connection
router.put('/auto-sync/:connectionId', authenticateToken, [
  body('enabled').isBoolean().withMessage('enabled must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { connectionId } = req.params;
    const { enabled } = req.body;
    
    const user = await User.findById(req.userId);
    const connection = user.platformConnections.id(connectionId);
    
    if (!connection || !connection.isActive) {
      return res.status(404).json({
        error: 'Platform connection not found'
      });
    }

    connection.autoSync = enabled;
    await user.save();

    res.json({
      message: `Auto-sync ${enabled ? 'enabled' : 'disabled'} for ${connection.platform}`,
      connection: {
        id: connection._id,
        platform: connection.platform,
        accountHandle: connection.accountHandle,
        autoSync: connection.autoSync
      }
    });
  } catch (error) {
    console.error('Toggle auto-sync error:', error);
    res.status(500).json({
      error: 'Failed to update auto-sync setting',
      message: error.message
    });
  }
});

// Test platform connection
router.post('/test/:connectionId', authenticateToken, async (req, res) => {
  try {
    const { connectionId } = req.params;
    
    const user = await User.findById(req.userId);
    const connection = user.platformConnections.id(connectionId);
    
    if (!connection || !connection.isActive) {
      return res.status(404).json({
        error: 'Platform connection not found'
      });
    }

    let testResult;
    
    if (connection.platform === 'instagram') {
      testResult = await InstagramService.testConnection(connection.accessToken);
    } else if (connection.platform === 'tiktok') {
      testResult = await TikTokService.testConnection(connection.accessToken, connection.accountId);
    } else {
      return res.status(400).json({
        error: 'Unsupported platform'
      });
    }

    if (testResult.success) {
      connection.lastSyncAt = new Date();
      await user.save();
    }

    res.json({
      platform: connection.platform,
      accountHandle: connection.accountHandle,
      status: testResult.success ? 'connected' : 'error',
      message: testResult.message,
      data: testResult.data
    });
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({
      error: 'Connection test failed',
      message: error.message
    });
  }
});

// Get platform statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const activeConnections = user.getActivePlatformConnections();
    
    const stats = {
      totalConnections: activeConnections.length,
      platforms: {},
      autoSyncEnabled: activeConnections.filter(conn => conn.autoSync).length
    };

    activeConnections.forEach(conn => {
      if (!stats.platforms[conn.platform]) {
        stats.platforms[conn.platform] = {
          count: 0,
          accounts: []
        };
      }
      stats.platforms[conn.platform].count++;
      stats.platforms[conn.platform].accounts.push({
        handle: conn.accountHandle,
        connectedAt: conn.connectedAt,
        lastSyncAt: conn.lastSyncAt,
        autoSync: conn.autoSync
      });
    });

    res.json(stats);
  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch platform statistics',
      message: error.message
    });
  }
});

module.exports = router;