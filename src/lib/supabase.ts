import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Detection = {
  id: string;
  statement: string;
  is_hateful: boolean;
  confidence: number;
  categories: string[];
  severity: 'none' | 'low' | 'moderate' | 'high' | 'severe';
  explanation: string;
  flagged_terms: string[];
  created_at: string;
};
