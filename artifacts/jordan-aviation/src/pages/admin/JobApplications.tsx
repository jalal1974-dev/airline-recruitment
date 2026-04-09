import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase, Application, Job } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const EDU_RANK: Record<string, number> = {
  'high-school': 1,
  diploma: 2,
  bachelor: 3,
  master: 4,
  phd: 5,
};

interface AiResult {
  id: string;
  name: string;
  score: number;
  status: string;
}

function scoreApplication(app: Application, job: Job): {
  score: number;
  expScore: number;
  eduScore: number;
  skillScore: number;
  salaryScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  newStatus: string;
  analysis: string;
} {
  const minExp = job.ai_min_experience ?? 0;
  const appExp = app.total_experience ?? 0;
  let expScore: number;
  if (!minExp || minExp === 0) {
    expScore = 30;
  } else if (appExp >= minExp) {
    expScore = 30;
  } else {
    expScore = Math.round((appExp / minExp) * 30 * 10) / 10;
  }

  const reqEdu = job.ai_required_education;
  let eduScore: number;
  if (!reqEdu || reqEdu === 'any') {
    eduScore = 25;
  } else {
    const appRank = EDU_RANK[app.highest_education || ''] ?? 0;
    const reqRank = EDU_RANK[reqEdu] ?? 3;
    const diff = appRank - reqRank;
    if (diff >= 0) eduScore = 25;
    else if (diff === -1) eduScore = 15;
    else eduScore = 5;
  }

  const requiredSkills = job.ai_required_skills ?? [];
  const appSkills = app.skills ?? [];
  let skillScore: number;
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  if (requiredSkills.length === 0) {
    skillScore = 25;
  } else {
    requiredSkills.forEach((rs) => {
      const found = appSkills.some(
        (as) =>
          as.toLowerCase().includes(rs.toLowerCase()) ||
          rs.toLowerCase().includes(as.toLowerCase())
      );
      if (found) matchedSkills.push(rs);
      else missingSkills.push(rs);
    });
    skillScore = Math.round((matchedSkills.length / requiredSkills.length) * 25 * 10) / 10;
  }

  const maxSalary = job.ai_max_salary ?? 0;
  const appSalary = app.expected_salary ?? 0;
  let salaryScore: number;
  if (!maxSalary || maxSalary === 0) {
    salaryScore = 20;
  } else if (appSalary <= maxSalary) {
    salaryScore = 20;
  } else if (appSalary <= maxSalary * 1.2) {
    salaryScore = 10;
  } else {
    salaryScore = 0;
  }

  const score = Math.round(expScore + eduScore + skillScore + salaryScore);

  let newStatus: string;
  if (score >= 70) newStatus = 'ai-shortlisted';
  else if (score >= 40) newStatus = 'reviewing';
  else newStatus = 'ai-rejected';

  const matchedStr = matchedSkills.length > 0 ? matchedSkills.join(', ') : 'None';
  const missingStr = missingSkills.length > 0 ? missingSkills.join(', ') : 'None';
  const analysis =
    `Score: ${score}/100. Experience: ${expScore}/30, Education: ${eduScore}/25, Skills: ${skillScore}/25, Salary: ${salaryScore}/20. Matched: [${matchedStr}]. Missing: [${missingStr}].`;

  return { score, expScore, eduScore, skillScore, salaryScore, matchedSkills, missingSkills, newStatus, analysis };
}

