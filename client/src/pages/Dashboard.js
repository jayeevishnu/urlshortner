import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-hot-toast';
import { 
  BarChart3, 
  Link as LinkIcon, 
  MousePointer, 
  Calendar,
  ExternalLink,
  Copy,
  Trash2,
  TrendingUp,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { urlAPI, apiUtils } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [copiedCode, setCopiedCode] = useState(null);

  // Fetch dashboard data
  const { 
    data: dashboardData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery(
    'dashboardStats',
    urlAPI.getDashboardStats,
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const handleCopyUrl = async (shortUrl, shortCode) => {
    const success = await apiUtils.copyToClipboard(shortUrl);
    if (success) {
      setCopiedCode(shortCode);
      toast.success('URL copied to clipboard!');
      setTimeout(() => setCopiedCode(null), 2000);
    } else {
      toast.error('Failed to copy URL');
    }
  };

  const handleDeleteUrl = async (shortCode) => {
    if (!window.confirm('Are you sure you want to delete this URL?')) return;
    
    try {
      await urlAPI.deleteUrl(shortCode);
      toast.success('URL deleted successfully');
      refetch(); // Refresh dashboard data
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete URL');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card p-8 text-center">
            <div className="text-red-500 mb-4">
              <BarChart3 className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              Failed to load dashboard
            </h3>
            <p className="text-secondary-600 mb-4">
              {error.response?.data?.error || 'Something went wrong'}
            </p>
            <button
              onClick={() => refetch()}
              className="btn btn-primary btn-md flex items-center space-x-2 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.data?.stats || {};
  const recentUrls = dashboardData?.data?.recentUrls || [];
  const topUrls = dashboardData?.data?.topUrls || [];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">
              Welcome back, {user?.username}! 👋
            </h1>
            <p className="text-secondary-600 mt-2">
              Here's what's happening with your shortened URLs.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <a
              href="/"
              className="btn btn-primary btn-md flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create New URL</span>
            </a>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-secondary-600 mb-1">Total URLs</h3>
                <p className="text-3xl font-bold text-primary-600">{stats.totalUrls || 0}</p>
              </div>
              <div className="p-3 bg-primary-100 rounded-lg">
                <LinkIcon className="h-6 w-6 text-primary-600" />
              </div>
            </div>
            <p className="text-sm text-secondary-500 mt-2">
              +{recentUrls.length} this week
            </p>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-secondary-600 mb-1">Total Clicks</h3>
                <p className="text-3xl font-bold text-green-600">{stats.totalClicks || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <MousePointer className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-secondary-500 mt-2">
              +{stats.clicksToday || 0} today
            </p>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-secondary-600 mb-1">This Month</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.clicksThisMonth || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-secondary-500 mt-2">
              Monthly clicks
            </p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-secondary-600 mb-1">Avg. CTR</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.totalUrls > 0 ? Math.round((stats.totalClicks / stats.totalUrls) * 100) / 100 : 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-secondary-500 mt-2">
              Clicks per URL
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent URLs */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-secondary-900">Recent URLs</h2>
              <button
                onClick={() => refetch()}
                className="text-secondary-500 hover:text-secondary-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            
            {recentUrls.length === 0 ? (
              <div className="text-center py-12">
                <LinkIcon className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-secondary-900 mb-2">No URLs yet</h3>
                <p className="text-secondary-600 mb-4">
                  Start by shortening your first URL!
                </p>
                <a href="/" className="btn btn-primary btn-md">
                  Create Your First URL
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {recentUrls.map((url) => (
                  <div key={url._id} className="border border-secondary-200 rounded-lg p-4 hover:bg-secondary-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <a
                            href={url.shortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            /{url.shortCode}
                          </a>
                          <span className={`badge ${url.isActive ? 'badge-success' : 'badge-warning'}`}>
                            {url.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-secondary-600 truncate mb-2">
                          {url.originalUrl}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-secondary-500">
                          <span>{url.totalClicks} clicks</span>
                          <span>{url.clicksToday} today</span>
                          <span>{new Date(url.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleCopyUrl(url.shortUrl, url.shortCode)}
                          className={`btn btn-sm ${
                            copiedCode === url.shortCode 
                              ? 'bg-green-100 text-green-700' 
                              : 'btn-secondary'
                          }`}
                          title="Copy URL"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <a
                          href={url.shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          title="Visit URL"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <button
                          onClick={() => handleDeleteUrl(url.shortCode)}
                          className="btn btn-sm text-red-600 hover:bg-red-50"
                          title="Delete URL"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Performing URLs */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-secondary-900 mb-6">Top Performing URLs</h2>
            
            {topUrls.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-secondary-900 mb-2">No data yet</h3>
                <p className="text-secondary-600">
                  Create some URLs to see your top performers!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {topUrls.map((url, index) => (
                  <div key={url.shortCode} className="flex items-center space-x-4">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-secondary-100 text-secondary-800'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <a
                          href={url.shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                        >
                          /{url.shortCode}
                        </a>
                      </div>
                      <p className="text-xs text-secondary-600 truncate">
                        {url.originalUrl}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-secondary-900">
                        {url.totalClicks}
                      </p>
                      <p className="text-xs text-secondary-500">clicks</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 card p-6">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="/"
              className="flex items-center space-x-3 p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors"
            >
              <Plus className="h-5 w-5 text-primary-600" />
              <span className="font-medium text-secondary-900">Create New URL</span>
            </a>
            <a
              href="/dashboard"
              onClick={() => refetch()}
              className="flex items-center space-x-3 p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors"
            >
              <RefreshCw className="h-5 w-5 text-green-600" />
              <span className="font-medium text-secondary-900">Refresh Data</span>
            </a>
            <a
              href="/urls"
              className="flex items-center space-x-3 p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors"
            >
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-secondary-900">View All URLs</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 