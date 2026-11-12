import React from 'react';

interface LoadingSpinnerProps {
  text?: string;
  className?: string;
}

export function LoadingSpinner({ text = 'Loading...', className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 gap-3 ${className}`}>
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent dark:border-indigo-400 dark:border-t-transparent" />
      {text && <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{text}</p>}
    </div>
  );
}
