// import { CONFIG } from '../config/config.js';
// import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = window.supabase;

console.log('Location View JS loaded.'); 

// i18n 객체
const i18n = {
  ko: {
    // 정적 텍스트
    title_location_view: '위치 보기',
    title_location_info: '위치 정보',
    label_product_name: '제품명',
    label_trailer_container: '트레일러/컨테이너 번호',
    label_receiving_date: '입고 날짜',
    btn_search: '검색',
    btn_reset: '초기화',
    text_loading_dock: '로딩 도크',
    text_select_location: '좌측에서 위치를 선택하세요.',
    
    // 동적 메시지
    msg_loading_data: '데이터를 불러오는 중...',
    msg_load_error: '데이터 로드 실패: {error}',
    msg_no_items: '해당 위치에 보관된 제품이 없습니다.',
    msg_location_info: '위치: {code}\n제품: {part_no}\n수량: {qty}',
    msg_receiving_date: '입고일: {date}',
    msg_container_no: '컨테이너 번호: {no}',
    msg_status_received: '입고 완료',
    msg_status_waiting: '입고 대기',
    msg_print_error: '출력 중 오류 발생: {error}',
    msg_print_success: '출하증이 성공적으로 출력되었습니다.',
    msg_no_shipping_order: '출하 지시가 없습니다.',
    msg_shipping_order: '출하 지시: {no}',
    msg_shipping_date: '출하일: {date}',
    msg_shipping_status: '상태: {status}',
    msg_shipping_items: '출하 품목:',
    msg_shipping_item: '- {part_no}: {qty}개',
    msg_print_shipping: '출하증 출력',
    msg_cancel_shipping: '출하 취소',
    msg_confirm_cancel: '출하를 취소하시겠습니까?',
    msg_cancel_success: '출하가 취소되었습니다.',
    msg_cancel_error: '출하 취소 중 오류 발생: {error}',
  },
  en: {
    // Static text
    title_location_view: 'Location View',
    title_location_info: 'Location Info',
    label_product_name: 'Product Name',
    label_trailer_container: 'Trailer/Container No.',
    label_receiving_date: 'Receiving Date',
    btn_search: 'Search',
    btn_reset: 'Reset',
    text_loading_dock: 'LOADING DOCK',
    text_select_location: 'Select a location from the left.',
    
    // Dynamic messages
    msg_loading_data: 'Loading data...',
    msg_load_error: 'Failed to load data: {error}',
    msg_no_items: 'No items stored in this location.',
    msg_location_info: 'Location: {code}\nProduct: {part_no}\nQuantity: {qty}',
    msg_receiving_date: 'Receiving Date: {date}',
    msg_container_no: 'Container No.: {no}',
    msg_status_received: 'Received',
    msg_status_waiting: 'Waiting',
    msg_print_error: 'Error printing: {error}',
    msg_print_success: 'Shipping instruction printed successfully.',
    msg_no_shipping_order: 'No shipping instruction.',
    msg_shipping_order: 'Shipping Instruction: {no}',
    msg_shipping_date: 'Shipping Date: {date}',
    msg_shipping_status: 'Status: {status}',
    msg_shipping_items: 'Shipping Items:',
    msg_shipping_item: '- {part_no}: {qty} pcs',
    msg_print_shipping: 'Print Shipping',
    msg_cancel_shipping: 'Cancel Shipping',
    msg_confirm_cancel: 'Are you sure you want to cancel this shipping?',
    msg_cancel_success: 'Shipping has been cancelled.',
    msg_cancel_error: 'Error cancelling shipping: {error}',
  }
};

// 현재 언어 설정
let currentLang = localStorage.getItem('admin_location_lang') || 'ko';

// 언어 설정 함수
function setLang(lang) {
  currentLang = lang;
  document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('bg-blue-600', 'text-white', 'bg-gray-300', 'text-gray-800'));
  document.querySelector('.lang-btn[data-lang="' + lang + '"]').classList.add('bg-blue-600', 'text-white');
  document.querySelectorAll('.lang-btn:not([data-lang="' + lang + '"])').forEach(btn => btn.classList.add('bg-gray-300', 'text-gray-800'));
  
  // 정적 텍스트 업데이트
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang][key]) el.textContent = i18n[lang][key];
  });
  
  // placeholder 업데이트
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (i18n[lang][key]) el.placeholder = i18n[lang][key];
  });
  
  document.documentElement.lang = lang;
  localStorage.setItem('admin_location_lang', lang);
}

