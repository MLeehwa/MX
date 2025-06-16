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
    title: '출고 처리',
    scan_barcode: '바코드를 스캔하세요',
    scan_result: '스캔 결과가 여기에 표시됩니다.',
    shipping_info: '출고 정보',
    container_no: '컨테이너 번호',
    part_no: '품번',
    quantity: '수량',
    location: '위치',
    home_btn: '홈으로',
  },
  en: {
    error_config: 'Configuration or Supabase library not loaded correctly. Please refresh or contact the administrator if the problem persists.',
    title: 'Shipping',
    scan_barcode: 'Scan barcode',
    scan_result: 'Scan result will appear here.',
    shipping_info: 'Shipping Info',
    container_no: 'Container No',
    part_no: 'Part No',
    quantity: 'Quantity',
    location: 'Location',
    home_btn: 'Home',
  },
  es: {
    error_config: 'La configuración o la biblioteca Supabase no se cargaron correctamente. Por favor, actualice o contacte al administrador si el problema persiste.',
    title: 'Envío',
    scan_barcode: 'Escanear código de barras',
    scan_result: 'El resultado del escaneo aparecerá aquí.',
    shipping_info: 'Información de envío',
    container_no: 'Número de contenedor',
    part_no: 'Part No',
    quantity: 'Cantidad',
    location: 'Ubicación',
    home_btn: 'Inicio',
  }
};

// === location code normalization ===
function normalizeLocationCode(code) {
  // 'A1' -> 'A-01', 'B10' -> 'B-10', etc.
  if (!code) return code;
  const match = code.match(/^([A-Z])[- ]?(\d{1,2})$/i);
  if (match) {
    const letter = match[1].toUpperCase();
    const num = match[2].padStart(2, '0');
    return `${letter}-${num}`;
  }
  return code.trim();
}

// === 2단계 출고 처리 로직만 남기고, MAP/SVG 관련 코드 모두 제거 ===

let shippingStep = 1;
let currentShippingInfo = null;

// 바코드 입력창 생성 및 스타일
let barcodeInput = document.getElementById('barcodeInput');
if (!barcodeInput) {
  barcodeInput = document.createElement('input');
  barcodeInput.id = 'barcodeInput';
  barcodeInput.type = 'text';
  barcodeInput.className = 'w-full px-4 py-3 text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500';
  barcodeInput.placeholder = i18n.ko.scan_barcode; // 기본값
  barcodeInput.style.background = '#e6f9e6';
  barcodeInput.style.margin = '24px 0 16px 0';
  document.body.prepend(barcodeInput);
}
barcodeInput.autofocus = true;
barcodeInput.focus();
barcodeInput.addEventListener('blur', () => setTimeout(() => barcodeInput.focus(), 100));

// 카메라 스캔 버튼 추가
if (!document.getElementById('barcodeCameraBtn')) {
  const cameraBtn = document.createElement('button');
  cameraBtn.id = 'barcodeCameraBtn';
  cameraBtn.textContent = 'Camera Scan';
  cameraBtn.className = 'bg-green-500 text-white px-4 py-2 rounded mb-2';
  cameraBtn.style.marginTop = '12px';
  barcodeInput.parentNode.appendChild(cameraBtn);

  const cameraPreview = document.createElement('div');
  cameraPreview.style.display = 'none';
  cameraPreview.style.position = 'relative';
  cameraPreview.innerHTML = `
    <video style="width:100%;max-width:400px;border:2px solid #333;border-radius:8px;"></video>
    <canvas style="display:none;"></canvas>
    <button style="position:absolute;top:8px;right:8px;z-index:10;background:#fff;color:#333;border-radius:50%;width:36px;height:36px;font-size:20px;">×</button>
  `;
  barcodeInput.parentNode.appendChild(cameraPreview);

  let cameraStream = null;
  cameraBtn.addEventListener('click', async () => {
    cameraPreview.style.display = 'block';
    const video = cameraPreview.querySelector('video');
    const closeBtn = cameraPreview.querySelector('button');
    const constraints = { video: { facingMode: { exact: 'environment' } } };
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e) {
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
    }
    video.srcObject = cameraStream;
    video.setAttribute('playsinline', true);
    video.play();
    scanBarcodeFromCamera(video, cameraPreview.querySelector('canvas'), barcodeInput, cameraPreview, () => cameraStream);
    closeBtn.onclick = () => {
      cameraPreview.style.display = 'none';
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
      }
    };
  });
}
if (!window.jsQR) {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
  document.head.appendChild(script);
}
function scanBarcodeFromCamera(video, canvas, inputEl, previewEl, getStream) {
  const ctx = canvas.getContext('2d');
  let scanning = true;
  async function tick() {
    if (!scanning || previewEl.style.display === 'none') return;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      if (window.jsQR) {
        const code = window.jsQR(imageData.data, canvas.width, canvas.height);
        if (code && code.data) {
          scanning = false;
          inputEl.value = code.data;
          inputEl.dispatchEvent(new Event('input'));
          previewEl.style.display = 'none';
          const stream = getStream();
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          return;
        }
      }
    }
    requestAnimationFrame(tick);
  }
  tick();
}

