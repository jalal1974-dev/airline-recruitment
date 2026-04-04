import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase, Application, Job } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function ApplicationDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application & { jobs: Job } | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/login'); return; }
    if (!isAdmin) { navigate('/'); return; }
    if (id) fetchApplication(id);
  }, [user, isAdmin, loading, id]);

  async function fetchApplication(appId: string) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*, jobs(*)')
        .eq('id', appId)
        .single();
      if (error) throw error;
      setApplication(data as unknown as Application & { jobs: Job });
      setStatus(data.status);
      setAdminNotes(data.admin_notes || '');
    } catch (error) {
      console.error('Error fetching application:', error);
    } finally {
      setDataLoading(false);
    }
  }

  async function updateStatus() {
    try {
      const { error } = await supabase.from('applications').update({ status }).eq('id', id!);
      if (error) throw error;
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  }

  async function updateNotes() {
    try {
      const { error } = await supabase.from('applications').update({ admin_notes: adminNotes }).eq('id', id!);
      if (error) throw error;
      toast.success('Notes saved');
    } catch (error) {
      toast.error('Failed to save notes');
    }
  }

  const labelClass = "text-sm font-semibold text-gray-500 uppercase tracking-wide";
  const valueClass = "text-gray-900 mt-1";

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

  if (!application) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center"><p className="text-xl text-gray-600">{t('common.notFound')}</p></div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto px-4 py-12 w-full">
        <div className="mb-6">
          <Link to={`/admin/jobs/${application.job_id}/applications`} className="text-[#1a365d] hover:text-[#f6ad55] text-sm">
            ← {t('admin.jobApplications')}
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-[#1a365d] mb-8">{t('admin.applicationDetail')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-[#1a365d] mb-4">{t('admin.personalInfo')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><p className={labelClass}>Name (EN)</p><p className={valueClass}>{application.full_name_en}</p></div>
                {application.full_name_ar && <div><p className={labelClass}>Name (AR)</p><p className={valueClass}>{application.full_name_ar}</p></div>}
                <div><p className={labelClass}>{t('admin.email')}</p><p className={valueClass}>{application.email}</p></div>
                <div><p className={labelClass}>{t('admin.phone')}</p><p className={valueClass}>{application.phone}</p></div>
                {application.nationality && <div><p className={labelClass}>{t('admin.nationality')}</p><p className={valueClass}>{application.nationality}</p></div>}
                {application.gender && <div><p className={labelClass}>{t('admin.gender')}</p><p className={valueClass}>{application.gender}</p></div>}
                {application.date_of_birth && <div><p className={labelClass}>{t('admin.dateOfBirth')}</p><p className={valueClass}>{new Date(application.date_of_birth).toLocaleDateString()}</p></div>}
                <div><p className={labelClass}>{t('admin.totalExperience')}</p><p className={valueClass}>{application.total_experience} years</p></div>
                <div><p className={labelClass}>{t('admin.expectedSalary')}</p><p className={valueClass}>{application.expected_salary.toLocaleString()} {application.salary_currency}</p></div>
              </div>
            </div>

            {application.education?.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-[#1a365d] mb-4">{t('admin.education')}</h2>
                <div className="space-y-3">
                  {application.education.map((edu, i) => (
                    <div key={i} className="border border-gray-100 rounded-lg p-3">
                      <p className="font-semibold text-[#1a365d]">{edu.degree} in {edu.field}</p>
                      <p className="text-gray-600 text-sm">{edu.institution} · {edu.year}</p>
                      {edu.gpa && <p className="text-gray-500 text-sm">GPA: {edu.gpa}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {application.experience?.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-[#1a365d] mb-4">{t('admin.experience')}</h2>
                <div className="space-y-3">
                  {application.experience.map((exp, i) => (
                    <div key={i} className="border border-gray-100 rounded-lg p-3">
                      <p className="font-semibold text-[#1a365d]">{exp.title}</p>
                      <p className="text-gray-600 text-sm">{exp.company} · {exp.start_date} - {exp.current ? 'Present' : exp.end_date}</p>
                      {exp.description && <p className="text-gray-500 text-sm mt-1">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {application.skills?.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-[#1a365d] mb-4">{t('admin.skills')}</h2>
                <div className="flex flex-wrap gap-2">
                  {application.skills.map((skill, i) => (
                    <span key={i} className="bg-[#1a365d]/10 text-[#1a365d] px-3 py-1 rounded-full text-sm">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {application.cover_letter && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-[#1a365d] mb-4">{t('admin.coverLetter')}</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{application.cover_letter}</p>
              </div>
            )}

            {application.ai_analysis && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-[#1a365d] mb-4">{t('admin.aiAnalysis')}</h2>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl font-bold text-purple-600">{application.ai_score?.toFixed(0)}/100</span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{application.ai_analysis}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-[#1a365d] mb-4">{t('admin.updateStatus')}</h2>
              <div className="space-y-3">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a365d]"
                >
                  <option value="pending">Pending</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="rejected">Rejected</option>
                  <option value="interview">Interview</option>
                  <option value="accepted">Accepted</option>
                  <option value="ai-shortlisted">AI Shortlisted</option>
                  <option value="ai-rejected">AI Rejected</option>
                </select>
                <button onClick={updateStatus} className="w-full bg-[#1a365d] text-white px-4 py-2 rounded-lg hover:bg-[#1a365d]/90 transition">
                  {t('common.save')}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-[#1a365d] mb-4">{t('admin.adminNotes')}</h2>
              <div className="space-y-3">
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a365d]"
                  placeholder="Add notes about this application..."
                />
                <button onClick={updateNotes} className="w-full bg-[#f6ad55] text-[#1a365d] px-4 py-2 rounded-lg hover:bg-[#f6ad55]/90 transition font-semibold">
                  {t('admin.saveNotes')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