// 메시지 포맷팅 함수
function formatMessage(key, params = {}) {
  let message = i18n[currentLang][key] || key;
  Object.entries(params).forEach(([key, value]) => {
    message = message.replace(`{${key}}`, value);
  });
  return message;
}

// 실제 도면 이미지 위에 맞춰 각 Location의 x, y, width, height를 개별 지정 (수정/확장 용이)
const layout = [
  // 예시: { code: 'A-01', x: 40, y: 40, width: 60, height: 30 }
  // A열 (왼쪽 세로)
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
  // B열 (A열 오른쪽)
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
  // C열 (중앙 왼쪽)
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
  // D열 (중앙)
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
  // E열 (중앙 오른쪽)
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
  // F열 (중앙 맨 오른쪽)
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
  // G열 (노란 영역 아래)
  { code: 'G-01', x: 450, y: 457, width: 120, height: 20 },
  { code: 'G-02', x: 450, y: 481, width: 120, height: 20 },
  { code: 'G-03', x: 450, y: 505, width: 120, height: 20 },
  { code: 'G-04', x: 450, y: 529, width: 120, height: 20 },
  { code: 'G-05', x: 450, y: 553, width: 120, height: 20 },
];

// 전역 상태 관리
let isLocationViewActive = false;
let currentSVG = null;
let currentOccupied = {};

// SVG 초기화 함수
function initializeSVG() {
  const svg = document.getElementById('locationSVG');
  if (!svg) return null;

  // 기존 SVG 내용 제거
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }

  // 기본 레이아웃 요소 추가
  const baseElements = `
    <!-- 왼쪽 세로 구역 -->
    <rect x="1" y="1" width="175" height="575" fill="#d3d3d3" stroke="#000" />
    <!-- 하단 가로 구역 -->
    <rect x="177.5" y="151" width="480" height="425" fill="#d3d3d3" stroke="#000" />
    <!-- LOADING DOCK -->
    <rect x="250" y="120" width="300" height="25" fill="#176687" stroke="#000" />
    <text x="400" y="135" font-size="15" fill="#fff" text-anchor="middle" alignment-baseline="middle">LOADING DOCK</text>
  `;
  svg.insertAdjacentHTML('beforeend', baseElements);
  currentSVG = svg;
  return svg;
}

// Location 데이터 로드
async function loadOccupied() {
  try {
    const { data: items, error: itemsError } = await supabase
      .from('receiving_items')
      .select('part_no,quantity,location_code,plan_id,label_id,container_no,receiving_plan:plan_id(container_no,receive_date)');
    
    if (itemsError) throw itemsError;

    // 입고 로그 조회
    const { data: logs } = await supabase.from('receiving_log').select('label_id');
    const receivedSet = new Set((logs || []).map(l => l.label_id));

    // 출고완료(shipped) 출하증의 container_no 목록 조회
    const { data: shippedList } = await supabase
      .from('shipping_instruction')
      .select('container_no, status')
      .eq('status', 'shipped');
    const shippedContainerSet = new Set((shippedList || []).map(s => s.container_no));

    // 출고완료된 label_id 전체 조회 (shipping_instruction_items의 shipped_at이 null이 아닌 것만)
    let shippedLabelSet = new Set();
    const { data: shippedItems } = await supabase
      .from('shipping_instruction_items')
      .select('label_id, shipped_at');
    if (shippedItems) {
      shippedLabelSet = new Set(
        shippedItems.filter(i => i.shipped_at).map(i => String(i.label_id))
      );
    }

    // 데이터 초기화
    currentOccupied = {};
    
    // 데이터 매핑
    for (const item of items) {
      if (!item.location_code) continue;
      if (shippedContainerSet.has(item.container_no)) {
        continue;
      }
      if (shippedLabelSet.has(String(item.label_id))) {
        continue;
      }
      let code = item.location_code;
      if (/^[A-Z][0-9]{1,2}$/.test(code)) {
        code = code[0] + '-' + code.slice(1).padStart(2, '0');
      }
      currentOccupied[code] = {
        part_no: item.part_no,
        qty: item.quantity,
        receiving_date: item.receiving_plan?.receive_date,
        container_id: item.receiving_plan?.container_no,
        received: receivedSet.has(item.label_id),
        label_id: item.label_id,
        raw_location_code: item.location_code
      };
    }

    // UI 업데이트
    renderLocations();
  } catch (error) {
    console.error('Error loading occupied data:', error);
    showMessage(
      formatMessage('modal_message_title'),
      formatMessage('msg_load_error', { error: error.message })
    );
  }
}

