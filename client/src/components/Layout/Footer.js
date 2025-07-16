import React from 'react';
import { Link as LinkIcon, Github, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-secondary-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <LinkIcon className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gradient">QuickLink</span>
            </div>
            <p className="text-secondary-600 mb-4 max-w-md">
              Professional URL shortener service with advanced analytics, 
              custom domains, and enterprise-grade security. Transform your long URLs 
              into powerful marketing tools.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-sm font-semibold text-secondary-900 uppercase tracking-wider mb-4">
              Features
            </h3>
            <ul className="space-y-3">
              <li>
                <span className="text-secondary-600 hover:text-primary-600 transition-colors duration-200 cursor-pointer">
                  URL Shortening
                </span>
              </li>
              <li>
                <span className="text-secondary-600 hover:text-primary-600 transition-colors duration-200 cursor-pointer">
                  Analytics
                </span>
              </li>
              <li>
                <span className="text-secondary-600 hover:text-primary-600 transition-colors duration-200 cursor-pointer">
                  Custom Codes
                </span>
              </li>
              <li>
                <span className="text-secondary-600 hover:text-primary-600 transition-colors duration-200 cursor-pointer">
                  Click Tracking
                </span>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-secondary-900 uppercase tracking-wider mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <span className="text-secondary-600 hover:text-primary-600 transition-colors duration-200 cursor-pointer">
                  Help Center
                </span>
              </li>
              <li>
                <span className="text-secondary-600 hover:text-primary-600 transition-colors duration-200 cursor-pointer">
                  API Documentation
                </span>
              </li>
              <li>
                <span className="text-secondary-600 hover:text-primary-600 transition-colors duration-200 cursor-pointer">
                  Contact Us
                </span>
              </li>
              <li>
                <span className="text-secondary-600 hover:text-primary-600 transition-colors duration-200 cursor-pointer">
                  Status Page
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-200 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-secondary-600 text-sm">
              © 2024 QuickLink. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <span className="text-secondary-600 hover:text-primary-600 text-sm transition-colors duration-200 cursor-pointer">
                Privacy Policy
              </span>
              <span className="text-secondary-600 hover:text-primary-600 text-sm transition-colors duration-200 cursor-pointer">
                Terms of Service
              </span>
              <span className="text-secondary-600 hover:text-primary-600 text-sm transition-colors duration-200 cursor-pointer">
                Cookie Policy
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 