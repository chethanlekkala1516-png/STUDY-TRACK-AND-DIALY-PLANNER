import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center p-4 bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/20">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            STUDYFLOW
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide">
            Plan Smart. Study Better. Achieve More.
          </p>
        </div>

        {/* Auth form outlet */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-xl shadow-gray-200/50 dark:shadow-none">
          <Outlet />
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600">
          STUDYFLOW &copy; {new Date().getFullYear()} — Student Productivity Platform
        </p>
      </div>
    </div>
  );
}
