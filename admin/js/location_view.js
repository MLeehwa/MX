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

// Delivery Location 드롭다운 로드 함수
async function loadDeliveryLocations() {
  const select = document.getElementById('deliveryLocationSelect');
  if (!select) return;
  
  try {
    const { data, error } = await supabase
      .from('mx_delivery_locations')
      .select('id, location_name')
      .eq('is_active', true)
      .order('location_name', { ascending: true });
    
    if (error) throw error;
    
    // 기존 옵션 유지 (선택... 옵션)
    const firstOption = select.querySelector('option[value=""]');
    select.innerHTML = '';
    if (firstOption) {
      select.appendChild(firstOption);
    } else {
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '선택...';
      select.appendChild(defaultOption);
    }
    
    // Delivery Location 옵션 추가
    if (data && data.length > 0) {
      data.forEach(loc => {
        const option = document.createElement('option');
        option.value = loc.id;
        option.textContent = loc.location_name;
        select.appendChild(option);
      });
    } else {
      const noOption = document.createElement('option');
      noOption.value = '';
      noOption.textContent = '등록된 Delivery Location이 없습니다';
      noOption.disabled = true;
      select.appendChild(noOption);
    }
  } catch (error) {
    console.error('Delivery Location 로드 실패:', error);
    const errorOption = document.createElement('option');
    errorOption.value = '';
    errorOption.textContent = '로드 실패';
    errorOption.disabled = true;
    select.innerHTML = '';
    select.appendChild(errorOption);
  }
}

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

// 위치 레이아웃을 데이터베이스에서 동적으로 로드
let layout = [];

// 데이터베이스에서 위치 레이아웃 로드
async function loadLocationLayout() {
  try {
    // font_size 컬럼이 없을 수 있으므로 먼저 시도하고, 없으면 기본값 사용
    const { data, error } = await supabase
      .from('mx_locations')
      .select('location_code, x, y, width, height, status')
      .order('location_code');
    
    if (error) {
      console.error('위치 레이아웃 로드 실패:', error);
      // 에러 발생 시 빈 배열 반환
      layout = [];
      return;
    }
    
    // 좌표 정보가 있는 위치만 레이아웃에 포함 (모든 상태 포함, disabled/maintenance도 표시)
    // 위치 코드를 정규화하여 저장 (A1 -> A-01)
    const filteredData = (data || []).filter(loc => {
      return loc.x !== null && loc.y !== null && loc.width !== null && loc.height !== null;
    });
    
    layout = filteredData.map(loc => {
      const normalizedCode = normalizeLocationCode(loc.location_code);
      return {
        code: normalizedCode, // 위치 코드 정규화
        x: loc.x,
        y: loc.y,
        width: loc.width,
        height: loc.height,
        status: loc.status, // 상태 정보도 저장
        font_size: (loc.font_size !== undefined && loc.font_size !== null) ? loc.font_size : 13 // 글씨 크기 정보도 저장 (없으면 기본값 13)
      };
    });
    
    console.log(`위치 레이아웃 로드 완료: ${layout.length}개 위치`);
    if (layout.length > 0) {
      console.log('위치 레이아웃 샘플:', layout[0]);
      console.log('위치 레이아웃 전체 (처음 5개):', layout.slice(0, 5));
    } else {
      console.warn('⚠️ 위치 레이아웃이 비어있습니다. 좌표 정보가 있는 위치가 없습니다.');
      console.warn('⚠️ 데이터베이스에서 로드된 원본 데이터:', data);
      if (data && data.length > 0) {
        console.warn('⚠️ 원본 데이터 샘플 (처음 3개):', data.slice(0, 3));
      }
    }
  } catch (error) {
    console.error('위치 레이아웃 로드 중 오류:', error);
    layout = [];
  }
}

// 전역 상태 관리
let isLocationViewActive = false;
let currentSVG = null;
let currentOccupied = {};

