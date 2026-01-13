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

// === [카메라 바코드/QR 스캔 기능 개선: receiving.js와 동일하게] ===
let isScanning = false;

document.addEventListener('DOMContentLoaded', function() {
  // ... 기존 언어/버튼 처리 ...

  // 카메라 프리뷰 영역 생성 (quaggaVideo 포함)
  let cameraPreview = document.getElementById('cameraPreview');
  if (!cameraPreview) {
    cameraPreview = document.createElement('div');
    cameraPreview.id = 'cameraPreview';
    cameraPreview.style.display = 'none';
    cameraPreview.style.position = 'relative';
    cameraPreview.style.textAlign = 'center';
    cameraPreview.innerHTML = `
      <div style="position: relative; display: inline-block;">
        <video id="barcodeVideo" style="width:100%;max-width:400px;border:2px solid #333;border-radius:8px;"></video>
        <video id="quaggaVideo" style="display:none;width:100%;max-width:400px;border:2px solid #333;border-radius:8px;"></video>
        <canvas id="barcodeCanvas" style="display:none;"></canvas>
        
        <!-- 바코드 스캔 가이드 오버레이 -->
        <div id="scanGuide" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none;">
          <!-- 스캔 영역 테두리 (더 크게) -->
          <div style="width: 320px; height: 160px; border: 3px solid #00ff00; border-radius: 8px; position: relative;">
            <!-- 모서리 표시 -->
            <div style="position: absolute; top: -3px; left: -3px; width: 20px; height: 20px; border-top: 4px solid #00ff00; border-left: 4px solid #00ff00;"></div>
            <div style="position: absolute; top: -3px; right: -3px; width: 20px; height: 20px; border-top: 4px solid #00ff00; border-right: 4px solid #00ff00;"></div>
            <div style="position: absolute; bottom: -3px; left: -3px; width: 20px; height: 20px; border-bottom: 4px solid #00ff00; border-left: 4px solid #00ff00;"></div>
            <div style="position: absolute; bottom: -3px; right: -3px; width: 20px; height: 20px; border-bottom: 4px solid #00ff00; border-right: 4px solid #00ff00;"></div>
            
            <!-- 중앙 십자선 -->
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px;">
              <div style="position: absolute; top: 50%; left: 0; width: 100%; height: 2px; background: #00ff00; transform: translateY(-50%);"></div>
              <div style="position: absolute; top: 0; left: 50%; width: 2px; height: 100%; background: #00ff00; transform: translateX(-50%);"></div>
            </div>
          </div>
          
          <!-- 스캔 가이드 텍스트 -->
          <div style="position: absolute; top: -50px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); color: white; padding: 10px 15px; border-radius: 8px; font-size: 14px; white-space: nowrap; text-align: center;">
            📱 바코드를 사각형 안에 맞춰주세요<br>
            <small style="font-size: 12px; opacity: 0.8;">거리: 10-30cm, 각도: 90도</small>
          </div>
          
          <!-- 스캔 라인 애니메이션 -->
          <div id="scanLine" style="position: absolute; top: 0; left: 0; width: 100%; height: 2px; background: linear-gradient(90deg, transparent, #00ff00, transparent); animation: scan 2s linear infinite;"></div>
        </div>
        
        <!-- 스캔 상태 표시 -->
        <div id="scanStatus" style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px;">
          🔍 바코드 스캔 중...
        </div>
        
        <button id="closeCameraBtn" style="position:absolute;top:8px;right:8px;z-index:10;background:#fff;color:#333;border-radius:50%;width:36px;height:36px;font-size:20px;border:none;cursor:pointer;">×</button>
      </div>
      
      <!-- 스캔 라인 애니메이션 CSS -->
      <style>
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        
        #scanGuide {
          animation: pulse 2s ease-in-out infinite alternate;
        }
        
        @keyframes pulse {
          from { opacity: 0.8; }
          to { opacity: 1; }
        }
      </style>
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
            height: { ideal: 720 },
            zoom: { ideal: 2.0 }, // 줌 기능 추가
            focusMode: 'continuous' // 자동 포커스
          }
        };
        let cameraStream;
        try {
          cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (e) {
          // 줌이 지원되지 않는 경우 기본 설정으로 시도
          cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { 
              width: { ideal: 1280 }, 
              height: { ideal: 720 },
              facingMode: 'environment'
            }
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
    const maxAttempts = 100; // QR 스캔 최대 시도 횟수
    
    if (!window.jsQR) return;
    
    async function tick() {
      if (!isScanning || cameraPreview.style.display === 'none') return;
      
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        try {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // 다양한 QR 스캔 옵션 시도
          let code = null;
          
          // 1. 기본 스캔
          code = window.jsQR(imageData.data, canvas.width, canvas.height, { 
            inversionAttempts: 'dontInvert' 
          });
          
          // 2. 역전 스캔
          if (!code) {
            code = window.jsQR(imageData.data, canvas.width, canvas.height, { 
              inversionAttempts: 'attemptBoth' 
            });
          }
          
          // 3. 더 관대한 설정으로 스캔
          if (!code) {
            code = window.jsQR(imageData.data, canvas.width, canvas.height, { 
              inversionAttempts: 'attemptBoth',
              minConfidence: 0.1 // 더 낮은 신뢰도 허용
            });
          }
          
          if (code && code.data && code.data.length >= 3) {
            isScanning = false;
            // 스캔 성공 시 가이드 숨기고 성공 메시지 표시
            const scanGuide = document.getElementById('scanGuide');
            const scanStatus = document.getElementById('scanStatus');
            if (scanGuide) scanGuide.style.display = 'none';
            if (scanStatus) {
              scanStatus.textContent = '✅ QR 코드 스캔 성공!';
              scanStatus.style.background = 'rgba(0,255,0,0.8)';
            }
            
            barcodeInput.value = code.data;
            barcodeInput.dispatchEvent(new Event('input'));
            stopScanning();
            return;
          }
          
          scanAttempts++;
          
          // 스캔 상태 업데이트
          const scanStatus = document.getElementById('scanStatus');
          if (scanStatus) {
            scanStatus.textContent = `🔍 QR 코드 스캔 중... (${scanAttempts}/${maxAttempts})`;
          }
          
          // 최대 시도 횟수 초과 시 재시작
          if (scanAttempts > maxAttempts) {
            scanAttempts = 0;
            // 잠시 대기 후 재시작
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
        } catch (e) {
          console.error('QR 스캔 오류:', e);
        }
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
          'code_128_reader', 'code_39_reader', 'ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader', 'codabar_reader',
          'i2of5_reader', '2of5_reader', 'code_93_reader'
        ],
        multiple: false,
        debug: {
          showCanvas: false,
          showPatches: false,
          showFoundPatches: false,
          showSkeleton: false,
          showLabels: false,
          showPatchLabels: false,
          showRemainingPatchLabels: false,
          boxFromPatches: {
            showTransformed: false,
            showTransformedBox: false,
            showBB: false
          }
        }
      },
      locate: true,
      frequency: 5, // 더 빠른 스캔 주기
      debug: false,
      // 스캔 영역 설정
      area: {
        top: '25%',
        right: '10%',
        left: '10%',
        bottom: '25%'
      }
    }, function(err) {
      if (err) {
        console.error('Quagga 초기화 오류:', err);
        return;
      }
      Quagga.start();
    });
    
    // 스캔 시도 횟수 추적
    let scanAttempts = 0;
    const maxAttempts = 50; // 최대 시도 횟수
    
    Quagga.onDetected(function(result) {
      scanAttempts++;
      if (result && result.codeResult && result.codeResult.code) {
        // 코드 길이 검증 (최소 3자 이상)
        if (result.codeResult.code.length >= 3) {
          isScanning = false;
          // 스캔 성공 시 가이드 숨기고 성공 메시지 표시
          const scanGuide = document.getElementById('scanGuide');
          const scanStatus = document.getElementById('scanStatus');
          if (scanGuide) scanGuide.style.display = 'none';
          if (scanStatus) {
            scanStatus.textContent = '✅ 바코드 스캔 성공!';
            scanStatus.style.background = 'rgba(0,255,0,0.8)';
          }
          
          barcodeInput.value = result.codeResult.code;
          barcodeInput.dispatchEvent(new Event('input'));
          stopScanning();
        }
      }
      
      // 최대 시도 횟수 초과 시 재시작
      if (scanAttempts > maxAttempts) {
        scanAttempts = 0;
        Quagga.stop();
        setTimeout(() => {
          if (isScanning) {
            Quagga.start();
          }
        }, 1000);
      }
    });
    
    // 스캔 진행 중 상태 업데이트
    Quagga.onProcessed(function(result) {
      if (result) {
        const scanStatus = document.getElementById('scanStatus');
        if (scanStatus) {
          scanStatus.textContent = `🔍 바코드 스캔 중... (${scanAttempts}/${maxAttempts})`;
        }
      }
    });
  }
});

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
      
      // receiving_items의 location_code를 null로 업데이트
      if (currentShippingInfo.label_id) {
        // 단일 라벨인 경우
        await supabase
          .from('receiving_items')
          .update({ location_code: null })
          .eq('label_id', currentShippingInfo.label_id);
      } else {
        // 여러 파트인 경우 - shipping_instruction_items의 모든 label_id 처리
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
        } else {
          // shipping_instruction_items에 label_id가 없는 경우, container_no로 업데이트
          if (currentShippingInfo.container_no) {
            await supabase
              .from('receiving_items')
              .update({ location_code: null })
              .eq('container_no', currentShippingInfo.container_no);
          }
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