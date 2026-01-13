const SUPABASE_URL = 'https://wfnihtmmaebgjtdmazmo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmbmlodG1tYWViZ2p0ZG1hem1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NTY3NTcsImV4cCI6MjA2NTMzMjc1N30.FYfdgSvOT1qUvANGlqXCEGvSR2JujggU7T_Sjzys3HQ';

// Supabase 초기화 함수
function initSupabase() {
  if (typeof supabase !== "undefined" && supabase.createClient) {
    window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('Supabase 클라이언트가 초기화되었습니다.');
    // 초기화 완료 이벤트 발생
    window.dispatchEvent(new Event('supabaseReady'));
  } else {
    console.warn("supabase-js가 아직 로드되지 않았습니다. 재시도 중...");
    setTimeout(initSupabase, 100);
  }
}

// 즉시 초기화 시도
initSupabase();
