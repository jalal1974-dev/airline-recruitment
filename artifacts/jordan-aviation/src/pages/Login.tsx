import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast.error(error.message || t('auth.loginError'));
        return;
      }

      toast.success(t('auth.loginSuccess'));

      // Determine redirect immediately from the returned user data — no waiting
      const u = data.user;
      const adminByMeta = u?.user_metadata?.role === 'admin';
      const adminByEmail = u?.email === 'admin@jordanaviation.com';

      if (adminByMeta || adminByEmail) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('auth.loginError');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-[#1a365d] mb-8 text-center">{t('auth.login')}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')}</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a365d] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#1a365d]/90 transition disabled:opacity-50"
            >
              {loading ? t('common.loading') : t('auth.login')}
            </button>
          </form>
          <p className="mt-6 text-center text-gray-600 text-sm">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-[#1a365d] font-semibold hover:text-[#f6ad55]">
              {t('auth.register')}
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
