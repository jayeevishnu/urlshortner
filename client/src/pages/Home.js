import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Link, BarChart3, Zap, Shield, ArrowRight, Copy, ExternalLink } from 'lucide-react';
import { urlAPI, apiUtils } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Home = () => {
  const [shortenedUrl, setShortenedUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Clear previous result
      setShortenedUrl(null);
      
      const response = await urlAPI.shorten(data);
      setShortenedUrl(response.data);
      reset();
      toast.success('URL shortened successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to shorten URL';
      const details = error.response?.data?.details;
      
      if (details && Array.isArray(details)) {
        // Show validation errors
        details.forEach(detail => {
          toast.error(detail.msg || detail.message || detail);
        });
      } else {
        toast.error(errorMessage);
      }
      
      // Log error for debugging
      console.error('URL shortening error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (shortenedUrl) {
      const success = await apiUtils.copyToClipboard(shortenedUrl.shortUrl);
      if (success) {
        toast.success('URL copied to clipboard!');
      } else {
        toast.error('Failed to copy URL');
      }
    }
  };

  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Lightning Fast',
      description: 'Generate short links instantly with our optimized infrastructure.',
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: 'Detailed Analytics',
      description: 'Track clicks, analyze traffic patterns, and measure your success.',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with 99.9% uptime guarantee.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-secondary-900 mb-6">
              Shorten Your URLs,
              <span className="block text-gradient">Amplify Your Reach</span>
            </h1>
            <p className="text-xl text-secondary-600 mb-12 max-w-3xl mx-auto">
              Transform long, complex URLs into powerful, trackable short links. 
              Get detailed analytics and boost your marketing campaigns with our 
              professional URL shortener.
            </p>

            {/* URL Shortening Form */}
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      {...register('originalUrl', {
                        required: 'URL is required',
                        validate: {
                          validUrl: (value) => {
                            try {
                              // Add protocol if missing
                              const urlToTest = value.startsWith('http://') || value.startsWith('https://') 
                                ? value 
                                : `https://${value}`;
                              
                              const url = new URL(urlToTest);
                              
                              // Check for valid protocols
                              if (!['http:', 'https:'].includes(url.protocol)) {
                                return 'URL must use HTTP or HTTPS protocol';
                              }
                              
                              // Check for valid hostname
                              if (!url.hostname || url.hostname.length < 4) {
                                return 'Please enter a valid domain name';
                              }
                              
                              // Check for valid TLD
                              if (!url.hostname.includes('.')) {
                                return 'Please enter a valid domain with extension (e.g., .com, .org)';
                              }
                              
                              return true;
                            } catch {
                              return 'Please enter a valid URL (e.g., https://example.com)';
                            }
                          }
                        }
                      })}
                      type="url"
                      placeholder="Enter your long URL here... (e.g., https://example.com)"
                      className={`input ${errors.originalUrl ? 'input-error' : ''}`}
                      disabled={isLoading}
                    />
                    {errors.originalUrl && (
                      <p className="text-red-500 text-sm mt-1 text-left">
                        {errors.originalUrl.message}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary btn-lg flex items-center justify-center space-x-2 sm:w-auto"
                  >
                    {isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <span>Shorten URL</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Custom Code Input */}
                <div className="text-left">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Custom Code (Optional)
                  </label>
                                     <input
                     {...register('customCode', {
                       validate: {
                         validCode: (value) => {
                           if (!value) return true; // Optional field
                           
                           // Check length
                           if (value.length < 3) return 'Custom code must be at least 3 characters';
                           if (value.length > 20) return 'Custom code must be less than 20 characters';
                           
                           // Check characters (alphanumeric, underscore, hyphen only)
                           if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
                             return 'Custom code can only contain letters, numbers, underscores, and hyphens';
                           }
                           
                           // Prevent reserved words
                           const reservedWords = ['api', 'admin', 'www', 'app', 'mail', 'ftp', 'localhost', 'stats', 'dashboard', 'login', 'register', 'signup'];
                           if (reservedWords.includes(value.toLowerCase())) {
                             return 'This custom code is reserved. Please choose another.';
                           }
                           
                           return true;
                         }
                       }
                     })}
                    type="text"
                    placeholder="Enter custom code (optional)"
                    className={`input ${errors.customCode ? 'input-error' : ''}`}
                    disabled={isLoading}
                  />
                  {errors.customCode && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.customCode.message}
                    </p>
                  )}
                </div>
              </form>

              {/* Result */}
              {shortenedUrl && (
                <div className="mt-8 p-6 bg-white rounded-xl shadow-sm border border-secondary-200 animate-slideUp">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                    Your shortened URL is ready!
                  </h3>
                  <div className="flex items-center space-x-3 p-3 bg-secondary-50 rounded-lg">
                    <div className="flex-1">
                      <a
                        href={shortenedUrl.shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 font-medium break-all"
                      >
                        {shortenedUrl.shortUrl}
                      </a>
                    </div>
                    <button
                      onClick={handleCopy}
                      className="btn btn-secondary btn-sm flex items-center space-x-1"
                    >
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </button>
                    <a
                      href={shortenedUrl.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm flex items-center space-x-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Visit</span>
                    </a>
                  </div>
                  <div className="mt-4 text-sm text-secondary-600">
                    <p className="mb-1">
                      <span className="font-medium">Original URL:</span> {shortenedUrl.url.originalUrl}
                    </p>
                    <p>
                      <span className="font-medium">Short Code:</span> {shortenedUrl.url.shortCode}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-secondary-900 mb-4">
              Why Choose QuickLink?
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              More than just a URL shortener. Get powerful features that help you 
              track, analyze, and optimize your link performance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 text-primary-600 rounded-lg mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-secondary-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust QuickLink for their URL shortening needs. 
            Sign up today and unlock advanced features.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/register" className="btn bg-white text-primary-600 hover:bg-blue-50 btn-lg">
              Create Free Account
            </a>
            <a href="/dashboard" className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 btn-lg">
              View Dashboard
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 