// Location 렌더링
function renderLocations(filter = {}) {
  const svg = document.getElementById('locationSVG');
  if (!svg) return;
  // 기존 Location 요소 제거
  document.querySelectorAll('#locationSVG g[data-type="location"]').forEach(g => g.remove());

  // 필터링된 코드 계산
  let filteredCodes = new Set();
  let oldestCode = null;
  let oldestDate = null;

  if (filter.product || filter.trailer || filter.date) {
    Object.entries(currentOccupied).forEach(([code, info]) => {
      let match = true;
      if (filter.product && !info.part_no?.toLowerCase().includes(filter.product.toLowerCase())) match = false;
      if (filter.trailer && !info.container_id?.toLowerCase().includes(filter.trailer.toLowerCase())) match = false;
      if (filter.date && !info.receiving_date?.includes(filter.date)) match = false;
      if (match) {
        filteredCodes.add(code);
        if (filter.product && (!oldestDate || info.receiving_date < oldestDate)) {
          oldestDate = info.receiving_date;
          oldestCode = code;
        }
      }
    });
  }

  // Location 렌더링
  layout.forEach(loc => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('data-type', 'location');
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', loc.x);
    rect.setAttribute('y', loc.y);
    rect.setAttribute('width', loc.width);
    rect.setAttribute('height', loc.height);
    rect.setAttribute('rx', 5);
    // 색상 결정
    let fill = '#86efac'; // 비어있음(연녹색)
    if (currentOccupied[loc.code]) {
      if (currentOccupied[loc.code].received) fill = '#fca5a5'; // 입고 완료(연빨강)
      else fill = '#a5b4fc'; // 예약/미입고(연파랑)
    }
    if (filteredCodes.has(loc.code)) fill = '#fde047'; // 필터 일치(노랑)
    if (filter.product && loc.code === oldestCode) fill = '#fb923c'; // 제품명+가장 오래된 입고(주황)
    rect.setAttribute('fill', fill);
    rect.setAttribute('stroke', '#333');
    rect.setAttribute('stroke-width', 1.5);
    rect.style.cursor = 'pointer';
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
    // 클릭 이벤트
    g.addEventListener('click', () => {
      if (!currentOccupied[loc.code]) {
        alert('데이터가 아직 로드되지 않았습니다. 잠시 후 다시 시도해 주세요.');
        return;
      }
      showLocationModal(loc.code, currentOccupied[loc.code]);
    });
    svg.appendChild(g);
  });
}

// Location View 초기화
function resetLocationView() {
  // SVG 완전 교체
  const oldSVG = document.getElementById('locationSVG');
  let newSVG;
  if (oldSVG) {
    const svgParent = oldSVG.parentNode;
    svgParent.removeChild(oldSVG);
    newSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    newSVG.setAttribute('id', 'locationSVG');
    newSVG.setAttribute('viewBox', '0 0 835 667');
    newSVG.setAttribute('style', 'width:100vw; height:80vh; max-width:100%; background:#f8fafc; border:1.5px solid #333; box-shadow:0 2px 12px #0002;');
    svgParent.appendChild(newSVG);
    currentSVG = newSVG;
  }
  initializeSVG();
  // 필터 초기화 (존재할 때만)
  const productFilter = document.getElementById('filterProduct');
  if (productFilter) productFilter.value = '';
  const trailerFilter = document.getElementById('filterTrailer');
  if (trailerFilter) trailerFilter.value = '';
  const dateFilter = document.getElementById('filterDate');
  if (dateFilter) dateFilter.value = '';
  // 패널 안내 메시지로 초기화
  const sidePanelTitle = document.getElementById('sidePanelLocationTitle');
  const sidePanelBody = document.getElementById('sidePanelLocationBody');
  const shippingOrderArea = document.getElementById('shippingOrderArea');
  if (sidePanelTitle) sidePanelTitle.textContent = 'Location Info';
  if (sidePanelBody) sidePanelBody.innerHTML = '좌측에서 위치를 선택하세요.';
  if (shippingOrderArea) shippingOrderArea.innerHTML = '';
  // Location 데이터 다시 로드
  loadOccupied();
}

