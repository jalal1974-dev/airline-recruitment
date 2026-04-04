import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase, Job } from '../lib/supabase';
import { MapPin, Briefcase, DollarSign, Calendar, GraduationCap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function JobDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchJob(id);
  }, [id]);

  async function fetchJob(jobId: string) {
    try {
      const { data, error } = await supabase.from('jobs').select('*').eq('id', jobId).single();
      if (error) throw error;
      setJob(data);
    } catch (error) {
      console.error('Error fetching job:', error);
    } finally {
      setLoading(false);
    }
  }

  const getEducationLabel = (level: string) => {
    const map: { [key: string]: string } = {
      'high-school': t('jobDetail.highSchool'),
      diploma: t('jobDetail.diploma'),
      bachelor: t('jobDetail.bachelor'),
      master: t('jobDetail.master'),
      phd: t('jobDetail.phd'),
    };
    return map[level] || level;
  };

  const getEmploymentTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'full-time': t('jobs.fullTime'),
      'part-time': t('jobs.partTime'),
      contract: t('jobs.contract'),
      internship: t('jobs.internship'),
    };
    return typeMap[type] || type;
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

  if (!job) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xl text-gray-600">{t('common.notFound')}</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#1a365d] mb-2">
                {i18n.language === 'ar' ? job.title_ar : job.title_en}
              </h1>
              <p className="text-[#f6ad55] font-semibold text-lg">
                {i18n.language === 'ar' ? job.department_ar : job.department_en}
              </p>
            </div>
            <button
              onClick={() => {
                if (!user) { navigate('/login'); return; }
                navigate(`/apply/${job.id}`);
              }}
              className="mt-4 md:mt-0 bg-[#f6ad55] text-[#1a365d] px-8 py-3 rounded-lg font-bold hover:bg-[#f6ad55]/90 transition"
            >
              {t('jobDetail.applyNow')}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="flex items-center space-x-2 text-gray-600">
              <MapPin className="w-5 h-5 text-[#1a365d]" />
              <span className="text-sm">{i18n.language === 'ar' ? job.location_ar : job.location_en}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Briefcase className="w-5 h-5 text-[#1a365d]" />
              <span className="text-sm">{getEmploymentTypeLabel(job.employment_type)}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <DollarSign className="w-5 h-5 text-[#1a365d]" />
              <span className="text-sm">{job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()} {job.salary_currency}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar className="w-5 h-5 text-[#1a365d]" />
              <span className="text-sm">{new Date(job.deadline).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="flex items-center space-x-2 text-gray-600">
              <GraduationCap className="w-5 h-5 text-[#1a365d]" />
              <span className="text-sm">{t('jobDetail.educationLevel')}: {getEducationLabel(job.education_level)}</span>
            </div>
            <div className="text-gray-600 text-sm">
              {t('jobDetail.experience')}: {job.experience_min} - {job.experience_max} {t('jobDetail.years')}
            </div>
          </div>

          <Section title={t('jobDetail.description')}>
            <p className="text-gray-700 leading-relaxed">
              {i18n.language === 'ar' ? job.description_ar : job.description_en}
            </p>
          </Section>

          {(i18n.language === 'ar' ? job.responsibilities_ar : job.responsibilities_en)?.length > 0 && (
            <Section title={t('jobDetail.responsibilities')}>
              <ul className="list-disc list-inside space-y-1">
                {(i18n.language === 'ar' ? job.responsibilities_ar : job.responsibilities_en).map((r, i) => (
                  <li key={i} className="text-gray-700">{r}</li>
                ))}
              </ul>
            </Section>
          )}

          {(i18n.language === 'ar' ? job.qualifications_ar : job.qualifications_en)?.length > 0 && (
            <Section title={t('jobDetail.qualifications')}>
              <ul className="list-disc list-inside space-y-1">
                {(i18n.language === 'ar' ? job.qualifications_ar : job.qualifications_en).map((q, i) => (
                  <li key={i} className="text-gray-700">{q}</li>
                ))}
              </ul>
            </Section>
          )}

          {job.skills?.length > 0 && (
            <Section title={t('jobDetail.skills')}>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, i) => (
                  <span key={i} className="bg-[#1a365d]/10 text-[#1a365d] px-3 py-1 rounded-full text-sm font-medium">{skill}</span>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-[#1a365d] mb-3 border-b border-gray-200 pb-2">{title}</h2>
      {children}
    </div>
  );
}
