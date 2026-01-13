
import { createClient } from '@supabase/supabase-js';

// No ambiente do desenvolvedor, estas variáveis são injetadas.
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wyhhjwzxsvidkqohygtm.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5aGhqd3p4c3ZpZGtxb2h5Z3RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNTUxNTgsImV4cCI6MjA4MzgzMTE1OH0.tOdV9ZPNqho1d1e20lmg-VIssDlp9-FJpLE25gqZuRA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
