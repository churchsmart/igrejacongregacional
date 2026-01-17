import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hiyfooyqpipmneskkrbf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpeWZvb3lxcGlwbW5lc2trcmJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NDEzNzIsImV4cCI6MjA4NDAxNzM3Mn0.xgPqYW5OIC6cPBoGg308LpRVhOZnWZiat5G5T4_5YVk';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);