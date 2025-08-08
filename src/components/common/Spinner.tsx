import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-6 h-6 border-2'
  };

  return (
    <div 
      className={`
        ${sizeClasses[size]} border-[rgba(0,0,0,0.1)] border-t-[#0071e3] 
        rounded-full animate-spin inline-block ${className}
      `}
    />
  );
};