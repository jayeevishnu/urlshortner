import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  getProfile: () => api.get('/api/auth/profile'),
};

// URL API
export const urlAPI = {
  shorten: (urlData) => api.post('/api/urls/shorten', urlData),
  getUserUrls: (params = {}) => api.get('/api/urls/my', { params }),
  getDashboardStats: () => api.get('/api/urls/dashboard'),
  getStats: (code) => api.get(`/api/urls/stats/${code}`),
  updateUrl: (code, data) => api.put(`/api/urls/${code}`, data),
  deleteUrl: (code) => api.delete(`/api/urls/${code}`),
  redirect: (code) => `${API_BASE_URL}/${code}`,
  
  getAllUrls: (page = 1, limit = 20, filters = {}) => {
    const params = { page, limit, ...filters };
    return api.get('/api/urls/my', { params });
  },
  
  searchUrls: (query, page = 1, limit = 20) => { // not backend api right now 
    const params = { page, limit, search: query };
    return api.get('/api/urls/my', { params });
  },
  
  bulkUpdateUrls: (codes, updateData) => {
    return Promise.all(codes.map(code => api.put(`/api/urls/${code}`, updateData)));
  },
  
  bulkDeleteUrls: (codes) => {
    return Promise.all(codes.map(code => api.delete(`/api/urls/${code}`)));
  },
  
  exportUrls: (format = 'csv') => {
    return api.get('/api/urls/export', { 
      params: { format },
      responseType: 'blob'
    });
  },
};

// General API utilities
export const apiUtils = {
  isValidUrl: (string) => {
    try {
      // Add protocol if missing for validation
      const urlToValidate = string.startsWith('http://') || string.startsWith('https://') 
        ? string 
        : `https://${string}`;
      
      const url = new URL(urlToValidate);
      
      // Check for valid protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        return false;
      }
      
      // Check hostname
      if (!url.hostname || url.hostname.length < 4) {
        return false;
      }
      
      // Check for valid TLD
      if (!url.hostname.includes('.')) {
        return false;
      }
      
      // Prevent localhost and internal IPs
      const hostname = url.hostname.toLowerCase();
      if (hostname === 'localhost' || 
          hostname === '127.0.0.1' || 
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('172.')) {
        return false;
      }
      
      return true;
    } catch (_) {
      return false;
    }
  },
  
  formatUrl: (url) => {
    if (!url) return '';
    
    const trimmedUrl = url.trim();
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      return `https://${trimmedUrl}`;
    }
    return trimmedUrl;
  },

  copyToClipboard: async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const result = document.execCommand('copy');
        document.body.removeChild(textArea);
        return result;
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      return false;
    }
  },

  formatDate: (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      return 'Invalid date';
    }
  },

  formatDateTime: (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return 'Invalid date';
    }
  },

  formatNumber: (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  },

  truncateUrl: (url, maxLength = 50) => {
    if (!url) return '';
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength - 3) + '...';
  },

  getTimeAgo: (dateString) => {
    try {
      const now = new Date();
      const past = new Date(dateString);
      const diffInSeconds = Math.floor((now - past) / 1000);

      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      return apiUtils.formatDate(dateString);
    } catch (err) {
      return 'Unknown';
    }
  },
  
  validateCustomCode: (code) => {
    if (!code) return { valid: true };
    
    // Length check
    if (code.length < 3 || code.length > 20) {
      return { valid: false, message: 'Custom code must be 3-20 characters long' };
    }
    
    // Character check
    if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
      return { valid: false, message: 'Custom code can only contain letters, numbers, underscores, and hyphens' };
    }
    
    // Reserved words check
    const reservedWords = [
      'api', 'admin', 'www', 'app', 'mail', 'ftp', 'localhost', 
      'stats', 'dashboard', 'login', 'register', 'signup', 'signin',
      'auth', 'oauth', 'callback', 'webhook', 'health', 'status'
    ];
    
    if (reservedWords.includes(code.toLowerCase())) {
      return { valid: false, message: 'This custom code is reserved. Please choose another.' };
    }
    
    return { valid: true };
  },
  
  copyToClipboard: async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        return true;
      } catch (err) {
        return false;
      } finally {
        document.body.removeChild(textArea);
      }
    }
  },
};

export default api; 