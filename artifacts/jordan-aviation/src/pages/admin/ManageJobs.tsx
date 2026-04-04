import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase, Job } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function ManageJobs() {
  const { t, i18n } = useTranslation();
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/login'); return; }
    if (!isAdmin) { navigate('/'); return; }
    fetchJobs();
  }, [user, isAdmin, loading]);

  async function fetchJobs() {
    try {
      const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setDataLoading(false);
    }
  }

  async function deleteJob(id: string) {
    if (!confirm('Are you sure you want to delete this job?')) return;
    try {
      const { error } = await supabase.from('jobs').delete().eq('id', id);
      if (error) throw error;
      setJobs(jobs.filter(j => j.id !== id));
      toast.success('Job deleted successfully');
    } catch (error) {
      toast.error('Failed to delete job');
    }
  }

  async function toggleJobStatus(job: Job) {
    try {
      const { error } = await supabase.from('jobs').update({ is_active: !job.is_active }).eq('id', job.id);
      if (error) throw error;
      setJobs(jobs.map(j => j.id === job.id ? { ...j, is_active: !j.is_active } : j));
    } catch (error) {
      toast.error('Failed to update job status');
    }
  }

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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#1a365d]">{t('admin.manageJobs')}</h1>
          <Link to="/admin/jobs/create" className="flex items-center space-x-2 bg-[#f6ad55] text-[#1a365d] px-4 py-2 rounded-lg hover:bg-[#f6ad55]/90 transition font-bold">
            <Plus className="w-4 h-4" />
            <span>{t('admin.createJob')}</span>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('admin.jobTitle')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Deadline</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('admin.status')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {jobs.map(job => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {i18n.language === 'ar' ? job.title_ar : job.title_en}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {i18n.language === 'ar' ? job.department_ar : job.department_en}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(job.deadline).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleJobStatus(job)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${job.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {job.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Link to={`/admin/jobs/${job.id}/applications`} className="text-blue-600 hover:text-blue-800" title="View Applications">
                          <Users className="w-4 h-4" />
                        </Link>
                        <Link to={`/admin/jobs/edit/${job.id}`} className="text-[#1a365d] hover:text-[#f6ad55]" title="Edit">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button onClick={() => deleteJob(job.id)} className="text-red-500 hover:text-red-700" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
