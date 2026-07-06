const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

/**
 * Protect route — Verify JWT cookie or Bearer token
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Get token from cookies or Authorization header
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'You are not logged in. Please log in to get access.' });
  }

  let decoded;
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured.');
    }
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated. Contact support.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth protect database query error:', error);
    return res.status(500).json({ success: false, message: 'Database connection failed. Please try again.' });
  }
};

/**
 * Restrict to specific roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
    }
    next();
  };
};

/**
 * Optional protect — Sets req.user if token exists, continues regardless
 */
const optionalProtect = async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token && process.env.JWT_SECRET) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, role: true, isActive: true },
      });
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Silently continue without user
    }
  }

  next();
};

module.exports = { protect, restrictTo, optionalProtect };