// SVG 초기화 함수
async function initializeSVG() {
  const svg = document.getElementById('locationSVG');
  if (!svg) return null;

  // 기존 SVG 내용 제거
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }

  // 배경 요소 로드 및 렌더링 (Supabase에서만)
  let backgroundElements = [];
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('mx_background_elements')
        .select('elements_data')
        .eq('id', 1)
        .single();
      
      console.log('위치 보기: Supabase 응답:', { data, error });
      
      // Supabase에서 데이터를 성공적으로 가져왔고, 배열이 존재하며 비어있지 않은 경우
      if (!error && data && data.elements_data && Array.isArray(data.elements_data) && data.elements_data.length > 0) {
        backgroundElements = data.elements_data;
        console.log('위치 보기: Supabase에서 배경 요소 로드 완료:', backgroundElements.length, '개');
        // 각 요소의 좌표 확인
        backgroundElements.forEach((bg, index) => {
          console.log(`위치 보기: 배경 요소 ${index + 1}:`, {
            id: bg.id,
            type: bg.type,
            x: bg.x,
            y: bg.y,
            width: bg.width,
            height: bg.height
          });
        });
      } else {
        // Supabase에 데이터가 없거나 빈 배열이면 배경 없음
        backgroundElements = [];
        if (error) {
          console.log('위치 보기: Supabase 에러:', error);
        } else if (!data || !data.elements_data) {
          console.log('위치 보기: Supabase에 데이터 없음');
        } else if (data.elements_data.length === 0) {
          console.log('위치 보기: 배경 요소 배열이 비어있음');
        }
      }
    } else {
      console.warn('위치 보기: Supabase가 초기화되지 않음');
      backgroundElements = [];
    }
  } catch (error) {
    console.error('위치 보기: 배경 요소 로드 실패:', error);
    backgroundElements = [];
  }
  
  // 배경 요소 렌더링
  console.log('위치 보기: 배경 요소 렌더링 시작, 개수:', backgroundElements.length);
  backgroundElements.forEach((bg, index) => {
    console.log(`위치 보기: 배경 요소 ${index + 1} 렌더링:`, {
      type: bg.type,
      x: bg.x,
      y: bg.y,
      width: bg.width,
      height: bg.height,
      fill: bg.fill,
      stroke: bg.stroke,
      strokeWidth: bg.strokeWidth
    });
    
    if (bg.type === 'rect') {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      // 좌표를 숫자로 변환 (문자열일 수 있음)
      const x = Number(bg.x) || 0;
      const y = Number(bg.y) || 0;
      const width = Number(bg.width) || 100;
      const height = Number(bg.height) || 50;
      const fill = bg.fill || '#d3d3d3';
      const stroke = bg.stroke || '#000';
      const strokeWidth = Number(bg.strokeWidth) || 1;
      
      // 배경 요소는 오프셋 없이 그대로 렌더링 (배경은 캔버스 전체를 기준으로 함)
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', width);
      rect.setAttribute('height', height);
      rect.setAttribute('fill', fill);
      rect.setAttribute('stroke', stroke);
      rect.setAttribute('stroke-width', strokeWidth);
      // 배경 요소는 클릭 이벤트를 받지 않도록 설정 (위치가 클릭 가능하도록)
      rect.setAttribute('pointer-events', 'none');
      // 배경 요소는 z-index를 낮게 설정하기 위해 먼저 추가 (SVG에서는 나중에 추가된 요소가 위에 표시됨)
      svg.appendChild(rect);
      console.log(`위치 보기: rect 요소 추가됨 - x:${x}, y:${y}, width:${width}, height:${height}, fill:${fill}, stroke:${stroke}, strokeWidth:${strokeWidth}`);
    } else if (bg.type === 'text') {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      // 좌표를 숫자로 변환 (문자열일 수 있음)
      const x = Number(bg.x) || 0;
      const y = Number(bg.y) || 0;
      const fontSize = Number(bg.fontSize) || 15;
      const fill = bg.fill || '#000';
      
      text.setAttribute('x', x);
      text.setAttribute('y', y);
      text.setAttribute('font-size', fontSize);
      text.setAttribute('fill', fill);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('alignment-baseline', 'middle');
      text.textContent = bg.text || bg.label || '';
      svg.appendChild(text);
      console.log(`위치 보기: text 요소 추가됨 - x:${x}, y:${y}, fontSize:${fontSize}, fill:${fill}`);
    }
  });
  console.log('위치 보기: 배경 요소 렌더링 완료');
  currentSVG = svg;
  return svg;
}

