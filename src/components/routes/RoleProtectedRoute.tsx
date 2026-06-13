import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, ShieldX } from 'lucide-react';
import ErrorBoundary from '../ErrorBoundary';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackPath?: string;
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ 
  children, 
  allowedRoles, 
  fallbackPath = '/user/dashboard' 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black">
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl relative border border-indigo-500/20 bg-neutral-900 flex items-center justify-center mb-4">
            <img 
              src="/skillcame.webp" 
              alt="SkillCame Brand" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 border-2 border-lime-400 border-t-transparent rounded-2xl animate-spin"></div>
          </div>
          <p className="text-sm font-semibold text-neutral-400 animate-pulse flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-lime-400 animate-bounce" /> Validating roles & privileges...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    const fromPath = location.pathname + location.search;
    return (
      <Navigate 
        to={`/auth/login?redirectTo=${encodeURIComponent(fromPath)}`} 
        state={{ from: fromPath }} 
        replace 
      />
    );
  }

  const userRole = user?.role || 'user';
  const hasAccess = allowedRoles.includes(userRole);

  if (!hasAccess) {
    // Return custom enterprise high-fidelity access denied screen rather than raw blank redirects
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-4">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f0f15_1px,transparent_1px),linear-gradient(to_bottom,#0f0f15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>
        <div className="relative z-10 max-w-md w-full bg-neutral-900/40 backdrop-blur-xl p-8 rounded-2xl border border-red-500/10 text-center">
          <div className="mx-auto w-16 h-16 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 text-red-500">
            <ShieldX className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Access Restricted</h2>
          <p className="text-sm text-neutral-400 mb-6">
            Your current account credentials do not grant authorization for the requested resource: <code className="text-red-400 bg-red-500/5 px-1.5 py-0.5 rounded font-mono text-xs">{location.pathname}</code>
          </p>
          <div className="space-y-3">
            <Navigate to={fallbackPath} replace />
            <a 
              href={fallbackPath} 
              className="inline-flex w-full justify-center px-4 py-3 border border-neutral-800 rounded-xl bg-neutral-950/40 text-neutral-300 hover:text-white hover:bg-neutral-900 transition-all font-semibold text-sm"
            >
              Return to Safe Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
};

export default RoleProtectedRoute;
