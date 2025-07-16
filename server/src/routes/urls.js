const express = require('express');
const router = express.Router();

const {
  shortenUrl,
  redirectUrl,
  getUrlStats,
  getUserUrls,
  deleteUrl,
  updateUrl,
  getDashboardStats,
} = require('../controllers/urlController');

const {
  validateShortenUrl,
  validateShortCode,
  validateUpdateUrl,
} = require('../middleware/validation');

const { auth, optionalAuth } = require('../middleware/auth');

router.post('/shorten', validateShortenUrl, optionalAuth, shortenUrl);

router.get('/my', auth, getUserUrls);

router.get('/dashboard', auth, getDashboardStats);

router.get('/stats/:code', validateShortCode, optionalAuth, getUrlStats);

router.put('/:code', validateUpdateUrl, auth, updateUrl);

router.delete('/:code', validateShortCode, auth, deleteUrl);

module.exports = router; 