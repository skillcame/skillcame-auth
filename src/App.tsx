import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

const routerFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

// Context Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';

// Common Core Components
import SEOHead from './components/SEOHead';
import ToastContainer from './components/Toast';

// Enterprise Route Guards
import ProtectedRoute from './components/routes/ProtectedRoute';
import PublicRoute from './components/routes/PublicRoute';
import RoleProtectedRoute from './components/routes/RoleProtectedRoute';

// Public pages
import NotFound from './pages/NotFound';

// Auth Pages
import Login from './features/auth/pages/Login';
import Register from './features/auth/pages/Register';
import ForgotPassword from './features/auth/pages/ForgotPassword';
import ResetPassword from './features/auth/pages/ResetPassword';
import VerifyEmail from './features/auth/pages/VerifyEmail';

// User Panel Pages
import UserDashboard from './user-panel/UserDashboard';
import UserNotifications from './user-panel/UserNotifications';
import UserSettings from './user-panel/UserSettings';
import UserPayments from './user-panel/UserPayments';
import InsightsFeed from './user-panel/InsightsFeed';
import UserCourses from './user-panel/UserCourses';
import UserLessons from './user-panel/UserLessons';
import ComingSoon from './user-panel/ComingSoon';
import BugsAndReports from './user-panel/BugsAndReports';

// Admin Panel Pages
import AdminDashboard from './admin-panel/Dashboard';
import UserManagement from './admin-panel/UserManagement';
import NotificationManagement from './admin-panel/NotificationManagement';
import PaymentsManagement from './admin-panel/PaymentsManagement';
import AdminSettings from './admin-panel/Settings';
import InsightsManager from './admin-panel/InsightsManager';
import BugsAndReportsManagement from './admin-panel/BugsAndReportsManagement';

// Newly added protected core application routes
import StudentsDirectory from './pages/students/StudentsDirectory';
import Profile from './pages/profile/Profile';

// Lazy loaded admin components
const CourseManager = lazy(() => import('./admin-panel/CourseManager'));
const LessonManager = lazy(() => import('./admin-panel/LessonManager'));
const CourseAnalytics = lazy(() => import('./admin-panel/CourseAnalytics'));
const DashboardCardManager = lazy(() => import('./admin-panel/DashboardCardManager'));

// SMART REDIRECT HANDLERS
const RoleDashboardRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/user/dashboard" replace />;
};

const RoleSettingsRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === 'admin') {
    return <Navigate to="/admin/settings" replace />;
  }
  return <Navigate to="/user/settings" replace />;
};

const RoleCoursesRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === 'admin') {
    return <Navigate to="/admin/courses" replace />;
  }
  return <Navigate to="/user/courses" replace />;
};

const RoleAdminRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/user/dashboard" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <Router future={routerFutureFlags}>
            <SEOHead />
            <ToastContainer />
            <Routes>
            {/* Legacy/Root Redirects */}
            <Route path="/" element={<Navigate to="/auth/login" replace />} />
            <Route path="/home" element={<Navigate to="/auth/login" replace />} />
            <Route path="/login" element={<Navigate to="/auth/login" replace />} />
            <Route path="/register" element={<Navigate to="/auth/register" replace />} />

            {/* Authentication Module Routes (wrapped in PublicRoute) */}
            <Route path="/auth/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/auth/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/auth/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/auth/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
            <Route path="/auth/verify-email" element={<PublicRoute><VerifyEmail /></PublicRoute>} />

            {/* General Protected Application Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><RoleDashboardRedirect /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><RoleSettingsRedirect /></ProtectedRoute>} />
            <Route path="/courses" element={<ProtectedRoute><RoleCoursesRedirect /></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute><StudentsDirectory /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={['admin']}><RoleAdminRedirect /></RoleProtectedRoute></ProtectedRoute>} />

            {/* User Specific Panel Routes (protected) */}
            <Route path="/user/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
            <Route path="/user/notifications" element={<ProtectedRoute><UserNotifications /></ProtectedRoute>} />
            <Route path="/user/settings" element={<ProtectedRoute><UserSettings /></ProtectedRoute>} />
            <Route path="/user/payments" element={<ProtectedRoute><UserPayments /></ProtectedRoute>} />
            <Route path="/user/ai-news" element={<ProtectedRoute><InsightsFeed /></ProtectedRoute>} />
            <Route path="/user/insights" element={<ProtectedRoute><InsightsFeed /></ProtectedRoute>} />
            <Route path="/user/courses" element={<ProtectedRoute><UserCourses /></ProtectedRoute>} />
            <Route path="/user/reports" element={<ProtectedRoute><BugsAndReports /></ProtectedRoute>} />
            <Route path="/coming-soon" element={<ComingSoon />} />
            <Route path="/course/:courseSlug" element={<ProtectedRoute><UserLessons /></ProtectedRoute>} />
            <Route path="/course/:courseSlug/lesson/:lessonSlug" element={<ProtectedRoute><UserLessons /></ProtectedRoute>} />

            {/* Admin Panel Routes (protected + admin only) */}
            <Route path="/admin/dashboard" element={<RoleProtectedRoute allowedRoles={['admin']}><AdminDashboard /></RoleProtectedRoute>} />
            <Route path="/admin/users" element={<RoleProtectedRoute allowedRoles={['admin']}><UserManagement /></RoleProtectedRoute>} />
            <Route path="/admin/ai-news" element={<RoleProtectedRoute allowedRoles={['admin']}><InsightsManager /></RoleProtectedRoute>} />
            <Route path="/admin/insights" element={<RoleProtectedRoute allowedRoles={['admin']}><InsightsManager /></RoleProtectedRoute>} />
            <Route path="/admin/notifications" element={<RoleProtectedRoute allowedRoles={['admin']}><NotificationManagement /></RoleProtectedRoute>} />
            <Route path="/admin/payments" element={<RoleProtectedRoute allowedRoles={['admin']}><PaymentsManagement /></RoleProtectedRoute>} />
            <Route path="/admin/reports" element={<RoleProtectedRoute allowedRoles={['admin']}><BugsAndReportsManagement /></RoleProtectedRoute>} />
            <Route path="/admin/settings" element={<RoleProtectedRoute allowedRoles={['admin']}><AdminSettings /></RoleProtectedRoute>} />
            <Route path="/admin/courses" element={<RoleProtectedRoute allowedRoles={['admin']}><Suspense fallback={null}><CourseManager /></Suspense></RoleProtectedRoute>} />
            <Route path="/admin/lessons" element={<RoleProtectedRoute allowedRoles={['admin']}><Suspense fallback={null}><LessonManager /></Suspense></RoleProtectedRoute>} />
            <Route path="/admin/course-analytics" element={<RoleProtectedRoute allowedRoles={['admin']}><Suspense fallback={null}><CourseAnalytics /></Suspense></RoleProtectedRoute>} />
            <Route path="/admin/dashboard-cards" element={<RoleProtectedRoute allowedRoles={['admin']}><Suspense fallback={null}><DashboardCardManager /></Suspense></RoleProtectedRoute>} />

            {/* Dynamic 404 Routing based on custom states */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AppProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
