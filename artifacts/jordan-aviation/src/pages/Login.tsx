import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Login() {
  const { t } = useTranslation();
  const { signIn, isAdmin, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(false);

  useEffect(() => {
    if (pendingRedirect && !loading && user) {
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
      setPendingRedirect(false);
    }
  }, [pendingRedirect, loading, user, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await signIn(email, password);
      toast.success(t('auth.loginSuccess'));
      setPendingRedirect(true);
    } catch (error) {
      toast.error(t('auth.loginError'));
    } finally {
      setSubmitting(false);
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.email')}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.password')}
              </label>
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
              disabled={submitting}
              className="w-full bg-[#1a365d] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#1a365d]/90 transition disabled:opacity-50"
            >
              {submitting ? t('common.loading') : t('auth.login')}
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
