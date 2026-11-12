import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/lib/notifications';
import { LogIn, ArrowRight, Sparkles } from 'lucide-react';

export default function Login() {
  const { signIn, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('alex.morgan@studyflow.edu');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: 'Please enter your email', type: 'warning' });
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast({ title: 'Sign in failed', description: error, type: 'error' });
    } else {
      toast({ title: 'Welcome to STUDYFLOW', type: 'success' });
      navigate('/dashboard');
    }
  };

  const handleDemoSignIn = async () => {
    setLoading(true);
    await signIn('alex.morgan@studyflow.edu', 'demo1234');
    setLoading(false);
    toast({ title: 'Signed in as Alex Morgan (Demo Student)', type: 'success' });
    navigate('/dashboard');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Welcome back</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Enter your student credentials to access your planner
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Student Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="student@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full gap-2" disabled={loading}>
          <LogIn className="h-4 w-4" />
          <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-gray-900 px-2 text-gray-400">Quick Access</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleDemoSignIn}
        className="w-full gap-2 border-indigo-200 dark:border-indigo-900/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300"
      >
        <Sparkles className="h-4 w-4" />
        <span>One-Click Student Demo Login</span>
      </Button>

      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        New to STUDYFLOW?{' '}
        <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          Create student account
        </Link>
      </p>
    </div>
  );
}
