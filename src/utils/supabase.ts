import { createClient } from '@supabase/supabase-js';
import { getConfig } from './config';

const { supabaseUrl, supabaseKey } = getConfig();

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
