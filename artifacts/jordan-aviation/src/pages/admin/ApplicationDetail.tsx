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
    } catch {
      toast.error('Failed to update status');
    }
  }

  async function updateNotes() {
    try {
      const { error } = await supabase.from('applications').update({ admin_notes: adminNotes }).eq('id', id!);
      if (error) throw error;
      toast.success('Notes saved');
    } catch {
      toast.error('Failed to save notes');
    }
  }

  const labelClass = "text-sm font-semibold text-gray-500 uppercase tracking-wide";
  const valueClass = "text-gray-900 mt-1";

  const yesNo = (v: boolean | undefined | null) => v ? t('application.yes') : t('application.no');

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

  const aq = application.additional_questions;
  const addr = application.full_address;

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

            {/* Personal Information */}
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
                {application.marital_status && <div><p className={labelClass}>{t('admin.maritalStatus')}</p><p className={valueClass}>{application.marital_status}</p></div>}
                {application.height_cm != null && <div><p className={labelClass}>{t('admin.height')}</p><p className={valueClass}>{application.height_cm} cm</p></div>}
                {application.weight_kg != null && <div><p className={labelClass}>{t('admin.weight')}</p><p className={valueClass}>{application.weight_kg} kg</p></div>}
                {application.religion && <div><p className={labelClass}>{t('admin.religion')}</p><p className={valueClass}>{application.religion}</p></div>}
                {application.national_id && <div><p className={labelClass}>{t('admin.nationalId')}</p><p className={valueClass}>{application.national_id}</p></div>}
                {application.passport_number && <div><p className={labelClass}>{t('admin.passportNumber')}</p><p className={valueClass}>{application.passport_number}</p></div>}
                <div><p className={labelClass}>{t('admin.totalExperience')}</p><p className={valueClass}>{application.total_experience} years</p></div>
                <div><p className={labelClass}>{t('admin.expectedSalary')}</p><p className={valueClass}>{application.expected_salary.toLocaleString()} {application.salary_currency}</p></div>
                {application.expected_joining_date && <div><p className={labelClass}>{t('admin.expectedJoiningDate')}</p><p className={valueClass}>{new Date(application.expected_joining_date).toLocaleDateString()}</p></div>}
              </div>
            </div>

            {/* Full Address */}
            {addr && (addr.country || addr.city || addr.street) && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-[#1a365d] mb-4">{t('admin.fullAddress')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addr.country && <div><p className={labelClass}>{t('application.country')}</p><p className={valueClass}>{addr.country}</p></div>}
                  {addr.city && <div><p className={labelClass}>{t('application.city')}</p><p className={valueClass}>{addr.city}</p></div>}
                  {addr.area && <div><p className={labelClass}>{t('application.area')}</p><p className={valueClass}>{addr.area}</p></div>}
                  {addr.street && <div><p className={labelClass}>{t('application.street')}</p><p className={valueClass}>{addr.street}</p></div>}
                  {addr.building && <div><p className={labelClass}>{t('application.building')}</p><p className={valueClass}>{addr.building}</p></div>}
                  {addr.postal_code && <div><p className={labelClass}>{t('application.postalCode')}</p><p className={valueClass}>{addr.postal_code}</p></div>}
                </div>
              </div>
            )}

            {/* Education */}
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

            {/* Work Experience */}
            {application.experience?.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-[#1a365d] mb-4">{t('admin.experience')}</h2>
                <div className="space-y-4">
                  {application.experience.map((exp, i) => (
                    <div key={i} className="border border-gray-100 rounded-lg p-4">
                      <p className="font-semibold text-[#1a365d]">{exp.title}</p>
                      <p className="text-gray-600 text-sm">{exp.company} · {exp.start_date} - {exp.current ? 'Present' : exp.end_date}</p>
                      {exp.description && <p className="text-gray-500 text-sm mt-1">{exp.description}</p>}
                      {exp.reason_for_leaving && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-500 font-semibold uppercase">{t('admin.reasonForLeaving')}</p>
                          <p className="text-gray-700 text-sm">{exp.reason_for_leaving}</p>
                        </div>
                      )}
                      {(exp.manager_name || exp.manager_email || exp.manager_phone) && (
                        <div className="mt-2 pt-2 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-2">
                          {exp.manager_name && <div><p className="text-xs text-gray-500 font-semibold uppercase">{t('admin.managerName')}</p><p className="text-gray-700 text-sm">{exp.manager_name}</p></div>}
                          {exp.manager_email && <div><p className="text-xs text-gray-500 font-semibold uppercase">{t('admin.managerEmail')}</p><p className="text-gray-700 text-sm">{exp.manager_email}</p></div>}
                          {exp.manager_phone && <div><p className="text-xs text-gray-500 font-semibold uppercase">{t('admin.managerPhone')}</p><p className="text-gray-700 text-sm">{exp.manager_phone}</p></div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
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

            {/* Additional Questions */}
            {aq && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-[#1a365d] mb-4">{t('admin.additionalQuestions')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div><p className={labelClass}>{t('application.canWorkShifts')}</p><p className={valueClass}>{yesNo(aq.can_work_shifts)}</p></div>
                  <div><p className={labelClass}>{t('application.canWorkOvertime')}</p><p className={valueClass}>{yesNo(aq.can_work_overtime)}</p></div>
                  <div><p className={labelClass}>{t('application.canWorkOutsideJordan')}</p><p className={valueClass}>{yesNo(aq.can_work_outside_jordan)}</p></div>
                  <div><p className={labelClass}>{t('application.hasCar')}</p><p className={valueClass}>{yesNo(aq.has_car)}</p></div>
                  <div>
                    <p className={labelClass}>{t('application.hasDrivingLicense')}</p>
                    <p className={valueClass}>{yesNo(aq.has_driving_license)}{aq.has_driving_license && aq.license_category ? ` — Category ${aq.license_category}` : ''}</p>
                  </div>
                  <div><p className={labelClass}>{t('application.isSmoker')}</p><p className={valueClass}>{yesNo(aq.is_smoker)}</p></div>
                  <div className="md:col-span-2">
                    <p className={labelClass}>{t('application.hasChronicDiseases')}</p>
                    <p className={valueClass}>{yesNo(aq.has_chronic_diseases)}</p>
                    {aq.has_chronic_diseases && aq.medical_status_details && (
                      <p className="text-gray-700 text-sm mt-1 bg-yellow-50 rounded p-2">{aq.medical_status_details}</p>
                    )}
                  </div>
                  {aq.expected_joining_date && (
                    <div><p className={labelClass}>{t('admin.expectedJoiningDate')}</p><p className={valueClass}>{new Date(aq.expected_joining_date).toLocaleDateString()}</p></div>
                  )}
                </div>
              </div>
            )}

            {/* References */}
            {application.references_list && application.references_list.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-[#1a365d] mb-4">{t('admin.references')}</h2>
                <div className="space-y-3">
                  {application.references_list.map((ref, i) => (
                    <div key={i} className="border border-gray-100 rounded-lg p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div><p className={labelClass}>{t('application.referenceName')}</p><p className={valueClass}>{ref.name}</p></div>
                      <div><p className={labelClass}>{t('application.referencePhone')}</p><p className={valueClass}>{ref.phone}</p></div>
                      {ref.relationship && <div><p className={labelClass}>{t('application.referenceRelationship')}</p><p className={valueClass}>{ref.relationship}</p></div>}
                      {ref.company && <div><p className={labelClass}>{t('application.referenceCompany')}</p><p className={valueClass}>{ref.company}</p></div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {(application.resume_url || application.documents) && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-[#1a365d] mb-4">{t('application.documents')}</h2>
                <div className="space-y-3">
                  {(application.documents?.resume || application.resume_url) && (
                    <div>
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('application.resume')}</p>
                      <a
                        href={application.documents?.resume || application.resume_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[#1a365d] hover:text-[#f6ad55] underline text-sm font-medium"
                      >
                        {t('admin.viewResume')}
                      </a>
                    </div>
                  )}
                  {application.documents?.professional_certificates?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('application.professionalCerts')}</p>
                      <ul className="space-y-1">
                        {application.documents.professional_certificates.map((url, i) => (
                          <li key={i}><a href={url} target="_blank" rel="noopener noreferrer" className="text-[#1a365d] hover:text-[#f6ad55] underline text-sm">Document {i + 1}</a></li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {application.documents?.educational_certificates?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('application.educationalCerts')}</p>
                      <ul className="space-y-1">
                        {application.documents.educational_certificates.map((url, i) => (
                          <li key={i}><a href={url} target="_blank" rel="noopener noreferrer" className="text-[#1a365d] hover:text-[#f6ad55] underline text-sm">Document {i + 1}</a></li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {application.documents?.other_documents?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('application.otherDocs')}</p>
                      <ul className="space-y-1">
                        {application.documents.other_documents.map((url, i) => (
                          <li key={i}><a href={url} target="_blank" rel="noopener noreferrer" className="text-[#1a365d] hover:text-[#f6ad55] underline text-sm">Document {i + 1}</a></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cover Letter */}
            {application.cover_letter && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-[#1a365d] mb-4">{t('admin.coverLetter')}</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{application.cover_letter}</p>
              </div>
            )}

            {/* AI Analysis */}
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

          {/* Sidebar */}
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
