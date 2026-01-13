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
    title: '위치 찾기',
    scan_barcode: '바코드를 스캔하세요',
    scan_result: '스캔 결과가 여기에 표시됩니다.',
    home_btn: '홈으로',
  },
  en: {
    error_config: 'Configuration or Supabase library not loaded correctly. Please refresh or contact the administrator if the problem persists.',
    title: 'Location Finder',
    scan_barcode: 'Scan barcode',
    scan_result: 'Scan result will appear here.',
    home_btn: 'Home',
  },
  es: {
    error_config: 'La configuración o la biblioteca Supabase no se cargaron correctamente. Por favor, actualice o contacte al administrador si el problema persiste.',
    title: 'Buscador de Ubicación',
    scan_barcode: 'Escanear código de barras',
    scan_result: 'El resultado del escaneo aparecerá aquí.',
    home_btn: 'Inicio',
  }
};

// === SVG 맵 레이아웃 (location_view.js에서 복사) ===
const layout = [
  { code: 'A-01', x: 2, y: 1, width: 60, height: 20 },
  { code: 'A-02', x: 2, y: 25, width: 60, height: 20 },
  { code: 'A-03', x: 2, y: 49, width: 60, height: 20 },
  { code: 'A-04', x: 2, y: 73, width: 60, height: 20 },
  { code: 'A-05', x: 2, y: 97, width: 60, height: 20 },
  { code: 'A-06', x: 2, y: 121, width: 60, height: 20 },
  { code: 'A-07', x: 2, y: 145, width: 60, height: 20 },
  { code: 'A-08', x: 2, y: 169, width: 60, height: 20 },
  { code: 'A-09', x: 2, y: 193, width: 60, height: 20 },
  { code: 'A-10', x: 2, y: 217, width: 60, height: 20 },
  { code: 'A-11', x: 2, y: 241, width: 60, height: 20 },
  { code: 'A-12', x: 2, y: 265, width: 60, height: 20 },
  { code: 'A-13', x: 2, y: 289, width: 60, height: 20 },
  { code: 'A-14', x: 2, y: 313, width: 60, height: 20 },
  { code: 'A-15', x: 2, y: 337, width: 60, height: 20 },
  { code: 'A-16', x: 2, y: 361, width: 60, height: 20 },
  { code: 'A-17', x: 2, y: 385, width: 60, height: 20 },
  { code: 'A-18', x: 2, y: 409, width: 60, height: 20 },
  { code: 'A-19', x: 2, y: 433, width: 60, height: 20 },
  { code: 'A-20', x: 2, y: 457, width: 60, height: 20 },
  { code: 'A-21', x: 2, y: 481, width: 60, height: 20 },
  { code: 'A-22', x: 2, y: 505, width: 60, height: 20 },
  { code: 'A-23', x: 2, y: 529, width: 60, height: 20 },
  { code: 'A-24', x: 2, y: 553, width: 60, height: 20 },
  { code: 'B-01', x: 115, y: 1, width: 60, height: 20 },
  { code: 'B-02', x: 115, y: 25, width: 60, height: 20 },
  { code: 'B-03', x: 115, y: 49, width: 60, height: 20 },
  { code: 'B-04', x: 115, y: 73, width: 60, height: 20 },
  { code: 'B-05', x: 115, y: 97, width: 60, height: 20 },
  { code: 'B-06', x: 115, y: 121, width: 60, height: 20 },
  { code: 'B-07', x: 115, y: 145, width: 60, height: 20 },
  { code: 'B-08', x: 115, y: 169, width: 60, height: 20 },
  { code: 'B-11', x: 115, y: 241, width: 60, height: 20 },
  { code: 'B-12', x: 115, y: 265, width: 60, height: 20 },
  { code: 'B-13', x: 115, y: 289, width: 60, height: 20 },
  { code: 'B-14', x: 115, y: 313, width: 60, height: 20 },
  { code: 'B-15', x: 115, y: 337, width: 60, height: 20 },
  { code: 'B-16', x: 115, y: 361, width: 60, height: 20 },
  { code: 'B-17', x: 115, y: 385, width: 60, height: 20 },
  { code: 'B-18', x: 115, y: 409, width: 60, height: 20 },
  { code: 'B-19', x: 115, y: 433, width: 60, height: 20 },
  { code: 'B-20', x: 115, y: 457, width: 60, height: 20 },
  { code: 'B-21', x: 115, y: 481, width: 60, height: 20 },
  { code: 'B-22', x: 115, y: 505, width: 60, height: 20 },
  { code: 'B-23', x: 115, y: 529, width: 60, height: 20 },
  { code: 'B-24', x: 115, y: 553, width: 60, height: 20 },
  { code: 'C-01', x: 230, y: 217, width: 60, height: 20 },
  { code: 'C-02', x: 230, y: 241, width: 60, height: 20 },
  { code: 'C-03', x: 230, y: 265, width: 60, height: 20 },
  { code: 'C-04', x: 230, y: 289, width: 60, height: 20 },
  { code: 'C-05', x: 230, y: 313, width: 60, height: 20 },
  { code: 'C-06', x: 230, y: 337, width: 60, height: 20 },
  { code: 'C-07', x: 230, y: 361, width: 60, height: 20 },
  { code: 'C-08', x: 230, y: 385, width: 60, height: 20 },
  { code: 'C-09', x: 230, y: 409, width: 60, height: 20 },
  { code: 'C-10', x: 230, y: 433, width: 60, height: 20 },
  { code: 'C-11', x: 230, y: 457, width: 60, height: 20 },
  { code: 'C-12', x: 230, y: 481, width: 60, height: 20 },
  { code: 'C-13', x: 230, y: 505, width: 60, height: 20 },
  { code: 'C-14', x: 230, y: 529, width: 60, height: 20 },
  { code: 'C-15', x: 230, y: 553, width: 60, height: 20 },
  { code: 'D-01', x: 292, y: 217, width: 60, height: 20 },
  { code: 'D-02', x: 292, y: 241, width: 60, height: 20 },
  { code: 'D-03', x: 292, y: 265, width: 60, height: 20 },
  { code: 'D-04', x: 292, y: 289, width: 60, height: 20 },
  { code: 'D-05', x: 292, y: 313, width: 60, height: 20 },
  { code: 'D-06', x: 292, y: 337, width: 60, height: 20 },
  { code: 'D-07', x: 292, y: 361, width: 60, height: 20 },
  { code: 'D-08', x: 292, y: 385, width: 60, height: 20 },
  { code: 'D-09', x: 292, y: 409, width: 60, height: 20 },
  { code: 'D-10', x: 292, y: 433, width: 60, height: 20 },
  { code: 'D-11', x: 292, y: 457, width: 60, height: 20 },
  { code: 'D-12', x: 292, y: 481, width: 60, height: 20 },
  { code: 'D-13', x: 292, y: 505, width: 60, height: 20 },
  { code: 'D-14', x: 292, y: 529, width: 60, height: 20 },
  { code: 'D-15', x: 292, y: 553, width: 60, height: 20 },
  { code: 'E-01', x: 450, y: 217, width: 60, height: 20 },
  { code: 'E-02', x: 450, y: 241, width: 60, height: 20 },
  { code: 'E-03', x: 450, y: 265, width: 60, height: 20 },
  { code: 'E-04', x: 450, y: 289, width: 60, height: 20 },
  { code: 'E-05', x: 450, y: 313, width: 60, height: 20 },
  { code: 'E-06', x: 450, y: 337, width: 60, height: 20 },
  { code: 'E-07', x: 450, y: 361, width: 60, height: 20 },
  { code: 'E-08', x: 450, y: 385, width: 60, height: 20 },
  { code: 'E-09', x: 450, y: 409, width: 60, height: 20 },
  { code: 'E-10', x: 450, y: 433, width: 60, height: 20 },
  { code: 'F-01', x: 512, y: 217, width: 60, height: 20 },
  { code: 'F-02', x: 512, y: 241, width: 60, height: 20 },
  { code: 'F-03', x: 512, y: 265, width: 60, height: 20 },
  { code: 'F-04', x: 512, y: 289, width: 60, height: 20 },
  { code: 'F-05', x: 512, y: 313, width: 60, height: 20 },
  { code: 'F-06', x: 512, y: 337, width: 60, height: 20 },
  { code: 'F-07', x: 512, y: 361, width: 60, height: 20 },
  { code: 'F-08', x: 512, y: 385, width: 60, height: 20 },
  { code: 'F-09', x: 512, y: 409, width: 60, height: 20 },
  { code: 'F-10', x: 512, y: 433, width: 60, height: 20 },
  { code: 'G-01', x: 450, y: 457, width: 120, height: 20 },
  { code: 'G-02', x: 450, y: 481, width: 120, height: 20 },
  { code: 'G-03', x: 450, y: 505, width: 120, height: 20 },
  { code: 'G-04', x: 450, y: 529, width: 120, height: 20 },
  { code: 'G-05', x: 450, y: 553, width: 120, height: 20 },
];

