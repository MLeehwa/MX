// import { CONFIG } from '../config/config.js';
// import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = window.supabase;

// i18n 객체
const i18n = {
  ko: {
    title_shipping_confirmation: '출하 확정 관리',
    label_search: '검색',
    label_part_no: '품번',
    label_status: '상태',
    label_shipping_date: '출하일',
    label_min_qty: '최소 수량',
    label_max_qty: '최대 수량',
    btn_search: '검색',
    btn_reset: '초기화',
    btn_cancel: '취소',
    btn_confirm: '확인',
    label_matching_list: '매칭 목록',
    th_container_no: '컨테이너 NO',
    th_shipping_date: '출하일',
    th_part_no: '품번',
    th_qty: '수량',
    th_status: '상태',
    th_shipped_at: '출고일',
    th_action: '작업',
    modal_title_confirm_matching: '매칭 확인',
    option_all: '전체',
    option_pending: '대기중',
    option_shipped: '출고완료',
    ph_search_part_no: '품번 검색',
    ph_min_qty: '최소 수량',
    ph_max_qty: '최대 수량',
    // 동적 메시지
    msg_no_results: '검색 결과가 없습니다.',
    msg_total: '전체 건수',
    msg_shipped: '출고완료',
    msg_pending: '대기중',
    msg_total_qty: '총 수량',
    msg_status_shipped: '출고완료',
    msg_status_pending: '대기중',
    msg_label_print: '라벨출력',
    msg_confirm_shipping: '출하 확정',
    msg_done: '완료',
    msg_match_fail: '매칭 실패: 출하증의 컨테이너 번호와 실물 바코드가 다릅니다.',
    msg_confirm_success: '출하가 확정되었습니다.',
    msg_confirm_error: '출하 확정 중 오류 발생: {error}',
    msg_cancel_shipping: '출하 취소',
    msg_confirm_cancel: '정말로 출하를 취소하시겠습니까?\n취소하면 출하 상태가 대기중으로 변경되고 위치가 복원됩니다.',
    msg_cancel_success: '출하가 취소되었습니다.',
    msg_cancel_error: '출하 취소 중 오류 발생: {error}',
    msg_delete_shipping: '삭제',
    msg_confirm_delete: '정말로 이 출하 지시서를 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.',
    msg_delete_success: '출하 지시서가 삭제되었습니다.',
    msg_delete_error: '삭제 중 오류 발생: {error}',
  },
  en: {
    title_shipping_confirmation: 'Shipping Confirmation Admin',
    label_search: 'Search',
    label_part_no: 'Part No.',
    label_status: 'Status',
    label_shipping_date: 'Shipping Date',
    label_min_qty: 'Min Qty',
    label_max_qty: 'Max Qty',
    btn_search: 'Search',
    btn_reset: 'Reset',
    btn_cancel: 'Cancel',
    btn_confirm: 'Confirm',
    label_matching_list: 'Matching List',
    th_container_no: 'Container No.',
    th_shipping_date: 'Shipping Date',
    th_part_no: 'Part No.',
    th_qty: 'Qty',
    th_status: 'Status',
    th_shipped_at: 'Shipped At',
    th_action: 'Action',
    modal_title_confirm_matching: 'Confirm Matching',
    option_all: 'All',
    option_pending: 'Pending',
    option_shipped: 'Shipped',
    ph_search_part_no: 'Search Part No.',
    ph_min_qty: 'Min Qty',
    ph_max_qty: 'Max Qty',
    // Dynamic messages
    msg_no_results: 'No results found.',
    msg_total: 'Total',
    msg_shipped: 'Shipped',
    msg_pending: 'Pending',
    msg_total_qty: 'Total Qty',
    msg_status_shipped: 'Shipped',
    msg_status_pending: 'Pending',
    msg_label_print: 'Print Label',
    msg_confirm_shipping: 'Confirm Shipping',
    msg_done: 'Done',
    msg_match_fail: 'Match failed: Container No. and barcode do not match.',
    msg_confirm_success: 'Shipping confirmed.',
    msg_confirm_error: 'Error confirming shipping: {error}',
    msg_cancel_shipping: 'Cancel Shipping',
    msg_confirm_cancel: 'Are you sure you want to cancel this shipping?\nThis will change the status back to pending and restore the location.',
    msg_cancel_success: 'Shipping has been cancelled.',
    msg_cancel_error: 'Error cancelling shipping: {error}',
    msg_delete_shipping: 'Delete',
    msg_confirm_delete: 'Are you sure you want to delete this shipping instruction?\nThis action cannot be undone.',
    msg_delete_success: 'Shipping instruction has been deleted.',
    msg_delete_error: 'Error deleting: {error}',
  }
};

