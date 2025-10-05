const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Auth middleware to verify JWT
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Auth middleware - Received token:', token);
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Auth middleware - Decoded user:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Check if user is owner
const isOwner = (req, res, next) => {
  if (req.user.userType !== 'owner') {
    return res.status(403).json({ message: 'Access denied. Owner privileges required.' });
  }
  next();
};

// Check if user is manager (or owner)
const isManager = (req, res, next) => {
  if (req.user.userType !== 'manager' && req.user.userType !== 'owner') {
    return res.status(403).json({ message: 'Access denied. Manager privileges required.' });
  }
  next();
};

module.exports = { auth, isOwner, isManager };