// 바코드 입력 이벤트: 2단계 출고 처리
barcodeInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    const value = barcodeInput.value.trim();
    if (!value) return;
    if (shippingStep === 1) {
      // 1단계: 출고지시서 바코드
      const { data: si, error } = await supabase
        .from('shipping_instruction')
        .select('id, shipping_date, label_id, container_no')
        .eq('barcode', value)
        .maybeSingle();
      if (error || !si) {
        showResult(i18n[lang()].scan_result + ' (지시서 없음)', 'error');
        barcodeInput.value = '';
        return;
      }
      currentShippingInfo = si;
      showResult('출고지시서 스캔 완료. 컨테이너 바코드를 스캔하세요.', 'success');
      shippingStep = 2;
      barcodeInput.value = '';
      barcodeInput.focus();
    } else if (shippingStep === 2) {
      // 2단계: 컨테이너 바코드
      if (!currentShippingInfo) {
        showResult(i18n[lang()].scan_result + ' (지시서 없음)', 'error');
        shippingStep = 1;
        barcodeInput.value = '';
        return;
      }
      if (value !== currentShippingInfo.container_no) {
        showResult('컨테이너 번호가 지시서와 일치하지 않습니다.', 'error');
        barcodeInput.value = '';
        return;
      }
      // 출고 확정 로직 (shipping_confirmation_admin.js와 동일)
      const shippedAt = currentShippingInfo.shipping_date || new Date().toISOString().slice(0, 10);
      await supabase
        .from('shipping_instruction_items')
        .update({ shipped_at: shippedAt })
        .eq('shipping_instruction_id', currentShippingInfo.id);
      await supabase
        .from('shipping_instruction')
        .update({ status: 'shipped' })
        .eq('id', currentShippingInfo.id);
      if (currentShippingInfo.label_id) {
        await supabase
          .from('receiving_items')
          .update({ location_code: null })
          .eq('label_id', currentShippingInfo.label_id);
      } else {
        const { data: shippedItems } = await supabase
          .from('shipping_instruction_items')
          .select('label_id')
          .eq('shipping_instruction_id', currentShippingInfo.id);
        const shippedLabelIds = (shippedItems || []).map(i => i.label_id).filter(Boolean);
        if (shippedLabelIds.length > 0) {
          await supabase
            .from('receiving_items')
            .update({ location_code: null })
            .in('label_id', shippedLabelIds);
        }
      }
      showResult('출고가 확정되었습니다.', 'success');
      shippingStep = 1;
      currentShippingInfo = null;
      barcodeInput.value = '';
      barcodeInput.focus();
    }
  }
});

// 입력값이 6글자 이상이면 자동으로 Enter keydown 이벤트 발생
barcodeInput.addEventListener('input', (e) => {
  if (barcodeInput.value && barcodeInput.value.length >= 6) {
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    barcodeInput.dispatchEvent(event);
  }
});

const successAudio = new Audio('../sounds/success.mp3');
const errorAudio = new Audio('../sounds/wrong.mp3');
function playSuccess() { successAudio.currentTime = 0; successAudio.play(); }
function playError() { errorAudio.currentTime = 0; errorAudio.play(); }

function showResult(msg, type) {
  const el = document.getElementById('result');
  if (!el) return;
  el.textContent = msg;
  if (type === 'error') {
    el.className = 'w-full max-w-2xl bg-white rounded-lg shadow-lg p-4 text-center text-red-600';
    playError();
  } else if (type === 'success') {
    el.className = 'w-full max-w-2xl bg-white rounded-lg shadow-lg p-4 text-center text-green-600';
    playSuccess();
    } else {
    el.className = 'w-full max-w-2xl bg-white rounded-lg shadow-lg p-4 text-center';
  }
}

function lang() {
  return localStorage.getItem('pda_lang') || 'ko';
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