const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Content = require('../models/Content');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { InstagramService } = require('../services/InstagramService');
const { TikTokService } = require('../services/TikTokService');
const { ContentProcessor } = require('../services/ContentProcessor');

const router = express.Router();

// Get all content for current user with filtering and pagination
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(['queued', 'downloading', 'processing', 'ready', 'syncing', 'synced', 'error']),
  query('platform').optional().isIn(['instagram', 'tiktok']),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { 
      userId: req.userId,
      isArchived: false
    };

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.platform) {
      query.sourcePlatform = req.query.platform;
    }

    if (req.query.search) {
      query.$or = [
        { 'metadata.originalCaption': { $regex: req.query.search, $options: 'i' } },
        { 'metadata.editedTitle': { $regex: req.query.search, $options: 'i' } },
        { 'metadata.editedDescription': { $regex: req.query.search, $options: 'i' } },
        { 'metadata.hashtags': { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }

    // Get content with pagination
    const content = await Content.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Content.countDocuments(query);

    res.json({
      content,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      error: 'Failed to fetch content',
      message: error.message
    });
  }
});

// Browse platform content (without importing)
router.get('/browse/:platform/:connectionId', authenticateToken, [
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('cursor').optional()
], async (req, res) => {
  try {
    const { platform, connectionId } = req.params;
    const limit = req.query.limit || 25;
    
    // Get user's platform connection
    const user = await User.findById(req.userId);
    const connection = user.platformConnections.id(connectionId);
    
    if (!connection || !connection.isActive || connection.platform !== platform) {
      return res.status(404).json({
        error: 'Platform connection not found'
      });
    }

    let result;
    
    if (platform === 'instagram') {
      result = await InstagramService.getUserMedia(connection.accessToken, limit);
    } else if (platform === 'tiktok') {
      const cursor = req.query.cursor ? parseInt(req.query.cursor) : 0;
      result = await TikTokService.getUserVideos(connection.accessToken, connection.accountId, cursor, limit);
    } else {
      return res.status(400).json({
        error: 'Unsupported platform'
      });
    }

    if (!result.success) {
      return res.status(400).json({
        error: 'Failed to fetch platform content',
        details: result.error
      });
    }

    // Check which videos are already imported
    const sourcePostIds = result.data.map(item => item.id);
    const existingContent = await Content.find({
      userId: req.userId,
      sourcePostId: { $in: sourcePostIds }
    }).select('sourcePostId');
    
    const existingIds = new Set(existingContent.map(c => c.sourcePostId));

    // Mark imported videos
    const videos = result.data.map(video => ({
      ...video,
      isImported: existingIds.has(video.id),
      platform
    }));

    res.json({
      videos,
      pagination: {
        hasMore: result.hasMore || false,
        cursor: result.cursor,
        total: videos.length
      },
      connection: {
        platform: connection.platform,
        accountHandle: connection.accountHandle
      }
    });
  } catch (error) {
    console.error('Browse content error:', error);
    res.status(500).json({
      error: 'Failed to browse platform content',
      message: error.message
    });
  }
});

// Import specific videos from platform
router.post('/import', authenticateToken, [
  body('videos').isArray().withMessage('Videos must be an array'),
  body('videos.*.platform').isIn(['instagram', 'tiktok']),
  body('videos.*.connectionId').notEmpty(),
  body('videos.*.videoId').notEmpty(),
  body('priority').optional().isInt({ min: 0, max: 10 }).toInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { videos, priority = 0 } = req.body;
    const user = await User.findById(req.userId);
    const importResults = [];

    for (const videoRequest of videos) {
      try {
        const { platform, connectionId, videoId } = videoRequest;
        
        // Verify connection
        const connection = user.platformConnections.id(connectionId);
        if (!connection || !connection.isActive || connection.platform !== platform) {
          importResults.push({
            videoId,
            success: false,
            error: 'Invalid platform connection'
          });
          continue;
        }

        // Check if already imported
        const existingContent = await Content.findOne({
          userId: req.userId,
          sourcePostId: videoId
        });

        if (existingContent) {
          importResults.push({
            videoId,
            success: false,
            error: 'Video already imported',
            contentId: existingContent._id
          });
          continue;
        }

        // Get video details from platform
        let videoDetails;
        if (platform === 'instagram') {
          videoDetails = await InstagramService.getMediaDetails(videoId, connection.accessToken);
        } else if (platform === 'tiktok') {
          videoDetails = await TikTokService.getVideoDetails(videoId, connection.accessToken, connection.accountId);
        }

        if (!videoDetails.success) {
          importResults.push({
            videoId,
            success: false,
            error: 'Failed to fetch video details',
            details: videoDetails.error
          });
          continue;
        }

        const video = videoDetails.data;
        
        // Create content record
        const content = new Content({
          userId: req.userId,
          sourcePlatform: platform,
          sourceAccountId: connection.accountId,
          sourcePostId: videoId,
          sourceUrl: video.shareUrl || video.permalink,
          videoFile: {
            originalUrl: video.downloadUrl || video.videoUrls?.[0] || video.media_url
          },
          metadata: {
            originalCaption: video.caption || video.description,
            hashtags: platform === 'instagram' 
              ? InstagramService.extractHashtags(video.caption)
              : TikTokService.extractHashtags(video.description),
            originalHashtags: platform === 'instagram' 
              ? InstagramService.extractHashtags(video.caption)
              : TikTokService.extractHashtags(video.description),
            postDate: new Date(video.timestamp || video.createTime * 1000),
            duration: video.duration,
            dimensions: {
              width: video.dimensions?.width,
              height: video.dimensions?.height
            },
            thumbnail: {
              original: video.thumbnailUrl || video.coverImageUrl
            },
            stats: {
              likes: video.likeCount || video.stats?.likes,
              comments: video.commentsCount || video.stats?.comments,
              views: video.stats?.views,
              shares: video.stats?.shares,
              capturedAt: new Date()
            }
          },
          status: 'queued',
          importMethod: 'manual',
          priority
        });

        await content.save();

        // Queue for processing
        ContentProcessor.queue(content._id);

        importResults.push({
          videoId,
          success: true,
          contentId: content._id,
          status: content.status
        });

      } catch (error) {
        console.error('Import video error:', error);
        importResults.push({
          videoId: videoRequest.videoId,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      message: 'Import request processed',
      results: importResults,
      summary: {
        total: videos.length,
        successful: importResults.filter(r => r.success).length,
        failed: importResults.filter(r => !r.success).length
      }
    });
  } catch (error) {
    console.error('Import content error:', error);
    res.status(500).json({
      error: 'Import failed',
      message: error.message
    });
  }
});

// Get specific content item
router.get('/:contentId', authenticateToken, async (req, res) => {
  try {
    const content = await Content.findOne({
      _id: req.params.contentId,
      userId: req.userId
    }).populate('userId', 'firstName lastName email');

    if (!content) {
      return res.status(404).json({
        error: 'Content not found'
      });
    }

    res.json(content);
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      error: 'Failed to fetch content',
      message: error.message
    });
  }
});

