require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');

// Route files
const authRoutes = require('./routes/authRoutes');
const storefrontRoutes = require('./routes/storefrontRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');

const app = express();

// Trust proxy for rate-limiting behind Render/Cloudflare proxy
app.set('trust proxy', 1);

// ─── 1. Request Logging ──────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ─── 2. Security Headers ────────────────────────────────────
// Disable crossOriginResourcePolicy so uploaded images can be loaded cross-origin
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// ─── 3. Response Compression ────────────────────────────────
app.use(compression());

// ─── 3.5. Serve uploads folder statically (with cross-origin headers) ───
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// ─── 4. Cross-Origin Resource Sharing ───────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5500',
  'http://127.0.0.1:5500',
  process.env.ADMIN_URL || 'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  // Production Whitelists (with/without www.)
  'https://mantraaq.com',
  'https://www.mantraaq.com',
  'https://admin.mantraaq.com',
  'https://www.admin.mantraaq.com'
];

// Add NGROK URL if configured (for webhook testing)
if (process.env.NGROK_URL) {
  allowedOrigins.push(process.env.NGROK_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile, Postman, server-to-server, webhooks)
    // Also allow PayU & CitrusPay domains for checkout redirects
    const isPayU = origin && (origin.endsWith('payu.in') || origin.endsWith('citruspay.com'));
    const isLocalIP = origin && (
      origin.startsWith('http://192.168.') ||
      origin.startsWith('http://10.') ||
      origin.startsWith('http://172.') ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1')
    );
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || isPayU || isLocalIP) {
      callback(null, true);
    } else {
      callback(null, false); // Block CORS headers on client, but do not throw internal error
    }
  },
  credentials: true,
}));

// ─── 5. Body Parsers ────────────────────────────────────────
// Store raw body for payment signature verification
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  },
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── 6. Cookie Parser ──────────────────────────────────────
app.use(cookieParser());

// ─── 7. Rate Limiting ──────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Strict: 20 attempts per 15 min on auth endpoints
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply strict limiter to auth endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

// Apply general limiter to checkout
app.use('/api/checkout', generalLimiter);

// Disable caching for all API endpoints
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// ─── 8. Mount Routes ───────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/storefront', storefrontRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wishlist', wishlistRoutes);



// ─── 9. Health Check ───────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── 10. 404 Handler ───────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ─── 11. Global Error Handler ──────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);

  // Don't leak internal error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal Server Error'
    : err.message || 'Internal Server Error';

  res.status(err.status || 500).json({
    success: false,
    message,
  });
});

// ─── 12. Start Server ──────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);

  // Start abandoned order cleanup (every 10 minutes)
  const checkoutController = require('./controllers/checkoutController');
  if (typeof checkoutController.cleanupAbandonedOrders === 'function') {
    setInterval(() => {
      checkoutController.cleanupAbandonedOrders().catch(err =>
        console.error('Abandoned order cleanup error:', err)
      );
    }, 10 * 60 * 1000); // Every 10 minutes
    console.log('Abandoned order cleanup scheduler started (every 10 min).');
  }
});

// ─── 13. Graceful Shutdown ─────────────────────────────────
const prisma = require('./config/db');

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Database disconnected. Process terminated.');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