let currentLang = localStorage.getItem('admin_shipping_lang') || 'ko';

function setLang(lang) {
  currentLang = lang;
  document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('bg-blue-600', 'text-white', 'bg-gray-300', 'text-gray-800'));
  document.querySelector('.lang-btn[data-lang="' + lang + '"]').classList.add('bg-blue-600', 'text-white');
  document.querySelectorAll('.lang-btn:not([data-lang="' + lang + '"])').forEach(btn => btn.classList.add('bg-gray-300', 'text-gray-800'));
  // 정적 텍스트
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang][key]) el.textContent = i18n[lang][key];
  });
  // placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (i18n[lang][key]) el.placeholder = i18n[lang][key];
  });
  // <option> 태그
  document.querySelectorAll('option[data-i18n]').forEach(opt => {
    const key = opt.getAttribute('data-i18n');
    if (i18n[lang][key]) opt.textContent = i18n[lang][key];
  });
  document.documentElement.lang = lang;
  localStorage.setItem('admin_shipping_lang', lang);
  // 동적 영역도 언어 즉시 반영
  updateSearchStats(lastStats || { total: 0, shipped: 0, pending: 0, totalQty: 0 });
  updateMatchingList(lastMatchingItems || []);
  updateModalTexts();
}

// 동적 영역의 마지막 데이터 저장
let lastStats = null;
let lastMatchingItems = null;

function formatMessage(key, params = {}) {
  let message = i18n[currentLang][key] || key;
  Object.entries(params).forEach(([k, v]) => {
    message = message.replace(`{${k}}`, v);
  });
  return message;
}

// DOM Elements
let filterStatus, filterDate;
let searchBtn, resetBtn, matchingListBody;
let matchingModal, matchingModalBody, confirmMatchingBtn, cancelMatchingBtn;

// 현재 매칭 중인 데이터
let currentMatching = {
  shippingInstruction: null,
  item: null
};

// DOM 초기화
function initializeElements() {
  filterStatus = document.getElementById('filterStatus');
  filterDate = document.getElementById('filterDate');
  searchBtn = document.getElementById('searchBtn');
  resetBtn = document.getElementById('resetBtn');
  matchingListBody = document.getElementById('matchingListBody');
  matchingModal = document.getElementById('matchingModal');
  matchingModalBody = document.getElementById('matchingModalBody');
  confirmMatchingBtn = document.getElementById('confirmMatchingBtn');
  cancelMatchingBtn = document.getElementById('cancelMatchingBtn');
}

// 이벤트 리스너 설정
function setupEventListeners() {
  // 검색/초기화 버튼
  if (searchBtn) searchBtn.addEventListener('click', () => loadMatchingList(true));
  if (resetBtn) resetBtn.addEventListener('click', resetFilters);

  // 모달 버튼
  if (confirmMatchingBtn) confirmMatchingBtn.addEventListener('click', confirmMatching);
  if (cancelMatchingBtn) cancelMatchingBtn.addEventListener('click', () => {
    matchingModal.classList.add('hidden');
    resetCurrentMatching();
  });

  const closeModalBtn = document.getElementById('closeMatchingModal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      matchingModal.classList.add('hidden');
      resetCurrentMatching();
    });
  }
}

