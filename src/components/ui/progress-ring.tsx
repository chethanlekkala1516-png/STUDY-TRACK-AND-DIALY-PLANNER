import React from 'react';

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
  label?: string;
}

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 8,
  className = '',
  color = '#6366f1',
  label,
}: ProgressRingProps) {
  const safeVal = Math.min(Math.max(0, isNaN(value) ? 0 : value), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (safeVal / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-100 dark:text-gray-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          {Math.round(safeVal)}%
        </span>
        {label && (
          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5 max-w-[80px] truncate">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