// SVG 맵 생성
function renderSVG(highlightCode) {
  let svg = document.getElementById('locationSVG');
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', 'locationSVG');
    svg.setAttribute('viewBox', '0 0 650 600');
    svg.setAttribute('style', 'width:100vw; height:60vh; max-width:100%; background:#f8fafc; border:1.5px solid #333; box-shadow:0 2px 12px #0002;');
    document.body.appendChild(svg);
  }
  // 기존 내용 제거
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  // 기본 배경
  svg.insertAdjacentHTML('beforeend', `
    <rect x="1" y="1" width="175" height="575" fill="#d3d3d3" stroke="#000" />
    <rect x="177.5" y="151" width="480" height="425" fill="#d3d3d3" stroke="#000" />
    <rect x="250" y="120" width="300" height="25" fill="#176687" stroke="#000" />
    <text x="400" y="135" font-size="15" fill="#fff" text-anchor="middle" alignment-baseline="middle">LOADING DOCK</text>
  `);
  // Location 사각형
  layout.forEach(loc => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', loc.x);
    rect.setAttribute('y', loc.y);
    rect.setAttribute('width', loc.width);
    rect.setAttribute('height', loc.height);
    rect.setAttribute('rx', 5);
    let fill = '#e5e7eb'; // 기본(회색)
    if (highlightCode && loc.code === highlightCode) fill = '#fde047'; // 강조(노랑)
    rect.setAttribute('fill', fill);
    rect.setAttribute('stroke', '#333');
    rect.setAttribute('stroke-width', 1.5);
    g.appendChild(rect);
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', loc.x + loc.width/2);
    text.setAttribute('y', loc.y + loc.height/2 + 4);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '13');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', '#222');
    text.textContent = loc.code;
    g.appendChild(text);
    svg.appendChild(g);
  });
}

