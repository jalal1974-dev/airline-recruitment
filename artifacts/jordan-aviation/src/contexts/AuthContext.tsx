import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        loadProfile(u);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        await loadProfile(u);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(u: User) {
    // Read role from user_metadata first (reliable, no RLS issues)
    const metaRole = u.user_metadata?.role as string | undefined;
    const metaNameEn = u.user_metadata?.full_name_en as string | undefined;
    const metaNameAr = u.user_metadata?.full_name_ar as string | undefined;

    // Set a synthetic profile from metadata immediately so isAdmin works at once
    const metaProfile: Profile = {
      id: u.id,
      full_name_en: metaNameEn || u.email || '',
      full_name_ar: metaNameAr || null,
      phone: null,
      nationality: null,
      role: (metaRole === 'admin' ? 'admin' : 'applicant') as 'admin' | 'applicant',
      created_at: '',
      updated_at: '',
    };
    setProfile(metaProfile);

    // Also try to fetch the actual profiles table row for richer data
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', u.id)
        .maybeSingle();

      if (!error && data) {
        // Profiles table row found — use it but prefer metadata role if DB row says applicant
        // and metadata says admin (to handle migration period)
        const finalRole = metaRole === 'admin' ? 'admin' : data.role;
        setProfile({ ...data, role: finalRole });
        console.log('[AuthContext] Profile from DB:', data, '| final role:', finalRole);
      } else {
        console.log('[AuthContext] No DB profile, using metadata. role:', metaRole);
      }
    } catch (err) {
      console.warn('[AuthContext] Could not fetch profiles table:', err);
    } finally {
      setLoading(false);
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
        }
      }
    });
    if (error) throw error;

    if (data.user) {
      // Try inserting a profiles row; ignore failure if RLS blocks it
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
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  // isAdmin: check both the profile object and user_metadata as fallback
  const isAdmin =
    profile?.role === 'admin' ||
    user?.user_metadata?.role === 'admin';

  console.log('[AuthContext] user:', user?.email, '| profile.role:', profile?.role, '| isAdmin:', isAdmin);

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
