import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/lib/notifications';
import { KeyRound, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);

    if (error) {
      toast({ title: 'Error sending reset link', description: error, type: 'error' });
    } else {
      setSent(true);
      toast({ title: 'Password recovery email sent', type: 'success' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Reset password</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Enter your registered student email and we'll send a password recovery link
        </p>
      </div>

      {sent ? (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-4 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            Check your inbox
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            A password reset link has been dispatched to <b>{email}</b>.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="student@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full gap-2" disabled={loading}>
            <KeyRound className="h-4 w-4" />
            <span>{loading ? 'Sending link...' : 'Send Recovery Link'}</span>
          </Button>
        </form>
      )}

      <div className="text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to sign in</span>
        </Link>
      </div>
    </div>
  );
}
