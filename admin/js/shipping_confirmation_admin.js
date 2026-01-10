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
    let query = supabase
      .from('shipping_instruction_items')
      .select(`
        *,
        shipping_instruction (
          id,
          barcode,
          shipping_date,
          part_no,
          qty,
          status,
          container_no,
          part_quantities
        )
      `)
      .order('created_at', { ascending: false });

    // 검색 조건 값
    const statusVal = filterStatus ? filterStatus.value : '';
    const dateVal = filterDate ? filterDate.value : '';
    const partNoSearchEl = document.getElementById('partNoSearch');
    const minQtyEl = document.getElementById('minQty');
    const maxQtyEl = document.getElementById('maxQty');
    const partNoSearch = partNoSearchEl ? partNoSearchEl.value.trim() : '';
    const minQty = minQtyEl ? minQtyEl.value : '';
    const maxQty = maxQtyEl ? maxQtyEl.value : '';

    const { data: items, error } = await query;
    if (error) throw error;

    // JS에서 한 번 더 후처리 필터링
    let filtered = (items || []).filter(item => {
      const si = item.shipping_instruction;
      if (!si) return false;
      if (statusVal && si.status !== statusVal) return false;
      if (dateVal && si.shipping_date !== dateVal) return false;
      
      // part_quantities가 있는 경우 해당 파트들 중 하나라도 검색어와 일치하는지 확인
      if (partNoSearch) {
        let hasMatchingPart = false;
        if (si.part_quantities) {
          try {
            const partQuantities = JSON.parse(si.part_quantities);
            hasMatchingPart = Object.keys(partQuantities).some(part => 
              part.toLowerCase().includes(partNoSearch.toLowerCase())
            );
          } catch (e) {
            console.error('Error parsing part_quantities:', e);
          }
        }
        // 기존 part_no도 확인
        if (!hasMatchingPart && !si.part_no?.toLowerCase().includes(partNoSearch.toLowerCase())) {
          return false;
        }
      }
      
      if (minQty && item.qty < Number(minQty)) return false;
      if (maxQty && item.qty > Number(maxQty)) return false;
      return true;
    });

    // 검색 결과 통계 계산 (필터링된 결과 기준)
    const stats = calculateSearchStats(filtered);

    // UI 업데이트 (필터링된 결과 기준)
    updateSearchStats(stats);
    updateMatchingList(filtered);
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
  
  return {
    total: groupedArray.length,
    shipped: groupedArray.filter(group => group.shipping_instruction.status === 'shipped').length,
    pending: groupedArray.filter(group => group.shipping_instruction.status === 'pending').length,
    totalQty: groupedArray.reduce((sum, group) => {
      const si = group.shipping_instruction;
      let qty = si.qty || 0;
      
      // part_quantities가 있는 경우 총 수량 계산
      if (si.part_quantities) {
        try {
          const partQuantities = JSON.parse(si.part_quantities);
          qty = Object.values(partQuantities).reduce((partSum, partQty) => partSum + partQty, 0);
        } catch (e) {
          console.error('Error parsing part_quantities:', e);
        }
      }
      
      return sum + qty;
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
        <td colspan="7" class="px-4 py-8 text-center text-gray-500">
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
    
    // part_quantities 파싱
    let partQuantities = {};
    if (si.part_quantities) {
      try {
        partQuantities = JSON.parse(si.part_quantities);
      } catch (e) {
        console.error('Error parsing part_quantities:', e);
      }
    }
    
    // 파트 정보 생성
    let partDisplay = si.part_no || '-';
    if (Object.keys(partQuantities).length > 0) {
      // 여러 파트가 있는 경우
      partDisplay = Object.entries(partQuantities)
        .map(([partNo, qty]) => `${partNo}(${qty})`)
        .join(', ');
    }
    
    // 수량 정보 생성
    let qtyDisplay = si.qty || '-';
    if (Object.keys(partQuantities).length > 0) {
      // 여러 파트가 있는 경우 총 수량 표시
      const totalQty = Object.values(partQuantities).reduce((sum, qty) => sum + qty, 0);
      qtyDisplay = totalQty;
    }
    
    const tr = document.createElement('tr');
    tr.className = 'border-t hover:bg-gray-50';
    tr.innerHTML = `
      <td class="px-4 py-2 border">${si.container_no || '-'}</td>
      <td class="px-4 py-2 border">${si.shipping_date || '-'}</td>
      <td class="px-4 py-2 border">${partDisplay}</td>
      <td class="px-4 py-2 border">${qtyDisplay}</td>
      <td class="px-4 py-2 border">
        <span class="px-2 py-1 rounded-full text-sm ${
          si.status === 'shipped'
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
        }">
          ${si.status === 'shipped' ? formatMessage('msg_status_shipped') : formatMessage('msg_status_pending')}
        </span>
      </td>
      <td class="px-4 py-2 border">${items[0]?.shipped_at || '-'}</td>
      <td class="px-4 py-2 border">
        <div class="flex gap-2">
          ${si.status !== 'shipped'
            ? `<button class="text-blue-600 hover:text-blue-800" onclick="printShippingLabel('${si.barcode}')">${formatMessage('msg_label_print')}</button>
               <button class="text-red-600 hover:text-red-800" onclick="window.confirmShipping('${si.id}')">${formatMessage('msg_confirm_shipping')}</button>`
            : `<span class="text-green-600">${formatMessage('msg_done')}</span>`}
          <button class="text-gray-600 hover:text-gray-800" onclick="window.deleteShipping('${si.id}')">${formatMessage('msg_delete_shipping')}</button>
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
  if (document.getElementById('partNoSearch')) document.getElementById('partNoSearch').value = '';
  if (document.getElementById('minQty')) document.getElementById('minQty').value = '';
  if (document.getElementById('maxQty')) document.getElementById('maxQty').value = '';
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

  // 매칭 기준: container_no === label_id
  if (shippingInstruction.container_no !== item.label_id) {
    alert(formatMessage('msg_match_fail'));
    return;
  }

  try {
    // 1. shipping_instruction_items에 매칭 정보 저장
    const { error: matchError } = await supabase
      .from('shipping_instruction_items')
      .insert({
        shipping_instruction_id: shippingInstruction.id,
        label_id: item.label_id,
        qty: item.quantity,
        shipped_at: shippingInstruction.shipping_date // 출고 예정일을 출고일로 사용
      });

    if (matchError) throw matchError;

    // 2. shipping_instruction 상태 업데이트
    const { error: updateError } = await supabase
      .from('shipping_instruction')
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
      .from('shipping_instruction')
      .select('*')
      .eq('barcode', barcode)
      .single();

    if (error) throw error;
    if (!shipping) {
      alert('출하증을 찾을 수 없습니다.');
      return;
    }

    // 라벨 출력 로직 (기존 printShippingLabel 함수 재사용)
    const now = new Date();
    const dateStr = now.toISOString().slice(0,10).replace(/-/g,'.');
    const timeStr = now.toTimeString().slice(0,5);
    const bolNo = shipping.barcode;
    const model = shipping.part_no || '-';
    const description = shipping.description || '-';
    const remarks = shipping.remarks || '-';
    const location = shipping.location_code || '-';
    
    // 파트별 수량 정보 파싱
    let partQuantities = {};
    if (shipping.part_quantities) {
      try {
        partQuantities = JSON.parse(shipping.part_quantities);
      } catch (e) {
        console.error('Error parsing part_quantities:', e);
      }
    }

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
            <td>Hyundai Transys <br> 6801 Kia Pkwy, West Point, GA 31833</td>
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
          ${Object.entries(partQuantities).map(([partNo, qty], index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${partNo}</td>
              <td>${description}</td>
              <td>${qty}</td>
              <td>EA</td>
              <td>${location}</td>
              <td>${remarks}</td>
            </tr>
          `).join('')}
          ${Object.keys(partQuantities).length === 0 ? `
            <tr>
              <td>1</td>
              <td>${model}</td>
              <td>${description}</td>
              <td>${shipping.qty}</td>
              <td>EA</td>
              <td>${location}</td>
              <td>${remarks}</td>
            </tr>
          ` : ''}
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
            <div style='font-size:16px;'>TOTAL Pieces: ${shipping.qty} EA</div>
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

// 출하 확정(관리자) 함수
window.confirmShipping = async function(shippingInstructionId) {
  if (!confirm('정말로 출하를 확정하시겠습니까?')) return;
  try {
    // 1. shipping_instruction의 shipping_date 가져오기
    const { data: si, error: siError } = await supabase
      .from('shipping_instruction')
      .select('shipping_date, label_id, container_no')
      .eq('id', shippingInstructionId)
      .single();
    if (siError) throw siError;

    // 2. shipping_instruction_items의 shipped_at 업데이트
    const shippedAt = si?.shipping_date || new Date().toISOString().slice(0, 10);
    console.log('Updating shipped_at to:', shippedAt); // 디버깅용

    const { data: updateData, error: updateError } = await supabase
      .from('shipping_instruction_items')
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
      .from('shipping_instruction')
      .update({ status: 'shipped' })
      .eq('id', shippingInstructionId);
    if (statusError) throw statusError;

    // 4. receiving_items의 location_code를 null로 업데이트
    // 4.1 shipping_instruction의 label_id가 있으면 해당 항목만 업데이트 (단일 라벨인 경우)
    if (si.label_id) {
      console.log('Using shipping_instruction label_id:', si.label_id);
      const { data: updateData, error: updateLocError } = await supabase
        .from('receiving_items')
        .update({ location_code: null })
        .eq('label_id', si.label_id)
        .select();
      if (updateLocError) {
        console.error('Error updating receiving_items with si.label_id:', updateLocError);
        throw updateLocError;
      }
      console.log('Updated receiving_items with si.label_id:', updateData);
    } else {
      // 4.2 shipping_instruction_items의 모든 label_id들로 업데이트 (여러 파트인 경우)
      console.log('Fetching shipping_instruction_items for id:', shippingInstructionId);
      const { data: shippedItems, error: shippedItemsError } = await supabase
        .from('shipping_instruction_items')
        .select('label_id')
        .eq('shipping_instruction_id', shippingInstructionId);
      if (shippedItemsError) {
        console.error('Error fetching shipping_instruction_items:', shippedItemsError);
        throw shippedItemsError;
      }
      console.log('Found shipping_instruction_items:', shippedItems);
      
      const shippedLabelIds = (shippedItems || []).map(i => i.label_id).filter(Boolean);
      console.log('Filtered label_ids to update:', shippedLabelIds);
      
      if (shippedLabelIds.length > 0) {
        // CKD PALLET인 경우 수량 차감 처리
        const { data: siInfo } = await supabase
          .from('shipping_instruction')
          .select('part_no')
          .eq('id', shippingInstructionId)
          .single();
        
        if (siInfo && siInfo.part_no === 'CKD PALLET') {
          // CKD PALLET: receiving_items에서 수량 차감 (FIFO)
          console.log('Processing CKD PALLET shipping confirmation');
          
          // shipping_instruction_items에서 label_id와 qty 가져오기
          const { data: itemsWithQty, error: itemsQtyError } = await supabase
            .from('shipping_instruction_items')
            .select('label_id, qty')
            .eq('shipping_instruction_id', shippingInstructionId);
          
          if (itemsQtyError) throw itemsQtyError;
          
          // receiving_log에 기록된 label_id 조회 (실제 입고 처리된 것만)
          const { data: logs, error: logError } = await supabase
            .from('receiving_log')
            .select('label_id');
          
          if (logError) throw logError;
          
          const receivedLabelIds = new Set((logs || []).map(l => String(l.label_id)));
          
          // 각 label_id에 대해 receiving_items에서 수량 차감 (receiving_log에 기록된 것만)
          for (const item of itemsWithQty || []) {
            if (!item.label_id || !item.qty) continue;
            
            // receiving_log에 기록되지 않은 항목은 스킵
            if (!receivedLabelIds.has(String(item.label_id))) {
              console.log(`Skipping label_id ${item.label_id} - not in receiving_log`);
              continue;
            }
            
            const { data: receivingItem, error: recError } = await supabase
              .from('receiving_items')
              .select('id, quantity')
              .eq('label_id', item.label_id)
              .single();
            
            if (recError || !receivingItem) continue;
            
            const currentQty = receivingItem.quantity || 0;
            const shippingQty = item.qty || 0;
            
            if (currentQty <= shippingQty) {
              // 전체 차감 (삭제)
              await supabase
                .from('receiving_items')
                .delete()
                .eq('id', receivingItem.id);
            } else {
              // 부분 차감 (수량 업데이트)
              await supabase
                .from('receiving_items')
                .update({ quantity: currentQty - shippingQty })
                .eq('id', receivingItem.id);
            }
          }
        } else {
          // 일반 품목: location_code를 null로 업데이트
          console.log('Updating receiving_items with label_ids:', shippedLabelIds);
          const { data: updateData, error: updateLocError } = await supabase
            .from('receiving_items')
            .update({ location_code: null })
            .in('label_id', shippedLabelIds)
            .select();
          if (updateLocError) {
            console.error('Error updating receiving_items:', updateLocError);
            throw updateLocError;
          }
          console.log('Updated receiving_items:', updateData);
        }
      } else {
        // 4.3 shipping_instruction_items에 label_id가 없는 경우, container_no로 업데이트
        console.log('No label_ids found in shipping_instruction_items, using container_no:', si.container_no);
        if (si.container_no) {
          const { data: updateData, error: updateLocError } = await supabase
            .from('receiving_items')
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
    }

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

// 출하 지시서 삭제 함수
window.deleteShipping = async function(shippingInstructionId) {
  if (!confirm(formatMessage('msg_confirm_delete'))) return;
  
  try {
    // 1. shipping_instruction_items 삭제
    const { error: itemsError } = await supabase
      .from('shipping_instruction_items')
      .delete()
      .eq('shipping_instruction_id', shippingInstructionId);
    
    if (itemsError) throw itemsError;

    // 2. shipping_instruction 삭제
    const { error: siError } = await supabase
      .from('shipping_instruction')
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