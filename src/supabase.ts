import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://photqfyljdnkteacberl.supabase.co';
const supabaseAnonKey = 'sb_publishable_GNw2Q82bM6YAFHD2Qyn6Kw_NndIQf1z';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
