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
      console.log("[useChurchSettings] Fetching church settings");
      
      const { data, error } = await supabase
        .from('church_settings')
        .select('*')
        .limit(1); // Assuming there's only one global settings entry

      if (error) {
        console.error("[useChurchSettings] Error fetching settings:", error);
        throw new Error(error.message);
      }
      
      console.log("[useChurchSettings] Settings fetched:", data);
      return data;
    },
  });

  const settings = data?.[0]; // Get the first (and only) settings object

  useEffect(() => {
    if (settings?.church_name) {
      document.title = settings.church_name;
    } else {
      document.title = "Dyad Church App";
    }
  }, [settings?.church_name]);

  return { settings, isLoading, error };
};