const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require authentication
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Not authorized, user not found'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          status: 'error',
          message: 'Account is deactivated'
        });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized, no token'
    });
  }
};

// Role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

// Check if user is owner
const isOwner = (req, res, next) => {
  if (req.user && req.user.role === 'owner') {
    next();
  } else {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Owner role required.'
    });
  }
};

// Check if user is manager or owner
const isManagerOrOwner = (req, res, next) => {
  if (req.user && (req.user.role === 'manager' || req.user.role === 'owner')) {
    next();
  } else {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Manager or Owner role required.'
    });
  }
};

// Check if user can access billing
const canAccessBilling = (req, res, next) => {
  if (req.user && ['owner', 'manager', 'staff'].includes(req.user.role)) {
    next();
  } else {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Billing access required.'
    });
  }
};

// Log user activity
const logActivity = (action) => {
  return async (req, res, next) => {
    try {
      if (req.user) {
        // You can implement activity logging here
        console.log(`User ${req.user.email} performed: ${action}`);
        
        // Optional: Save to database
        // await ActivityLog.create({
        //   user: req.user._id,
        //   action,
        //   timestamp: new Date(),
        //   ip: req.ip,
        //   userAgent: req.get('User-Agent')
        // });
      }
      next();
    } catch (error) {
      console.error('Activity logging error:', error);
      next(); // Continue even if logging fails
    }
  };
};

module.exports = {
  protect,
  authorize,
  isOwner,
  isManagerOrOwner,
  canAccessBilling,
  logActivity
};