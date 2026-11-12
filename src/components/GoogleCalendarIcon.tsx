import React from 'react';

export function GoogleCalendarIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="17" rx="3" className="fill-blue-500" />
      <rect x="4" y="8" width="16" height="12" rx="1.5" fill="white" />
      <rect x="7" y="2" width="2" height="4" rx="1" className="fill-red-500" />
      <rect x="15" y="2" width="2" height="4" rx="1" className="fill-red-500" />
      <path d="M7 12h2v2H7z" fill="#4285F4" />
      <path d="M11 12h2v2h-2z" fill="#34A853" />
      <path d="M15 12h2v2h-2z" fill="#FBBC05" />
      <path d="M7 15h2v2H7z" fill="#EA4335" />
      <path d="M11 15h2v2h-2z" fill="#4285F4" />
      <path d="M15 15h2v2h-2z" fill="#34A853" />
    </svg>
  );
}
