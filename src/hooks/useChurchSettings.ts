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
        .limit(1); // Assuming there's only one global settings entry

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });

  const settings = data?.[0]; // Get the first (and only) settings object

  useEffect(() => {
    if (settings?.church_name) {
      document.title = settings.church_name;
      // Note: Dynamically updating manifest.json is not directly possible from client-side JavaScript
      // as it's a static file served by the web server. If truly dynamic manifest content
      // is required, a server-side endpoint would be needed to generate it.
      // For now, the browser tab title will reflect the church name.
    } else {
      document.title = "Dyad Church App";
    }
  }, [settings?.church_name]);

  return { settings, isLoading, error };
};