import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Sparkles } from 'lucide-react';

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
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
            <Sparkles className="w-4 h-4 text-lime-400 animate-bounce" /> Loading your context...
          </p>
        </div>
      </div>
    );
  }

  if (user) {
    // If we have a saved redirect target in location state or URL params, respect it!
    const queryParams = new URLSearchParams(location.search);
    const redirectTo = queryParams.get('redirectTo') || (location.state as any)?.from || '/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
