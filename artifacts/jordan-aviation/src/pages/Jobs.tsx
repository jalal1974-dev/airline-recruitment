import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase, Job } from '../lib/supabase';
import { MapPin, Briefcase, DollarSign, Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Jobs() {
  const { t, i18n } = useTranslation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, departmentFilter, typeFilter, i18n.language]);

  async function fetchJobs() {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterJobs() {
    let filtered = jobs;
    if (searchTerm) {
      filtered = filtered.filter(job => {
        const title = i18n.language === 'ar' ? job.title_ar : job.title_en;
        const department = i18n.language === 'ar' ? job.department_ar : job.department_en;
        return (
          title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          department.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }
    if (departmentFilter) {
      filtered = filtered.filter(job => {
        const department = i18n.language === 'ar' ? job.department_ar : job.department_en;
        return department === departmentFilter;
      });
    }
    if (typeFilter) {
      filtered = filtered.filter(job => job.employment_type === typeFilter);
    }
    setFilteredJobs(filtered);
  }

  const departments = Array.from(new Set(jobs.map(job => i18n.language === 'ar' ? job.department_ar : job.department_en)));
  const types = Array.from(new Set(jobs.map(job => job.employment_type)));

  const getEmploymentTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'full-time': t('jobs.fullTime'),
      'part-time': t('jobs.partTime'),
      'contract': t('jobs.contract'),
      'internship': t('jobs.internship'),
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

  return (
    <div className="min-h-screen bg-[#f7f8fc] flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto px-4 py-12 w-full">
        <h1 className="text-4xl font-bold text-[#1a365d] mb-8">{t('jobs.title')}</h1>
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('jobs.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
              />
            </div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a365d]"
            >
              <option value="">{t('jobs.allDepartments')}</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a365d]"
            >
              <option value="">{t('jobs.allTypes')}</option>
              {types.map(type => (
                <option key={type} value={type}>{getEmploymentTypeLabel(type)}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-500">{t('jobs.noJobs')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map(job => (
              <div key={job.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6">
                <h3 className="text-xl font-bold text-[#1a365d] mb-2">
                  {i18n.language === 'ar' ? job.title_ar : job.title_en}
                </h3>
                <p className="text-[#f6ad55] font-semibold mb-4">
                  {i18n.language === 'ar' ? job.department_ar : job.department_en}
                </p>
                <div className="space-y-2 text-sm text-gray-600 mb-6">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-[#1a365d]" />
                    <span>{i18n.language === 'ar' ? job.location_ar : job.location_en}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-4 h-4 text-[#1a365d]" />
                    <span>{getEmploymentTypeLabel(job.employment_type)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-[#1a365d]" />
                    <span>{job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()} {job.salary_currency}</span>
                  </div>
                </div>
                <Link
                  to={`/jobs/${job.id}`}
                  className="block text-center bg-[#1a365d] text-white px-4 py-2 rounded-lg hover:bg-[#1a365d]/90 transition font-medium"
                >
                  {t('jobs.viewDetails')}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
