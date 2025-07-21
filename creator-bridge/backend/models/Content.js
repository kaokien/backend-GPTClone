const mongoose = require('mongoose');

const metadataSchema = new mongoose.Schema({
  originalCaption: String,
  editedTitle: String,
  editedDescription: String,
  hashtags: [String],
  originalHashtags: [String],
  tags: [String],
  postDate: Date,
  duration: Number, // in seconds
  dimensions: {
    width: Number,
    height: Number
  },
  fileSize: Number, // in bytes
  format: String,
  thumbnail: {
    original: String, // URL to original thumbnail
    custom: String,   // URL to custom thumbnail
    generated: String // URL to generated thumbnail
  },
  stats: {
    likes: Number,
    comments: Number,
    shares: Number,
    views: Number,
    capturedAt: Date
  }
});

const contentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Source platform information
  sourcePlatform: {
    type: String,
    enum: ['instagram', 'tiktok'],
    required: true
  },
  sourceAccountId: {
    type: String,
    required: true
  },
  sourcePostId: {
    type: String,
    required: true,
    unique: true
  },
  sourceUrl: String,
  
  // Content files
  videoFile: {
    originalUrl: String,    // URL from social platform
    downloadedUrl: String,  // URL after downloading to temp storage
    processedUrl: String,   // URL after processing (if any)
    localPath: String,      // Local file path (temporary)
    fileSize: Number,
    format: String,
    checksum: String
  },
  
  // Metadata
  metadata: metadataSchema,
  
  // Processing status
  status: {
    type: String,
    enum: ['queued', 'downloading', 'processing', 'ready', 'syncing', 'synced', 'error'],
    default: 'queued'
  },
  
  // Sync information
  syncHistory: [{
    destination: {
      type: String,
      enum: ['jwplayer', 'vimeo', 'wistia']
    },
    destinationId: String, // ID on destination platform
    destinationUrl: String,
    syncedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'success', 'failed']
    },
    error: String,
    metadata: {
      title: String,
      description: String,
      tags: [String],
      thumbnail: String
    }
  }],
  
  // Auto-sync settings
  autoSync: {
    enabled: {
      type: Boolean,
      default: false
    },
    destinations: [String], // Array of destination platform names
    lastAutoSyncAt: Date
  },
  
  // Processing errors
  errors: [{
    stage: {
      type: String,
      enum: ['download', 'processing', 'upload', 'sync']
    },
    message: String,
    details: mongoose.Schema.Types.Mixed,
    occurredAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Import information
  importedAt: {
    type: Date,
    default: Date.now
  },
  importMethod: {
    type: String,
    enum: ['manual', 'auto', 'bulk'],
    default: 'manual'
  },
  
  // Archive/soft delete
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  
  // Processing priority
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  }
}, {
  timestamps: true
});

// Indexes for better query performance
contentSchema.index({ userId: 1, sourcePlatform: 1 });
contentSchema.index({ sourcePostId: 1 }, { unique: true });
contentSchema.index({ status: 1 });
contentSchema.index({ 'autoSync.enabled': 1, 'autoSync.lastAutoSyncAt': 1 });
contentSchema.index({ importedAt: -1 });

// Virtual for current sync status
contentSchema.virtual('currentSyncStatus').get(function() {
  if (this.syncHistory && this.syncHistory.length > 0) {
    const latest = this.syncHistory[this.syncHistory.length - 1];
    return latest.status;
  }
  return 'not_synced';
});

// Method to add sync history entry
contentSchema.methods.addSyncEntry = function(syncData) {
  this.syncHistory.push({
    destination: syncData.destination,
    destinationId: syncData.destinationId,
    destinationUrl: syncData.destinationUrl,
    syncedAt: new Date(),
    status: syncData.status || 'pending',
    error: syncData.error,
    metadata: syncData.metadata
  });
};

// Method to update metadata
contentSchema.methods.updateMetadata = function(updates) {
  Object.assign(this.metadata, updates);
};

// Method to mark as error
contentSchema.methods.markAsError = function(stage, message, details = {}) {
  this.status = 'error';
  this.errors.push({
    stage,
    message,
    details,
    occurredAt: new Date()
  });
};

// Static method to get content by status
contentSchema.statics.getByStatus = function(status, limit = 50) {
  return this.find({ status })
    .populate('userId', 'firstName lastName email')
    .limit(limit)
    .sort({ createdAt: -1 });
};

// Static method to get pending auto-sync content
contentSchema.statics.getPendingAutoSync = function() {
  return this.find({
    'autoSync.enabled': true,
    status: 'ready',
    $or: [
      { 'autoSync.lastAutoSyncAt': { $exists: false } },
      { 'autoSync.lastAutoSyncAt': { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
    ]
  }).populate('userId');
};

module.exports = mongoose.model('Content', contentSchema);