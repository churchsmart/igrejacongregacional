import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';

export type UserRole = 'master' | 'admin' | 'leader' | 'editor' | 'member';

export const useUserRole = () => {
  const { user, loading: sessionLoading } = useSession();

  const { data: role, isLoading, error } = useQuery<UserRole | null, Error>({
    queryKey: ['userRole', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data.role as UserRole;
    },
    enabled: !!user && !sessionLoading, // Only run query if user is logged in and session is not loading
  });

  return { role, isLoading: isLoading || sessionLoading, error };
};