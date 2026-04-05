import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullNameEn: '',
    fullNameAr: '',
    phone: '',
    nationality: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error(t('auth.passwordMismatch') || 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: 'applicant',
            full_name_en: formData.fullNameEn,
            full_name_ar: formData.fullNameAr || null,
            phone: formData.phone || null,
            nationality: formData.nationality || null,
          },
        },
      });

      if (error) {
        toast.error(error.message || t('auth.registerError'));
        return;
      }

      toast.success(t('auth.registerSuccess'));
      navigate('/');

      // Fire-and-forget: insert profile row in background after redirect
      if (data.user) {
        supabase.from('profiles').upsert({
          id: data.user.id,
          full_name_en: formData.fullNameEn,
          full_name_ar: formData.fullNameAr || null,
          phone: formData.phone || null,
          nationality: formData.nationality || null,
          role: 'applicant',
        }).then(() => {}).catch(() => {});
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('auth.registerError');
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
          <h2 className="text-3xl font-bold text-[#1a365d] mb-8 text-center">{t('auth.register')}</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.fullNameEn')} *</label>
              <input type="text" required value={formData.fullNameEn} onChange={(e) => setFormData({ ...formData, fullNameEn: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a365d]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.fullNameAr')}</label>
              <input type="text" value={formData.fullNameAr} onChange={(e) => setFormData({ ...formData, fullNameAr: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a365d]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')} *</label>
              <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a365d]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.phone')}</label>
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a365d]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.nationality')}</label>
              <input type="text" value={formData.nationality} onChange={(e) => setFormData({ ...formData, nationality: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a365d]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')} *</label>
              <input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a365d]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.confirmPassword')} *</label>
              <input type="password" required value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a365d]" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[#1a365d] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#1a365d]/90 transition disabled:opacity-50">
              {loading ? t('common.loading') : t('auth.register')}
            </button>
          </form>
          <p className="mt-6 text-center text-gray-600 text-sm">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-[#1a365d] font-semibold hover:text-[#f6ad55]">{t('auth.login')}</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