// 이벤트 리스너 설정
function setupEventListeners() {
  // 필터 버튼
  const filterBtn = document.getElementById('filterBtn');
  const resetBtn = document.getElementById('resetBtn');
  
  if (filterBtn) {
    filterBtn.onclick = () => {
      const filter = {
        product: document.getElementById('filterProduct')?.value.trim(),
        trailer: document.getElementById('filterTrailer')?.value.trim(),
        date: document.getElementById('filterDate')?.value.trim()
      };
      renderLocations(filter);
    };
  }

  if (resetBtn) {
    resetBtn.onclick = resetLocationView;
  }

  // 사이드 패널 닫기
  const closeSidePanel = document.getElementById('closeSidePanel');
  if (closeSidePanel) {
    closeSidePanel.onclick = () => {
      const sidePanel = document.getElementById('locationSidePanel');
      if (sidePanel) {
        sidePanel.classList.add('hidden');
      }
    };
  }
}

// 섹션 초기화
export function initSection() {
  isLocationViewActive = true;
  setupEventListeners();
  resetLocationView();
}

// 섹션 정리
export function cleanupSection() {
  isLocationViewActive = false;
  currentSVG = null;
  currentOccupied = {};
}

// 해시 변경 이벤트
window.addEventListener('hashchange', () => {
  if (location.hash.includes('location')) {
    initSection();
  } else {
    cleanupSection();
  }
});

// 포커스 이벤트
window.addEventListener('focus', () => {
  if (isLocationViewActive) {
    resetLocationView();
  }
});

// 모달 표시/닫기
const sidePanel = document.getElementById('locationSidePanel');
const sidePanelTitle = document.getElementById('sidePanelLocationTitle');
const sidePanelBody = document.getElementById('sidePanelLocationBody');
const shippingOrderArea = document.getElementById('shippingOrderArea');

function ensureSidePanelElements() {
  let sidePanel = document.getElementById('locationSidePanel');
  const flexContainer = document.querySelector('.flex.gap-4');
  // 패널이 있는데 flex row 밖에 있으면 flex row로 이동
  if (sidePanel && flexContainer && sidePanel.parentNode !== flexContainer) {
    flexContainer.appendChild(sidePanel);
  }
  // 없으면 flex row에 생성
  if (!sidePanel && flexContainer) {
    sidePanel = document.createElement('div');
    sidePanel.id = 'locationSidePanel';
    sidePanel.className = 'w-80 bg-white p-4 rounded shadow-lg h-[80vh] overflow-y-auto flex-shrink-0';
    flexContainer.appendChild(sidePanel);
  }
  // flex row가 없으면 패널도 만들지 않음
  if (!sidePanel) return {};

  let title = document.getElementById('sidePanelLocationTitle');
  if (!title) {
    title = document.createElement('h2');
    title.id = 'sidePanelLocationTitle';
    title.className = 'text-xl font-bold';
    sidePanel.appendChild(title);
  }
  let closeBtn = document.getElementById('closeSidePanel');
  if (!closeBtn) {
    closeBtn = document.createElement('button');
    closeBtn.id = 'closeSidePanel';
    closeBtn.className = 'text-gray-500 hover:text-gray-700';
    closeBtn.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
    sidePanel.appendChild(closeBtn);
  }
  let body = document.getElementById('sidePanelLocationBody');
  if (!body) {
    body = document.createElement('div');
    body.id = 'sidePanelLocationBody';
    body.className = 'mb-4';
    sidePanel.appendChild(body);
  }
  let shippingOrderArea = document.getElementById('shippingOrderArea');
  if (!shippingOrderArea) {
    shippingOrderArea = document.createElement('div');
    shippingOrderArea.id = 'shippingOrderArea';
    sidePanel.appendChild(shippingOrderArea);
  }
  return { sidePanel, title, closeBtn, body, shippingOrderArea };
}

