import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

interface SessionContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("[SessionContext] Auth state change:", event, currentSession);
        setSession(currentSession);
        setUser(currentSession?.user || null);
        setLoading(false);

        if (event === 'SIGNED_IN') {
          toast.success('Login successful!');
          // Redirect authenticated users to admin dashboard if they were on login or root
          if (location.pathname === '/login' || location.pathname === '/') {
            navigate('/admin');
          }
        } else if (event === 'SIGNED_OUT') {
          toast.success('Logged out successfully.');
          // Redirect unauthenticated users to login page if they were in admin
          if (location.pathname.startsWith('/admin')) {
            navigate('/login');
          }
        }
        // AUTH_API_ERROR is not a direct event type from onAuthStateChange.
        // Errors are typically handled when making specific auth calls or via session object.
      }
    );

    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user || null);
      setLoading(false);
      if (initialSession && (location.pathname === '/login' || location.pathname === '/')) {
        navigate('/admin'); // If already logged in, go to admin
      } else if (!initialSession && location.pathname.startsWith('/admin')) {
        navigate('/login'); // If not logged in and trying to access admin, go to login
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  return (
    <SessionContext.Provider value={{ session, user, loading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};