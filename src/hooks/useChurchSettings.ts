import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

interface ChurchSettings {
  id: string;
  church_name: string;
  logo_url?: string;
  description?: string;
  contact_phone?: string;
  contact_email?: string;
  social_links?: Record<string, string>;
  updated_at: string;
}

export const useChurchSettings = () => {
  const { data, isLoading, error } = useQuery<ChurchSettings[], Error>({
    queryKey: ['churchSettings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('church_settings')
        .select('*')
        .limit(1);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
  });

  const settings = data?.[0];

  useEffect(() => {
    if (settings?.church_name) {
      document.title = settings.church_name;
    } else {
      document.title = "Igreja App";
    }
  }, [settings?.church_name]);

  return { settings, isLoading, error };
};