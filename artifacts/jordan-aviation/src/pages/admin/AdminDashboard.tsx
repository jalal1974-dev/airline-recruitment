import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Briefcase, FileText, CheckCircle, Clock } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

interface DashboardStats {
  totalJobs: number;
  totalApplications: number;
  activeJobs: number;
  pendingApplications: number;
}

interface RecentApplication {
  id: string;
  full_name_en: string;
  status: string;
  applied_at: string;
  jobs: { title_en: string; title_ar: string };
}

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const { user, profile, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({ totalJobs: 0, totalApplications: 0, activeJobs: 0, pendingApplications: 0 });
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/login'); return; }
    if (!isAdmin) { navigate('/'); return; }
    fetchStats();
    fetchRecentApplications();
  }, [user, isAdmin, loading]);

  async function fetchStats() {
    try {
      const [jobsRes, appRes, activeRes, pendingRes] = await Promise.all([
        supabase.from('jobs').select('*', { count: 'exact', head: true }),
        supabase.from('applications').select('*', { count: 'exact', head: true }),
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      setStats({
        totalJobs: jobsRes.count || 0,
        totalApplications: appRes.count || 0,
        activeJobs: activeRes.count || 0,
        pendingApplications: pendingRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setDataLoading(false);
    }
  }

  async function fetchRecentApplications() {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('id, full_name_en, status, applied_at, jobs(title_en, title_ar)')
        .order('applied_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      setRecentApplications((data as unknown as RecentApplication[]) || []);
    } catch (error) {
      console.error('Error fetching recent applications:', error);
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

  const statCards = [
    { label: t('admin.totalJobs'), value: stats.totalJobs, icon: Briefcase, color: 'bg-blue-500' },
    { label: t('admin.totalApplications'), value: stats.totalApplications, icon: FileText, color: 'bg-green-500' },
    { label: t('admin.activeJobs'), value: stats.activeJobs, icon: CheckCircle, color: 'bg-yellow-500' },
    { label: t('admin.pendingApplications'), value: stats.pendingApplications, icon: Clock, color: 'bg-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-[#f7f8fc] flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto px-4 py-12 w-full">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#1a365d]">{t('admin.dashboard')}</h1>
          <div className="flex gap-3">
            <Link to="/admin/jobs" className="bg-[#1a365d] text-white px-4 py-2 rounded-lg hover:bg-[#1a365d]/90 transition text-sm font-medium">
              {t('admin.manageJobs')}
            </Link>
            <Link to="/admin/jobs/create" className="bg-[#f6ad55] text-[#1a365d] px-4 py-2 rounded-lg hover:bg-[#f6ad55]/90 transition text-sm font-bold">
              {t('admin.createJob')}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-3xl font-bold text-[#1a365d]">{card.value}</span>
                </div>
                <p className="text-gray-600 text-sm font-medium">{card.label}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-[#1a365d] mb-6">{t('admin.recentApplications')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('admin.applicantName')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('admin.jobTitle')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('admin.date')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('admin.status')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{app.full_name_en}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {i18n.language === 'ar' ? app.jobs.title_ar : app.jobs.title_en}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(app.applied_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
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
