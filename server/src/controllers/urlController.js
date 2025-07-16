const { validationResult } = require('express-validator');
const Url = require('../models/Url');
const { 
  generateShortCode, 
  isValidUrl, 
  normalizeUrl, 
  getClientIp, 
  isValidCustomCode,
  generateUrlHash 
} = require('../utils/urlUtils');
const { logger } = require('../utils/logger');

const shortenUrl = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    let { originalUrl, customCode } = req.body;
    
    // Input sanitization
    if (!originalUrl || typeof originalUrl !== 'string') {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Trim whitespace and normalize
    originalUrl = originalUrl.trim();
    if (originalUrl.length > 2048) {
      return res.status(400).json({ error: 'URL is too long (max 2048 characters)' });
    }

    // Normalize URL
    originalUrl = normalizeUrl(originalUrl);

    // Enhanced URL validation
    if (!isValidUrl(originalUrl)) {
      return res.status(400).json({ 
        error: 'Invalid URL. Please provide a valid HTTP or HTTPS URL.' 
      });
    }

    // Validate custom code if provided
    if (customCode) {
      customCode = customCode.trim();
      if (!isValidCustomCode(customCode)) {
        return res.status(400).json({ 
          error: 'Invalid custom code. Must be 3-20 characters, alphanumeric, underscore, or hyphen only. Reserved words are not allowed.' 
        });
      }
      
      // Check if custom code is available with atomic operation
      const existingCustom = await Url.findOne({ shortCode: customCode }).lean();
      if (existingCustom) {
        return res.status(400).json({ error: 'Custom code already taken. Please choose another.' });
      }
    }

    // Generate URL hash for efficient duplicate detection
    const urlHash = generateUrlHash(originalUrl, req.user ? req.user._id.toString() : null);
    
    // Check for existing URL by hash (more efficient than URL string comparison)
    const existingUrl = await Url.findOne({ 
      user: req.user ? req.user._id : null,
      $or: [
        { originalUrl },
        { urlHash }
      ]
    }).lean();

    if (existingUrl) {
      return res.json({
        message: 'URL already shortened',
        url: existingUrl,
        shortUrl: `${process.env.API_BASE_URL}/${existingUrl.shortCode}`,
      });
    }

    // Generate short code with professional collision handling
    const shortCode = customCode || await generateShortCode();

    // Create new URL with hash for faster lookups
    const url = new Url({
      originalUrl,
      shortCode,
      urlHash,
      user: req.user ? req.user._id : null,
    });

    await url.save();

    logger.info(`URL shortened: ${originalUrl} -> ${shortCode}`);

    res.status(201).json({
      message: 'URL shortened successfully',
      url,
      shortUrl: `${process.env.API_BASE_URL}/${shortCode}`,
    });
  } catch (error) {
    logger.error('URL shortening error:', error);
    res.status(500).json({ error: 'Server error during URL shortening' });
  }
};

const redirectUrl = async (req, res) => {
  try {
    const { code } = req.params;
    
    const url = await Url.findOne({ shortCode: code, isActive: true });
    
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    // Check if URL has expired
    if (url.expiresAt && url.expiresAt < new Date()) {
      return res.status(410).json({ error: 'URL has expired' });
    }

    // Track click
    const ip = getClientIp(req);
    const userAgent = req.get('User-Agent');
    
    await url.addClick(ip, userAgent);

    logger.info(`URL accessed: ${code} -> ${url.originalUrl}`);

    // Redirect to original URL
    res.redirect(url.originalUrl);
  } catch (error) {
    logger.error('URL redirect error:', error);
    res.status(500).json({ error: 'Server error during redirection' });
  }
};

