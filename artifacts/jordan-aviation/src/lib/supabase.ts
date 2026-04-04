import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Disable navigator lock to prevent multi-tab "lock stolen" conflicts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const noLock = (_name: string, _timeout: number, fn: (value: any) => any) => fn(null);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'jordan-aviation-auth',
    lock: noLock,
  },
});

export interface Profile {
  id: string;
  full_name_en: string;
  full_name_ar: string | null;
  phone: string | null;
  nationality: string | null;
  role: 'applicant' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  department_en: string;
  department_ar: string;
  location_en: string;
  location_ar: string;
  employment_type: string;
  education_level: string;
  experience_min: number;
  experience_max: number;
  salary_min: number;
  salary_max: number;
  salary_currency: string;
  qualifications_en: string[];
  qualifications_ar: string[];
  requirements_en: string[];
  requirements_ar: string[];
  responsibilities_en: string[];
  responsibilities_ar: string[];
  skills: string[];
  deadline: string;
  is_active: boolean;
  ai_min_experience: number | null;
  ai_required_skills: string[] | null;
  ai_required_education: string | null;
  ai_max_salary: number | null;
  ai_custom_criteria: string | null;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  job_id: string;
  full_name_en: string;
  full_name_ar: string | null;
  email: string;
  phone: string;
  nationality: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address_en: string | null;
  address_ar: string | null;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  skills: string[];
  languages: LanguageEntry[];
  resume_url: string | null;
  cover_letter: string | null;
  total_experience: number;
  highest_education: string | null;
  expected_salary: number;
  salary_currency: string;
  status: string;
  ai_score: number | null;
  ai_analysis: string | null;
  admin_notes: string | null;
  applied_at: string;
  updated_at: string;
}

export interface EducationEntry {
  degree: string;
  institution: string;
  field: string;
  year: string;
  gpa: string;
}

export interface ExperienceEntry {
  title: string;
  company: string;
  start_date: string;
  end_date: string;
  current: boolean;
  description: string;
}

export interface LanguageEntry {
  language: string;
  proficiency: string;
}
