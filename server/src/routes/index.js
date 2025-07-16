const express = require('express');
const router = express.Router();

const { redirectUrl } = require('../controllers/urlController');
const { validateShortCode } = require('../middleware/validation');

// Import route modules
const authRoutes = require('./auth');
const urlRoutes = require('./urls');

// API routes
router.use('/api/auth', authRoutes);
router.use('/api/urls', urlRoutes);

// @route   GET /:code
// @desc    Redirect to original URL
// @access  Public
router.get('/:code', validateShortCode, redirectUrl);

// Health check route
router.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'URL Shortener API',
  });
});

module.exports = router; 