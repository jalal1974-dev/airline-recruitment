import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Plus, Trash2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function CreateJob() {
  const { t } = useTranslation();
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title_en: '', title_ar: '',
    description_en: '', description_ar: '',
    department_en: '', department_ar: '',
    location_en: '', location_ar: '',
    employment_type: 'full-time',
    education_level: 'bachelor',
    experience_min: 0, experience_max: 5,
    salary_min: 0, salary_max: 0,
    salary_currency: 'USD',
    deadline: '',
    is_active: true,
    qualifications_en: [] as string[],
    qualifications_ar: [] as string[],
    requirements_en: [] as string[],
    requirements_ar: [] as string[],
    responsibilities_en: [] as string[],
    responsibilities_ar: [] as string[],
    skills: [] as string[],
    ai_min_experience: null as number | null,
    ai_required_skills: null as string[] | null,
    ai_required_education: null as string | null,
    ai_max_salary: null as number | null,
    ai_custom_criteria: null as string | null,
  });
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/login'); return; }
    if (!isAdmin) { navigate('/'); return; }
    if (isEditing && id) fetchJob(id);
  }, [user, isAdmin, loading, id]);

  async function fetchJob(jobId: string) {
    const { data, error } = await supabase.from('jobs').select('*').eq('id', jobId).single();
    if (!error && data) setFormData({ ...data });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing) {
        const { error } = await supabase.from('jobs').update(formData).eq('id', id!);
        if (error) throw error;
        toast.success('Job updated successfully');
      } else {
        const { error } = await supabase.from('jobs').insert(formData);
        if (error) throw error;
        toast.success('Job created successfully');
      }
      navigate('/admin/jobs');
    } catch (error) {
      toast.error('Failed to save job');
    } finally {
      setSaving(false);
    }
  };

  const addToList = (field: string, value: string) => {
    if (!value.trim()) return;
    setFormData({ ...formData, [field]: [...(formData[field as keyof typeof formData] as string[]), value.trim()] });
  };

  const removeFromList = (field: string, idx: number) => {
    setFormData({ ...formData, [field]: (formData[field as keyof typeof formData] as string[]).filter((_, i) => i !== idx) });
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a365d]";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  const ListField = ({ label, field, placeholder }: { label: string; field: string; placeholder: string }) => {
    const [val, setVal] = useState('');
    return (
      <div>
        <label className={labelClass}>{label}</label>
        <div className="flex gap-2 mb-2">
          <input type="text" value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addToList(field, val); setVal(''); } }} placeholder={placeholder} className={`flex-1 ${inputClass}`} />
          <button type="button" onClick={() => { addToList(field, val); setVal(''); }} className="bg-[#1a365d] text-white px-3 py-2 rounded-lg hover:bg-[#1a365d]/90">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <ul className="space-y-1">
          {(formData[field as keyof typeof formData] as string[]).map((item, i) => (
            <li key={i} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
              <span className="text-sm">{item}</span>
              <button type="button" onClick={() => removeFromList(field, i)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <h1 className="text-3xl font-bold text-[#1a365d] mb-8">
          {isEditing ? t('admin.editJob') : t('admin.createJob')}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-[#1a365d] mb-4">Job Titles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={labelClass}>Title (English) *</label><input type="text" required value={formData.title_en} onChange={(e) => setFormData({ ...formData, title_en: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>العنوان (عربي) *</label><input type="text" required value={formData.title_ar} onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })} className={inputClass} dir="rtl" /></div>
              <div><label className={labelClass}>Department (English) *</label><input type="text" required value={formData.department_en} onChange={(e) => setFormData({ ...formData, department_en: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>القسم (عربي) *</label><input type="text" required value={formData.department_ar} onChange={(e) => setFormData({ ...formData, department_ar: e.target.value })} className={inputClass} dir="rtl" /></div>
              <div><label className={labelClass}>Location (English) *</label><input type="text" required value={formData.location_en} onChange={(e) => setFormData({ ...formData, location_en: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>الموقع (عربي) *</label><input type="text" required value={formData.location_ar} onChange={(e) => setFormData({ ...formData, location_ar: e.target.value })} className={inputClass} dir="rtl" /></div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-[#1a365d] mb-4">Description</h2>
            <div className="space-y-4">
              <div><label className={labelClass}>Description (English) *</label><textarea required value={formData.description_en} onChange={(e) => setFormData({ ...formData, description_en: e.target.value })} rows={4} className={inputClass} /></div>
              <div><label className={labelClass}>الوصف (عربي) *</label><textarea required value={formData.description_ar} onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })} rows={4} className={inputClass} dir="rtl" /></div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-[#1a365d] mb-4">Job Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Employment Type *</label>
                <select value={formData.employment_type} onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })} className={inputClass}>
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Education Level *</label>
                <select value={formData.education_level} onChange={(e) => setFormData({ ...formData, education_level: e.target.value })} className={inputClass}>
                  <option value="high-school">High School</option>
                  <option value="diploma">Diploma</option>
                  <option value="bachelor">Bachelor</option>
                  <option value="master">Master</option>
                  <option value="phd">PhD</option>
                </select>
              </div>
              <div><label className={labelClass}>Min Experience (years)</label><input type="number" min="0" value={formData.experience_min} onChange={(e) => setFormData({ ...formData, experience_min: parseInt(e.target.value) || 0 })} className={inputClass} /></div>
              <div><label className={labelClass}>Max Experience (years)</label><input type="number" min="0" value={formData.experience_max} onChange={(e) => setFormData({ ...formData, experience_max: parseInt(e.target.value) || 0 })} className={inputClass} /></div>
              <div><label className={labelClass}>Min Salary *</label><input type="number" min="0" required value={formData.salary_min} onChange={(e) => setFormData({ ...formData, salary_min: parseInt(e.target.value) || 0 })} className={inputClass} /></div>
              <div><label className={labelClass}>Max Salary *</label><input type="number" min="0" required value={formData.salary_max} onChange={(e) => setFormData({ ...formData, salary_max: parseInt(e.target.value) || 0 })} className={inputClass} /></div>
              <div>
                <label className={labelClass}>Currency</label>
                <select value={formData.salary_currency} onChange={(e) => setFormData({ ...formData, salary_currency: e.target.value })} className={inputClass}>
                  <option value="USD">USD</option>
                  <option value="JOD">JOD</option>
                  <option value="EUR">EUR</option>
                  <option value="SAR">SAR</option>
                </select>
              </div>
              <div><label className={labelClass}>Deadline *</label><input type="date" required value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} className={inputClass} /></div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4" />
                <label className="text-sm font-medium text-gray-700">Active</label>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <h2 className="text-xl font-bold text-[#1a365d]">Lists</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ListField label="Responsibilities (EN)" field="responsibilities_en" placeholder="Add responsibility..." />
              <ListField label="المسؤوليات (AR)" field="responsibilities_ar" placeholder="أضف مسؤولية..." />
              <ListField label="Qualifications (EN)" field="qualifications_en" placeholder="Add qualification..." />
              <ListField label="المؤهلات (AR)" field="qualifications_ar" placeholder="أضف مؤهلاً..." />
              <ListField label="Requirements (EN)" field="requirements_en" placeholder="Add requirement..." />
              <ListField label="المتطلبات (AR)" field="requirements_ar" placeholder="أضف متطلباً..." />
            </div>
            <div>
              <label className={labelClass}>Skills</label>
              <div className="flex gap-2 mb-2">
                <input type="text" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (newSkill.trim()) { setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] }); setNewSkill(''); } } }} placeholder="Add skill..." className={`flex-1 ${inputClass}`} />
                <button type="button" onClick={() => { if (newSkill.trim()) { setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] }); setNewSkill(''); } }} className="bg-[#1a365d] text-white px-3 py-2 rounded-lg hover:bg-[#1a365d]/90"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, i) => (
                  <span key={i} className="flex items-center gap-1 bg-[#1a365d]/10 text-[#1a365d] px-3 py-1 rounded-full text-sm">
                    {skill}
                    <button type="button" onClick={() => setFormData({ ...formData, skills: formData.skills.filter((_, idx) => idx !== i) })} className="text-red-500 hover:text-red-700 ml-1"><Trash2 className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>
          </section>

          <div className="flex gap-4">
            <button type="submit" disabled={saving} className="flex-1 bg-[#f6ad55] text-[#1a365d] px-8 py-4 rounded-lg text-lg font-bold hover:bg-[#f6ad55]/90 transition disabled:opacity-50">
              {saving ? t('common.loading') : (isEditing ? t('common.save') : t('admin.createJob'))}
            </button>
            <button type="button" onClick={() => navigate('/admin/jobs')} className="px-6 py-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}
