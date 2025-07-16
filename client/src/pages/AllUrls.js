import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc,
  MoreVertical,
  Copy,
  ExternalLink,
  Edit,
  Trash2,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  Calendar,
  Link as LinkIcon,
  MousePointer,
  Plus,
  RefreshCw,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { urlAPI, apiUtils } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const AllUrls = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedUrls, setSelectedUrls] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'all', // all, active, inactive
    dateRange: 'all', // all, today, week, month, custom
    customDateStart: '',
    customDateEnd: '',
    minClicks: '',
    maxClicks: ''
  });

  // Fetch URLs with pagination and filters
  const { 
    data: urlsData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery(
    ['allUrls', currentPage, pageSize, searchQuery, sortField, sortOrder, filters],
    () => urlAPI.getAllUrls(currentPage, pageSize, {
      search: searchQuery,
      sortBy: sortField,
      sortOrder,
      ...filters
    }),
    {
      keepPreviousData: true,
      staleTime: 30000, // 30 seconds
    }
  );

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation(
    (codes) => urlAPI.bulkDeleteUrls(codes),
    {
      onSuccess: () => {
        toast.success('URLs deleted successfully');
        setSelectedUrls(new Set());
        queryClient.invalidateQueries('allUrls');
        queryClient.invalidateQueries('dashboardStats');
      },
      onError: (error) => {
        toast.error('Failed to delete some URLs');
        console.error('Bulk delete error:', error);
      }
    }
  );

  // Individual delete mutation
  const deleteMutation = useMutation(
    (code) => urlAPI.deleteUrl(code),
    {
      onSuccess: () => {
        toast.success('URL deleted successfully');
        queryClient.invalidateQueries('allUrls');
        queryClient.invalidateQueries('dashboardStats');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete URL');
      }
    }
  );

  // Update URL mutation
  const updateMutation = useMutation(
    ({ code, data }) => urlAPI.updateUrl(code, data),
    {
      onSuccess: () => {
        toast.success('URL updated successfully');
        queryClient.invalidateQueries('allUrls');
        queryClient.invalidateQueries('dashboardStats');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update URL');
      }
    }
  );

  const urls = urlsData?.data?.urls || [];
  const pagination = urlsData?.data?.pagination || {};

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // Handle selection
  const handleSelectAll = () => {
    if (selectedUrls.size === urls.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(urls.map(url => url.shortCode)));
    }
  };

  const handleSelectUrl = (shortCode) => {
    const newSelected = new Set(selectedUrls);
    if (newSelected.has(shortCode)) {
      newSelected.delete(shortCode);
    } else {
      newSelected.add(shortCode);
    }
    setSelectedUrls(newSelected);
  };

  // Handle copy URL
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

  // Handle delete
  const handleDelete = (shortCode) => {
    if (window.confirm('Are you sure you want to delete this URL?')) {
      deleteMutation.mutate(shortCode);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedUrls.size === 0) return;
    
    const urlCount = selectedUrls.size;
    if (window.confirm(`Are you sure you want to delete ${urlCount} URL${urlCount > 1 ? 's' : ''}?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedUrls));
    }
  };

  // Handle toggle active status
  const handleToggleActive = (url) => {
    updateMutation.mutate({
      code: url.shortCode,
      data: { isActive: !url.isActive }
    });
  };

  // Filter URLs based on current filters
  const filteredUrls = useMemo(() => {
    return urls.filter(url => {
      // Status filter
      if (filters.status === 'active' && !url.isActive) return false;
      if (filters.status === 'inactive' && url.isActive) return false;
      
      // Date range filter
      if (filters.dateRange !== 'all') {
        const urlDate = new Date(url.createdAt);
        const now = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            if (urlDate < today) return false;
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (urlDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (urlDate < monthAgo) return false;
            break;
          case 'custom':
            if (filters.customDateStart && urlDate < new Date(filters.customDateStart)) return false;
            if (filters.customDateEnd && urlDate > new Date(filters.customDateEnd)) return false;
            break;
        }
      }
      
      // Click count filters
      if (filters.minClicks && url.totalClicks < parseInt(filters.minClicks)) return false;
      if (filters.maxClicks && url.totalClicks > parseInt(filters.maxClicks)) return false;
      
      return true;
    });
  }, [urls, filters]);

  // Clear filters
  const clearFilters = () => {
    setFilters({
      status: 'all',
      dateRange: 'all',
      customDateStart: '',
      customDateEnd: '',
      minClicks: '',
      maxClicks: ''
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  if (error) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card p-8 text-center">
            <div className="text-red-500 mb-4">
              <LinkIcon className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              Failed to load URLs
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

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">
              All URLs ({pagination.total || 0})
            </h1>
            <p className="text-secondary-600 mt-2">
              Manage and monitor all your shortened URLs in one place.
            </p>
          </div>
          <div className="mt-4 lg:mt-0 flex flex-wrap gap-3">
            <a
              href="/"
              className="btn btn-primary btn-md flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create New URL</span>
            </a>
            <button
              onClick={() => refetch()}
              className="btn btn-secondary btn-md flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search URLs, codes, or domains..."
                  className="input pl-10 w-full"
                />
              </div>
            </form>

            <div className="flex items-center space-x-3">
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn btn-md flex items-center space-x-2 ${
                  showFilters ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </button>

              {/* Bulk Actions */}
              {selectedUrls.size > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-secondary-600">
                    {selectedUrls.size} selected
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteMutation.isLoading}
                    className="btn btn-sm bg-red-100 text-red-700 hover:bg-red-200 flex items-center space-x-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-secondary-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="input w-full"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Date Range
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                    className="input w-full"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {/* Min Clicks Filter */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Min Clicks
                  </label>
                  <input
                    type="number"
                    value={filters.minClicks}
                    onChange={(e) => setFilters(prev => ({ ...prev, minClicks: e.target.value }))}
                    placeholder="0"
                    className="input w-full"
                    min="0"
                  />
                </div>

                {/* Max Clicks Filter */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Max Clicks
                  </label>
                  <input
                    type="number"
                    value={filters.maxClicks}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxClicks: e.target.value }))}
                    placeholder="No limit"
                    className="input w-full"
                    min="0"
                  />
                </div>
              </div>

              {/* Custom Date Range */}
              {filters.dateRange === 'custom' && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={filters.customDateStart}
                      onChange={(e) => setFilters(prev => ({ ...prev, customDateStart: e.target.value }))}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={filters.customDateEnd}
                      onChange={(e) => setFilters(prev => ({ ...prev, customDateEnd: e.target.value }))}
                      className="input w-full"
                    />
                  </div>
                </div>
              )}

              {/* Clear Filters */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="btn btn-secondary btn-sm flex items-center space-x-1"
                >
                  <X className="h-3 w-3" />
                  <span>Clear Filters</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* URLs Table */}
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <LoadingSpinner size="lg" text="Loading URLs..." />
            </div>
          ) : filteredUrls.length === 0 ? (
            <div className="p-12 text-center">
              <LinkIcon className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 mb-2">
                {searchQuery || Object.values(filters).some(f => f && f !== 'all') 
                  ? 'No URLs found' 
                  : 'No URLs yet'
                }
              </h3>
              <p className="text-secondary-600 mb-4">
                {searchQuery || Object.values(filters).some(f => f && f !== 'all') 
                  ? 'Try adjusting your search or filters.' 
                  : 'Start by creating your first shortened URL!'
                }
              </p>
              {!searchQuery && !Object.values(filters).some(f => f && f !== 'all') && (
                <a href="/" className="btn btn-primary btn-md">
                  Create Your First URL
                </a>
              )}
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-secondary-200">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <button
                          onClick={handleSelectAll}
                          className="text-secondary-400 hover:text-secondary-600"
                        >
                          {selectedUrls.size === filteredUrls.length ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </th>
                      
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('shortCode')}
                          className="flex items-center space-x-1 hover:text-secondary-700"
                        >
                          <span>Short URL</span>
                          {sortField === 'shortCode' && (
                            sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                          )}
                        </button>
                      </th>
                      
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Original URL
                      </th>
                      
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('totalClicks')}
                          className="flex items-center space-x-1 hover:text-secondary-700"
                        >
                          <span>Clicks</span>
                          {sortField === 'totalClicks' && (
                            sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                          )}
                        </button>
                      </th>
                      
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Status
                      </th>
                      
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('createdAt')}
                          className="flex items-center space-x-1 hover:text-secondary-700"
                        >
                          <span>Created</span>
                          {sortField === 'createdAt' && (
                            sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                          )}
                        </button>
                      </th>
                      
                      <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  
                  <tbody className="bg-white divide-y divide-secondary-200">
                    {filteredUrls.map((url) => (
                      <tr key={url._id} className="hover:bg-secondary-50">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleSelectUrl(url.shortCode)}
                            className="text-secondary-400 hover:text-secondary-600"
                          >
                            {selectedUrls.has(url.shortCode) ? (
                              <CheckSquare className="h-4 w-4" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <a
                              href={url.shortUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-700 font-medium"
                            >
                              /{url.shortCode}
                            </a>
                            <button
                              onClick={() => handleCopyUrl(url.shortUrl, url.shortCode)}
                              className={`p-1 rounded hover:bg-secondary-100 ${
                                copiedCode === url.shortCode 
                                  ? 'text-green-600' 
                                  : 'text-secondary-400'
                              }`}
                              title="Copy URL"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <p className="text-sm text-secondary-900 truncate" title={url.originalUrl}>
                              {apiUtils.truncateUrl(url.originalUrl, 40)}
                            </p>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-1">
                            <MousePointer className="h-3 w-3 text-secondary-400" />
                            <span className="text-sm font-medium text-secondary-900">
                              {apiUtils.formatNumber(url.totalClicks)}
                            </span>
                            {url.clicksToday > 0 && (
                              <span className="text-xs text-green-600">
                                (+{url.clicksToday} today)
                              </span>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleActive(url)}
                            disabled={updateMutation.isLoading}
                            className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${
                              url.isActive
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {url.isActive ? (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </button>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex flex-col text-sm text-secondary-500">
                            <span>{apiUtils.formatDate(url.createdAt)}</span>
                            <span className="text-xs">{apiUtils.getTimeAgo(url.createdAt)}</span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <a
                              href={`/stats/${url.shortCode}`}
                              className="btn btn-sm btn-secondary"
                              title="View Statistics"
                            >
                              <Eye className="h-3 w-3" />
                            </a>
                            <a
                              href={url.shortUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-secondary"
                              title="Visit URL"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <button
                              onClick={() => handleDelete(url.shortCode)}
                              disabled={deleteMutation.isLoading}
                              className="btn btn-sm text-red-600 hover:bg-red-50"
                              title="Delete URL"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-secondary-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-secondary-700">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, pagination.total)} of {pagination.total} results
                      </span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(parseInt(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="input text-sm"
                      >
                        <option value={10}>10 per page</option>
                        <option value={20}>20 per page</option>
                        <option value={50}>50 per page</option>
                        <option value={100}>100 per page</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="btn btn-sm btn-secondary disabled:opacity-50"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        const page = Math.max(1, Math.min(pagination.pages - 4, currentPage - 2)) + i;
                        if (page > pagination.pages) return null;
                        
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`btn btn-sm ${
                              currentPage === page 
                                ? 'btn-primary' 
                                : 'btn-secondary'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                        disabled={currentPage === pagination.pages}
                        className="btn btn-sm btn-secondary disabled:opacity-50"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllUrls; 