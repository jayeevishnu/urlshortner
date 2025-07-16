const { nanoid, customAlphabet } = require('nanoid');
const Url = require('../models/Url');

const SAFE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
const generateSafeId = customAlphabet(SAFE_ALPHABET, 8);

const generateShortCode = async (length = 8, retries = 0) => {
  const MAX_RETRIES = 10;
  
  if (retries >= MAX_RETRIES) {
    length = Math.min(length + 1, 12);
    retries = 0;
  }
  
  try {
    const shortCode = length <= 8 ? generateSafeId() : customAlphabet(SAFE_ALPHABET, length)();
    
    const existingUrl = await Url.findOne({ shortCode }).lean();
    
    if (existingUrl) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 10));
      return generateShortCode(length, retries + 1);
    }
    
    return shortCode;
  } catch (error) {
    return nanoid(length);
  }
};

const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }
    
    if (!url.hostname || url.hostname.length < 4) {
      return false;
    }
    
    const hostname = url.hostname.toLowerCase();
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')) {
      return false;
    }
    
    if (!hostname.includes('.')) {
      return false;
    }
    
    const maliciousPatterns = [
      'javascript:',
      'data:',
      'vbscript:',
      'file:',
      'ftp:'
    ];
    
    if (maliciousPatterns.some(pattern => string.toLowerCase().includes(pattern))) {
      return false;
    }
    
    return true;
  } catch (_) {
    return false;
  }
};

const normalizeUrl = (url) => {
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const urlObj = new URL(url);
    
    urlObj.hostname = urlObj.hostname.toLowerCase();
    
    if (urlObj.pathname === '/') {
      urlObj.pathname = '';
    }
    
    if ((urlObj.protocol === 'https:' && urlObj.port === '443') ||
        (urlObj.protocol === 'http:' && urlObj.port === '80')) {
      urlObj.port = '';
    }
    
    return urlObj.toString();
  } catch (_) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'https://' + url;
    }
    return url;
  }
};

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return req.headers['x-real-ip'] ||
         req.headers['x-client-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.connection?.socket?.remoteAddress ||
         req.ip ||
         '127.0.0.1';
};

const isValidCustomCode = (code) => {
  if (!code || typeof code !== 'string') return false;
  
  if (code.length < 3 || code.length > 20) return false;
  
  if (!/^[a-zA-Z0-9_-]+$/.test(code)) return false;
  
  const reservedWords = [
    'api', 'admin', 'www', 'app', 'mail', 'ftp', 'localhost', 
    'stats', 'dashboard', 'login', 'register', 'signup', 'signin',
    'auth', 'oauth', 'callback', 'webhook', 'health', 'status',
    'about', 'contact', 'help', 'support', 'terms', 'privacy',
    'robots', 'sitemap', 'favicon', 'apple', 'android', 'ios'
  ];
  
  if (reservedWords.includes(code.toLowerCase())) return false;
  
    if (/^(.)\1{2,}$/.test(code)) return false; // aaa, bbb, etc.
  if (/^(123|abc|xyz|test|demo)$/i.test(code)) return false;
  
  return true;
};

// Generate URL hash for duplicate detection
const generateUrlHash = (url, userId = null) => {
  const crypto = require('crypto');
  const normalizedUrl = normalizeUrl(url);
  const hashInput = `${normalizedUrl}:${userId || 'anonymous'}`;
  return crypto.createHash('sha256').update(hashInput).digest('hex').substring(0, 16);
};

module.exports = {
  generateShortCode,
  isValidUrl,
  normalizeUrl,
  getClientIp,
  isValidCustomCode,
  generateUrlHash,
  SAFE_ALPHABET,
}; 