import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullNameEn: string, fullNameAr?: string, phone?: string, nationality?: string) => Promise<{ user: User | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isAdminUser(u: User | null): boolean {
  if (!u) return false;
  return u.user_metadata?.role === 'admin' || u.email === 'admin@jordanaviation.com';
}

function buildProfileFromUser(u: User): Profile {
  const meta = u.user_metadata || {};
  return {
    id: u.id,
    full_name_en: (meta.full_name_en as string) || u.email || 'User',
    full_name_ar: (meta.full_name_ar as string) || null,
    phone: (meta.phone as string) || null,
    nationality: (meta.nationality as string) || null,
    role: isAdminUser(u) ? 'admin' : 'applicant',
    created_at: '',
    updated_at: '',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Global safety net — NEVER stay loading beyond 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      setProfile(u ? buildProfileFromUser(u) : null);
      setLoading(false);

      // Background: try to enrich profile from DB (non-blocking, best-effort)
      if (u) enrichProfileFromDB(u);
    }).catch(() => {
      setLoading(false);
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setProfile(u ? buildProfileFromUser(u) : null);
      setLoading(false);

      // Background: try to enrich profile from DB (non-blocking, best-effort)
      if (u) enrichProfileFromDB(u);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Try to load richer profile data from DB — never blocks loading state
  async function enrichProfileFromDB(u: User) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', u.id)
        .maybeSingle()
        .abortSignal(controller.signal);
      clearTimeout(timeout);
      if (data) {
        // Always preserve admin role from metadata even if DB says applicant
        const role = isAdminUser(u) ? 'admin' : data.role;
        setProfile({ ...data, role });
      }
    } catch {
      // silently ignore — metadata-based profile is already set
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(
    email: string,
    password: string,
    fullNameEn: string,
    fullNameAr?: string,
    phone?: string,
    nationality?: string
  ) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name_en: fullNameEn,
          full_name_ar: fullNameAr || null,
          phone: phone || null,
          nationality: nationality || null,
          role: 'applicant',
        },
      },
    });
    if (error) throw error;
    return { user: data.user };
  }

  async function signOut() {
    // Clear state immediately so the UI reacts at once
    setUser(null);
    setProfile(null);
    setLoading(false);
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // ignore
    }
    try {
      localStorage.removeItem('jordan-aviation-auth');
    } catch {
      // ignore
    }
  }

  const isAdmin = isAdminUser(user) || profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
