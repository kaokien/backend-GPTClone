const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token and attach user to request
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        error: 'Invalid token or user not found',
        code: 'INVALID_TOKEN'
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Role-based authorization
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    const hasRole = allowedRoles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: userRoles
      });
    }
    
    next();
  };
};

// Check if user owns the resource
const requireOwnership = (resourceField = 'userId') => {
  return (req, res, next) => {
    const resourceUserId = req.params[resourceField] || req.body[resourceField] || req.query[resourceField];
    
    if (!resourceUserId) {
      return res.status(400).json({ 
        error: 'Resource ownership cannot be determined',
        code: 'OWNERSHIP_CHECK_FAILED'
      });
    }

    // Admins can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    if (req.userId.toString() !== resourceUserId.toString()) {
      return res.status(403).json({ 
        error: 'Access denied: You can only access your own resources',
        code: 'OWNERSHIP_DENIED'
      });
    }
    
    next();
  };
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireOwnership,
  generateToken
};