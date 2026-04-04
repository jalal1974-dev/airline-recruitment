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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Safety net: never stay in loading state more than 5 seconds
  function startLoadingTimeout() {
    if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
    loadingTimeout.current = setTimeout(() => {
      console.warn('[AuthContext] Loading timeout reached — forcing loading=false');
      setLoading(false);
    }, 5000);
  }

  function clearLoadingTimeout() {
    if (loadingTimeout.current) {
      clearTimeout(loadingTimeout.current);
      loadingTimeout.current = null;
    }
  }

  useEffect(() => {
    startLoadingTimeout();

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        loadProfile(u);
      } else {
        clearLoadingTimeout();
        setLoading(false);
      }
    }).catch(() => {
      clearLoadingTimeout();
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        startLoadingTimeout();
        await loadProfile(u);
      } else {
        clearLoadingTimeout();
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearLoadingTimeout();
    };
  }, []);

  async function loadProfile(u: User) {
    // Read role from user_metadata immediately (no DB query, no RLS, reliable)
    const metaRole = u.user_metadata?.role as string | undefined;
    const metaNameEn = (u.user_metadata?.full_name_en as string | undefined) || u.email || 'User';
    const metaNameAr = u.user_metadata?.full_name_ar as string | undefined;

    const syntheticProfile: Profile = {
      id: u.id,
      full_name_en: metaNameEn,
      full_name_ar: metaNameAr || null,
      phone: null,
      nationality: null,
      role: metaRole === 'admin' ? 'admin' : 'applicant',
      created_at: '',
      updated_at: '',
    };
    setProfile(syntheticProfile);
    clearLoadingTimeout();
    setLoading(false);

    // Optionally enrich with DB profile (non-blocking)
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', u.id)
        .maybeSingle();

      if (data) {
        const finalRole = metaRole === 'admin' ? 'admin' : data.role;
        setProfile({ ...data, role: finalRole });
      }
    } catch {
      // silently ignore — syntheticProfile already set above
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
          role: 'applicant',
        },
      },
    });
    if (error) throw error;

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        full_name_en: fullNameEn,
        full_name_ar: fullNameAr || null,
        phone: phone || null,
        nationality: nationality || null,
        role: 'applicant',
      }).then(({ error: profileError }) => {
        if (profileError) {
          console.warn('[AuthContext] Could not insert profile row:', profileError.message);
        }
      });
    }
  }

  async function signOut() {
    // Clear state immediately so UI responds right away
    setUser(null);
    setProfile(null);

    // Attempt Supabase signOut but don't let failures block the UI
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.warn('[AuthContext] signOut error (ignored):', err);
    }

    // Belt-and-suspenders: force-clear any stored auth tokens
    try {
      const storageKey = 'jordan-aviation-auth';
      localStorage.removeItem(storageKey);
      // Also clear any legacy keys
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
