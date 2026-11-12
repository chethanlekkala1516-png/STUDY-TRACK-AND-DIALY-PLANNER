import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { resetToSampleData } = useApp();
  const location = useLocation();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50/60 dark:bg-gray-950 font-sans">
      {/* Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      {/* Main App Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-gray-200/70 dark:border-gray-800/70 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shrink-0 z-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 text-gray-600 dark:text-gray-300"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="lg:hidden font-bold text-base bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                STUDYFLOW
              </span>
              <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                <span>Plan Smart. Study Better. Achieve More.</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetToSampleData}
              className="text-xs h-8 gap-1.5 border-dashed text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
              title="Reset to test dataset for verification"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset Standard Test Data</span>
            </Button>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
