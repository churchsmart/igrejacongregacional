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
    console.log("[SessionContext] Initializing auth state listener");
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("[SessionContext] Auth state change:", event, currentSession?.user?.id);
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        if (event === 'INITIAL_SESSION') {
          console.log("[SessionContext] Initial session loaded");
          setLoading(false);
        } else if (event === 'SIGNED_IN') {
          console.log("[SessionContext] User signed in");
          toast.success('Login realizado com sucesso!');
          // Only redirect if user was on login page
          if (location.pathname === '/login') {
            navigate('/admin');
          }
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          console.log("[SessionContext] User signed out");
          toast.success('Logout realizado com sucesso.');
          // Only redirect if user was in admin area
          if (location.pathname.startsWith('/admin')) {
            navigate('/login');
          }
          setLoading(false);
        } else {
          setLoading(false);
        }
      }
    );

    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log("[SessionContext] Initial session fetch result:", !!initialSession);
      setSession(initialSession);
      setUser(initialSession?.user || null);
      setLoading(false);
      
      // Redirect logic for initial load
      if (initialSession && location.pathname === '/login') {
        navigate('/admin');
      } else if (!initialSession && location.pathname.startsWith('/admin')) {
        navigate('/login');
      }
    });

    return () => {
      console.log("[SessionContext] Cleaning up auth listener");
      subscription.unsubscribe();
    };
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