// 바코드 입력창 생성 및 스타일
let barcodeInput = document.getElementById('barcodeInput');
if (!barcodeInput) {
  barcodeInput = document.createElement('input');
  barcodeInput.id = 'barcodeInput';
  barcodeInput.type = 'text';
  barcodeInput.className = 'w-full px-4 py-3 text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500';
  barcodeInput.placeholder = i18n.ko.scan_barcode; // 기본값
  barcodeInput.style.background = '#e6f9e6';
  barcodeInput.style.margin = '24px 0 16px 0';
  document.body.prepend(barcodeInput);
}
barcodeInput.autofocus = true;
barcodeInput.focus();
barcodeInput.addEventListener('blur', () => setTimeout(() => barcodeInput.focus(), 100));

// === [카메라 바코드/QR 스캔 기능 개선: receiving.js와 동일하게] ===
let isScanning = false;

// DOMContentLoaded로 감싸서 안전하게 DOM 조작

document.addEventListener('DOMContentLoaded', function() {
  // ... 기존 언어/버튼 처리 ...

  // 카메라 프리뷰 영역 생성 (quaggaVideo 포함)
  let cameraPreview = document.getElementById('cameraPreview');
  if (!cameraPreview) {
    cameraPreview = document.createElement('div');
    cameraPreview.id = 'cameraPreview';
    cameraPreview.style.display = 'none';
    cameraPreview.innerHTML = `
      <video id="barcodeVideo" style="width:100%;max-width:400px;border:2px solid #333;border-radius:8px;"></video>
      <video id="quaggaVideo" style="display:none;width:100%;max-width:400px;border:2px solid #333;border-radius:8px;"></video>
      <canvas id="barcodeCanvas" style="display:none;"></canvas>
      <button id="closeCameraBtn" style="position:absolute;top:8px;right:8px;z-index:10;background:#fff;color:#333;border-radius:50%;width:36px;height:36px;font-size:20px;">×</button>
    `;
    document.body.appendChild(cameraPreview);
  }

  const cameraBtn = document.getElementById('cameraBtn');
  if (cameraBtn) {
    cameraBtn.addEventListener('click', async () => {
      if (isScanning) {
        stopScanning();
        return;
      }
      try {
        cameraPreview.style.display = 'block';
        const video = document.getElementById('barcodeVideo');
        const quaggaVideo = document.getElementById('quaggaVideo');
        const closeBtn = document.getElementById('closeCameraBtn');
        // 후방 카메라 우선 시도
        const constraints = {
          video: {
            facingMode: { exact: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
        let cameraStream;
        try {
          cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (e) {
          cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } }
          });
        }
        video.srcObject = cameraStream;
        quaggaVideo.srcObject = cameraStream;
        video.setAttribute('playsinline', true);
        quaggaVideo.setAttribute('playsinline', true);
        await video.play();
        await quaggaVideo.play();
        startScanning();
        closeBtn.onclick = () => { stopScanning(); };
      } catch (error) {
        alert('카메라에 접근할 수 없습니다. 권한을 확인해주세요.');
        cameraPreview.style.display = 'none';
      }
    });
  }

  function startScanning() {
    isScanning = true;
    if (cameraBtn) {
      cameraBtn.innerHTML = '<i class="fas fa-stop mr-2"></i>스캔 중지';
      cameraBtn.className = 'mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600';
    }
    scanQRCode();
    scanBarcode();
  }
  function stopScanning() {
    isScanning = false;
    if (cameraBtn) {
      cameraBtn.innerHTML = '<i class="fas fa-camera mr-2"></i>카메라 스캔 (QR+바코드)';
      cameraBtn.className = 'mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600';
    }
    cameraPreview.style.display = 'none';
    const video = document.getElementById('barcodeVideo');
    const quaggaVideo = document.getElementById('quaggaVideo');
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
    if (quaggaVideo && quaggaVideo.srcObject) {
      quaggaVideo.srcObject.getTracks().forEach(track => track.stop());
      quaggaVideo.srcObject = null;
    }
    if (window.Quagga) {
      Quagga.stop();
    }
  }
  async function scanQRCode() {
    const video = document.getElementById('barcodeVideo');
    const canvas = document.getElementById('barcodeCanvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let scanAttempts = 0;
    if (!window.jsQR) return;
    async function tick() {
      if (!isScanning || cameraPreview.style.display === 'none') return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        try {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          let code = window.jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: 'dontInvert' });
          if (!code) code = window.jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: 'attemptBoth' });
          if (code && code.data) {
            isScanning = false;
            barcodeInput.value = code.data;
            barcodeInput.dispatchEvent(new Event('input'));
            stopScanning();
            return;
          }
        } catch (e) {}
      }
      requestAnimationFrame(tick);
    }
    tick();
  }
  function scanBarcode() {
    if (!window.Quagga) return;
    if (Quagga.isRunning) Quagga.stop();
    Quagga.init({
      inputStream: {
        name: 'Live',
        type: 'LiveStream',
        target: '#quaggaVideo',
        constraints: {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          facingMode: 'environment',
          aspectRatio: { min: 1, max: 2 }
        }
      },
      decoder: {
        readers: [
          'code_128_reader', 'code_39_reader', 'ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader', 'codabar_reader'
        ],
        multiple: false
      },
      locate: true,
      frequency: 10,
      debug: false
    }, function(err) {
      if (err) return;
      Quagga.start();
    });
    Quagga.onDetected(function(result) {
      if (result && result.codeResult && result.codeResult.code) {
        isScanning = false;
        barcodeInput.value = result.codeResult.code;
        barcodeInput.dispatchEvent(new Event('input'));
        stopScanning();
      }
    });
  }
});

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

