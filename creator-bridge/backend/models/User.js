const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const platformConnectionSchema = new mongoose.Schema({
  platform: {
    type: String,
    enum: ['instagram', 'tiktok'],
    required: true
  },
  accountId: {
    type: String,
    required: true
  },
  accountHandle: String,
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: String,
  tokenExpiry: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  connectedAt: {
    type: Date,
    default: Date.now
  },
  lastSyncAt: Date,
  autoSync: {
    type: Boolean,
    default: false
  }
});

const destinationConnectionSchema = new mongoose.Schema({
  platform: {
    type: String,
    enum: ['jwplayer', 'vimeo', 'wistia'],
    required: true
  },
  apiKey: {
    type: String,
    required: true
  },
  apiSecret: String,
  siteid: String, // For JW Player
  isActive: {
    type: Boolean,
    default: true
  },
  connectedAt: {
    type: Date,
    default: Date.now
  },
  lastUsedAt: Date
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  company: String,
  role: {
    type: String,
    enum: ['admin', 'manager', 'user'],
    default: 'user'
  },
  platformConnections: [platformConnectionSchema],
  destinationConnections: [destinationConnectionSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: Date,
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpiry: Date
}, {
  timestamps: true
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get active platform connections
userSchema.methods.getActivePlatformConnections = function() {
  return this.platformConnections.filter(conn => conn.isActive);
};

// Get active destination connections
userSchema.methods.getActiveDestinationConnections = function() {
  return this.destinationConnections.filter(conn => conn.isActive);
};

module.exports = mongoose.model('User', userSchema);