export default function JobApplications() {
  const { t, i18n } = useTranslation();
  const { jobId } = useParams<{ jobId: string }>();
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [aiRunning, setAiRunning] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [aiResults, setAiResults] = useState<AiResult[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/login'); return; }
    if (!isAdmin) { navigate('/'); return; }
    if (jobId) {
      fetchJob(jobId);
      fetchApplications(jobId);
    }
  }, [user, isAdmin, loading, jobId]);

  async function fetchJob(id: string) {
    const { data } = await supabase.from('jobs').select('*').eq('id', id).single();
    setJob(data);
  }

  async function fetchApplications(id: string) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('job_id', id)
        .order('applied_at', { ascending: false });
      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setDataLoading(false);
    }
  }

  async function runAiFilter() {
    if (!job || !jobId) return;
    setAiRunning(true);
    setAiResults(null);
    try {
      const { data: pending, error } = await supabase
        .from('applications')
        .select('*')
        .eq('job_id', jobId)
        .eq('status', 'pending');
      if (error) throw error;
      if (!pending || pending.length === 0) {
        toast.info(i18n.language === 'ar' ? 'لا توجد طلبات معلقة' : 'No pending applications to filter');
        setAiRunning(false);
        return;
      }

      const results: AiResult[] = [];
      for (const app of pending) {
        const { score, newStatus, analysis } = scoreApplication(app as Application, job);
        const { error: updateError } = await supabase
          .from('applications')
          .update({ ai_score: score, ai_analysis: analysis, status: newStatus })
          .eq('id', app.id);
        if (updateError) console.error('Update error for', app.id, updateError);
        results.push({ id: app.id, name: app.full_name_en, score, status: newStatus });
      }

      setAiResults(results);
      toast.success(
        i18n.language === 'ar'
          ? `تم تصفية ${results.length} طلبات بنجاح`
          : `${results.length} applications filtered`
      );
      await fetchApplications(jobId);
    } catch (err) {
      console.error('AI filter error:', err);
      toast.error(i18n.language === 'ar' ? 'حدث خطأ أثناء التصفية' : 'Error running AI filter');
    } finally {
      setAiRunning(false);
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

  const shortlistedCount = aiResults?.filter(r => r.status === 'ai-shortlisted').length ?? 0;
  const reviewCount = aiResults?.filter(r => r.status === 'reviewing').length ?? 0;
  const rejectedCount = aiResults?.filter(r => r.status === 'ai-rejected').length ?? 0;

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
        <div className="mb-6">
          <Link to="/admin/jobs" className="text-[#1a365d] hover:text-[#f6ad55] text-sm">
            ← {t('admin.manageJobs')}
          </Link>
        </div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1a365d]">{t('admin.jobApplications')}</h1>
            {job && <p className="text-[#f6ad55] font-semibold mt-1">{i18n.language === 'ar' ? job.title_ar : job.title_en}</p>}
          </div>
          <button
            onClick={runAiFilter}
            disabled={aiRunning}
            className="flex items-center space-x-2 bg-[#f6ad55] text-[#1a365d] px-5 py-2.5 rounded-lg hover:bg-[#e09a3e] transition disabled:opacity-50 font-semibold text-base shadow"
          >
            <span>{aiRunning ? t('admin.aiFiltering') : t('admin.aiFilter')}</span>
          </button>
        </div>

        {aiResults && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-[#f6ad55]">
            <h2 className="text-lg font-bold text-[#1a365d] mb-4">{t('admin.aiFilterResultsTitle')}</h2>
            <div className="flex gap-6 mb-5">
              <div className="flex items-center gap-2 text-teal-600 font-semibold">
                <span className="text-xl">✅</span>
                <span>{shortlistedCount} {i18n.language === 'ar' ? 'مختصر' : 'Shortlisted'}</span>
              </div>
              <div className="flex items-center gap-2 text-blue-600 font-semibold">
                <span className="text-xl">⏳</span>
                <span>{reviewCount} {i18n.language === 'ar' ? 'مراجعة' : 'Review'}</span>
              </div>
              <div className="flex items-center gap-2 text-orange-600 font-semibold">
                <span className="text-xl">❌</span>
                <span>{rejectedCount} {i18n.language === 'ar' ? 'مرفوض' : 'Rejected'}</span>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {aiResults.map(r => (
                <div key={r.id} className="py-2 flex items-center justify-between">
                  <span className="text-gray-800 font-medium">{r.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#1a365d]">{r.score}/100</span>
                    <span className={`px-3 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(r.status)}`}>
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a365d]">
            <option value="">All Statuses ({applications.length})</option>
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
