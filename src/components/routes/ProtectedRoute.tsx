import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles } from 'lucide-react';
import ErrorBoundary from '../ErrorBoundary';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
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
            <Sparkles className="w-4 h-4 text-lime-400 animate-bounce" /> Securing authorization...
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

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
};

export default ProtectedRoute;
