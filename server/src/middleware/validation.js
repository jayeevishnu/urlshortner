const { body, param } = require('express-validator');

// Import utilities function at the end to avoid circular dependency
let isValidCustomCode;
try {
  const urlUtils = require('../utils/urlUtils');
  isValidCustomCode = urlUtils.isValidCustomCode;
} catch (error) {
  // Fallback validation function
  isValidCustomCode = (code) => {
    if (!code || typeof code !== 'string') return false;
    if (code.length < 3 || code.length > 20) return false;
    if (!/^[a-zA-Z0-9_-]+$/.test(code)) return false;
    return true;
  };
}

const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  ];

const validateShortenUrl = [
  body('originalUrl')
    .notEmpty()
    .withMessage('URL is required')
    .isLength({ max: 2048 })
    .withMessage('URL is too long (max 2048 characters)')
    .custom((value) => {
      // Basic URL format check - detailed validation happens in controller
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,})/i;
      if (!urlPattern.test(value)) {
        throw new Error('Please provide a valid URL format');
      }
      return true;
    }),
  body('customCode')
    .optional()
    .custom((value) => {
      if (value && !isValidCustomCode(value)) {
        throw new Error('Invalid custom code. Must be 3-20 characters, alphanumeric, underscore, or hyphen only. Reserved words are not allowed.');
      }
      return true;
    }),
];

const validateShortCode = [
  param('code')
    .isLength({ min: 3, max: 20 })
    .withMessage('Invalid short code format')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Invalid short code characters'),
];

const validateUpdateUrl = [
  param('code')
    .isLength({ min: 3, max: 20 })
    .withMessage('Invalid short code format'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('expiresAt must be a valid date'),
];

module.exports = {
  validateRegister,
  validateLogin,
  validateShortenUrl,
  validateShortCode,
  validateUpdateUrl,
}; 