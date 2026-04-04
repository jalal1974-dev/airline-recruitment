import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, LogOut, User, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const isRTL = i18n.language === 'ar';

  function toggleLanguage() {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  }

  async function handleLogout() {
    try {
      await signOut();
      toast.success(t('auth.logoutSuccess'));
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  return (
    <nav className="bg-[#1a365d] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2 font-bold text-xl">
            <span>{t('nav.logo')}</span>
          </Link>

          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className={`hidden md:flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
            <Link to="/jobs" className="hover:text-[#f6ad55] transition">
              {t('nav.jobs')}
            </Link>

            {user && !isAdmin && (
              <Link to="/my-applications" className="hover:text-[#f6ad55] transition">
                {t('nav.myApplications')}
              </Link>
            )}

            {user && isAdmin && (
              <Link to="/admin" className="hover:text-[#f6ad55] transition">
                {t('nav.adminDashboard')}
              </Link>
            )}

            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 hover:text-[#f6ad55] transition"
            >
              <Globe className="w-4 h-4" />
              <span>{i18n.language === 'en' ? 'العربية' : 'English'}</span>
            </button>

            {user ? (
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{profile?.full_name_en}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 hover:text-[#f6ad55] transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('nav.logout')}</span>
                </button>
              </div>
            ) : (
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                <Link to="/login" className="hover:text-[#f6ad55] transition">
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-[#f6ad55] text-[#1a365d] px-4 py-2 rounded hover:bg-[#f6ad55]/90 transition"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 space-y-3 border-t border-white/20 pt-4">
            <Link to="/jobs" className="block hover:text-[#f6ad55] transition" onClick={() => setMenuOpen(false)}>
              {t('nav.jobs')}
            </Link>
            {user && !isAdmin && (
              <Link to="/my-applications" className="block hover:text-[#f6ad55] transition" onClick={() => setMenuOpen(false)}>
                {t('nav.myApplications')}
              </Link>
            )}
            {user && isAdmin && (
              <Link to="/admin" className="block hover:text-[#f6ad55] transition" onClick={() => setMenuOpen(false)}>
                {t('nav.adminDashboard')}
              </Link>
            )}
            <button onClick={toggleLanguage} className="flex items-center space-x-1 hover:text-[#f6ad55] transition">
              <Globe className="w-4 h-4" />
              <span>{i18n.language === 'en' ? 'العربية' : 'English'}</span>
            </button>
            {user ? (
              <button onClick={handleLogout} className="flex items-center space-x-1 hover:text-[#f6ad55] transition">
                <LogOut className="w-4 h-4" />
                <span>{t('nav.logout')}</span>
              </button>
            ) : (
              <>
                <Link to="/login" className="block hover:text-[#f6ad55] transition" onClick={() => setMenuOpen(false)}>
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="block bg-[#f6ad55] text-[#1a365d] px-4 py-2 rounded hover:bg-[#f6ad55]/90 transition text-center" onClick={() => setMenuOpen(false)}>
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
