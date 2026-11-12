import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '@/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isDemoMode: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  isDemoMode: false,
  signUp: async () => ({}),
  signIn: async () => ({}),
  signOut: async () => {},
  resetPassword: async () => ({}),
  updateProfile: async () => {},
});

const DEFAULT_DEMO_USER_ID = 'demo-student-id-101';
const DEFAULT_DEMO_PROFILE: Profile = {
  id: DEFAULT_DEMO_USER_ID,
  full_name: 'Alex Morgan',
  email: 'alex.morgan@studyflow.edu',
  avatar_url: null,
  institution: 'Stanford University',
  course: 'Computer Science & Engineering',
  semester: 'Semester 5',
  created_at: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(!isSupabaseConfigured);

  async function fetchProfile(userId: string) {
    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem(`studyflow_profile_${userId}`);
      if (stored) {
        setProfile(JSON.parse(stored));
      } else {
        setProfile(DEFAULT_DEMO_PROFILE);
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data && !error) {
        setProfile(data);
      }
    } catch (err) {
      console.warn('Failed to fetch profile from Supabase:', err);
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Local persistent authentication
      const storedAuth = localStorage.getItem('studyflow_local_auth');
      if (storedAuth) {
        try {
          const parsed = JSON.parse(storedAuth);
          setUser(parsed.user);
          setProfile(parsed.profile);
        } catch {
          // Fallback to default demo user
          const mockUser: User = {
            id: DEFAULT_DEMO_USER_ID,
            app_metadata: {},
            user_metadata: { full_name: DEFAULT_DEMO_PROFILE.full_name },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            email: DEFAULT_DEMO_PROFILE.email,
          } as User;
          setUser(mockUser);
          setProfile(DEFAULT_DEMO_PROFILE);
        }
      } else {
        // Auto-initialize default student profile so user can immediately experience the app
        const mockUser: User = {
          id: DEFAULT_DEMO_USER_ID,
          app_metadata: {},
          user_metadata: { full_name: DEFAULT_DEMO_PROFILE.full_name },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          email: DEFAULT_DEMO_PROFILE.email,
        } as User;
        setUser(mockUser);
        setProfile(DEFAULT_DEMO_PROFILE);
        localStorage.setItem(
          'studyflow_local_auth',
          JSON.stringify({ user: mockUser, profile: DEFAULT_DEMO_PROFILE })
        );
      }
      setLoading(false);
      return;
    }

    // Real Supabase Auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signUp(email: string, password: string, fullName: string) {
    if (!isSupabaseConfigured) {
      const newId = `user_${Date.now()}`;
      const newUser: User = {
        id: newId,
        app_metadata: {},
        user_metadata: { full_name: fullName },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email,
      } as User;
      const newProfile: Profile = {
        id: newId,
        full_name: fullName,
        email,
        avatar_url: null,
        institution: 'University',
        course: 'General Studies',
        semester: 'Semester 1',
        created_at: new Date().toISOString(),
      };
      setUser(newUser);
      setProfile(newProfile);
      localStorage.setItem('studyflow_local_auth', JSON.stringify({ user: newUser, profile: newProfile }));
      localStorage.setItem(`studyflow_profile_${newId}`, JSON.stringify(newProfile));
      return {};
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        email,
        created_at: new Date().toISOString(),
      });
    }
    return {};
  }

  async function signIn(email: string, password: string) {
    if (!isSupabaseConfigured) {
      // Local sign in check or create
      const stored = localStorage.getItem('studyflow_local_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.user?.email === email || email) {
          setUser(parsed.user);
          setProfile(parsed.profile);
          return {};
        }
      }
      const newId = `user_${Date.now()}`;
      const newUser: User = {
        id: newId,
        app_metadata: {},
        user_metadata: { full_name: email.split('@')[0] },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email,
      } as User;
      const newProfile: Profile = {
        id: newId,
        full_name: email.split('@')[0],
        email,
        avatar_url: null,
        institution: 'University',
        course: 'Academics',
        semester: 'Semester 1',
        created_at: new Date().toISOString(),
      };
      setUser(newUser);
      setProfile(newProfile);
      localStorage.setItem('studyflow_local_auth', JSON.stringify({ user: newUser, profile: newProfile }));
      return {};
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  }

  async function signOut() {
    if (!isSupabaseConfigured) {
      setUser(null);
      setProfile(null);
      localStorage.removeItem('studyflow_local_auth');
      return;
    }
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
  }

  async function resetPassword(email: string) {
    if (!isSupabaseConfigured) {
      return {};
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { error: error.message };
    return {};
  }

  async function updateProfile(data: Partial<Profile>) {
    if (!user) return;
    const updated = { ...(profile || DEFAULT_DEMO_PROFILE), ...data };
    setProfile(updated);

    if (!isSupabaseConfigured) {
      localStorage.setItem(`studyflow_profile_${user.id}`, JSON.stringify(updated));
      localStorage.setItem('studyflow_local_auth', JSON.stringify({ user, profile: updated }));
      return;
    }

    try {
      await supabase.from('profiles').update(data).eq('id', user.id);
    } catch (err) {
      console.warn('Could not update profile on Supabase:', err);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isDemoMode,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