const getUrlStats = async (req, res) => {
  try {
    const { code } = req.params;
    
    const url = await Url.findOne({ shortCode: code })
      .populate('user', 'username email');
    
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    // Check if user has access to stats
    if (url.user && (!req.user || url.user._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Calculate statistics
    const stats = {
      url: {
        shortCode: url.shortCode,
        originalUrl: url.originalUrl,
        totalClicks: url.totalClicks,
        clicksToday: url.clicksToday,
        clicksThisWeek: url.clicksThisWeek,
        createdAt: url.createdAt,
        isActive: url.isActive,
        expiresAt: url.expiresAt,
      },
      clickHistory: url.clicks.map(click => ({
        ip: click.ip.substring(0, click.ip.lastIndexOf('.')) + '.xxx', // Anonymize IP
        timestamp: click.timestamp,
        userAgent: click.userAgent,
      })),
    };

    res.json(stats);
  } catch (error) {
    logger.error('Get URL stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getUserUrls = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const urls = await Url.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Url.countDocuments({ user: req.user._id });

    res.json({
      urls: urls.map(url => ({
        ...url.toObject(),
        shortUrl: `${process.env.API_BASE_URL}/${url.shortCode}`,
        clicksToday: url.clicksToday,
        clicksThisWeek: url.clicksThisWeek,
      })),
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    logger.error('Get user URLs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteUrl = async (req, res) => {
  try {
    const { code } = req.params;
    
    const url = await Url.findOne({ 
      shortCode: code, 
      user: req.user._id 
    });
    
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    await Url.deleteOne({ _id: url._id });

    logger.info(`URL deleted: ${code}`);

    res.json({ message: 'URL deleted successfully' });
  } catch (error) {
    logger.error('Delete URL error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateUrl = async (req, res) => {
  try {
    const { code } = req.params;
    const { isActive, expiresAt } = req.body;
    
    const url = await Url.findOne({ 
      shortCode: code, 
      user: req.user._id 
    });
    
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    if (typeof isActive !== 'undefined') {
      url.isActive = isActive;
    }
    
    if (expiresAt) {
      url.expiresAt = new Date(expiresAt);
    }

    await url.save();

    logger.info(`URL updated: ${code}`);

    res.json({
      message: 'URL updated successfully',
      url,
    });
  } catch (error) {
    logger.error('Update URL error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const urls = await Url.find({ user: userId }).lean();
    
    const totalUrls = urls.length;
    const totalClicks = urls.reduce((sum, url) => sum + url.totalClicks, 0);
    
    const currentMonth = new Date();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    
    const clicksThisMonth = urls.reduce((sum, url) => {
      const monthClicks = url.clicks.filter(click => 
        new Date(click.timestamp) >= firstDayOfMonth
      ).length;
      return sum + monthClicks;
    }, 0);
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const clicksToday = urls.reduce((sum, url) => {
      const todayClicks = url.clicks.filter(click => 
        new Date(click.timestamp) >= startOfDay
      ).length;
      return sum + todayClicks;
    }, 0);
    
    const recentUrls = await Url.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    const formattedRecentUrls = recentUrls.map(url => ({
      ...url,
      shortUrl: `${process.env.API_BASE_URL}/${url.shortCode}`,
      clicksToday: url.clicks.filter(click => 
        new Date(click.timestamp) >= startOfDay
      ).length,
      clicksThisWeek: url.clicks.filter(click => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(click.timestamp) >= weekAgo;
      }).length,
    }));
    
    const topUrls = urls
      .sort((a, b) => b.totalClicks - a.totalClicks)
      .slice(0, 5)
      .map(url => ({
        shortCode: url.shortCode,
        originalUrl: url.originalUrl,
        totalClicks: url.totalClicks,
        shortUrl: `${process.env.API_BASE_URL}/${url.shortCode}`,
        createdAt: url.createdAt,
      }));

    res.json({
      stats: {
        totalUrls,
        totalClicks,
        clicksThisMonth,
        clicksToday,
      },
      recentUrls: formattedRecentUrls,
      topUrls,
      chartData: {
        last7Days: Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          const dayEnd = new Date(dayStart);
          dayEnd.setDate(dayEnd.getDate() + 1);
          
          const dayClicks = urls.reduce((sum, url) => {
            const dayClicksCount = url.clicks.filter(click => {
              const clickDate = new Date(click.timestamp);
              return clickDate >= dayStart && clickDate < dayEnd;
            }).length;
            return sum + dayClicksCount;
          }, 0);
          
          return {
            date: date.toISOString().split('T')[0],
            clicks: dayClicks,
          };
        }),
      },
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  shortenUrl,
  redirectUrl,
  getUrlStats,
  getUserUrls,
  deleteUrl,
  updateUrl,
  getDashboardStats,
}; 