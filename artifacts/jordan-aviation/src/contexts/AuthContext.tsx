import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullNameEn: string, fullNameAr?: string, phone?: string, nationality?: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function buildProfileFromUser(u: User): Profile {
  const meta = u.user_metadata || {};
  return {
    id: u.id,
    full_name_en: (meta.full_name_en as string) || u.email || 'User',
    full_name_ar: (meta.full_name_ar as string) || null,
    phone: (meta.phone as string) || null,
    nationality: (meta.nationality as string) || null,
    role: meta.role === 'admin' ? 'admin' : 'applicant',
    created_at: '',
    updated_at: '',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearSafetyTimeout() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function done(u: User | null) {
    clearSafetyTimeout();
    if (u) {
      setProfile(buildProfileFromUser(u));
    } else {
      setProfile(null);
    }
    setUser(u);
    setLoading(false);
  }

  useEffect(() => {
    // Safety net: never stay loading more than 4 seconds
    timeoutRef.current = setTimeout(() => {
      setLoading(false);
    }, 4000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      done(session?.user ?? null);
    }).catch(() => {
      done(null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      done(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
      clearSafetyTimeout();
    };
  }, []);

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
    const { error } = await supabase.auth.signUp({
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
  }

  async function signOut() {
    done(null);
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // ignore
    }
    try {
      localStorage.removeItem('jordan-aviation-auth');
      localStorage.removeItem('sb-ocnkjfipugtkzaplqvcf-auth-token');
    } catch {
      // ignore
    }
  }

  const isAdmin =
    profile?.role === 'admin' ||
    user?.user_metadata?.role === 'admin';

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
