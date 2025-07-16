import React from 'react';
import { useParams } from 'react-router-dom';

const Stats = () => {
  const { code } = useParams();

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900">
            URL Statistics
          </h1>
          <p className="text-secondary-600 mt-2">
            Detailed analytics for short code: {code}
          </p>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">Statistics</h2>
          <p className="text-secondary-600">Statistics functionality will be implemented here.</p>
        </div>
      </div>
    </div>
  );
};

export default Stats; 