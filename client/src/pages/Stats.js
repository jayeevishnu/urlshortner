import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { urlAPI } from '../services/api';

const Stats = () => {
  const { code } = useParams();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setError('');
      setStats(null);
      try {
        const res = await urlAPI.getStats(code);
        setStats(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch stats');
      }
    };
    if (code) fetchStats();
  }, [code]);

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-900">URL Statistics</h1>
          <p className="text-blue-600 mt-2">
            Analytics for short code: <span className="font-mono">{code}</span>
          </p>
        </div>

        {error && <div className="text-red-600 mb-4">{error}</div>}
        {!stats && !error && <p className="text-blue-600">Loading...</p>}

        {stats && (
          <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white shadow rounded p-4">
                <div className="text-sm text-gray-500">Original URL</div>
                <div className="font-mono text-blue-700 break-all">{stats.url.originalUrl}</div>
              </div>
              <div className="bg-white shadow rounded p-4 flex flex-col justify-between">
                <div>
                  <div className="text-sm text-gray-500">Total Clicks</div>
                  <div className="text-2xl font-bold text-blue-700">{stats.url.totalClicks}</div>
                </div>
                <div className="mt-2 text-xs text-gray-400">Unique IPs: {stats.summary.uniqueIps}</div>
              </div>
              <div className="bg-white shadow rounded p-4">
                <div className="text-sm text-gray-500">Clicks Today</div>
                <div className="text-xl font-bold text-blue-700">{stats.url.clicksToday}</div>
              </div>
              <div className="bg-white shadow rounded p-4">
                <div className="text-sm text-gray-500">Clicks This Week</div>
                <div className="text-xl font-bold text-blue-700">{stats.url.clicksThisWeek}</div>
              </div>
            </div>

            {/* Top IPs */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold mb-2 text-blue-900">Top IPs</h4>
              <table className="min-w-full border bg-white shadow rounded">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="px-2 py-1 border">IP Address</th>
                    <th className="px-2 py-1 border">Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.summary.topIps.map((ipObj, idx) => (
                    <tr key={idx} className="hover:bg-blue-50">
                      <td className="px-2 py-1 border font-mono">{ipObj.ip}</td>
                      <td className="px-2 py-1 border">{ipObj.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Details */}
            <ul className="mb-6 text-gray-700">
              <li><b>Short Code:</b> <span className="font-mono">{stats.url.shortCode}</span></li>
              <li><b>Created At:</b> {new Date(stats.url.createdAt).toLocaleString()}</li>
              <li><b>Status:</b> {stats.url.isActive ? 'Active' : 'Inactive'}</li>
              {stats.url.expiresAt && (
                <li><b>Expires At:</b> {new Date(stats.url.expiresAt).toLocaleString()}</li>
              )}
            </ul>

            {/* Recent Clicks Table */}
            <h4 className="text-lg font-semibold mb-2 text-blue-900">Recent Clicks</h4>
            <div className="overflow-x-auto mb-8">
              <table className="min-w-full border bg-white shadow rounded">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="px-2 py-1 border">IP</th>
                    <th className="px-2 py-1 border">Timestamp</th>
                    <th className="px-2 py-1 border">User Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentClicks.map((click, idx) => (
                    <tr key={idx} className="hover:bg-blue-50">
                      <td className="px-2 py-1 border font-mono text-blue-700">{click.ip || 'N/A'}</td>
                      <td className="px-2 py-1 border">{new Date(click.timestamp).toLocaleString()}</td>
                      <td className="px-2 py-1 border">{click.userAgent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Full Click History (collapsible) */}
            <details className="mb-8">
              <summary className="cursor-pointer text-blue-700 font-semibold">Show Full Click History</summary>
              <div className="overflow-x-auto mt-2">
                <table className="min-w-full border bg-white">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="px-2 py-1 border">IP</th>
                      <th className="px-2 py-1 border">Timestamp</th>
                      <th className="px-2 py-1 border">User Agent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.clickHistory.map((click, idx) => (
                      <tr key={idx}>
                        <td className="px-2 py-1 border font-mono text-blue-700">{click.ip || 'N/A'}</td>
                        <td className="px-2 py-1 border">{new Date(click.timestamp).toLocaleString()}</td>
                        <td className="px-2 py-1 border">{click.userAgent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stats;