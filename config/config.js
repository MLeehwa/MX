// Supabase Configuration
const SUPABASE_URL = 'https://wfnihtmmaebgjtdmazmo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmbmlodG1tYWViZ2p0ZG1hem1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NTY3NTcsImV4cCI6MjA2NTMzMjc1N30.FYfdgSvOT1qUvANGlqXCEGvSR2JujggU7T_Sjzys3HQ';
 
// Initialize Supabase Client (supabase-js v2.x)
window.supabase = window.supabase || supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 