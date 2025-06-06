import React from 'react';
import { FaSpinner } from 'react-icons/fa';

const LoadingSpinner = ({ 
  size = 'md', 
  message = 'Carregando...', 
  fullScreen = false,
  className = '',
  showMessage = true 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-gray-900 bg-opacity-75 flex flex-col items-center justify-center z-50'
    : 'flex flex-col items-center justify-center py-10';

  return (
    <div className={`${containerClasses} ${className}`}>
      <FaSpinner 
        className={`animate-spin text-blue-500 ${sizeClasses[size]} mb-3`} 
      />
      {showMessage && (
        <span className={`text-gray-300 ${textSizeClasses[size]}`}>
          {message}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;