// Location 데이터 로드
async function loadOccupied() {
  try {
    const { data: items, error: itemsError } = await supabase
      .from('mx_receiving_items')
      .select('location_code,plan_id,label_id,container_no,remark,receiving_plan:plan_id(container_no,receive_date)');
    
    if (itemsError) throw itemsError;

    // 입고 로그 조회
    const { data: logs } = await supabase.from('mx_receiving_log').select('label_id');
    const receivedSet = new Set((logs || []).map(l => l.label_id));

    // 출고완료(shipped) 출하증의 container_no 목록 조회
    const { data: shippedList } = await supabase
      .from('mx_shipping_instruction')
      .select('container_no, status')
      .eq('status', 'shipped');
    const shippedContainerSet = new Set((shippedList || []).map(s => s.container_no));

    // 출고완료된 container_no 전체 조회 (shipping_instruction_items의 shipped_at이 null이 아닌 것만)
    let shippedContainerSet2 = new Set();
    const { data: shippedItems } = await supabase
      .from('mx_shipping_instruction_items')
      .select('container_no, shipped_at');
    if (shippedItems) {
      shippedContainerSet2 = new Set(
        shippedItems.filter(i => i.shipped_at).map(i => String(i.container_no))
      );
    }

    // 데이터 초기화
    currentOccupied = {};
    
    // 데이터 매핑 - Container 단위로 처리
    const locationGroups = {};
    
    for (const item of items) {
      if (!item.location_code) continue;
      if (shippedContainerSet.has(item.container_no)) {
        continue;
      }
      if (shippedContainerSet2.has(String(item.container_no))) {
        continue;
      }
      
      // 위치 코드 정규화 (normalizeLocationCode 함수 사용)
      const code = normalizeLocationCode(item.location_code);
      
      // 같은 위치의 항목들을 그룹화
      if (!locationGroups[code]) {
        locationGroups[code] = [];
      }
      locationGroups[code].push(item);
    }
    
    // 각 위치별로 데이터 정리 (Container 단위)
    for (const [code, groupItems] of Object.entries(locationGroups)) {
      let containerIds = new Set();
      let receivingDates = new Set();
      let labelIds = [];
      let receivedCount = 0;
      
      groupItems.forEach(item => {
        if (item.receiving_plan?.container_no) {
          containerIds.add(item.receiving_plan.container_no);
        }
        if (item.receiving_plan?.receive_date) {
          receivingDates.add(item.receiving_plan.receive_date);
        }
        if (item.label_id) {
          labelIds.push(item.label_id);
          if (receivedSet.has(item.label_id)) {
            receivedCount++;
          }
        }
      });
      
      // 제품 정보(remark) 가져오기
      let remark = null;
      for (const item of groupItems) {
        if (item.remark && item.remark.trim() !== '') {
          remark = item.remark;
          break;
        }
      }
      
      currentOccupied[code] = {
        container_id: Array.from(containerIds)[0], // 첫 번째 컨테이너 사용
        receiving_date: Array.from(receivingDates)[0], // 첫 번째 날짜 사용
        received: receivedCount > 0,
        label_id: labelIds[0], // 첫 번째 label_id 사용
        raw_location_code: groupItems[0].location_code,
        remark: remark || '-' // 제품 정보
      };
    }

    // UI 업데이트
    renderLocations();
    // 제품 정보 드롭다운 업데이트
    updateProductFilterDropdown();
  } catch (error) {
    console.error('Error loading occupied data:', error);
    showMessage(
      formatMessage('modal_message_title'),
      formatMessage('msg_load_error', { error: error.message })
    );
  }
}

