import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uyztuulsgzdnihzbnnmh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5enR1dWxzZ3pkbmloemJubm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4ODMwNTYsImV4cCI6MjA5MDQ1OTA1Nn0.gzTkNWMsIGWn0ZaD7LykUfZBQIAVoueSzOPAgdeHh98';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