// 매칭 목록 로드
async function loadMatchingList(applyFilter = false) {
  try {
    // mx_shipping_instruction에서 직접 데이터 가져오기 (출하 지시서가 발행되었지만 items가 없을 수 있음)
    // remark 컬럼이 없을 수 있으므로 선택적으로 처리
    let query = supabase
      .from('mx_shipping_instruction')
      .select(`
        id,
        barcode,
        shipping_date,
        status,
        container_no,
        delivery_location_id,
        created_at,
        mx_shipping_instruction_items (
          id,
          container_no,
          shipped_at,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    // 검색 조건 값
    const statusVal = filterStatus ? filterStatus.value : '';
    const dateVal = filterDate ? filterDate.value : '';
    const containerNoSearchEl = document.getElementById('containerNoSearch');
    const remarkSearchEl = document.getElementById('remarkSearch');
    const containerNoSearch = containerNoSearchEl ? containerNoSearchEl.value.trim() : '';
    const remarkSearch = remarkSearchEl ? remarkSearchEl.value.trim() : '';

    const { data: shippingInstructions, error } = await query;
    if (error) throw error;
    
    console.log('출하 지시서 로드:', shippingInstructions?.length || 0, '개');

    // mx_receiving_items에서 remark 가져오기 (container_no 기준)
    const containerNos = (shippingInstructions || [])
      .map(si => si.container_no)
      .filter(Boolean);
    
    let remarkMap = new Map();
    if (containerNos.length > 0) {
      const { data: receivingItems, error: receivingError } = await supabase
        .from('mx_receiving_items')
        .select('container_no, remark')
        .in('container_no', containerNos)
        .not('remark', 'is', null)
        .neq('remark', '');
      
      if (!receivingError && receivingItems) {
        receivingItems.forEach(item => {
          if (item.container_no && item.remark) {
            // 같은 container_no에 여러 remark가 있을 수 있으므로 첫 번째 것만 사용
            if (!remarkMap.has(item.container_no)) {
              remarkMap.set(item.container_no, item.remark);
            }
          }
        });
      }
    }
    
    console.log('제품 정보(remark) 맵:', remarkMap.size, '개');

    // JS에서 한 번 더 후처리 필터링 및 remark 추가
    let filtered = (shippingInstructions || []).filter(si => {
      if (!si) return false;
      
      // remark를 mx_receiving_items에서 가져온 값으로 설정
      si.remark = remarkMap.get(si.container_no) || null;
      
      if (statusVal && si.status !== statusVal) return false;
      if (dateVal && si.shipping_date !== dateVal) return false;
      
      // 컨테이너 번호 검색
      if (containerNoSearch && si.container_no) {
        if (!si.container_no.toLowerCase().includes(containerNoSearch.toLowerCase())) {
          return false;
        }
      }
      
      // 제품 정보(remark) 검색
      if (remarkSearch) {
        const remark = si.remark || '';
        if (!remark.toLowerCase().includes(remarkSearch.toLowerCase())) {
          return false;
        }
      }
      
      return true;
    });

    // shipping_instruction_items 형태로 변환 (호환성 유지)
    const items = filtered.map(si => ({
      id: si.id,
      shipping_instruction_id: si.id,
      container_no: si.container_no,
      shipped_at: si.mx_shipping_instruction_items?.[0]?.shipped_at || null,
      created_at: si.created_at,
      shipping_instruction: si
    }));
    
    console.log('필터링된 항목:', items.length, '개');

    // 검색 결과 통계 계산 (필터링된 결과 기준)
    const stats = calculateSearchStats(items);

    // UI 업데이트 (필터링된 결과 기준)
    updateSearchStats(stats);
    updateMatchingList(items);
  } catch (error) {
    console.error('Error loading matching list:', error);
    updateSearchStats({ total: 0, shipped: 0, pending: 0, totalQty: 0 });
    updateMatchingList([]);
  }
}

// 검색 결과 통계 계산
function calculateSearchStats(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { total: 0, shipped: 0, pending: 0, totalQty: 0 };
  }
  
  // shipping_instruction_id별로 그룹화하여 중복 제거
  const groupedItems = {};
  items.forEach(item => {
    const si = item.shipping_instruction;
    if (!si) return;
    
    const siId = si.id;
    if (!groupedItems[siId]) {
      groupedItems[siId] = {
        shipping_instruction: si,
        items: []
      };
    }
    groupedItems[siId].items.push(item);
  });
  
  const groupedArray = Object.values(groupedItems);
  
  // Container 단위이므로 컨테이너 개수로 통계 계산
  return {
    total: groupedArray.length,
    shipped: groupedArray.filter(group => group.shipping_instruction.status === 'shipped').length,
    pending: groupedArray.filter(group => group.shipping_instruction.status === 'pending').length,
    totalQty: groupedArray.reduce((sum, group) => {
      // Container 개수 계산 (각 shipping_instruction_items가 하나의 컨테이너)
      return sum + (group.items.length || 1);
    }, 0)
  };
}

// 검색 결과 통계 표시
function updateSearchStats(stats) {
  lastStats = stats;
  const statsContainer = document.getElementById('searchStats');
  if (!statsContainer) return;
  statsContainer.innerHTML = `
    <div class="grid grid-cols-4 gap-4">
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="text-sm text-gray-500">${formatMessage('msg_total')}</div>
        <div class="text-2xl font-bold">${stats.total}</div>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="text-sm text-gray-500">${formatMessage('msg_shipped')}</div>
        <div class="text-2xl font-bold text-green-600">${stats.shipped}</div>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="text-sm text-gray-500">${formatMessage('msg_pending')}</div>
        <div class="text-2xl font-bold text-yellow-600">${stats.pending}</div>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="text-sm text-gray-500">${formatMessage('msg_total_qty')}</div>
        <div class="text-2xl font-bold">${stats.totalQty}</div>
      </div>
    </div>
  `;
}

// 매칭 목록 업데이트
function updateMatchingList(items) {
  lastMatchingItems = items;
  if (!matchingListBody) return;
  matchingListBody.innerHTML = '';
  if (!Array.isArray(items) || items.length === 0) {
    matchingListBody.innerHTML = `
      <tr>
        <td colspan="6" class="px-4 py-8 text-center text-gray-500">
          ${formatMessage('msg_no_results')}
        </td>
      </tr>
    `;
    return;
  }
  
  // shipping_instruction_id별로 그룹화하여 중복 제거
  const groupedItems = {};
  items.forEach(item => {
    const si = item.shipping_instruction;
    if (!si) return;
    
    const siId = si.id;
    if (!groupedItems[siId]) {
      groupedItems[siId] = {
        shipping_instruction: si,
        items: []
      };
    }
    groupedItems[siId].items.push(item);
  });
  
  // 그룹화된 데이터를 정렬: 대기중(pending) 먼저, 그 다음 출고완료(shipped)
  const sortedGroups = Object.values(groupedItems).sort((a, b) => {
    const statusA = a.shipping_instruction.status;
    const statusB = b.shipping_instruction.status;
    
    // pending가 먼저 오도록 정렬
    if (statusA === 'pending' && statusB === 'shipped') return -1;
    if (statusA === 'shipped' && statusB === 'pending') return 1;
    
    // 같은 상태인 경우 생성일 기준 내림차순 정렬
    return new Date(b.shipping_instruction.created_at) - new Date(a.shipping_instruction.created_at);
  });
  
  // 정렬된 데이터를 화면에 표시
  sortedGroups.forEach(group => {
    const si = group.shipping_instruction;
    const items = group.items;
    
    // 제품 정보(remark) 표시 (remark 컬럼이 없을 수 있으므로 안전하게 처리)
    let partDisplay = (si.remark !== undefined && si.remark !== null) ? si.remark : '-';
    
    const tr = document.createElement('tr');
    tr.className = 'border-t hover:bg-gray-50';
    tr.innerHTML = `
      <td class="px-4 py-2 border">${si.container_no || '-'}</td>
      <td class="px-4 py-2 border">${partDisplay}</td>
      <td class="px-4 py-2 border">
        <span class="px-2 py-1 rounded-full text-sm ${
          si.status === 'shipped'
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
        }">
          ${si.status === 'shipped' ? formatMessage('msg_status_shipped') : formatMessage('msg_status_pending')}
        </span>
      </td>
      <td class="px-4 py-2 border">${si.shipping_date || '-'}</td>
      <td class="px-4 py-2 border">${items[0]?.shipped_at ? items[0].shipped_at.slice(0, 10) : '-'}</td>
      <td class="px-4 py-2 border">
        <div class="flex gap-2">
          ${si.status !== 'shipped'
            ? `<button class="text-blue-600 hover:text-blue-800" onclick="printShippingLabel('${si.barcode}')">${formatMessage('msg_label_print')}</button>
               <button class="text-red-600 hover:text-red-800" onclick="window.confirmShipping('${si.id}')">${formatMessage('msg_confirm_shipping')}</button>
               <button class="text-gray-600 hover:text-gray-800" onclick="window.deleteShipping('${si.id}')">${formatMessage('msg_delete_shipping')}</button>`
            : `<button class="text-blue-600 hover:text-blue-800" onclick="printShippingLabel('${si.barcode}')">${formatMessage('msg_label_print')}</button>
               <button class="text-orange-600 hover:text-orange-800" onclick="window.cancelShipping('${si.id}')">${formatMessage('msg_cancel_shipping')}</button>`}
        </div>
      </td>
    `;
    matchingListBody.appendChild(tr);
  });
}

// 필터 초기화
function resetFilters() {
  filterStatus.value = '';
  filterDate.value = '';
  if (document.getElementById('barcodeSearch')) document.getElementById('barcodeSearch').value = '';
  if (document.getElementById('containerNoSearch')) document.getElementById('containerNoSearch').value = '';
  if (document.getElementById('remarkSearch')) document.getElementById('remarkSearch').value = '';
  loadMatchingList(); // 초기화 후 전체 목록 로드
}

// 현재 매칭 데이터 초기화
function resetCurrentMatching() {
  currentMatching = {
    shippingInstruction: null,
    item: null
  };
}

// 매칭 확인 처리
async function confirmMatching() {
  const { shippingInstruction, item } = currentMatching;
  if (!shippingInstruction || !item) return;

  // 매칭 기준: container_no === container_no (Container 단위)
  if (shippingInstruction.container_no !== item.container_no) {
    alert(formatMessage('msg_match_fail'));
    return;
  }

  try {
    // 1. shipping_instruction_items에 매칭 정보 저장 (Container 단위)
    const { error: matchError } = await supabase
      .from('mx_shipping_instruction_items')
      .insert({
        shipping_instruction_id: shippingInstruction.id,
        container_no: item.container_no || shippingInstruction.container_no,
        shipped_at: shippingInstruction.shipping_date // 출고 예정일을 출고일로 사용
      });

    if (matchError) throw matchError;

    // 2. shipping_instruction 상태 업데이트
    const { error: updateError } = await supabase
      .from('mx_shipping_instruction')
      .update({ status: 'shipped' })
      .eq('id', shippingInstruction.id);

    if (updateError) throw updateError;

    alert(formatMessage('msg_confirm_success'));
    matchingModal.classList.add('hidden');
    resetCurrentMatching();
    loadMatchingList(); // 목록 새로고침
    // LOCATION VIEW 자동 새로고침
    try {
      if (window.location.hash === '#location' || window.location.pathname.includes('location_view')) {
        window.location.reload();
      } else if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'refreshLocationView' }, '*');
      }
    } catch (e) {}
  } catch (error) {
    console.error('Error confirming matching:', error);
    alert(formatMessage('msg_confirm_error', { error: error.message }));
  }
}

// 전역 함수로 노출 (라벨 출력용)
window.printShippingLabel = async function(barcode) {
  try {
    const { data: shipping, error } = await supabase
      .from('mx_shipping_instruction')
      .select('*')
      .eq('barcode', barcode)
      .single();

    if (error) throw error;
    if (!shipping) {
      alert('출하증을 찾을 수 없습니다.');
      return;
    }

    // mx_receiving_items에서 remark 가져오기
    let remark = '-';
    if (shipping.container_no) {
      const { data: receivingItem } = await supabase
        .from('mx_receiving_items')
        .select('remark')
        .eq('container_no', shipping.container_no)
        .not('remark', 'is', null)
        .neq('remark', '')
        .limit(1)
        .single();
      
      if (receivingItem && receivingItem.remark) {
        remark = receivingItem.remark;
      }
    }
    
    // 라벨 출력 로직 (기존 printShippingLabel 함수 재사용)
    const now = new Date();
    const dateStr = now.toISOString().slice(0,10).replace(/-/g,'.');
    const timeStr = now.toTimeString().slice(0,5);
    const bolNo = shipping.barcode;
    // 제품 정보(remark) 표시
    const model = remark;
    const description = shipping.description || '-';
    const remarks = shipping.remarks || '-';
    const location = shipping.location_code || '-';
    
    // Delivery Location 정보 조회 (마스터에서 가져오기)
    let destinationInfo = '-';
    if (shipping.delivery_location_id) {
      try {
        const { data: deliveryLocation, error: dlError } = await supabase
          .from('mx_delivery_locations')
          .select('location_name, address, contact_person, contact_phone')
          .eq('id', shipping.delivery_location_id)
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
    
    // partQuantities는 이미 523번 라인에서 선언됨

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
            <td>${shipping.container_no || '-'}</td>
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
            <div style='font-size:16px;'>Container: ${shipping.container_no || '-'}</div>
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
  } catch (error) {
    console.error('Error printing shipping label:', error);
    alert('라벨 출력 실패: ' + error.message);
  }
};

// 출하 확정 모달 관련 변수
let currentConfirmShippingId = null;
let confirmShippingModal = null;
let confirmShippingDateInput = null;
let confirmShippingDateNote = null;

// 출하 확정 모달 초기화
function initializeConfirmShippingModal() {
  confirmShippingModal = document.getElementById('confirmShippingModal');
  confirmShippingDateInput = document.getElementById('confirmShippingDate');
  confirmShippingDateNote = document.getElementById('confirmShippingDateNote');
  
  const closeBtn = document.getElementById('closeConfirmShippingModal');
  const cancelBtn = document.getElementById('cancelConfirmShippingBtn');
  const confirmBtn = document.getElementById('confirmConfirmShippingBtn');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      confirmShippingModal.classList.add('hidden');
      currentConfirmShippingId = null;
    });
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      confirmShippingModal.classList.add('hidden');
      currentConfirmShippingId = null;
    });
  }
  
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      if (currentConfirmShippingId) {
        processConfirmShipping(currentConfirmShippingId);
      }
    });
  }
}

// 출하 확정(관리자) 함수 - 모달 열기
window.confirmShipping = async function(shippingInstructionId) {
  try {
    // 1. shipping_instruction의 shipping_date 가져오기
    const { data: si, error: siError } = await supabase
      .from('mx_shipping_instruction')
      .select('shipping_date, container_no')
      .eq('id', shippingInstructionId)
      .single();
    if (siError) throw siError;

    currentConfirmShippingId = shippingInstructionId;
    
    // 모달에 기존 출하일 설정
    if (confirmShippingDateInput) {
      const existingDate = si?.shipping_date || new Date().toISOString().slice(0, 10);
      confirmShippingDateInput.value = existingDate;
      
      // 안내 메시지
      if (confirmShippingDateNote) {
        confirmShippingDateNote.textContent = `기존 출하일: ${existingDate || '미설정'}`;
      }
    }
    
    // 모달 표시
    if (confirmShippingModal) {
      confirmShippingModal.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error loading shipping instruction:', error);
    alert('출하 지시서 정보를 불러오는 중 오류가 발생했습니다: ' + error.message);
  }
};

// 출하 확정 처리 함수
async function processConfirmShipping(shippingInstructionId) {
  try {
    if (!confirmShippingDateInput || !confirmShippingDateInput.value) {
      alert('출하일을 선택해주세요.');
      return;
    }

    const selectedDate = confirmShippingDateInput.value;
    
    // 1. shipping_instruction의 shipping_date 가져오기
    const { data: si, error: siError } = await supabase
      .from('mx_shipping_instruction')
      .select('shipping_date, container_no')
      .eq('id', shippingInstructionId)
      .single();
    if (siError) throw siError;

    // 2. 출하일이 다르면 업데이트
    if (si.shipping_date !== selectedDate) {
      const { error: updateDateError } = await supabase
        .from('mx_shipping_instruction')
        .update({ shipping_date: selectedDate })
        .eq('id', shippingInstructionId);
      if (updateDateError) throw updateDateError;
      console.log('출하일이 업데이트되었습니다:', selectedDate);
    }

    // 3. shipping_instruction_items의 shipped_at 업데이트
    const shippedAt = selectedDate;
    console.log('Updating shipped_at to:', shippedAt); // 디버깅용

    const { data: updateData, error: updateError } = await supabase
      .from('mx_shipping_instruction_items')
      .update({ 
        shipped_at: shippedAt
      })
      .eq('shipping_instruction_id', shippingInstructionId)
      .select();  // 업데이트된 데이터 반환

    if (updateError) {
      console.error('Error updating shipping_instruction_items:', updateError);
      throw updateError;
    }
    console.log('Updated shipping_instruction_items:', updateData); // 디버깅용

    // 3. shipping_instruction 상태를 shipped로 변경
    const { error: statusError } = await supabase
      .from('mx_shipping_instruction')
      .update({ status: 'shipped' })
      .eq('id', shippingInstructionId);
    if (statusError) throw statusError;

    // 4. receiving_items의 location_code를 null로 업데이트 (Container 단위)
    console.log('Fetching shipping_instruction_items for id:', shippingInstructionId);
    const { data: shippedItems, error: shippedItemsError } = await supabase
      .from('mx_shipping_instruction_items')
      .select('container_no')
      .eq('shipping_instruction_id', shippingInstructionId);
    if (shippedItemsError) {
      console.error('Error fetching shipping_instruction_items:', shippedItemsError);
      throw shippedItemsError;
    }
    console.log('Found shipping_instruction_items:', shippedItems);
    
    const shippedContainerNos = (shippedItems || []).map(i => i.container_no).filter(Boolean);
    console.log('Filtered container_nos to update:', shippedContainerNos);
    
    if (shippedContainerNos.length > 0) {
      // Container 단위: container_no로 receiving_items의 location_code를 null로 업데이트
      console.log('Updating receiving_items with container_nos:', shippedContainerNos);
      const { data: updateData, error: updateLocError } = await supabase
        .from('mx_receiving_items')
        .update({ location_code: null })
        .in('container_no', shippedContainerNos)
        .select();
      if (updateLocError) {
        console.error('Error updating receiving_items:', updateLocError);
        throw updateLocError;
      }
      console.log('Updated receiving_items:', updateData);
    } else {
      // shipping_instruction_items에 container_no가 없는 경우, shipping_instruction의 container_no로 업데이트
      console.log('No container_nos found in shipping_instruction_items, using shipping_instruction container_no:', si.container_no);
      if (si.container_no) {
        const { data: updateData, error: updateLocError } = await supabase
          .from('mx_receiving_items')
          .update({ location_code: null })
          .eq('container_no', si.container_no)
          .select();
        if (updateLocError) {
          console.error('Error updating receiving_items with container_no:', updateLocError);
          throw updateLocError;
        }
        console.log('Updated receiving_items with container_no:', updateData);
      } else {
        console.log('No container_no found to update');
      }
    }

    // 모달 닫기
    if (confirmShippingModal) {
      confirmShippingModal.classList.add('hidden');
    }
    currentConfirmShippingId = null;
    
    alert('출하가 확정되었습니다.');
    loadMatchingList();
    // LOCATION VIEW 자동 새로고침
    try {
      if (window.location.hash === '#location' || window.location.pathname.includes('location_view')) {
        window.location.reload();
      } else if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'refreshLocationView' }, '*');
      }
    } catch (e) {
      console.error('Error refreshing location view:', e);
    }
  } catch (e) {
    console.error('Error confirming shipping:', e);
    alert('출하 확정 처리 실패: ' + e.message);
  }
}

// 출하 취소 함수 (원복)
window.cancelShipping = async function(shippingInstructionId) {
  if (!confirm(formatMessage('msg_confirm_cancel'))) return;
  
  try {
    // 1. shipping_instruction의 container_no와 location_code 가져오기
    const { data: si, error: siError } = await supabase
      .from('mx_shipping_instruction')
      .select('container_no, location_code')
      .eq('id', shippingInstructionId)
      .single();
    if (siError) throw siError;

    // 2. shipping_instruction_items의 container_no 목록 가져오기
    const { data: shippedItems, error: shippedItemsError } = await supabase
      .from('mx_shipping_instruction_items')
      .select('container_no')
      .eq('shipping_instruction_id', shippingInstructionId);
    if (shippedItemsError) throw shippedItemsError;

    const containerNos = (shippedItems || []).map(i => i.container_no).filter(Boolean);
    if (containerNos.length === 0 && si.container_no) {
      containerNos.push(si.container_no);
    }

    // 3. shipping_instruction_items의 shipped_at을 null로 변경
    const { error: updateItemsError } = await supabase
      .from('mx_shipping_instruction_items')
      .update({ shipped_at: null })
      .eq('shipping_instruction_id', shippingInstructionId);
    if (updateItemsError) throw updateItemsError;

    // 4. shipping_instruction 상태를 pending으로 변경
    const { error: statusError } = await supabase
      .from('mx_shipping_instruction')
      .update({ status: 'pending' })
      .eq('id', shippingInstructionId);
    if (statusError) throw statusError;

    // 5. receiving_items의 location_code 복원 (원래 location_code로 복원)
    // 주의: 원래 location_code를 저장하지 않으므로, shipping_instruction의 location_code를 사용
    if (containerNos.length > 0 && si.location_code) {
      const { error: restoreLocError } = await supabase
        .from('mx_receiving_items')
        .update({ location_code: si.location_code })
        .in('container_no', containerNos);
      if (restoreLocError) {
        console.error('Error restoring location_code:', restoreLocError);
        // 위치 복원 실패해도 취소는 성공으로 처리
      }
    }

    alert(formatMessage('msg_cancel_success'));
    loadMatchingList(); // 목록 새로고침
    
    // LOCATION VIEW 자동 새로고침
    try {
      if (window.location.hash === '#location' || window.location.pathname.includes('location_view')) {
        window.location.reload();
      } else if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'refreshLocationView' }, '*');
      }
    } catch (e) {
      console.error('Error refreshing location view:', e);
    }
  } catch (error) {
    console.error('Error cancelling shipping:', error);
    alert(formatMessage('msg_cancel_error', { error: error.message }));
  }
};

// 출하 지시서 삭제 함수 (출하 확정되지 않은 항목만 삭제 가능)
window.deleteShipping = async function(shippingInstructionId) {
  // 출하 확정된 항목은 삭제 불가
  try {
    const { data: si, error: checkError } = await supabase
      .from('mx_shipping_instruction')
      .select('status')
      .eq('id', shippingInstructionId)
      .single();
    
    if (checkError) throw checkError;
    
    if (si.status === 'shipped') {
      alert('출하 확정된 항목은 삭제할 수 없습니다. 출하 취소를 사용해주세요.');
      return;
    }
  } catch (error) {
    console.error('Error checking shipping status:', error);
    alert('출하 지시서 상태 확인 중 오류가 발생했습니다.');
    return;
  }

  if (!confirm(formatMessage('msg_confirm_delete'))) return;
  
  try {
    // 1. shipping_instruction_items 삭제
    const { error: itemsError } = await supabase
      .from('mx_shipping_instruction_items')
      .delete()
      .eq('shipping_instruction_id', shippingInstructionId);
    
    if (itemsError) throw itemsError;

    // 2. shipping_instruction 삭제
    const { error: siError } = await supabase
      .from('mx_shipping_instruction')
      .delete()
      .eq('id', shippingInstructionId);
    
    if (siError) throw siError;

    alert(formatMessage('msg_delete_success'));
    loadMatchingList(); // 목록 새로고침
    
    // LOCATION VIEW 자동 새로고침
    try {
      if (window.location.hash === '#location' || window.location.pathname.includes('location_view')) {
        window.location.reload();
      } else if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'refreshLocationView' }, '*');
      }
    } catch (e) {
      console.error('Error refreshing location view:', e);
    }
  } catch (error) {
    console.error('Error deleting shipping:', error);
    alert(formatMessage('msg_delete_error', { error: error.message }));
  }
};

// 언어 변경 이벤트 리스너
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang')));
    });
    setLang(currentLang);
  });
}

// 섹션 초기화
export function initSection() {
  initializeElements();
  setupEventListeners();
  initializeConfirmShippingModal();
  loadMatchingList();
}

// 모달 내 텍스트도 언어 변경 시 반영
function updateModalTexts() {
  const modalTitle = document.querySelector('#matchingModal [data-i18n="modal_title_confirm_matching"]');
  if (modalTitle) modalTitle.textContent = formatMessage('modal_title_confirm_matching');
  const cancelBtn = document.getElementById('cancelMatchingBtn');
  if (cancelBtn) cancelBtn.textContent = formatMessage('btn_cancel');
  const confirmBtn = document.getElementById('confirmMatchingBtn');
  if (confirmBtn) confirmBtn.textContent = formatMessage('btn_confirm');
} 