// PDA용 config.js(window.CONFIG) 사용, admin/config/config.js와 분리
if (!window.CONFIG || !window.supabase) {
  alert('설정 또는 Supabase 라이브러리가 올바르게 로드되지 않았습니다. 새로고침 후에도 문제가 있으면 관리자에게 문의하세요.');
  throw new Error('CONFIG or supabase not loaded');
}
const supabase = window.supabase.createClient(window.CONFIG.SUPABASE_URL, window.CONFIG.SUPABASE_KEY);

// 다국어 번역 데이터
const i18n = {
  ko: {
    error_config: '설정 또는 Supabase 라이브러리가 올바르게 로드되지 않았습니다. 새로고침 후에도 문제가 있으면 관리자에게 문의하세요.',
    title: '입고 처리',
    scan_barcode: '바코드를 스캔하세요',
    scan_result: '스캔 결과가 여기에 표시됩니다.',
    home_btn: '홈으로',
  },
  en: {
    error_config: 'Configuration or Supabase library not loaded correctly. Please refresh or contact the administrator if the problem persists.',
    title: 'Receiving',
    scan_barcode: 'Scan barcode',
    scan_result: 'Scan result will appear here.',
    home_btn: 'Home',
  },
  es: {
    error_config: 'La configuración o la biblioteca Supabase no se cargaron correctamente. Por favor, actualice o contacte al administrador si el problema persiste.',
    title: 'Recepción',
    scan_barcode: 'Escanear código de barras',
    scan_result: 'El resultado del escaneo aparecerá aquí.',
    home_btn: 'Inicio',
  }
};

// DOM Elements
const barcodeInput = document.getElementById('barcodeInput')
const receivingInfo = document.getElementById('receivingInfo')
const receivingForm = document.getElementById('receivingForm')
const statusMessage = document.getElementById('statusMessage')
const messageText = document.getElementById('messageText')

// Current receiving plan data
let currentReceivingPlan = null

// 바코드 인풋 항상 포커스
barcodeInput.focus();
barcodeInput.style.background = '#e6f9e6';
barcodeInput.addEventListener('blur', () => setTimeout(() => barcodeInput.focus(), 100));
barcodeInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    const barcode = barcodeInput.value.trim();
    if (barcode) {
      await handleBarcodeScan(barcode);
      barcodeInput.value = '';
      barcodeInput.focus();
    }
  }
});

// === [자동 입력: input 이벤트로 자동 처리] ===
let lastValue = '';
barcodeInput.addEventListener('input', async (e) => {
  // 값이 바뀌었고, 길이가 충분히 길면(예: 6자리 이상) 자동 처리
  if (barcodeInput.value && barcodeInput.value !== lastValue && barcodeInput.value.length >= 6) {
    lastValue = barcodeInput.value;
    await handleBarcodeScan(barcodeInput.value.trim());
    barcodeInput.value = '';
    barcodeInput.focus();
  }
});

// === [카메라 바코드 스캔 기능 개선] ===
let cameraStream = null;

// 카메라 프리뷰 영역 생성
const cameraPreview = document.createElement('div');
cameraPreview.id = 'cameraPreview';
cameraPreview.style.display = 'none';
cameraPreview.innerHTML = `
  <video id="barcodeVideo" style="width:100%;max-width:400px;border:2px solid #333;border-radius:8px;"></video>
  <canvas id="barcodeCanvas" style="display:none;"></canvas>
  <button id="closeCameraBtn" style="position:absolute;top:8px;right:8px;z-index:10;background:#fff;color:#333;border-radius:50%;width:36px;height:36px;font-size:20px;">×</button>
`;
document.body.appendChild(cameraPreview);

// 카메라 버튼 이벤트 리스너
const cameraBtn = document.getElementById('cameraBtn');
if (cameraBtn) {
  cameraBtn.addEventListener('click', async () => {
    try {
      cameraPreview.style.display = 'block';
      const video = document.getElementById('barcodeVideo');
      const closeBtn = document.getElementById('closeCameraBtn');
      
      // 후방 카메라 우선 시도
      const constraints = {
        video: { facingMode: { exact: 'environment' } }
      };
      
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        console.log('후방 카메라 접근 실패, 기본 카메라 사용:', e);
        // 후방 카메라가 없으면 기본 카메라
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      
      video.srcObject = cameraStream;
      video.setAttribute('playsinline', true);
      await video.play();
      
      scanBarcodeFromCamera();
      
      closeBtn.onclick = () => {
        cameraPreview.style.display = 'none';
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
          cameraStream = null;
        }
      };
    } catch (error) {
      console.error('카메라 접근 오류:', error);
      alert('카메라에 접근할 수 없습니다. 카메라 권한을 확인해주세요.');
      cameraPreview.style.display = 'none';
    }
  });
}

async function scanBarcodeFromCamera() {
  const video = document.getElementById('barcodeVideo');
  const canvas = document.getElementById('barcodeCanvas');
  const ctx = canvas.getContext('2d');
  let scanning = true;
  
  async function tick() {
    if (!scanning || cameraPreview.style.display === 'none') return;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      if (window.jsQR) {
        const code = window.jsQR(imageData.data, canvas.width, canvas.height);
        if (code && code.data) {
          scanning = false;
          // 바코드 인풋에 값 입력 및 자동 처리
          barcodeInput.value = code.data;
          barcodeInput.dispatchEvent(new Event('input'));
          cameraPreview.style.display = 'none';
          if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
          }
          return;
        }
      }
    }
    requestAnimationFrame(tick);
  }
  tick();
}

