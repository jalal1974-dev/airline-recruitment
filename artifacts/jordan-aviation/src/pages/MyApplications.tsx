import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase, Application, Job } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function MyApplications() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<(Application & { jobs: Job })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchApplications();
  }, [user]);

  async function fetchApplications() {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*, jobs(*)')
        .eq('user_id', user!.id)
        .order('applied_at', { ascending: false });
      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-700',
      reviewing: 'bg-blue-100 text-blue-700',
      shortlisted: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      interview: 'bg-purple-100 text-purple-700',
      accepted: 'bg-green-200 text-green-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const map: { [key: string]: string } = {
      pending: t('myApplications.pending'),
      reviewing: t('myApplications.reviewing'),
      shortlisted: t('myApplications.shortlisted'),
      rejected: t('myApplications.rejected'),
      interview: t('myApplications.interview'),
      accepted: t('myApplications.accepted'),
    };
    return map[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xl text-gray-600">{t('common.loading')}</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto px-4 py-12 w-full">
        <h1 className="text-4xl font-bold text-[#1a365d] mb-8">{t('myApplications.title')}</h1>

        {applications.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-500">{t('myApplications.noApplications')}</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('myApplications.job')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('myApplications.department')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('myApplications.appliedDate')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('myApplications.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {i18n.language === 'ar' ? app.jobs.title_ar : app.jobs.title_en}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {i18n.language === 'ar' ? app.jobs.department_ar : app.jobs.department_en}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(app.applied_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(app.status)}`}>
                          {getStatusLabel(app.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
