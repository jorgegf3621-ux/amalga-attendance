import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cjztsqlddutkwmdvgayl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqenRzcWxkZHV0a3dtZHZnYXlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2ODc0MjcsImV4cCI6MjA4OTI2MzQyN30.8Ze2PdN-eUOggWEP1Oks_3dPlmrff4bkpzviBDMRURs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