// 제품 정보 드롭다운 업데이트 함수
async function updateProductFilterDropdown() {
  try {
    // mx_receiving_items에서 고유한 remark 목록 가져오기
    const { data: items, error } = await supabase
      .from('mx_receiving_items')
      .select('remark')
      .not('remark', 'is', null)
      .neq('remark', '');
    
    if (error) throw error;
    
    // 고유한 제품 정보 추출
    const uniqueRemarks = [...new Set((items || []).map(item => item.remark).filter(r => r && r.trim() !== ''))].sort();
    
    const select = document.getElementById('filterProduct');
    if (!select) return;
    
    // 기존 옵션 유지 (첫 번째 "전체" 옵션)
    const firstOption = select.querySelector('option[value=""]');
    select.innerHTML = '';
    if (firstOption) {
      select.appendChild(firstOption);
    } else {
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '전체';
      select.appendChild(defaultOption);
    }
    
    // 제품 정보 옵션 추가
    uniqueRemarks.forEach(remark => {
      const option = document.createElement('option');
      option.value = remark;
      option.textContent = remark;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('제품 정보 드롭다운 업데이트 실패:', error);
  }
}

// viewBox 업데이트
function updateViewBox() {
  const svg = document.getElementById('locationSVG');
  if (!svg) {
    console.error('위치 보기: updateViewBox - SVG 요소를 찾을 수 없습니다.');
    return;
  }
  
  const viewBox = calculateViewBox();
  svg.setAttribute('viewBox', viewBox);
  console.log('위치 보기: viewBox 업데이트:', viewBox);
  console.log('위치 보기: SVG 현재 viewBox:', svg.getAttribute('viewBox'));
  console.log('위치 보기: SVG 크기:', svg.clientWidth, 'x', svg.clientHeight);
}

// Location 렌더링
function renderLocations(filter = {}) {
  const svg = document.getElementById('locationSVG');
  if (!svg) {
    console.error('위치 보기: SVG 요소를 찾을 수 없습니다.');
    return;
  }
  
  // 기존 Location 요소 제거
  document.querySelectorAll('#locationSVG g[data-type="location"]').forEach(g => g.remove());

  // layout이 비어있는지 확인
  if (!layout || layout.length === 0) {
    console.warn('위치 보기: 렌더링할 위치가 없습니다. layout.length:', layout?.length || 0);
    return;
  }

  // 필터링된 코드 계산
  let filteredCodes = new Set();
  let oldestCode = null;
  let oldestDate = null;

  if (filter.product || filter.trailer || filter.date) {
    Object.entries(currentOccupied).forEach(([code, info]) => {
      let match = true;
      if (filter.product && info.remark !== filter.product) match = false;
      if (filter.trailer && !info.container_id?.toLowerCase().includes(filter.trailer.toLowerCase())) match = false;
      if (filter.date && !info.receiving_date?.includes(filter.date)) match = false;
      if (match) {
        filteredCodes.add(code);
        if (filter.trailer && (!oldestDate || info.receiving_date < oldestDate)) {
          oldestDate = info.receiving_date;
          oldestCode = code;
        }
      }
    });
  }

  // Location 렌더링 - 성능 최적화: 배치 처리 및 이벤트 위임 사용
  const offsetX = 0;
  const offsetY = 0;
  
  // SVG에 이벤트 위임 설정 (한 번만)
  if (!svg.hasAttribute('data-location-click-bound')) {
    svg.addEventListener('click', (e) => {
      const g = e.target.closest('g[data-type="location"]');
      if (!g) return;
      const code = g.getAttribute('data-location-code');
      if (code) {
        if (currentOccupied[code]) {
          showLocationModal(code, currentOccupied[code]);
        } else {
          showLocationModal(code, null);
        }
      }
    });
    svg.setAttribute('data-location-click-bound', 'true');
  }
  
  // 배치로 요소 생성 및 추가 (성능 최적화)
  const elements = [];
  layout.forEach(loc => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('data-type', 'location');
    g.setAttribute('data-location-code', loc.code);
    
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', loc.x + offsetX);
    rect.setAttribute('y', loc.y + offsetY);
    rect.setAttribute('width', loc.width);
    rect.setAttribute('height', loc.height);
    rect.setAttribute('rx', 5);
    
    // 색상 결정
    let fill = '#86efac'; // 비어있음(연녹색)
    if (loc.status === 'disabled' || loc.status === 'maintenance') {
      fill = '#fb923c'; // 주황색
    } else if (currentOccupied[loc.code]) {
      if (currentOccupied[loc.code].received) fill = '#fca5a5'; // 입고 완료(연빨강)
      else fill = '#a5b4fc'; // 예약/미입고(연파랑)
    }
    if (fill !== '#fb923c' && filteredCodes.has(loc.code)) fill = '#fde047'; // 필터 일치(노랑)
    if (fill !== '#fb923c' && filter.trailer && loc.code === oldestCode) fill = '#fb923c'; // 컨테이너+가장 오래된 입고(주황)
    
    rect.setAttribute('fill', fill);
    rect.setAttribute('stroke', '#333');
    rect.setAttribute('stroke-width', 1.5);
    rect.style.cursor = 'pointer';
    g.appendChild(rect);
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', loc.x + offsetX + loc.width/2);
    text.setAttribute('y', loc.y + offsetY + loc.height/2);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('font-size', loc.font_size || 13);
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', '#222');
    text.textContent = loc.code;
    g.appendChild(text);
    
    elements.push(g);
  });
  
  // 한 번에 모든 요소 추가 (배치 처리)
  elements.forEach(g => svg.appendChild(g));
  
  // 렌더링 후 viewBox 업데이트는 resetLocationView에서 호출
  // updateViewBox();
}

// location_code 포맷 통일 함수 ('A1', 'A-01', 'A 01' 등 모두 'A-01'로 변환)
function normalizeLocationCode(code) {
  if (!code) return code;
  const match = code.match(/^([A-Z])[- ]?(\d{1,2})$/i);
  if (match) {
    const letter = match[1].toUpperCase();
    const num = match[2].padStart(2, '0');
    return `${letter}-${num}`;
  }
  return code.trim();
}

// 사용 가능한 위치 목록 가져오기 (빈 위치만)
async function getAvailableLocationsForView() {
  try {
    // 1. status='available'이고 disabled가 아닌 위치 목록
    const { data: locations, error: locError } = await supabase
      .from('mx_locations')
      .select('location_code')
      .eq('status', 'available')
      .neq('status', 'disabled')
      .order('location_code');
    if (locError || !locations || locations.length === 0) return [];

    // 2. 입고 완료된 항목의 위치 조회 (receiving_log 확인)
    const { data: receivedItems, error: receivedError } = await supabase
      .from('mx_receiving_log')
      .select('label_id');
    
    if (receivedError) {
      console.error('Error loading receiving_log:', receivedError);
      return [];
    }
    
    const receivedLabelIds = new Set((receivedItems || []).map(l => String(l.label_id)));
    
    // 3. receiving_items에서 입고 완료된 항목의 위치 조회
    const { data: allItems, error: itemsError } = await supabase
      .from('mx_receiving_items')
      .select('location_code, label_id');
    
    if (itemsError) {
      console.error('Error loading receiving_items:', itemsError);
      return [];
    }
    
    // 4. 출고 완료된 항목 제외
    const { data: shippedItems } = await supabase
      .from('mx_shipping_instruction_items')
      .select('container_no, shipped_at');
    
    const shippedContainerIds = new Set(
      (shippedItems || [])
        .filter(i => i.shipped_at && i.container_no)
        .map(i => String(i.container_no))
    );
    
    // 5. 점유된 위치 코드 집합 생성 (Container 단위)
    const occupiedCodes = new Set();
    // receiving_items에서 container_no별로 그룹화
    const containerLocationMap = new Map();
    (allItems || []).forEach(item => {
      if (!item.location_code) return;
      const labelId = String(item.label_id);
      // 입고 완료된 항목만 처리
      if (receivedLabelIds.has(labelId)) {
        // container_no를 가져오기 위해 receiving_items 다시 조회
        const normCode = normalizeLocationCode(item.location_code);
        if (!containerLocationMap.has(normCode)) {
          containerLocationMap.set(normCode, new Set());
        }
      }
    });
    
    // container_no별로 출고 여부 확인하여 점유된 위치 결정
    const { data: allItemsWithContainer } = await supabase
      .from('mx_receiving_items')
      .select('location_code, container_no, label_id');
    
    if (allItemsWithContainer) {
      allItemsWithContainer.forEach(item => {
        if (!item.location_code || !item.container_no) return;
        const labelId = String(item.label_id);
        const containerNo = String(item.container_no);
        // 입고 완료되었고 출고되지 않은 Container만 점유로 간주
        if (receivedLabelIds.has(labelId) && !shippedContainerIds.has(containerNo)) {
          const normCode = normalizeLocationCode(item.location_code);
          occupiedCodes.add(normCode);
        }
      });
    }
    
    // 6. 사용 가능한 위치 필터링
    const available = locations
      .map(loc => loc.location_code)
      .filter(locCode => {
        const normCode = normalizeLocationCode(locCode);
        return !occupiedCodes.has(normCode);
      });
    
    return available;
  } catch (error) {
    console.error('Error in getAvailableLocationsForView:', error);
    return [];
  }
}

// 빈 위치 드롭다운 로드
async function loadEmptyLocationDropdown() {
  const emptyLocationSelect = document.getElementById('emptyLocationSelect');
  if (!emptyLocationSelect) return;
  
  emptyLocationSelect.innerHTML = '<option value="">로딩 중...</option>';
  const available = await getAvailableLocationsForView();
  emptyLocationSelect.innerHTML = '<option value="">빈 위치 목록...</option>';
  
  if (available.length === 0) {
    emptyLocationSelect.innerHTML = '<option value="">사용 가능한 위치가 없습니다</option>';
    return;
  }
  
  available.forEach(loc => {
    const option = document.createElement('option');
    option.value = loc;
    option.textContent = loc;
    emptyLocationSelect.appendChild(option);
  });
  
  // 드롭다운 선택 시 해당 위치로 스크롤 및 하이라이트
  const changeHandler = async (e) => {
    if (e.target.value) {
      const selectedCode = normalizeLocationCode(e.target.value);
      // SVG에서 해당 위치 찾기
      const locationGroups = document.querySelectorAll('#locationSVG g[data-type="location"]');
      let found = false;
      locationGroups.forEach(g => {
        const rect = g.querySelector('rect');
        const text = g.querySelector('text');
        const locationCode = g.getAttribute('data-location-code');
        const codeToCheck = locationCode || (text ? text.textContent : '');
        if (normalizeLocationCode(codeToCheck) === selectedCode) {
          found = true;
          // 위치 하이라이트
          rect.setAttribute('stroke', '#ff0000');
          rect.setAttribute('stroke-width', '3');
          // SVG 컨테이너 스크롤
          const svg = document.getElementById('locationSVG');
          if (svg) {
            const rectBounds = rect.getBBox();
            const svgBounds = svg.getBoundingClientRect();
            const scrollX = rectBounds.x + rectBounds.width / 2 - svgBounds.width / 2;
            const scrollY = rectBounds.y + rectBounds.height / 2 - svgBounds.height / 2;
            svg.parentElement.scrollTo({
              left: scrollX,
              top: scrollY,
              behavior: 'smooth'
            });
          }
          // 클릭 이벤트 트리거하여 정보 표시
          setTimeout(() => {
            g.click();
          }, 300);
        } else {
          // 다른 위치는 원래 스타일로
          rect.setAttribute('stroke', '#333');
          rect.setAttribute('stroke-width', '1.5');
        }
      });
      if (!found) {
        // 위치를 찾지 못한 경우 빈 위치로 표시
        showLocationModal(selectedCode, null);
      }
    }
  };
  
  // 기존 이벤트 리스너 제거 후 새로 추가
  emptyLocationSelect.removeEventListener('change', changeHandler);
  emptyLocationSelect.addEventListener('change', changeHandler);
}

// 모든 위치와 배경 요소를 포함하는 viewBox 계산
function calculateViewBox() {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let locationMinY = Infinity; // 위치만의 최소 Y (배경 요소 제외)
  let locationMinX = Infinity; // 위치만의 최소 X
  let hasContent = false;
  
  // 위치들의 범위 계산
  if (layout && layout.length > 0) {
    console.log(`위치 보기: calculateViewBox - ${layout.length}개 위치 범위 계산 시작`);
    layout.forEach(loc => {
      hasContent = true;
      const right = loc.x + loc.width;
      const bottom = loc.y + loc.height;
      if (loc.x < minX) minX = loc.x;
      if (loc.x < locationMinX) locationMinX = loc.x;
      if (loc.y < minY) minY = loc.y;
      if (loc.y < locationMinY) locationMinY = loc.y; // 위치만의 최소 Y 저장
      if (right > maxX) maxX = right;
      if (bottom > maxY) maxY = bottom;
    });
    console.log(`위치 보기: calculateViewBox - 위치 범위: minX=${locationMinX}, minY=${locationMinY}, maxX=${maxX}, maxY=${maxY}`);
  } else {
    console.warn('위치 보기: calculateViewBox - layout이 비어있거나 null입니다.');
  }
  
  // 위치가 있으면 위치의 최소 좌표를 확정 (상단/왼쪽 간격 완전 제거)
  if (locationMinX !== Infinity) {
    minX = locationMinX; // 위치의 실제 최소 X 사용
  }
  if (locationMinY !== Infinity) {
    minY = locationMinY; // 위치의 실제 최소 Y 사용 (상단 간격 완전 제거)
  }
  
  // 내용이 없으면 기본값 사용
  if (!hasContent || minX === Infinity) {
    return '0 0 835 667';
  }
  
  // 배경 요소들의 범위도 고려 (maxX, maxY만, minX/minY는 위치 기준으로 이미 확정됨)
  const svg = document.getElementById('locationSVG');
  if (svg) {
    // 배경 요소는 pointer-events="none"이 설정되어 있으므로, 일반 rect와 구분하기 위해
    // data-type이 없는 rect만 배경으로 간주
    const bgRects = svg.querySelectorAll('rect:not([data-type])');
    bgRects.forEach(rect => {
      const x = parseFloat(rect.getAttribute('x')) || 0;
      const y = parseFloat(rect.getAttribute('y')) || 0;
      const width = parseFloat(rect.getAttribute('width')) || 0;
      const height = parseFloat(rect.getAttribute('height')) || 0;
      const right = x + width;
      const bottom = y + height;
      // 배경 요소는 maxX, maxY만 고려 (minX, minY는 위치 기준으로 이미 확정됨)
      if (right > maxX) maxX = right;
      if (bottom > maxY) maxY = bottom;
    });
  }
  
  // 최소값이 0보다 작으면 0으로 조정 (음수 좌표 방지)
  if (minX < 0) minX = 0;
  if (minY < 0) minY = 0;
  
  // 여유 공간 추가 (오른쪽과 하단만, 상단과 왼쪽은 완전히 제거)
  // 위치들이 화면에 꽉 차게 보이도록 최소한의 여유 공간만 추가
  const paddingX = Math.min(20, (maxX - minX) * 0.02); // 최대 20px 또는 2%
  const paddingY = Math.min(20, (maxY - minY) * 0.02); // 최대 20px 또는 2%
  
  // 오른쪽 패널(LOCATION INFO) 때문에 잘리지 않도록 최소한의 여유 공간만 확보
  // 패널 너비는 약 320px이지만, SVG가 flex-1로 축소되므로 실제로는 더 작은 공간이 필요
  // 위치들이 화면에 꽉 차게 보이도록 최소한만 추가
  const contentWidth = maxX - minX;
  const sidePanelPadding = Math.max(50, Math.min(120, contentWidth * 0.08)); // 최소 50px, 최대 120px 또는 8% 추가
  
  // 왼쪽과 상단은 여유 공간 전혀 없음 (실제 최소값 그대로 사용)
  // minX, minY는 이미 위치의 실제 최소값으로 설정됨 - 변경하지 않음
  maxX = maxX + paddingX + sidePanelPadding; // 오른쪽에 패널 공간까지 고려한 padding 추가
  maxY = maxY + paddingY; // 하단만 padding 추가
  
  console.log(`위치 보기: calculateViewBox - 오른쪽 패널 여유 공간: ${sidePanelPadding}px 추가 (전체 너비: ${contentWidth}px)`);
  
  console.log(`viewBox 계산: minX=${minX}, minY=${minY}, width=${maxX - minX}, height=${maxY - minY}`);
  
  return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
}

// Location View 초기화
async function resetLocationView() {
  // 위치 레이아웃 먼저 로드
  await loadLocationLayout();
  
  // SVG 완전 교체
  const oldSVG = document.getElementById('locationSVG');
  let newSVG;
  if (oldSVG) {
    const svgParent = oldSVG.parentNode;
    svgParent.removeChild(oldSVG);
    newSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    newSVG.setAttribute('id', 'locationSVG');
    // 초기 viewBox는 나중에 계산
    newSVG.setAttribute('viewBox', '0 0 835 667');
    newSVG.setAttribute('style', 'width:100%; height:100%; max-width:100%; background:#f8fafc; border:1.5px solid #333; box-shadow:0 2px 12px #0002;');
    svgParent.appendChild(newSVG);
    currentSVG = newSVG;
  }
  
  await initializeSVG();
  
  // 위치 렌더링 후 viewBox 업데이트
  renderLocations();
  updateViewBox();
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
      <div><b>컨테이너 번호:</b> ${info.container_id || '-'}</div>
      <div><b>입고일:</b> ${info.receiving_date || '-'}</div>
      <div><b>제품 정보:</b> ${info.remark || '-'}</div>
    `;
    shippingOrderArea.innerHTML = `<div class="mt-4 text-sm text-gray-500">출하지시서 상태 확인 중...</div>`;
    // 출하지시서 존재 여부 확인 - 컨테이너 단위로 확인
    (async () => {
      const { data: exist } = await supabase.from('mx_shipping_instruction')
        .select('*')
        .eq('container_no', info.container_id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (exist && exist.length > 0) {
        // 이미 출하지시서가 있으면 프린트 버튼만
        const si = exist[0];
        shippingOrderArea.innerHTML = `
          <div class="mb-2 text-green-700 font-bold">이 컨테이너의 출하지시서가 이미 생성됨</div>
          <button id="printShippingBtn" class="bg-blue-600 text-white px-4 py-1 rounded">출하지시서 프린트</button>
        `;
        document.getElementById('printShippingBtn').onclick = () => printShippingLabel(si);
      } else {
        // 없으면 출하지시 버튼만 (프린트 버튼은 생성 후에만 표시)
        shippingOrderArea.innerHTML = `
          <div class="mt-4 space-y-2">
            <div class="flex gap-2 items-end">
              <div class="flex-1">
                <label class="block text-xs text-gray-600 mb-1">출고 날짜</label>
                <input type="date" id="shippingDateInput" class="border rounded px-2 py-1 w-full" />
              </div>
              <div class="flex-1">
                <label class="block text-xs text-gray-600 mb-1">Delivery Location</label>
                <select id="deliveryLocationSelect" class="border rounded px-2 py-1 w-full">
                  <option value="">선택...</option>
                </select>
              </div>
            </div>
            <div class="flex gap-2">
              <button id="createShippingBtn" class="bg-green-600 text-white px-4 py-1 rounded flex-1">출하지시</button>
            </div>
          </div>
          <div id="shippingResultMsg" class="mt-2 text-sm"></div>
        `;
        
        // Delivery Location 드롭다운 로드
        await loadDeliveryLocations();
        let lastSI = null;
        document.getElementById('createShippingBtn').onclick = async () => {
          const shippingDate = document.getElementById('shippingDateInput').value;
          if (!shippingDate) {
            document.getElementById('shippingResultMsg').textContent = '출고 날짜를 선택하세요.';
            return;
          }
          const barcode = info.label_id || info.container_id;

          // Delivery Location ID 가져오기
          const deliveryLocationSelect = document.getElementById('deliveryLocationSelect');
          const deliveryLocationId = deliveryLocationSelect && deliveryLocationSelect.value 
            ? parseInt(deliveryLocationSelect.value) 
            : null;
          
          // mx_receiving_items에서 remark 가져오기
          let remark = null;
          if (info.container_id) {
            const { data: receivingItem } = await supabase
              .from('mx_receiving_items')
              .select('remark')
              .eq('container_no', info.container_id)
              .limit(1)
              .single();
            if (receivingItem && receivingItem.remark) {
              remark = receivingItem.remark;
            }
          }
          
          // Container 단위로 출하 지시서 생성
          // remark 컬럼이 없을 수 있으므로 조건부로 포함
          const insertData = {
            location_code: loc,
            container_no: info.container_id,
            shipping_date: shippingDate,
            status: 'pending',
            barcode: crypto.randomUUID(),
            delivery_location_id: deliveryLocationId
          };
          
          // remark 컬럼이 있을 때만 추가 (테이블에 컬럼이 없으면 오류 방지)
          // SQL 스크립트 실행 후에는 항상 포함 가능
          if (remark) {
            insertData.remark = remark;
          }
          
          const { data, error } = await supabase.from('mx_shipping_instruction').insert(insertData).select('*').single();
          if (error) {
            document.getElementById('shippingResultMsg').textContent = '출하지시서 생성 실패: ' + error.message;
            return;
          }

          // shipping_instruction_items에 Container 정보 저장
          const shippingInstructionId = data.id;
          const itemsToInsert = [{
            shipping_instruction_id: shippingInstructionId,
            container_no: info.container_id
          }];
          const { error: itemError } = await supabase.from('mx_shipping_instruction_items').insert(itemsToInsert);
          if (itemError) {
            document.getElementById('shippingResultMsg').textContent = '출하지시서 생성(실물 매핑) 실패: ' + itemError.message;
            return;
          }
          document.getElementById('shippingResultMsg').textContent = '컨테이너 출하지시서가 생성되었습니다!';
          lastSI = data;
          
          // 출하지시서 생성 후 프린트 버튼 추가
          const buttonContainer = document.querySelector('#shippingOrderArea .flex.gap-2');
          if (buttonContainer && !document.getElementById('printShippingBtn')) {
            const printBtn = document.createElement('button');
            printBtn.id = 'printShippingBtn';
            printBtn.className = 'bg-blue-600 text-white px-4 py-1 rounded';
            printBtn.textContent = '출하지시서 프린트';
            printBtn.onclick = async () => {
              if (lastSI) await printShippingLabel(lastSI);
            };
            buttonContainer.appendChild(printBtn);
          }
        };
      }
    })();
  } else {
    sidePanelBody.innerHTML = `<div class='text-green-600 font-semibold'>✓ 빈 위치 (사용 가능)</div>`;
    shippingOrderArea.innerHTML = '';
  }
}

// 출하지시서 라벨 프린트 함수
async function printShippingLabel(si) {
  const now = new Date();
  const dateStr = now.toISOString().slice(0,10).replace(/-/g,'.');
  const timeStr = now.toTimeString().slice(0,5);
  const bolNo = si.barcode || si.location_code;
  const containerNo = si.container_no || '-';
  const location = si.location_code || '-';
  
  // mx_receiving_items에서 remark 가져오기
  let remark = '-';
  if (containerNo && containerNo !== '-') {
    const { data: receivingItem } = await supabase
      .from('mx_receiving_items')
      .select('remark')
      .eq('container_no', containerNo)
      .not('remark', 'is', null)
      .neq('remark', '')
      .limit(1)
      .single();
    
    if (receivingItem && receivingItem.remark) {
      remark = receivingItem.remark;
    }
  }
  
  // Delivery Location 정보 조회 (마스터에서 가져오기)
  let destinationInfo = '-';
  if (si.delivery_location_id) {
    try {
        const { data: deliveryLocation, error: dlError } = await supabase
          .from('mx_delivery_locations')
          .select('location_name, address, contact_person, contact_phone')
          .eq('id', si.delivery_location_id)
          .single();
      
      if (!dlError && deliveryLocation) {
        // Delivery Location 정보로 Destination 구성
        const parts = [];
        if (deliveryLocation.location_name) parts.push(deliveryLocation.location_name);
        if (deliveryLocation.address) parts.push(deliveryLocation.address);
        if (deliveryLocation.contact_person) parts.push(`Contact: ${deliveryLocation.contact_person}`);
        if (deliveryLocation.contact_phone) parts.push(`Tel: ${deliveryLocation.contact_phone}`);
        destinationInfo = parts.join(' <br> ') || '-';
      }
    } catch (error) {
      console.error('Delivery Location 조회 실패:', error);
    }
  }
  
  // 제품 정보(remark) 표시
  const model = remark;
  const description = si.description || '-';
  const remarks = si.remarks || '-';

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
          <td>LHM Pesqueria Hub</td>
          <th>BOL#</th>
          <td>${bolNo}</td>
        </tr>
        <tr>
          <th>Address</th>
          <td>Calle Esfuerzo No. 104, Perque Industrial Asia Pacific Park, Pesqueria, Nuevo Leon, Mexico</td>
          <th>Destination</th>
          <td>${destinationInfo}</td>
        </tr>
      </table>
        <table class='bol-table'>
          <tr>
            <th>No.</th>
            <th>Container No.</th>
            <th>Model</th>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit</th>
            <th>Location</th>
            <th>Remarks</th>
          </tr>
          <tr>
            <td>1</td>
            <td>${containerNo}</td>
            <td>${model}</td>
            <td>${description}</td>
            <td>-</td>
            <td>EA</td>
            <td>${location}</td>
            <td>${remarks}</td>
          </tr>
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
          <div style='font-size:16px;'>Container: ${containerNo}</div>
          <div style='font-size:16px;'>${dateStr} ${timeStr}</div>
        </div>
        <div style='text-align:right;'>
          <canvas id='qr-shipping-print' width='120' height='120'></canvas>
        </div>
      </div>
      <div class='bol-footer'>
        ● The property described above and destined as indicated above with said carrier (person or corporation in possession of the property under contract) agrees to carry product/s to its place of delivery (Consignee) at said destination. It is mutually agreed as to each the service to be performed hereunder shall be subject to all the terms and conditions of Uniform Domestic Straight Bill of Lading set forth (1) in Uniform Freight Classification in effect on date hereof.<br>
        ● Leehwa SCM must keep copy of this receipt for the future reference.<br>
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
  console.log('위치 보기: 메시지 수신:', event.data);
  if (event.data && event.data.type === 'refreshLocationView') {
    console.log('위치 보기: refreshLocationView 메시지 수신, resetLocationView() 호출');
    // 페이지 새로고침 대신 resetLocationView 호출 (더 부드러운 업데이트)
    resetLocationView();
  }
});

// 페이지 포커스가 돌아올 때 자동 새로고침 (시각적 편집기에서 돌아올 때)
let lastFocusTime = Date.now();
window.addEventListener('focus', () => {
  // 5초 이상 포커스를 잃었다가 돌아온 경우에만 새로고침
  const timeSinceLastFocus = Date.now() - lastFocusTime;
  console.log('위치 보기: 포커스 복귀, 경과 시간:', timeSinceLastFocus, 'ms');
  if (timeSinceLastFocus > 5000) {
    console.log('위치 보기: 5초 이상 경과, resetLocationView() 호출');
    resetLocationView();
  }
  lastFocusTime = Date.now();
});

// 페이지가 보일 때도 체크 (탭 전환 시)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    console.log('위치 보기: 페이지가 다시 보임, resetLocationView() 호출');
    // 페이지가 다시 보일 때 최신 데이터 로드
    resetLocationView();
  }
});

// 언어 변경 이벤트 리스너
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang')));
});

// 초기 언어 설정
setLang(currentLang); 