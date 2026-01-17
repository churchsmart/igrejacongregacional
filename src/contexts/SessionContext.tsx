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
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        if (event === 'INITIAL_SESSION') {
          setLoading(false);
        } else if (event === 'SIGNED_IN') {
          toast.success('Login realizado com sucesso!');
          // Redirecionar para admin apenas se estiver na página de login
          if (location.pathname === '/login') {
            navigate('/admin');
          }
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          toast.success('Logout realizado com sucesso.');
          // Redirecionar para login apenas se estiver em área protegida
          if (location.pathname.startsWith('/admin')) {
            navigate('/login');
          }
          setLoading(false);
        } else {
          setLoading(false);
        }
      }
    );

    // Buscar sessão inicial
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user || null);
      setLoading(false);
      
      // Redirecionamentos iniciais
      if (initialSession && location.pathname === '/login') {
        navigate('/admin');
      } else if (!initialSession && location.pathname.startsWith('/admin')) {
        navigate('/login');
      }
    });

    return () => {
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