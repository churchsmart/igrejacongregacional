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
      
      console.log("[useUserRole] Fetching role for user:", user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error("[useUserRole] Error fetching user role:", error);
        throw new Error(error.message);
      }
      
      console.log("[useUserRole] Role fetched:", data.role);
      return data.role as UserRole;
    },
    enabled: !!user && !sessionLoading,
    staleTime: Infinity, // Role rarely changes, so we can cache it
  });

  return { role, isLoading: isLoading || sessionLoading, error };
};