const successAudio = new Audio('../sounds/success.mp3');
const errorAudio = new Audio('../sounds/wrong.mp3');
function playSuccess() { successAudio.currentTime = 0; successAudio.play(); }
function playError() { errorAudio.currentTime = 0; errorAudio.play(); }

// 바코드 입력 이벤트: 스캔 시 해당 제품의 location_code를 찾아 SVG에서 강조
barcodeInput.addEventListener('input', async (e) => {
  const value = barcodeInput.value.trim();
  if (!value || value.length < 1) return;
  let highlightCode = null;
  let success = false;
  // 1. shipping_instruction barcode로 조회
  let { data: si } = await supabase
    .from('shipping_instruction')
    .select('location_code, container_no, barcode')
    .eq('barcode', value)
    .maybeSingle();
  if (si && si.location_code) {
    highlightCode = si.location_code;
    success = true;
  }
  // 2. receiving_items의 container_no로 조회
  if (!highlightCode) {
    let { data: items } = await supabase
      .from('receiving_items')
      .select('location_code, container_no, label_id')
      .eq('container_no', value);
    if (items && items.length > 0 && items[0].location_code) {
      highlightCode = items[0].location_code;
      success = true;
    }
  }
  // 3. receiving_items의 label_id로 조회
  if (!highlightCode) {
    let { data: item2 } = await supabase
      .from('receiving_items')
      .select('location_code, container_no, label_id')
      .eq('label_id', value)
      .maybeSingle();
    if (item2 && item2.location_code) {
      highlightCode = item2.location_code;
      success = true;
    }
  }
  // 코드 정규화
  highlightCode = normalizeLocationCode(highlightCode);
  // SVG 맵에 위치 강조
  renderSVG(highlightCode);
  barcodeInput.value = '';
  barcodeInput.focus();
  // Play sound
  if (success) playSuccess();
  else playError();
});

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

document.addEventListener('DOMContentLoaded', () => {
  renderSVG();
}); 