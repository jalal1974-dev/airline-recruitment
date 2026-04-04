import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './i18n/config';

import Home from './pages/Home';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import ApplicationForm from './pages/ApplicationForm';
import MyApplications from './pages/MyApplications';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageJobs from './pages/admin/ManageJobs';
import CreateJob from './pages/admin/CreateJob';
import JobApplications from './pages/admin/JobApplications';
import ApplicationDetail from './pages/admin/ApplicationDetail';
import AllApplications from './pages/admin/AllApplications';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/jobs/:id" element={<JobDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/apply/:jobId" element={<ApplicationForm />} />
      <Route path="/my-applications" element={<MyApplications />} />

      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/jobs" element={<AdminRoute><ManageJobs /></AdminRoute>} />
      <Route path="/admin/jobs/create" element={<AdminRoute><CreateJob /></AdminRoute>} />
      <Route path="/admin/jobs/edit/:id" element={<AdminRoute><CreateJob /></AdminRoute>} />
      <Route path="/admin/jobs/:jobId/applications" element={<AdminRoute><JobApplications /></AdminRoute>} />
      <Route path="/admin/applications" element={<AdminRoute><AllApplications /></AdminRoute>} />
      <Route path="/admin/applications/:id" element={<AdminRoute><ApplicationDetail /></AdminRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  const savedLanguage = localStorage.getItem('language') || 'en';
  document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = savedLanguage;

  const base = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <BrowserRouter basename={base}>
      <AuthProvider>
        <div className="min-h-screen">
          <AppRoutes />
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
