const SUPABASE_URL = 'https://wfnihtmmaebgjtdmazmo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmbmlodG1tYWViZ2p0ZG1hem1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NTY3NTcsImV4cCI6MjA2NTMzMjc1N30.FYfdgSvOT1qUvANGlqXCEGvSR2JujggU7T_Sjzys3HQ';
if (typeof supabase !== "undefined") {
  window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
  console.error("supabase-js가 아직 로드되지 않았습니다!");
}
