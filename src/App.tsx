import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { ToastContainer } from '@/components/ui/toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Pages
import Dashboard from '@/pages/Dashboard';
import DailyPlanner from '@/pages/DailyPlanner';
import Tasks from '@/pages/Tasks';
import Timetable from '@/pages/Timetable';
import StudyGoals from '@/pages/StudyGoals';
import Examinations from '@/pages/Examinations';
import Assignments from '@/pages/Assignments';
import FocusMode from '@/pages/FocusMode';
import CalendarPage from '@/pages/Calendar';
import Analytics from '@/pages/Analytics';
import Notes from '@/pages/Notes';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';
import SignUp from '@/pages/SignUp';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <LoadingSpinner text="Starting STUDYFLOW..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <ToastContainer />
          <Routes>
            {/* Public Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            {/* Protected Student SaaS Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/planner" element={<DailyPlanner />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/timetable" element={<Timetable />} />
              <Route path="/goals" element={<StudyGoals />} />
              <Route path="/examinations" element={<Examinations />} />
              <Route path="/assignments" element={<Assignments />} />
              <Route path="/focus" element={<FocusMode />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Root & Catch-all redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