// showLocationModal: 패널의 내용만 갱신, 패널은 항상 보임
function showLocationModal(loc, info) {
  const sidePanel = document.getElementById('locationSidePanel');
  const sidePanelTitle = document.getElementById('sidePanelLocationTitle');
  const sidePanelBody = document.getElementById('sidePanelLocationBody');
  const shippingOrderArea = document.getElementById('shippingOrderArea');
  if (!sidePanel || !sidePanelTitle || !sidePanelBody || !shippingOrderArea) return;

  sidePanelTitle.textContent = `Location: ${loc}`;
  if (info) {
    sidePanelBody.innerHTML = `
      <div class='mb-2'><b>Part No:</b> ${info.part_no}</div>
      <div><b>Qty:</b> ${info.qty}</div>
      <div><b>입고일:</b> ${info.receiving_date || '-'}</div>
      <div><b>컨테이너/트레일러:</b> ${info.container_id || '-'}</div>
    `;
    shippingOrderArea.innerHTML = `<div class="mt-4 text-sm text-gray-500">출하지시서 상태 확인 중...</div>`;
    // 출하지시서 존재 여부 확인 (이하 기존 코드 동일)
    (async () => {
      const { data: exist } = await supabase.from('shipping_instruction')
        .select('*')
        .eq('location_code', loc)
        .eq('part_no', info.part_no)
        .order('created_at', { ascending: false })
        .limit(1);
      if (exist && exist.length > 0) {
        // 이미 출하지시서가 있으면 프린트 버튼만
        const si = exist[0];
        shippingOrderArea.innerHTML = `
          <div class="mb-2 text-green-700 font-bold">출하지시서가 이미 생성됨</div>
          <button id="printShippingBtn" class="bg-blue-600 text-white px-4 py-1 rounded">출하지시서 프린트</button>
        `;
        document.getElementById('printShippingBtn').onclick = () => printShippingLabel(si);
      } else {
        // 없으면 출하지시 버튼 + 프린트 버튼(생성 후 활성화)
        shippingOrderArea.innerHTML = `
          <div class="mt-4 flex gap-2 items-end">
            <input type="date" id="shippingDateInput" class="border rounded px-2 py-1" />
            <button id="createShippingBtn" class="bg-green-600 text-white px-4 py-1 rounded">출하지시</button>
            <button id="printShippingBtn" class="bg-blue-400 text-white px-4 py-1 rounded" disabled>출하지시서 프린트</button>
          </div>
          <div id="shippingResultMsg" class="mt-2 text-sm"></div>
        `;
        let lastSI = null;
        document.getElementById('createShippingBtn').onclick = async () => {
          const shippingDate = document.getElementById('shippingDateInput').value;
          if (!shippingDate) {
            document.getElementById('shippingResultMsg').textContent = '출고 날짜를 선택하세요.';
            return;
          }
          const barcode = info.label_id || info.container_id;

          // 1. 해당 Location의 모든 실물(label_id) 조회
          const { data: items, error: itemsError } = await supabase
            .from('receiving_items')
            .select('label_id, quantity')
            .eq('location_code', info.raw_location_code);

          if (itemsError || !items || items.length === 0) {
            document.getElementById('shippingResultMsg').textContent = '이 위치에 실물(label_id)이 없습니다.';
            return;
          }

          // 2. 출하증 생성
          const { data, error } = await supabase.from('shipping_instruction').insert({
            location_code: loc,
            part_no: info.part_no,
            qty: info.qty,
            shipping_date: shippingDate,
            status: 'pending',
            barcode: crypto.randomUUID(),
            container_no: info.container_id,
            label_id: items.length === 1 ? items[0].label_id : null
          }).select('*').single();
          if (error) {
            document.getElementById('shippingResultMsg').textContent = '출하지시서 생성 실패: ' + error.message;
            return;
          }

          // 3. shipping_instruction_items에 여러 개 insert
          const shippingInstructionId = data.id;
          const itemsToInsert = items.map(item => ({
            shipping_instruction_id: shippingInstructionId,
            label_id: item.label_id,
            qty: item.quantity
          }));
          const { error: itemError } = await supabase.from('shipping_instruction_items').insert(itemsToInsert);
          if (itemError) {
            document.getElementById('shippingResultMsg').textContent = '출하지시서 생성(실물 매핑) 실패: ' + itemError.message;
            return;
          }
          document.getElementById('shippingResultMsg').textContent = '출하지시서가 생성되었습니다!';
          lastSI = data;
          const printBtn = document.getElementById('printShippingBtn');
          printBtn.disabled = false;
          printBtn.classList.remove('bg-blue-400');
          printBtn.classList.add('bg-blue-600');
        };
        document.getElementById('printShippingBtn').onclick = () => {
          if (lastSI) printShippingLabel(lastSI);
        };
      }
    })();
  } else {
    sidePanelBody.innerHTML = `<div class='text-gray-500'>비어있음</div>`;
    shippingOrderArea.innerHTML = '';
  }
}

