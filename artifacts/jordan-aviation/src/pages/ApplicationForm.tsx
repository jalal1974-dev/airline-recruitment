import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase, Job, EducationEntry, ExperienceEntry, LanguageEntry } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Plus, Trash2, Upload, X, FileText } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface FileEntry {
  file: File;
  id: string;
}

function FileUploadField({
  label,
  hint,
  accept,
  multiple,
  required,
  files,
  onChange,
  onRemove,
}: {
  label: string;
  hint: string;
  accept: string;
  multiple?: boolean;
  required?: boolean;
  files: FileEntry[];
  onChange: (newFiles: File[]) => void;
  onRemove: (id: string) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const valid: File[] = [];
    for (const f of selected) {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(t('application.fileTooLarge') + f.name);
      } else {
        valid.push(f);
      }
    }
    if (valid.length > 0) onChange(valid);
    if (inputRef.current) inputRef.current.value = '';
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <p className="text-xs text-gray-500 mb-2">{hint}</p>
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#1a365d] transition cursor-pointer"
        onClick={() => inputRef.current?.click()}
      >
        <div className="flex items-center gap-2 text-gray-500">
          <Upload className="w-5 h-5" />
          <span className="text-sm">
            {files.length === 0
              ? (multiple ? 'Click to select files' : 'Click to select file')
              : `${files.length} ${files.length === 1 ? t('application.fileSelected') : t('application.filesSelected')}`}
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          required={required && files.length === 0}
          className="hidden"
          onChange={handleChange}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      {files.length > 0 && (
        <ul className="mt-2 space-y-1">
          {files.map((entry) => (
            <li key={entry.id} className="flex items-center gap-2 bg-blue-50 rounded px-3 py-2">
              <FileText className="w-4 h-4 text-[#1a365d] flex-shrink-0" />
              <span className="text-sm text-gray-700 flex-1 truncate">{entry.file.name}</span>
              <span className="text-xs text-gray-500 flex-shrink-0">{formatSize(entry.file.size)}</span>
              <button
                type="button"
                onClick={() => onRemove(entry.id)}
                className="text-red-500 hover:text-red-700 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ApplicationForm() {
  const { t, i18n } = useTranslation();
  const { jobId } = useParams<{ jobId: string }>();
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingMsg, setUploadingMsg] = useState('');

  const [formData, setFormData] = useState({
    full_name_en: profile?.full_name_en || '',
    full_name_ar: profile?.full_name_ar || '',
    email: user?.email || '',
    phone: profile?.phone || '',
    nationality: profile?.nationality || '',
    date_of_birth: '',
    gender: '',
    address_en: '',
    address_ar: '',
    cover_letter: '',
    total_experience: 0,
    highest_education: 'bachelor',
    expected_salary: 0,
    salary_currency: 'USD',
    skills: [] as string[],
    education: [] as EducationEntry[],
    experience: [] as ExperienceEntry[],
    languages: [] as LanguageEntry[],
  });
  const [newSkill, setNewSkill] = useState('');

  const [resumeFiles, setResumeFiles] = useState<FileEntry[]>([]);
  const [professionalFiles, setProfessionalFiles] = useState<FileEntry[]>([]);
  const [educationalFiles, setEducationalFiles] = useState<FileEntry[]>([]);
  const [otherFiles, setOtherFiles] = useState<FileEntry[]>([]);

  const makeId = () => Math.random().toString(36).slice(2);

  const addFiles = (setter: React.Dispatch<React.SetStateAction<FileEntry[]>>, single: boolean) =>
    (newFiles: File[]) => {
      const entries = newFiles.map((f) => ({ file: f, id: makeId() }));
      if (single) setter(entries.slice(0, 1));
      else setter((prev) => [...prev, ...entries]);
    };

  const removeFile = (setter: React.Dispatch<React.SetStateAction<FileEntry[]>>) =>
    (id: string) => setter((prev) => prev.filter((e) => e.id !== id));

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    if (jobId) fetchJob(jobId);
  }, [user, authLoading, jobId]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || prev.email,
        full_name_en: profile?.full_name_en || prev.full_name_en,
        full_name_ar: profile?.full_name_ar || prev.full_name_ar,
        phone: profile?.phone || prev.phone,
        nationality: profile?.nationality || prev.nationality,
      }));
    }
  }, [user, profile]);

  async function fetchJob(id: string) {
    const { data, error } = await supabase.from('jobs').select('*').eq('id', id).single();
    if (!error) setJob(data);
  }

  async function uploadFile(file: File, path: string): Promise<string | null> {
    const { error: upErr } = await supabase.storage.from('documents').upload(path, file, { upsert: true });
    if (upErr) {
      console.error('Upload error:', upErr);
      toast.error(t('application.uploadError') + file.name);
      return null;
    }
    const { data } = supabase.storage.from('documents').getPublicUrl(path);
    return data.publicUrl;
  }

  async function uploadGroup(files: FileEntry[], type: string): Promise<string[]> {
    const urls: string[] = [];
    for (const entry of files) {
      const ext = entry.file.name.split('.').pop();
      const path = `${user!.id}/${type}/${Date.now()}_${makeId()}.${ext}`;
      const url = await uploadFile(entry.file, path);
      if (url) urls.push(url);
    }
    return urls;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !jobId) return;

    if (resumeFiles.length === 0) {
      toast.error(i18n.language === 'ar' ? 'يرجى رفع السيرة الذاتية' : 'Please upload your Resume/CV');
      return;
    }

    setLoading(true);

    try {
      setUploadingMsg(t('application.uploadingFiles'));

      const [resumeUrls, professionalUrls, educationalUrls, otherUrls] = await Promise.all([
        uploadGroup(resumeFiles, 'resume'),
        uploadGroup(professionalFiles, 'professional'),
        uploadGroup(educationalFiles, 'educational'),
        uploadGroup(otherFiles, 'other'),
      ]);

      setUploadingMsg('');

      if (resumeUrls.length === 0) {
        toast.error(t('application.bucketError'));
        return;
      }

      const documents = {
        resume: resumeUrls[0] || null,
        professional_certificates: professionalUrls,
        educational_certificates: educationalUrls,
        other_documents: otherUrls,
      };

      const applicationData = {
        user_id: user.id,
        job_id: jobId,
        full_name_en: formData.full_name_en,
        full_name_ar: formData.full_name_ar,
        email: formData.email,
        phone: formData.phone,
        nationality: formData.nationality,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        address_en: formData.address_en || null,
        address_ar: formData.address_ar || null,
        cover_letter: formData.cover_letter || null,
        total_experience: formData.total_experience,
        highest_education: formData.highest_education,
        expected_salary: formData.expected_salary,
        salary_currency: formData.salary_currency,
        skills: formData.skills,
        education: formData.education,
        experience: formData.experience,
        languages: formData.languages,
        resume_url: documents.resume,
        documents,
        status: 'pending',
        applied_at: new Date().toISOString(),
      };

      console.log('Submitting application:', applicationData);

      const { error } = await supabase.from('applications').insert(applicationData);

      if (error) {
        console.error('Submit error:', error);
        toast.error(error.message || t('application.applicationError'));
        return;
      }

      toast.success(t('application.applicationSuccess'));
      navigate('/my-applications');
    } catch (err: unknown) {
      console.error('Submit error:', err);
      const msg = err instanceof Error ? err.message : t('application.applicationError');
      toast.error(msg);
    } finally {
      setLoading(false);
      setUploadingMsg('');
    }
  };

  const addEducation = () => setFormData({ ...formData, education: [...formData.education, { degree: '', institution: '', field: '', year: '', gpa: '' }] });
  const removeEducation = (i: number) => setFormData({ ...formData, education: formData.education.filter((_, idx) => idx !== i) });
  const updateEducation = (i: number, field: keyof EducationEntry, value: string) => {
    const edu = [...formData.education];
    edu[i] = { ...edu[i], [field]: value };
    setFormData({ ...formData, education: edu });
  };

  const addExperience = () => setFormData({ ...formData, experience: [...formData.experience, { title: '', company: '', start_date: '', end_date: '', current: false, description: '' }] });
  const removeExperience = (i: number) => setFormData({ ...formData, experience: formData.experience.filter((_, idx) => idx !== i) });
  const updateExperience = (i: number, field: keyof ExperienceEntry, value: string | boolean) => {
    const exp = [...formData.experience];
    exp[i] = { ...exp[i], [field]: value };
    setFormData({ ...formData, experience: exp });
  };

  const addLanguage = () => setFormData({ ...formData, languages: [...formData.languages, { language: '', proficiency: 'intermediate' }] });
  const removeLanguage = (i: number) => setFormData({ ...formData, languages: formData.languages.filter((_, idx) => idx !== i) });
  const updateLanguage = (i: number, field: keyof LanguageEntry, value: string) => {
    const langs = [...formData.languages];
    langs[i] = { ...langs[i], [field]: value };
    setFormData({ ...formData, languages: langs });
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };
  const removeSkill = (i: number) => setFormData({ ...formData, skills: formData.skills.filter((_, idx) => idx !== i) });

  const inputClass = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a365d]';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="min-h-screen bg-[#f7f8fc] flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <h1 className="text-3xl font-bold text-[#1a365d] mb-2">{t('application.title')}</h1>
        {job && (
          <p className="text-[#f6ad55] font-semibold mb-8">
            {i18n.language === 'ar' ? job.title_ar : job.title_en}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-8">

          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-[#1a365d] mb-4">{t('application.personalInfo')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={labelClass}>{t('auth.fullNameEn')} *</label><input type="text" required value={formData.full_name_en} onChange={(e) => setFormData({ ...formData, full_name_en: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>{t('auth.fullNameAr')}</label><input type="text" value={formData.full_name_ar} onChange={(e) => setFormData({ ...formData, full_name_ar: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>{t('auth.email')} *</label><input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>{t('auth.phone')} *</label><input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>{t('auth.nationality')}</label><input type="text" value={formData.nationality} onChange={(e) => setFormData({ ...formData, nationality: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>{t('application.dateOfBirth')}</label><input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>{t('application.gender')}</label>
                <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className={inputClass}>
                  <option value="">-</option>
                  <option value="male">{t('application.male')}</option>
                  <option value="female">{t('application.female')}</option>
                </select>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1a365d]">{t('application.education')}</h2>
              <button type="button" onClick={addEducation} className="flex items-center space-x-1 text-[#1a365d] hover:text-[#f6ad55] transition">
                <Plus className="w-4 h-4" /><span className="text-sm">{t('application.addEducation')}</span>
              </button>
            </div>
            {formData.education.map((edu, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex justify-end mb-2"><button type="button" onClick={() => removeEducation(i)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className={labelClass}>{t('application.degree')}</label><input type="text" value={edu.degree} onChange={(e) => updateEducation(i, 'degree', e.target.value)} className={inputClass} /></div>
                  <div><label className={labelClass}>{t('application.institution')}</label><input type="text" value={edu.institution} onChange={(e) => updateEducation(i, 'institution', e.target.value)} className={inputClass} /></div>
                  <div><label className={labelClass}>{t('application.field')}</label><input type="text" value={edu.field} onChange={(e) => updateEducation(i, 'field', e.target.value)} className={inputClass} /></div>
                  <div><label className={labelClass}>{t('application.graduationYear')}</label><input type="text" value={edu.year} onChange={(e) => updateEducation(i, 'year', e.target.value)} className={inputClass} /></div>
                  <div><label className={labelClass}>{t('application.gpa')}</label><input type="text" value={edu.gpa} onChange={(e) => updateEducation(i, 'gpa', e.target.value)} className={inputClass} /></div>
                </div>
              </div>
            ))}
          </section>

          <section className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1a365d]">{t('application.experience')}</h2>
              <button type="button" onClick={addExperience} className="flex items-center space-x-1 text-[#1a365d] hover:text-[#f6ad55] transition">
                <Plus className="w-4 h-4" /><span className="text-sm">{t('application.addExperience')}</span>
              </button>
            </div>
            {formData.experience.map((exp, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex justify-end mb-2"><button type="button" onClick={() => removeExperience(i)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className={labelClass}>{t('application.jobTitle')}</label><input type="text" value={exp.title} onChange={(e) => updateExperience(i, 'title', e.target.value)} className={inputClass} /></div>
                  <div><label className={labelClass}>{t('application.company')}</label><input type="text" value={exp.company} onChange={(e) => updateExperience(i, 'company', e.target.value)} className={inputClass} /></div>
                  <div><label className={labelClass}>{t('application.startDate')}</label><input type="date" value={exp.start_date} onChange={(e) => updateExperience(i, 'start_date', e.target.value)} className={inputClass} /></div>
                  {!exp.current && <div><label className={labelClass}>{t('application.endDate')}</label><input type="date" value={exp.end_date} onChange={(e) => updateExperience(i, 'end_date', e.target.value)} className={inputClass} /></div>}
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" checked={exp.current} onChange={(e) => updateExperience(i, 'current', e.target.checked)} className="w-4 h-4" />
                    <label className="text-sm text-gray-700">{t('application.currentlyWorking')}</label>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-[#1a365d] mb-4">{t('application.skills')}</h2>
            <div className="flex gap-2 mb-4">
              <input type="text" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} className={`flex-1 ${inputClass}`} placeholder={t('application.addSkill')} />
              <button type="button" onClick={addSkill} className="bg-[#1a365d] text-white px-4 py-2 rounded-lg hover:bg-[#1a365d]/90 transition"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, i) => (
                <span key={i} className="flex items-center gap-1 bg-[#1a365d]/10 text-[#1a365d] px-3 py-1 rounded-full text-sm">
                  {skill}
                  <button type="button" onClick={() => removeSkill(i)} className="text-red-500 hover:text-red-700 ml-1"><Trash2 className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1a365d]">{t('application.languages')}</h2>
              <button type="button" onClick={addLanguage} className="flex items-center space-x-1 text-[#1a365d] hover:text-[#f6ad55] transition">
                <Plus className="w-4 h-4" /><span className="text-sm">{t('application.addLanguage')}</span>
              </button>
            </div>
            {formData.languages.map((lang, i) => (
              <div key={i} className="flex gap-3 mb-3 items-start">
                <div className="flex-1"><input type="text" value={lang.language} onChange={(e) => updateLanguage(i, 'language', e.target.value)} placeholder={t('application.language')} className={inputClass} /></div>
                <div className="flex-1">
                  <select value={lang.proficiency} onChange={(e) => updateLanguage(i, 'proficiency', e.target.value)} className={inputClass}>
                    <option value="basic">{t('application.basic')}</option>
                    <option value="intermediate">{t('application.intermediate')}</option>
                    <option value="advanced">{t('application.advanced')}</option>
                    <option value="native">{t('application.native')}</option>
                  </select>
                </div>
                <button type="button" onClick={() => removeLanguage(i)} className="text-red-500 hover:text-red-700 pt-2"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </section>

          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-[#1a365d] mb-4">{t('application.salaryInfo')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t('application.totalExperience')}</label>
                <input type="number" min="0" value={formData.total_experience} onChange={(e) => setFormData({ ...formData, total_experience: parseFloat(e.target.value) || 0 })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('application.highestEducation')}</label>
                <select value={formData.highest_education} onChange={(e) => setFormData({ ...formData, highest_education: e.target.value })} className={inputClass}>
                  <option value="high-school">{t('jobDetail.highSchool')}</option>
                  <option value="diploma">{t('jobDetail.diploma')}</option>
                  <option value="bachelor">{t('jobDetail.bachelor')}</option>
                  <option value="master">{t('jobDetail.master')}</option>
                  <option value="phd">{t('jobDetail.phd')}</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('application.expectedSalary')} *</label>
                <input type="number" min="0" required value={formData.expected_salary} onChange={(e) => setFormData({ ...formData, expected_salary: parseFloat(e.target.value) || 0 })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('application.currency')}</label>
                <select value={formData.salary_currency} onChange={(e) => setFormData({ ...formData, salary_currency: e.target.value })} className={inputClass}>
                  <option value="USD">USD</option>
                  <option value="JOD">JOD</option>
                  <option value="EUR">EUR</option>
                  <option value="SAR">SAR</option>
                  <option value="AED">AED</option>
                </select>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-[#1a365d] mb-6">{t('application.documents')}</h2>

            <FileUploadField
              label={`${t('application.resume')} *`}
              hint={t('application.resumeHint')}
              accept=".pdf,.doc,.docx"
              multiple={false}
              required
              files={resumeFiles}
              onChange={addFiles(setResumeFiles, true)}
              onRemove={removeFile(setResumeFiles)}
            />

            <FileUploadField
              label={t('application.professionalCerts')}
              hint={t('application.professionalCertsHint')}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              multiple
              files={professionalFiles}
              onChange={addFiles(setProfessionalFiles, false)}
              onRemove={removeFile(setProfessionalFiles)}
            />

            <FileUploadField
              label={t('application.educationalCerts')}
              hint={t('application.educationalCertsHint')}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              multiple
              files={educationalFiles}
              onChange={addFiles(setEducationalFiles, false)}
              onRemove={removeFile(setEducationalFiles)}
            />

            <FileUploadField
              label={t('application.otherDocs')}
              hint={t('application.otherDocsHint')}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              multiple
              files={otherFiles}
              onChange={addFiles(setOtherFiles, false)}
              onRemove={removeFile(setOtherFiles)}
            />

            <div className="mt-4">
              <label className={labelClass}>{t('application.coverLetter')}</label>
              <textarea value={formData.cover_letter} onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })} rows={4} className={inputClass} />
            </div>
          </section>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#f6ad55] text-[#1a365d] px-8 py-4 rounded-lg text-lg font-bold hover:bg-[#f6ad55]/90 transition disabled:opacity-50"
          >
            {loading ? (uploadingMsg || t('common.loading')) : t('application.submit')}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}
