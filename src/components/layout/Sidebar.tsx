import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  Clock,
  Target,
  GraduationCap,
  BookOpen,
  Timer,
  Calendar,
  BarChart3,
  StickyNote,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Daily Planner', path: '/planner', icon: CalendarDays },
  { label: 'My Tasks', path: '/tasks', icon: CheckSquare },
  { label: 'Timetable Tracker', path: '/timetable', icon: Clock },
  { label: 'Study Goals', path: '/goals', icon: Target },
  { label: 'Examinations', path: '/examinations', icon: GraduationCap },
  { label: 'Assignments', path: '/assignments', icon: BookOpen },
  { label: 'Focus Mode', path: '/focus', icon: Timer },
  { label: 'Calendar', path: '/calendar', icon: Calendar },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Notes & Journal', path: '/notes', icon: StickyNote },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('studyflow_sidebar_collapsed') === 'true';
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('studyflow_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'SF';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <TooltipProvider delayDuration={150}>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-900 transition-all duration-300 ease-in-out lg:static ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent truncate">
                  STUDYFLOW
                </span>
                <span className="text-[10px] font-medium text-gray-400 tracking-wider uppercase">
                  Student SaaS
                </span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={toggleCollapsed}
            className="hidden lg:flex items-center justify-center h-7 w-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const linkContent = (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-xs dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold border-l-3 border-indigo-600'
                      : 'text-gray-600 hover:bg-gray-100/70 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-gray-200'
                  } ${collapsed && !mobileOpen ? 'justify-center px-0' : ''}`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                {(!collapsed || mobileOpen) && <span className="truncate">{item.label}</span>}
              </NavLink>
            );

            if (collapsed && !mobileOpen) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </div>

        {/* Bottom User & Theme Footer */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
          {/* Theme & Logout Buttons */}
          <div className={`flex items-center gap-1.5 ${collapsed && !mobileOpen ? 'flex-col' : 'justify-between'}`}>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className={`text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 ${
                collapsed && !mobileOpen ? 'h-9 w-9 p-0' : 'flex-1 justify-start gap-2'
              }`}
            >
              {resolvedTheme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4 text-amber-500" />
                  {(!collapsed || mobileOpen) && <span>Light Mode</span>}
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-indigo-500" />
                  {(!collapsed || mobileOpen) && <span>Dark Mode</span>}
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className={`text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/50 ${
                collapsed && !mobileOpen ? 'h-9 w-9 p-0' : 'gap-1.5'
              }`}
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
              {(!collapsed || mobileOpen) && <span>Exit</span>}
            </Button>
          </div>

          {/* Student Profile snippet */}
          <div
            onClick={() => navigate('/settings')}
            className={`flex items-center gap-2.5 p-2 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
              collapsed && !mobileOpen ? 'justify-center p-1.5' : ''
            }`}
          >
            <Avatar className="h-9 w-9 border border-indigo-200 dark:border-indigo-900 shrink-0">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-indigo-600 text-white font-semibold text-xs">
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            {(!collapsed || mobileOpen) && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                  {profile?.full_name || 'Student'}
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {profile?.course || 'Academic Track'}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