// 출고/입고 확정 버튼 등 기존 이벤트 리스너
if (document.getElementById('completeReceiving')) {
  document.getElementById('completeReceiving').addEventListener('click', async () => {
    await completeReceiving();
    barcodeInput.focus();
  });
}

// Functions
async function handleBarcodeScan(barcode) {
  try {
    // 1. container_no로 receiving_plan에서 plan 조회
    const { data: plan, error: planError } = await supabase
      .from('receiving_plan')
      .select('id, container_no')
      .eq('container_no', barcode)
      .single();
    if (planError || !plan) {
      showMessage('해당 컨테이너 번호의 입고계획이 없습니다.', 'error');
      return;
    }

    // 2. 해당 plan의 모든 receiving_items 조회
    const { data: items, error: itemsError } = await supabase
      .from('receiving_items')
      .select('label_id')
      .eq('container_no', barcode);
    if (itemsError || !items || items.length === 0) {
      showMessage('해당 컨테이너의 품번 정보가 없습니다.', 'error');
      return;
    }

    // 3. 이미 입고된 label_id 조회
    const labelIds = items.map(i => i.label_id);
    const { data: logs, error: logsError } = await supabase
      .from('receiving_log')
      .select('label_id')
      .in('label_id', labelIds);
    if (logsError) throw logsError;
    const receivedSet = new Set((logs || []).map(l => String(l.label_id)));

    // 4. 입고되지 않은 label_id만 insert
    const now = new Date();
    const etTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    let insertCount = 0;
    for (const item of items) {
      if (!receivedSet.has(String(item.label_id))) {
        const { error: logError } = await supabase
          .from('receiving_log')
          .insert({
            label_id: item.label_id,
            received_at: etTime.toISOString(),
            confirmed_by: 'admin', // 실제 PDA 유저명으로 교체 가능
          });
        if (!logError) insertCount++;
      }
    }
    if (insertCount > 0) {
      showMessage(`Success (${insertCount}건)`, 'success');
    } else {
      showMessage('Alredy Scanned.', 'info');
    }
    barcodeInput.value = '';
    barcodeInput.focus();
  } catch (error) {
    console.error('Error:', error);
    showMessage('ERROR', 'error');
  }
}

function displayReceivingInfo(data) {
  document.getElementById('containerNo').textContent = data.container_no;
  document.getElementById('partNo').textContent = data.part_no;
  document.getElementById('planQty').textContent = data.quantity;
  document.getElementById('planDate').textContent = data.created_at ? new Date(data.created_at).toLocaleDateString() : '';
}

async function completeReceiving() {
  const quantity = document.getElementById('quantity').value;
  const location = document.getElementById('location').value;
  if (!quantity || !location) {
    showMessage('Please fill in all fields', 'error');
    return;
  }
  try {
    // Get current time in US Eastern Time
    const now = new Date();
    const etTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    // receiving_log에 insert
    const { error: logError } = await supabase
      .from('receiving_log')
      .insert({
        label_id: currentReceivingPlan.label_id,
        received_at: etTime.toISOString(),
        confirmed_by: 'pda_user',
        quantity: quantity,
        location_code: location
      });
    if (logError) throw logError;
    showMessage('Receiving completed successfully', 'success');
    resetForm();
    barcodeInput.focus();
  } catch (error) {
    console.error('Error:', error);
    showMessage('Error completing receiving', 'error');
  }
}

function resetForm() {
    receivingInfo.classList.add('hidden')
    receivingForm.classList.add('hidden')
    document.getElementById('quantity').value = ''
    document.getElementById('location').value = ''
    currentReceivingPlan = null
}

const successAudio = new Audio('../sounds/success.mp3');
const errorAudio = new Audio('../sounds/wrong.mp3');
function playSuccess() { successAudio.currentTime = 0; successAudio.play(); }
function playError() { errorAudio.currentTime = 0; errorAudio.play(); }

function showMessage(message, type = 'info') {
  const el = document.getElementById('messageText');
  if (!el) return;
  el.textContent = message;
  el.className = 'block mt-4 text-lg';
  if (type === 'error') {
    el.classList.add('text-red-600');
    playError();
  } else if (type === 'success') {
    el.classList.add('text-green-600');
    playSuccess();
  } else {
    el.classList.add('text-gray-800');
  }
}

// 언어 변경 함수 및 이벤트
function setLang(lang) {
  document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector('.lang-btn[data-lang="' + lang + '"]');
  if (activeBtn) activeBtn.classList.add('active');
  // Only update home button
  var homeBtn = document.querySelector('.home-btn[data-i18n="home_btn"]');
  if (homeBtn && i18n[lang]["home_btn"]) homeBtn.textContent = i18n[lang]["home_btn"];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang][key]) el.textContent = i18n[lang][key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (i18n[lang][key]) el.placeholder = i18n[lang][key];
  });
  document.documentElement.lang = lang;
  localStorage.setItem('pda_lang', lang);
}
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.onclick = () => setLang(btn.getAttribute('data-lang'));
});
setLang(localStorage.getItem('pda_lang') || 'ko');

document.addEventListener('DOMContentLoaded', function() {
  var lang = localStorage.getItem('pda_lang') || 'ko';
  var homeBtn = document.querySelector('.home-btn[data-i18n="home_btn"]');
  if (homeBtn && i18n[lang]["home_btn"]) homeBtn.textContent = i18n[lang]["home_btn"];
}); 