// Update content metadata
router.put('/:contentId/metadata', authenticateToken, [
  body('editedTitle').optional().trim(),
  body('editedDescription').optional().trim(),
  body('tags').optional().isArray(),
  body('customThumbnail').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const content = await Content.findOne({
      _id: req.params.contentId,
      userId: req.userId
    });

    if (!content) {
      return res.status(404).json({
        error: 'Content not found'
      });
    }

    // Update metadata
    const updates = {};
    if (req.body.editedTitle !== undefined) {
      updates['metadata.editedTitle'] = req.body.editedTitle;
    }
    if (req.body.editedDescription !== undefined) {
      updates['metadata.editedDescription'] = req.body.editedDescription;
    }
    if (req.body.tags !== undefined) {
      updates['metadata.tags'] = req.body.tags;
    }
    if (req.body.customThumbnail !== undefined) {
      updates['metadata.thumbnail.custom'] = req.body.customThumbnail;
    }

    const updatedContent = await Content.findByIdAndUpdate(
      req.params.contentId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Metadata updated successfully',
      content: updatedContent
    });
  } catch (error) {
    console.error('Update metadata error:', error);
    res.status(500).json({
      error: 'Failed to update metadata',
      message: error.message
    });
  }
});

// Delete/Archive content
router.delete('/:contentId', authenticateToken, async (req, res) => {
  try {
    const content = await Content.findOne({
      _id: req.params.contentId,
      userId: req.userId
    });

    if (!content) {
      return res.status(404).json({
        error: 'Content not found'
      });
    }

    // Soft delete by archiving
    content.isArchived = true;
    content.archivedAt = new Date();
    await content.save();

    res.json({
      message: 'Content archived successfully'
    });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({
      error: 'Failed to delete content',
      message: error.message
    });
  }
});

// Get content statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const pipeline = [
      { $match: { userId: req.userId, isArchived: false } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byStatus: {
            $push: {
              status: '$status',
              platform: '$sourcePlatform'
            }
          },
          byPlatform: {
            $push: '$sourcePlatform'
          }
        }
      }
    ];

    const result = await Content.aggregate(pipeline);
    
    if (result.length === 0) {
      return res.json({
        total: 0,
        byStatus: {},
        byPlatform: {},
        recentActivity: []
      });
    }

    const stats = result[0];
    
    // Process status counts
    const statusCounts = {};
    const platformCounts = {};
    
    stats.byStatus.forEach(item => {
      statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
    });
    
    stats.byPlatform.forEach(platform => {
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    });

    // Get recent activity
    const recentContent = await Content.find({
      userId: req.userId,
      isArchived: false
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('metadata.editedTitle metadata.originalCaption sourcePlatform status createdAt');

    res.json({
      total: stats.total,
      byStatus: statusCounts,
      byPlatform: platformCounts,
      recentActivity: recentContent
    });
  } catch (error) {
    console.error('Get content stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch content statistics',
      message: error.message
    });
  }
});

// Retry failed content processing
router.post('/:contentId/retry', authenticateToken, async (req, res) => {
  try {
    const content = await Content.findOne({
      _id: req.params.contentId,
      userId: req.userId
    });

    if (!content) {
      return res.status(404).json({
        error: 'Content not found'
      });
    }

    if (content.status !== 'error') {
      return res.status(400).json({
        error: 'Content is not in error state'
      });
    }

    // Reset status and clear errors
    content.status = 'queued';
    content.errors = [];
    await content.save();

    // Queue for processing
    ContentProcessor.queue(content._id);

    res.json({
      message: 'Content queued for retry',
      content: {
        id: content._id,
        status: content.status
      }
    });
  } catch (error) {
    console.error('Retry content error:', error);
    res.status(500).json({
      error: 'Failed to retry content processing',
      message: error.message
    });
  }
});

module.exports = router;