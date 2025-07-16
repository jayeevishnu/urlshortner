import React from 'react';
import { Loader2 } from 'lucide-react';
import classNames from 'classnames';

const LoadingSpinner = ({ size = 'md', className, text }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <div className={classNames('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className={classNames(
          'animate-spin text-primary-600',
          sizeClasses[size]
        )} />
        {text && (
          <span className="text-sm text-secondary-600">{text}</span>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner; 