import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase, Application, Job } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function AllApplications() {
  const { t, i18n } = useTranslation();
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<(Application & { jobs: Job })[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/login'); return; }
    if (!isAdmin) { navigate('/'); return; }
    fetchApplications();
  }, [user, isAdmin, loading]);

  async function fetchApplications() {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*, jobs(*)')
        .order('applied_at', { ascending: false });
      if (error) throw error;
      setApplications((data as unknown as (Application & { jobs: Job })[]) || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setDataLoading(false);
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
      'ai-shortlisted': 'bg-teal-100 text-teal-700',
      'ai-rejected': 'bg-orange-100 text-orange-700',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-700';
  };

  const filteredApplications = statusFilter
    ? applications.filter(a => a.status === statusFilter)
    : applications;

  if (loading || dataLoading) {
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
        <h1 className="text-3xl font-bold text-[#1a365d] mb-8">{t('admin.allApplications')}</h1>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a365d]">
            <option value="">All ({applications.length})</option>
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="ai-shortlisted">AI Shortlisted</option>
            <option value="rejected">Rejected</option>
            <option value="ai-rejected">AI Rejected</option>
            <option value="interview">Interview</option>
            <option value="accepted">Accepted</option>
          </select>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('admin.name')}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('admin.jobTitle')}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('admin.email')}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('admin.date')}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('admin.status')}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('admin.aiScore')}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{app.full_name_en}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {i18n.language === 'ar' ? app.jobs.title_ar : app.jobs.title_en}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{app.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(app.applied_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {app.ai_score !== null ? `${app.ai_score.toFixed(0)}/100` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/admin/applications/${app.id}`} className="text-[#1a365d] hover:text-[#f6ad55] font-medium">
                        {t('admin.view')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