// 출하지시서 라벨 프린트 함수
function printShippingLabel(si) {
  const now = new Date();
  const dateStr = now.toISOString().slice(0,10).replace(/-/g,'.');
  const timeStr = now.toTimeString().slice(0,5);
  const bolNo = si.barcode || si.location_code;
  const model = si.part_no || '-';
  const description = si.description || '-';
  const remarks = si.remarks || '-';
  const location = si.location_code || '-';

  const printHtml = `
    <style>
      @media print {
        @page { size: 11in 8.5in portrait; margin: 0; }
        body { margin: 0; }
      }
      .bol-table, .bol-table th, .bol-table td {
        border: 1.5px solid #222; border-collapse: collapse;
      }
      .bol-table th, .bol-table td {
        padding: 10px 18px; font-size: 18px;
      }
      .bol-table { width: 100%; margin: 0 auto 12px auto; }
      .bol-title { font-size: 38px; font-weight: bold; text-align: center; margin: 18px 0 12px 0; }
      .bol-header { font-size: 16px; }
      .bol-barcode { font-size: 18px; text-align: center; margin: 8px 0; }
      .bol-sign th, .bol-sign td { font-size: 16px; height: 40px; }
      .bol-sign { width: 100%; margin: 24px 0 0 0; }
      .bol-footer { font-size: 12px; color: #444; margin-top: 12px; }
    </style>
    <div style='font-family:sans-serif;width:100vw;max-width:900px;margin:auto;background:#fff;'>
      <div class='bol-title'>STRAIGHT BILL OF LADING</div>
      <table class='bol-table bol-header'>
        <tr>
          <th>Company</th>
          <td>Leehwa SCM, Inc</td>
          <th>BOL#</th>
          <td>${bolNo}</td>
        </tr>
        <tr>
          <th>Address</th>
          <td>1201 O G Skinner Dr, West Point, GA 31833</td>
          <th>Destination</th>
          <td>Hyundai Transys <br> 6601 Kia Pkwy, West Point, GA 31833</td>
        </tr>
      </table>
      <table class='bol-table'>
        <tr>
          <th>No.</th>
          <th>Model</th>
          <th>Description</th>
          <th>Qty</th>
          <th>Unit</th>
          <th>Location</th>
          <th>Remarks</th>
        </tr>
        <tr>
          <td>1</td>
          <td>${model}</td>
          <td>${description}</td>
          <td>${si.qty}</td>
          <td>EA</td>
          <td>${location}</td>
          <td>${remarks}</td>
        </tr>
        <tr><td colspan='7' style='height:32px;'></td></tr>
        <tr><td colspan='7' style='height:32px;'></td></tr>
        <tr><td colspan='7' style='height:32px;'></td></tr>
      </table>
      <table class='bol-table bol-sign'>
        <tr>
          <th>Consigned To (Carrier)</th>
          <th>Driver</th>
          <th>Authorizer</th>
          <th>Security Officer<br>(Through Main Gate)</th>
        </tr>
        <tr>
          <td></td><td></td><td></td><td></td>
        </tr>
      </table>
      <div style='display:flex;justify-content:space-between;align-items:center;margin-top:18px;'>
        <div>
          <div class='bol-barcode'>${bolNo}</div>
          <div style='font-size:16px;'>TOTAL Pieces: ${si.qty} EA</div>
          <div style='font-size:16px;'>${dateStr} ${timeStr}</div>
        </div>
        <div style='text-align:right;'>
          <canvas id='qr-shipping-print' width='120' height='120'></canvas>
        </div>
      </div>
      <div class='bol-footer'>
        ● The property described above and destined as indicated above with said carrier (person or corporation in possession of the property under contract) agrees to carry product/s to its place of delivery (Consignee) at said destination. It is mutually agreed as to each the service to be performed hereunder shall be subject to all the terms and conditions of Uniform Domestic Straight Bill of Lading set forth (1) in Uniform Freight Classification in effect on date hereof.<br>
        ● Leehwa SCM must keep copy of this receipt for the future reference.<br>
        ● Person who signed on this sheet agreed that the above information is correct and their company is responsible for any problem, after container leaves HTPG.<br>
      </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js"></script>
    <script>setTimeout(function(){
      var qr = new QRious({element:document.getElementById('qr-shipping-print'),value:'${bolNo}',size:120});
    },100);</script>
  `;
  const win = window.open('', '', 'width=900,height=1200');
  win.document.write('<html><head><title>Bill of Lading</title></head><body style="margin:0;">' + printHtml + '</body></html>');
  setTimeout(() => { win.print(); }, 900);
}

// LOCATION VIEW 자동 새로고침 메시지 리스너
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'refreshLocationView') {
    window.location.reload();
  }
});

// 언어 변경 이벤트 리스너
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang')));
});

// 초기 언어 설정
setLang(currentLang); 