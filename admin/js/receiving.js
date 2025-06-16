console.log('window.supabase:', window.supabase);
console.log('typeof window.supabase:', typeof window.supabase);

console.log('Initializing receiving.js...');

// supabase는 window.supabase로 사용
// const supabase = window.supabase; // 이 줄은 제거
console.log('Supabase client initialized');

// Global state
let isInitialized = false;
let currentPlans = [];
let currentItems = new Map();
let pendingForceReceive = null; // Store pending force receive data
let isMessageShowing = false; // Track if message modal is currently showing

// i18n 객체 확장
const i18n = {
  ko: {
    // 기존 키
    label_location: '위치',
    label_receiving_place: '입고처',
    label_receive_date: '예정 입고일',
    label_items: '입고 품목',
    btn_add_item: '+ 품목 추가',
    btn_confirm: '확인',
    btn_cancel: '취소',
    
    // HTML에서 추가된 키
    title_receiving_plan: '입고 계획',
    title_receiving_plan_registration: '입고 계획 등록',
    lang_ko: '한국어',
    lang_en: 'English',
    label_receiving_type: '입고 유형',
    option_all: '전체',
    option_container: '컨테이너',
    option_trailer: '트레일러',
    label_container_no: '컨테이너 번호',
    ph_container_no: '예: C123456',
    label_part_no: '품번',
    ph_part_no: '예: 4HH1',
    label_status: '상태',
    option_received: '입고 완료',
    option_not_received: '미입고',
    label_start_date: '시작일',
    label_end_date: '종료일',
    btn_search_plan: '계획 검색',
    btn_add_new_plan: '+ 새 계획 추가',
    btn_print: '인쇄',
    th_date: '날짜',
    th_type: '유형',
    th_container_no: '컨테이너 번호',
    th_location: '위치',
    th_from: '출처',
    th_part_no: '품번',
    th_qty: '수량',
    th_status: '상태',
    th_receiving_date: '입고일',
    th_delete: '삭제',
    th_force_receive: '강제 입고',
    title_add_new_receiving_plan: '새 입고 계획 추가',
    ph_location: '예: A1',
    ph_receiving_place: '예: 메인 창고',
    modal_force_receive_title: '강제 입고 날짜 선택',
    modal_message_title: '알림',

    // 동적 메시지
    msg_loading_plans: '입고 계획을 조회중입니다...',
    msg_no_plans: '해당 기간의 입고 계획이 없습니다',
    msg_error_loading: '데이터를 불러오는 중 오류가 발생했습니다',
    msg_select_date: '시작일과 종료일을 모두 선택해주세요.',
    msg_enter_all_fields: '모든 필드를 입력해주세요.',
    msg_receiving_complete: '입고가 성공적으로 완료되었습니다.',
    msg_error_processing: '입고 처리 중 오류가 발생했습니다.',
    msg_force_receive_complete: '강제 입고 완료',
    msg_success_count: '성공: {count}건',
    msg_fail_count: '실패: {count}건',
    msg_confirm_delete: '이 기록을 삭제하시겠습니까?',
    msg_error_delete: '삭제 중 오류 발생: {error}',
    msg_select_rows: '출력할 행을 선택하세요.',
    msg_print_error: '출력 중 오류가 발생했습니다.',
    msg_saved: '저장되었습니다!',
    msg_save_error: '저장 실패: {error}',
    msg_enter_parts_qty: '모든 품번과 수량을 입력하세요.',
    msg_auto_generated: '자동생성',
  },
  en: {
    // 기존 키
    label_location: 'Location',
    label_receiving_place: 'Receiving Place',
    label_receive_date: 'Planned Receiving Date',
    label_items: 'Receiving Items',
    btn_add_item: '+ Add Item',
    btn_confirm: 'Confirm',
    btn_cancel: 'Cancel',
    
    // HTML에서 추가된 키
    title_receiving_plan: 'Receiving Plan',
    title_receiving_plan_registration: 'Receiving Plan Registration',
    lang_ko: '한국어',
    lang_en: 'English',
    label_receiving_type: 'Receiving Type',
    option_all: 'All',
    option_container: 'Container',
    option_trailer: 'Trailer',
    label_container_no: 'Container No.',
    ph_container_no: 'e.g., C123456',
    label_part_no: 'Part No.',
    ph_part_no: 'e.g., 4HH1',
    label_status: 'Status',
    option_received: 'Received',
    option_not_received: 'Not Received',
    label_start_date: 'Start Date',
    label_end_date: 'End Date',
    btn_search_plan: 'Search Plan',
    btn_add_new_plan: '+ Add New Plan',
    btn_print: 'Print',
    th_date: 'Date',
    th_type: 'Type',
    th_container_no: 'Container No.',
    th_location: 'Location',
    th_from: 'From',
    th_part_no: 'Part No.',
    th_qty: 'Qty',
    th_status: 'Status',
    th_receiving_date: 'Receiving Date',
    th_delete: 'Delete',
    th_force_receive: 'Force Receive',
    title_add_new_receiving_plan: 'Add New Receiving Plan',
    ph_location: 'e.g., A1',
    ph_receiving_place: 'e.g., Main Warehouse',
    modal_force_receive_title: 'Select Force Receive Date',
    modal_message_title: 'Notification',

    // 동적 메시지
    msg_loading_plans: 'Loading receiving plans...',
    msg_no_plans: 'No receiving plans for the selected period',
    msg_error_loading: 'Error loading data',
    msg_select_date: 'Please select both start and end dates.',
    msg_enter_all_fields: 'Please enter all fields.',
    msg_receiving_complete: 'Receiving completed successfully.',
    msg_error_processing: 'Error processing receiving.',
    msg_force_receive_complete: 'Force Receive Complete',
    msg_success_count: 'Success: {count}',
    msg_fail_count: 'Failed: {count}',
    msg_confirm_delete: 'Are you sure you want to delete this record?',
    msg_error_delete: 'Error deleting record: {error}',
    msg_select_rows: 'Please select rows to print.',
    msg_print_error: 'Error occurred while printing.',
    msg_saved: 'Saved!',
    msg_save_error: 'Save failed: {error}',
    msg_enter_parts_qty: 'Please enter all part numbers and quantities.',
    msg_auto_generated: 'Auto-generated',
  }
};

// 현재 언어 설정
let currentLang = localStorage.getItem('admin_receiving_lang') || 'ko';

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
  localStorage.setItem('admin_receiving_lang', lang);
}

// 메시지 포맷팅 함수
function formatMessage(key, params = {}) {
  let message = i18n[currentLang][key] || key;
  Object.entries(params).forEach(([key, value]) => {
    message = message.replace(`{${key}}`, value);
  });
  return message;
}

// DOM Elements
let addPlanForm, addNewPlanBtn, addItemBtn, itemList, submitPlanBtn, searchPlanBtn, planListBody;
const containerNoInput = document.getElementById('containerNo')
const partNoInput = document.getElementById('partNo')
const quantityInput = document.getElementById('quantity')
const locationInput = document.getElementById('location')
const forceReceivingButton = document.getElementById('forceReceivingButton')
const refreshButton = document.getElementById('refreshButton')
const exportButton = document.getElementById('exportButton')
const forceReceiveModal = document.getElementById('forceReceiveModal')
const forceReceiveDate = document.getElementById('forceReceiveDate')
const confirmForceReceive = document.getElementById('confirmForceReceive')
const cancelForceReceive = document.getElementById('cancelForceReceive')
const messageModal = document.getElementById('messageModal')
const messageTitle = document.getElementById('messageTitle')
const messageContent = document.getElementById('messageContent')
const messageConfirm = document.getElementById('messageConfirm')

// Show message modal
function showMessage(title, content) {
  if (isMessageShowing) return;
  
  isMessageShowing = true;
  messageTitle.textContent = title;
  messageContent.textContent = content;
  messageModal.classList.remove('hidden');
}

// Initialize DOM elements
function initializeElements() {
  console.log('Initializing DOM elements...');
  
  addPlanForm = document.getElementById("addPlanForm");
  addNewPlanBtn = document.getElementById("addNewPlanBtn");
  addItemBtn = document.getElementById("addItemBtn");
  itemList = document.getElementById("itemList");
  submitPlanBtn = document.getElementById("submitPlanBtn");
  searchPlanBtn = document.getElementById("searchPlanBtn");
  planListBody = document.getElementById("planListBody");

  // 각 요소 존재 여부 로깅
  console.log('DOM Elements initialized:', {
    addPlanForm: !!addPlanForm,
    addNewPlanBtn: !!addNewPlanBtn,
    addItemBtn: !!addItemBtn,
    itemList: !!itemList,
    submitPlanBtn: !!submitPlanBtn,
    searchPlanBtn: !!searchPlanBtn,
    planListBody: !!planListBody
  });

  if (!planListBody) {
    console.error('planListBody not found');
    return false;
  }
  return true;
}

// Remove all event listeners
function cleanupEventListeners() {
  console.log('Cleaning up event listeners...');
  
  // 모든 버튼의 이벤트 리스너 제거
  const buttons = [
    addNewPlanBtn,
    addItemBtn,
    submitPlanBtn,
    searchPlanBtn
  ];

  buttons.forEach(btn => {
    if (btn) {
      const newBtn = btn.cloneNode(true);
      btn.parentNode?.replaceChild(newBtn, btn);
      console.log(`Replaced button: ${btn.id || 'unnamed'}`);
    }
  });

  // 전역 변수 업데이트
  addNewPlanBtn = document.getElementById("addNewPlanBtn");
  addItemBtn = document.getElementById("addItemBtn");
  submitPlanBtn = document.getElementById("submitPlanBtn");
  searchPlanBtn = document.getElementById("searchPlanBtn");
}

// Initialize event listeners
function initializeEventListeners() {
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded 이벤트 발생');
    
    const autoLocationCheckbox = document.getElementById('autoLocationCheckbox');
    const locationInput = document.getElementById('locationInput');
    const autoLocDiv = document.getElementById('autoLocationInfo');

    console.log('초기 요소 상태:', {
      autoLocationCheckbox: autoLocationCheckbox ? '존재' : '없음',
      locationInput: locationInput ? '존재' : '없음',
      autoLocDiv: autoLocDiv ? '존재' : '없음'
    });

    if (autoLocationCheckbox && locationInput) {
      // 초기 상태 설정
      locationInput.placeholder = 'e.g., A1';
      locationInput.readOnly = false;
      console.log('초기 상태 설정 완료');

      autoLocationCheckbox.addEventListener('change', async function(e) {
        console.log('체크박스 상태 변경:', {
          checked: e.target.checked,
          timestamp: new Date().toISOString()
        });

        if (e.target.checked) {
          console.log('자동 위치 할당 모드 시작');
          // 체크 시: 자동 위치 할당 모드
          locationInput.readOnly = true;
          locationInput.value = '';
          locationInput.placeholder = '자동 할당 중...';
          console.log('입력란 상태 변경:', {
            readonly: locationInput.readOnly,
            value: locationInput.value,
            placeholder: locationInput.placeholder
          });
          
          try {
            console.log('getRandomAvailableLocation 호출 시작');
            const loc = await getRandomAvailableLocation();
            console.log('getRandomAvailableLocation 결과:', loc);
            
            if (loc) {
              console.log('위치 할당 성공:', loc);
              // 위치 할당 성공
              locationInput.value = loc;
              locationInput.placeholder = '자동 할당됨';
              if (autoLocDiv) {
                autoLocDiv.textContent = `자동 할당 위치: ${loc}`;
                autoLocDiv.classList.remove('text-red-600');
                autoLocDiv.classList.add('text-green-700');
              }
              console.log('위치 할당 UI 업데이트 완료');
            } else {
              console.log('사용 가능한 위치 없음');
              // 사용 가능한 위치 없음
              locationInput.value = '';
              locationInput.placeholder = '사용 가능한 위치 없음';
              if (autoLocDiv) {
                autoLocDiv.textContent = '사용 가능한 위치가 없습니다!';
                autoLocDiv.classList.remove('text-green-700');
                autoLocDiv.classList.add('text-red-600');
              }
              console.log('위치 없음 UI 업데이트 완료');
            }
          } catch (error) {
            console.error('위치 할당 중 오류 발생:', error);
            locationInput.value = '';
            locationInput.placeholder = '오류 발생';
            if (autoLocDiv) {
              autoLocDiv.textContent = '위치 할당 중 오류가 발생했습니다.';
              autoLocDiv.classList.add('text-red-600');
            }
            console.log('오류 상태 UI 업데이트 완료');
          }
        } else {
          console.log('수동 입력 모드로 전환');
          // 체크 해제 시: 수동 입력 모드
          locationInput.readOnly = false;
          locationInput.value = '';
          locationInput.placeholder = 'e.g., A1';
          if (autoLocDiv) {
            autoLocDiv.textContent = '';
          }
          console.log('수동 입력 모드 UI 업데이트 완료');
        }
      });
      console.log('체크박스 이벤트 리스너 등록 완료');
    } else {
      console.error('필요한 DOM 요소를 찾을 수 없음:', {
        autoLocationCheckbox: !autoLocationCheckbox,
        locationInput: !locationInput
      });
    }

    // Add New Plan 버튼 클릭 시 초기화
    if (addNewPlanBtn) {
      addNewPlanBtn.addEventListener('click', () => {
        console.log('Add New Plan 버튼 클릭');
        addPlanForm = document.getElementById("addPlanForm");
        if (locationInput) {
          locationInput.value = '';
          locationInput.placeholder = 'e.g., A1';
          locationInput.readOnly = false;
          if (autoLocDiv) autoLocDiv.textContent = '';
          if (autoLocationCheckbox) autoLocationCheckbox.checked = false;
          console.log('위치 입력란 초기화 완료');
        }
        if (addPlanForm) {
          addPlanForm.classList.remove('hidden');
          renderPlanFormButton();
          console.log('폼 표시 및 버튼 렌더링 완료');
        }
      });
    }

    if (addItemBtn) {
      addItemBtn.addEventListener('click', () => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'grid grid-cols-2 gap-4';
        itemDiv.innerHTML = `
          <input type="text" placeholder="Part No." class="part-input border rounded px-3 py-2" />
          <input type="number" placeholder="Quantity" class="qty-input border rounded px-3 py-2" />
        `;
        itemList.appendChild(itemDiv);
      });
    }

    // 최초 입력란에도 class 추가 (이미 있다면 중복 추가 X)
    if (itemList) {
      const inputs = itemList.querySelectorAll('input');
      if (inputs.length === 2) {
        inputs[0].classList.add('part-input');
        inputs[1].classList.add('qty-input');
      }
    }

    if (submitPlanBtn) {
      submitPlanBtn.addEventListener('click', async () => {
        console.log('Submit Plan button CLICKED'); // 디버깅용 로그
        console.log('submitPlanBtn:', submitPlanBtn);
        const type = document.getElementById("typeSelect").value;
        let container = document.getElementById("containerInput").value.trim();
        const location = document.getElementById("locationInput").value.trim();
        const receivingPlace = document.getElementById("receivingPlaceInput")?.value.trim() || '';
        const receiveDate = document.getElementById("receiveDateInput").value;
        const parts = Array.from(document.querySelectorAll(".part-input")).map(el => el.value.trim());
        const qtys = Array.from(document.querySelectorAll(".qty-input")).map(el => parseInt(el.value));

        // 입력값 검증
        if (parts.length === 0 || qtys.length === 0 || parts.some(p => !p) || qtys.some(q => !q || isNaN(q))) {
          alert('모든 품번과 수량을 입력하세요.');
          return;
        }

        if (type === 'trailer') {
          // 1. Plan 저장 (trailer_seq 자동 생성)
          const { data: planData, error: planError } = await window.supabase
            .from('receiving_plan')
            .insert({
              type,
              receive_date: receiveDate,
            })
            .select('id, trailer_seq')
            .single();
          if (planError) {
            alert('Plan 저장 실패: ' + planError.message);
            return;
          }
          const planId = planData.id;
          // 5자리 패딩
          const trailerNo = `T-${String(planData.trailer_seq).padStart(5, '0')}`;
          // 2. Plan의 container_no 업데이트
          await window.supabase
            .from('receiving_plan')
            .update({ container_no: trailerNo })
            .eq('id', planId);
          // 3. Items 저장
          const items = [];
          for (let i = 0; i < parts.length; i++) {
            items.push({
              plan_id: planId,
              part_no: parts[i],
              quantity: qtys[i],
              location_code: location,
              label_id: crypto.randomUUID(),
              container_no: trailerNo,
              receiving_place: receivingPlace,
            });
          }
          const { error: itemsError } = await window.supabase.from('receiving_items').insert(items);
          if (itemsError) {
            alert('Items 저장 실패: ' + itemsError.message);
            return;
          }
          alert('Saved!');
          addPlanForm.classList.add("hidden");
          itemList.innerHTML = "";
          containerInput.value = trailerNo; // 실제 부여된 번호를 입력란에 표시
          loadPlans();
        } else {
          // 컨테이너는 기존 방식(직접 입력/수정)
          try {
            // 1. Plan 저장
            const { data: planData, error: planError } = await window.supabase
              .from('receiving_plan')
              .insert({
                type,
                container_no: container,
                receive_date: receiveDate,
              })
              .select('id, trailer_seq')
              .single();
            if (planError) throw planError;
            const planId = planData.id;
            // 2. Items 저장
            const items = [];
            for (let i = 0; i < parts.length; i++) {
              items.push({
                plan_id: planId,
                part_no: parts[i],
                quantity: qtys[i],
                location_code: location,
                label_id: crypto.randomUUID(),
                container_no: container,
                receiving_place: receivingPlace,
              });
            }
            const { error: itemsError } = await window.supabase.from('receiving_items').insert(items);
            if (itemsError) throw itemsError;
            alert('Saved!');
            addPlanForm.classList.add("hidden");
            itemList.innerHTML = "";
            loadPlans();
          } catch (error) {
            console.error('Error:', error);
            alert('수정 실패: ' + error.message);
          }
        }
      });
    }

    if (searchPlanBtn) {
      searchPlanBtn.addEventListener('click', () => loadPlans(true));
    }

    // 프린트 버튼 초기화 함수
    initializePrintButton();

    // Event Listeners
    if (forceReceivingButton) {
      forceReceivingButton.addEventListener('click', handleForceReceiving)
    }
    if (refreshButton) {
      refreshButton.addEventListener('click', loadPendingReceivings)
    }
    if (exportButton) {
      exportButton.addEventListener('click', exportToExcel)
    }
  });
}

// Helper: get today's date as YYYYMMDD
function getTodayStr() {
  const d = new Date();
  return d.getFullYear().toString() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
}
// Helper: random 4 digit
function random4() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// 컨테이너/트레일러 타입에 따라 입력란 제어
const typeSelect = document.getElementById("typeSelect");
const containerInput = document.getElementById("containerInput");
if (typeSelect && containerInput) {
  typeSelect.addEventListener('change', () => {
    if (typeSelect.value === 'trailer') {
      containerInput.value = '';
      containerInput.disabled = true;
      containerInput.placeholder = '자동생성';
    } else {
      containerInput.disabled = false;
      containerInput.placeholder = 'e.g., C123456';
    }
  });
}

// Add QRious script for QR code generation
if (!document.getElementById('qrious-lib')) {
  const qrScript = document.createElement('script');
  qrScript.id = 'qrious-lib';
  qrScript.src = 'https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js';
  document.head.appendChild(qrScript);
}

// 데이터 로드
async function loadPlans(applyFilter = false) {
  if (!initializeElements()) return;

  if (!applyFilter) {
    planListBody.innerHTML = `
      <tr>
        <td colspan="12" class="text-center py-4 text-muted">
          <i class="fas fa-search me-2"></i>
          ${formatMessage('msg_click_search')}
        </td>
      </tr>
    `;
    return;
  }

  try {
    planListBody.innerHTML = `
      <tr>
        <td colspan="12" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <div class="mt-2">${formatMessage('msg_loading_plans')}</div>
        </td>
      </tr>
    `;

    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;

    if (!startDate || !endDate) {
      showMessage(
        formatMessage('modal_message_title'),
        formatMessage('msg_select_date')
      );
      return;
    }

    // 1. receiving_log 전체 불러오기 (label_id, received_at 모두)
    const { data: logs, error: logError } = await window.supabase.from('receiving_log').select('label_id, received_at');
    if (logError) throw logError;
    const logMap = new Map();
    (logs || []).forEach(log => logMap.set(String(log.label_id), log));

    // 2. plan, item 데이터 불러오기
    const { data: plans, error } = await window.supabase
      .from('receiving_plan')
      .select(`
        *,
        receiving_items (*)
      `)
      .gte('receive_date', startDate)
      .lte('receive_date', endDate)
      .order('receive_date', { ascending: true });

    if (error) throw error;

    if (!plans || plans.length === 0) {
      planListBody.innerHTML = `
        <tr>
          <td colspan="12" class="text-center py-4 text-muted">
            <i class="fas fa-info-circle me-2"></i>
            ${formatMessage('msg_no_plans')}
          </td>
        </tr>
      `;
      return;
    }

    // === currentPlans, currentItems 세팅 ===
    if (Array.isArray(plans) && Array.isArray(plans[0])) {
      plans = plans.flat();
    }
    currentPlans = plans;
    currentItems = new Map();
    for (const plan of plans) {
      currentItems.set(plan.id, (plan && Array.isArray(plan.receiving_items)) ? plan.receiving_items : []);
    }

    // 데이터 표시 (tbody만 생성)
    planListBody.innerHTML = plans.map(plan => {
      const items = (plan && Array.isArray(plan.receiving_items)) ? plan.receiving_items : [];
      const partNos = items.map(i => i.part_no).join(', ');
      const qtys = items.map(i => i.quantity).join(', ');
      const locations = items.map(i => i.location_code).join(', ');
      const receivingPlaces = items.map(i => i.receiving_place || '-').join(', ');
      const receivedAts = items.map(i => logMap.has(String(i.label_id)) ? new Date(logMap.get(String(i.label_id)).received_at).toISOString().slice(0,10) : '').join(', ');
      const allReceived = items.length > 0 && items.every(i => logMap.has(String(i.label_id)));
      const status = allReceived ? '입고' : '대기';
      let forceBtn = '';
      const notReceivedItems = items.filter(i => !logMap.has(String(i.label_id)));
      if (notReceivedItems.length > 0) {
        forceBtn = `<button class="force-receive-btn text-green-600" data-plan-id="${plan.id}" data-label-ids="${notReceivedItems.map(i => i.label_id).join(',')}">입고</button>`;
      }
      return `
        <tr>
          <td class="px-2 py-2 border text-center"><input type="checkbox" name="planCheckBox" value="${plan.id}"></td>
          <td class="px-2 py-2 border text-center">${plan.receive_date || ''}</td>
          <td class="px-4 py-2 border">${plan.type || ''}</td>
          <td class="px-4 py-2 border">${plan.container_no || ''}</td>
          <td class="px-4 py-2 border">${locations}</td>
          <td class="px-4 py-2 border">${receivingPlaces}</td>
          <td class="px-4 py-2 border">${partNos}</td>
          <td class="px-4 py-2 border">${qtys}</td>
          <td class="px-4 py-2 border">${status}</td>
          <td class="px-4 py-2 border">${receivedAts}</td>
          <td class="px-2 py-2 border">
            <button class="delete-btn text-red-600" data-id="${plan.id}">Delete</button>
          </td>
          <td class="px-2 py-2 border">
            ${forceBtn}
          </td>
        </tr>
      `;
    }).join('');

    // 7. 이벤트 리스너 바인딩 (반드시 planListBody.innerHTML 이후 호출)
    bindEventListeners();

  } catch (error) {
    console.error('Error:', error);
    planListBody.innerHTML = `
      <tr>
        <td colspan="12" class="text-center py-4 text-danger">
          <i class="fas fa-exclamation-circle me-2"></i>
          ${formatMessage('msg_error_loading')}
        </td>
      </tr>
    `;
  }
}

// 이벤트 리스너 바인딩
function bindEventListeners() {
  console.log('Binding event listeners...');  // 디버깅용 로그

  // Delete 버튼
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", handleDelete);
  });

  // 강제입고 버튼
  document.querySelectorAll(".force-receive-btn").forEach(btn => {
    btn.addEventListener("click", function(e) {
      const labelIds = e.target.dataset.labelIds;
      if (labelIds) {
        pendingForceReceive = labelIds.split(',');
        forceReceiveDate.value = new Date().toISOString().split('T')[0];
        forceReceiveModal.classList.remove('hidden');
      }
    });
  });

  // Force Receive Modal Buttons (항상 최신 DOM에 바인딩)
  ['confirmForceReceive', 'cancelForceReceive'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
    }
  });
  const confirmBtn = document.getElementById('confirmForceReceive');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      if (!pendingForceReceive) return;
      const selectedDate = forceReceiveDate.value;
      if (!selectedDate) {
        showMessage('알림', '날짜를 선택해주세요.');
        return;
      }
      // Convert selected date to ET timezone
      const etDate = new Date(selectedDate + 'T00:00:00');
      const etTime = new Date(etDate.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      await forceReceiveMultiple(pendingForceReceive, etTime);
      forceReceiveModal.classList.add('hidden');
      pendingForceReceive = null;
    });
  }
  const cancelBtn = document.getElementById('cancelForceReceive');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      forceReceiveModal.classList.add('hidden');
      pendingForceReceive = null;
    });
  }

  // Close message modal when clicking outside
  if (messageModal) {
    messageModal.addEventListener('click', (e) => {
      if (e.target === messageModal) {
        messageModal.classList.add('hidden');
        isMessageShowing = false;
      }
    });
  }

  // 전체 선택 체크박스
  const planCheckAll = document.getElementById('planCheckAll');
  if (planCheckAll) {
    planCheckAll.addEventListener('change', function() {
      const checkboxes = document.querySelectorAll('input[name="planCheckBox"]');
      checkboxes.forEach(cb => { cb.checked = planCheckAll.checked; });
    });
  }
}

// Delete 핸들러
async function handleDelete(event) {
  const id = event.target.dataset.id;
  if (!confirm(formatMessage('msg_confirm_delete'))) return;
  
  try {
    const { error } = await window.supabase.from("receiving_plan").delete().eq("id", id);
    if (error) throw error;
    
    // 캐시 업데이트
    currentPlans = currentPlans.filter(p => p.id !== parseInt(id));
    currentItems.delete(parseInt(id));
    
    // UI 업데이트
    loadPlans();
  } catch (error) {
    console.error('Error deleting record:', error);
    showMessage(
      formatMessage('modal_message_title'),
      formatMessage('msg_error_delete', { error: error.message })
    );
  }
}

// CSV Download
const exportBtn = document.createElement("button");
exportBtn.textContent = "Download CSV";
exportBtn.className = "bg-gray-600 text-white px-4 py-2 rounded ml-4";
document.getElementById("searchPlanBtn")?.after(exportBtn);
exportBtn.addEventListener("click", async () => {
    console.log('Export CSV button clicked');
    const { data, error } = await window.supabase.from("receiving_plan").select("*");
    if (error) {
        console.error('Error loading data for CSV:', error);
        alert("Error loading data: " + error.message);
        return;
    }
    const csv = ["Date,Type,Container No.,Part No.,Quantity"].concat(
        data.map(row => `${row.receive_date},${row.type},${row.container_no},-,-`)
    ).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "receiving_plan.csv";
    a.click();
    URL.revokeObjectURL(url);
});

// 프린트 버튼 초기화 함수
function initializePrintButton() {
  console.log('Initializing print button...');
  
  // 1. 기존 프린트 버튼 완전 제거
  const existingButtons = document.querySelectorAll('#printPlanBtn');
  existingButtons.forEach(btn => {
    console.log('Removing existing print button:', btn);
    btn.remove();
  });

  // 2. 새 프린트 버튼 생성 및 바인딩
  const mb6Div = document.querySelector('.mb-6');
  if (mb6Div) {
    console.log('Creating new print button...');
    const newPrintBtn = document.createElement('button');
    newPrintBtn.id = 'printPlanBtn';
    newPrintBtn.type = 'button';
    newPrintBtn.className = 'bg-gray-700 text-white px-6 py-2 rounded ml-2';
    newPrintBtn.textContent = 'Print';
    
    // 이벤트 리스너 바인딩
    newPrintBtn.addEventListener('click', async () => {
      console.log('Print button clicked');
      const checked = document.querySelectorAll('input[name="planCheckBox"]:checked');
      if (!checked.length) {
        alert('출력할 행을 선택하세요.');
        return;
      }
      
      try {
        let allLabelsHtml = '';
        for (let idx = 0; idx < checked.length; idx++) {
          const input = checked[idx];
          const planId = input.value;
          if (!planId) continue;
          // plan 정보
          const { data: plan, error: planError } = await window.supabase
            .from('receiving_plan')
            .select('*')
            .eq('id', planId)
            .single();
          if (planError || !plan) continue;
          // items 정보 (plan_id로 조회)
          const { data: items, error: itemsError } = await window.supabase
            .from('receiving_items')
            .select('*')
            .eq('plan_id', planId);
          if (itemsError || !items || items.length === 0) continue;
          allLabelsHtml += `
            <div style='${idx !== checked.length - 1 ? "break-after:page;" : ""}; display:block; min-height:950px; padding:20px; box-sizing:border-box;'>
              <div style='display:block; text-align:center;'>
                <div style='font-size:150px;font-weight:bold;margin-bottom:30px;white-space:nowrap;'>${plan.container_no}</div>
                <div style='font-size:100px;font-weight:bold;margin-bottom:20px;'>LOCATION: <span style="font-weight:normal;">${items[0]?.location_code || ''}</span></div>
                <div style='font-size:50px;font-weight:bold;margin-bottom:20px;'>RECEIVING DATE: <span style="font-weight:normal;">${plan.receive_date}</span></div>
                <table style="font-size:45px;font-weight:bold;margin-bottom:30px;text-align:center;border-collapse:collapse;width:100%;">
                  <tr>
                    <th style="border:2px solid #000;padding:8px 16px;">PART NO</th>
                    <th style="border:2px solid #000;padding:8px 16px;">QTY</th>
                  </tr>
                  ${items.map(item => `
                    <tr>
                      <td style="border:2px solid #000;padding:8px 16px;font-weight:normal;">${item.part_no}</td>
                      <td style="border:2px solid #000;padding:8px 16px;font-weight:normal;">${item.quantity}</td>
                    </tr>
                  `).join('')}
                </table>
                <div style='margin-top:20px;'>
                  <canvas class='qr-print' width='200' height='200' data-qr='${plan.container_no}'></canvas>
                  <div style='font-size:30px;margin-top:8px;font-weight:normal;white-space:nowrap;'>${plan.container_no}</div>
                </div>
              </div>
            </div>
          `;
        }
        
        if (!allLabelsHtml) {
          alert('출력 정보 조회 실패');
          return;
        }
        
        const printHtml = `
          <style>
            @media print {
              @page { 
                size: 8.5in 11in portrait; 
                margin: 0.25in; 
              }
              body { 
                margin: 0; 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              div[style*='break-after:page;'] { break-after: page; }
            }
          </style>
          <div style='font-family:sans-serif;width:100%;height:100%;position:relative;background:#fff;'>
            ${allLabelsHtml}
          </div>
          <script src="https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js"></script>
          <script>setTimeout(function(){
            document.querySelectorAll('.qr-print').forEach(function(canvas){
              var qr = new QRious({element:canvas,value:canvas.getAttribute('data-qr'),size:200});
            });
          },100);</script>
        `;
        
        const win = window.open('', '', 'width=1400,height=900');
        win.document.write('<html><head><title>Print</title></head><body style="margin:0;">' + printHtml + '</body></html>');
        setTimeout(() => { win.print(); }, 900);
      } catch (error) {
        console.error('Print error:', error);
        alert('출력 중 오류가 발생했습니다.');
      }
    });
    
    mb6Div.appendChild(newPrintBtn);
    console.log('Print button initialized successfully');
  } else {
    console.error('Could not find .mb-6 div for print button');
  }
}

// Main initialization function
export async function initSection() {
  console.log('=== Initializing receiving section ===');
  
  // 1. 기존 이벤트 리스너 정리
  cleanupEventListeners();
  
  // 2. DOM 요소 초기화
  if (!initializeElements()) {
    console.error('Failed to initialize elements');
    return;
  }

  // 3. 이벤트 리스너 초기화
  console.log('Initializing event listeners...');
  
  // 4. 프린트 버튼 초기화
  initializePrintButton();
  
  // Add New Plan 버튼
  if (addNewPlanBtn) {
    addNewPlanBtn.addEventListener('click', () => {
      console.log('Add New Plan button clicked');
      if (addPlanForm) {
        addPlanForm.classList.remove('hidden');
        renderPlanFormButton();
      }
    });
  }

  // Add Item 버튼
  if (addItemBtn) {
    addItemBtn.addEventListener('click', () => {
      console.log('Add Item button clicked');
      if (itemList) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'grid grid-cols-2 gap-4';
        itemDiv.innerHTML = `
          <input type="text" placeholder="Part No." class="part-input border rounded px-3 py-2" />
          <input type="number" placeholder="Quantity" class="qty-input border rounded px-3 py-2" />
        `;
        itemList.appendChild(itemDiv);
      }
    });
  }

  // Search Plan 버튼
  if (searchPlanBtn) {
    searchPlanBtn.addEventListener('click', () => {
      console.log('Search Plan button clicked');
      loadPlans(true);
    });
  }

  // 4. 입력폼 초기화
  console.log('Initializing form elements...');
  const typeSelect = document.getElementById('typeSelect');
  const containerInput = document.getElementById('containerInput');
  const locationInput = document.getElementById('locationInput');
  const receiveDateInput = document.getElementById('receiveDateInput');

  if (typeSelect) typeSelect.value = 'container';
  if (containerInput) {
    containerInput.value = '';
    containerInput.disabled = false;
    containerInput.placeholder = 'e.g., C123456';
  }
  if (locationInput) locationInput.value = '';
  if (receiveDateInput) receiveDateInput.value = '';
  if (itemList) itemList.innerHTML = '';

  // 5. 최초 Receiving Items 입력란 생성
  if (itemList) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'grid grid-cols-2 gap-4';
    itemDiv.innerHTML = `
      <input type="text" placeholder="Part No." class="part-input border rounded px-3 py-2" />
      <input type="number" placeholder="Quantity" class="qty-input border rounded px-3 py-2" />
    `;
    itemList.appendChild(itemDiv);
  }

  // 6. typeSelect 변경 이벤트
  if (typeSelect && containerInput) {
    typeSelect.addEventListener('change', () => {
      console.log('Type select changed:', typeSelect.value);
      if (typeSelect.value === 'trailer') {
        containerInput.value = '';
        containerInput.disabled = true;
        containerInput.placeholder = '자동생성';
      } else {
        containerInput.disabled = false;
        containerInput.placeholder = 'e.g., C123456';
      }
    });
  }

  // 7. 날짜 필터 초기화
  const today = new Date().toISOString().split("T")[0];
  const startDateEl = document.getElementById("filterStartDate");
  const endDateEl = document.getElementById("filterEndDate");
  if (startDateEl && endDateEl) {
    startDateEl.value = today;
    endDateEl.value = today;
    startDateEl.addEventListener("change", () => {
      endDateEl.value = startDateEl.value;
    });
  }

  // 8. 초기 데이터 로드
  console.log('Loading initial data...');
  await loadPlans();
  
  console.log('=== Receiving section initialization complete ===');
  isInitialized = true;
}

// Search Plan 버튼 이벤트 리스너 (fetch -> supabase-js로 변경)
if (searchPlanBtn) {
  searchPlanBtn.addEventListener('click', async function() {
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;
    const tbody = document.querySelector('#receivingPlanTable tbody');
    if (!startDate || !endDate) {
      alert('시작일과 종료일을 모두 선택해주세요.');
      return;
    }
    try {
      // 로딩 표시
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <div class="mt-2">입고 계획을 조회중입니다...</div>
          </td>
        </tr>
      `;
      // supabase-js로 데이터 조회
      const { data, error } = await window.supabase
        .from('receiving_plan')
        .select('*')
        .gte('receive_date', startDate)
        .lte('receive_date', endDate)
        .order('receive_date', { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center py-4 text-muted">
              <i class="fas fa-info-circle me-2"></i>
              해당 기간의 입고 계획이 없습니다
            </td>
          </tr>
        `;
        return;
      }
      // 데이터 표시
      tbody.innerHTML = data.map(plan => `
        <tr>
          <td>${plan.container_no}</td>
          <td>${plan.part_no}</td>
          <td>${plan.receive_date}</td>
          <td>${plan.qty}</td>
          <td>${plan.status}</td>
          <td>${plan.remark || '-'}</td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="showReceivingModal('${plan.container_no}', '${plan.part_no}')">
              입고
            </button>
          </td>
        </tr>
      `).join('');
    } catch (error) {
      console.error('Error:', error);
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4 text-danger">
            <i class="fas fa-exclamation-circle me-2"></i>
            데이터를 불러오는 중 오류가 발생했습니다
          </td>
        </tr>
      `;
    }
  });
}

// Functions
async function handleForceReceiving() {
    const containerNo = containerNoInput.value.trim()
    const partNo = partNoInput.value.trim()
    const quantity = quantityInput.value.trim()
    const location = locationInput.value.trim()

    if (!containerNo || !partNo || !quantity || !location) {
        showMessage(
          formatMessage('modal_message_title'),
          formatMessage('msg_enter_all_fields')
        );
        return;
    }

    try {
        // Get current time in US Eastern Time
        const now = new Date();
        const etTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
        
        // Create receiving record
        const { error } = await window.supabase
            .from('receivings')
            .insert({
                container_no: containerNo,
                part_no: partNo,
                quantity: parseInt(quantity),
                location: location,
                status: 'in_stock',
                in_date: etTime.toISOString()
            })

        if (error) throw error

        // Clear form
        containerNoInput.value = ''
        partNoInput.value = ''
        quantityInput.value = ''
        locationInput.value = ''

        // Refresh data
        loadPendingReceivings()
        loadReceivingReport()

        showMessage(
          formatMessage('modal_message_title'),
          formatMessage('msg_receiving_complete')
        );
    } catch (error) {
        console.error('Error:', error)
        showMessage(
          formatMessage('modal_message_title'),
          formatMessage('msg_error_processing')
        );
    }
}

async function loadPendingReceivings() {
    try {
        const { data, error } = await window.supabase
            .from('receiving_plans')
            .select('*')
            .eq('status', 'pending')
            .order('plan_date', { ascending: true })

        if (error) throw error

        const tbody = document.getElementById('pendingTableBody')
        tbody.innerHTML = ''

        data.forEach((item, index) => {
            const tr = document.createElement('tr')
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${index + 1}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.container_no}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.part_no}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(item.plan_date).toLocaleDateString()}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.plan_qty}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.status}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button onclick="handlePendingReceiving('${item.id}')" 
                            class="text-blue-600 hover:text-blue-900">
                        Process
                    </button>
                </td>
            `
            tbody.appendChild(tr)
        })
    } catch (error) {
        console.error('Error:', error)
        alert('Error loading pending receivings')
    }
}

async function handlePendingReceiving(id) {
    try {
        // Update receiving plan status
        const { error } = await window.supabase
            .from('receiving_plans')
            .update({ status: 'completed' })
            .eq('id', id)

        if (error) throw error

        // Refresh data
        loadPendingReceivings()
        loadReceivingReport()

        alert('Receiving processed successfully')
    } catch (error) {
        console.error('Error:', error)
        alert('Error processing receiving')
    }
}

async function loadReceivingReport() {
    try {
        const { data, error } = await window.supabase
            .from('receivings')
            .select('*')
            .order('in_date', { ascending: false })

        if (error) throw error

        const tbody = document.getElementById('reportTableBody')
        tbody.innerHTML = ''

        data.forEach((item, index) => {
            const duration = item.out_date ? 
                Math.ceil((new Date(item.out_date) - new Date(item.in_date)) / (1000 * 60 * 60 * 24)) : 
                '-'

            const tr = document.createElement('tr')
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${index + 1}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.container_no}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.part_no}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(item.in_date).toLocaleDateString()}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.out_date ? new Date(item.out_date).toLocaleDateString() : '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${duration}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.quantity}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.location}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.status}</td>
            `
            tbody.appendChild(tr)
        })
    } catch (error) {
        console.error('Error:', error)
        alert('Error loading receiving report')
    }
}

function exportToExcel() {
    // Implement Excel export functionality
    alert('Export to Excel functionality will be implemented')
}

async function forceReceiveMultiple(labelIds, receiveDate) {
  // 여러 label_id를 한 번에 처리
  let successCount = 0;
  let failCount = 0;
  
  for (const labelId of labelIds) {
    // 이미 입고된 항목은 건너뜀
    const { data: logData } = await window.supabase
      .from('receiving_log')
      .select('id')
      .eq('label_id', labelId);
      
    if (logData && logData.length > 0) {
      successCount++; // 이미 입고된 항목도 성공으로 카운트
      continue;
    }
    
    try {
      const { error: insertError } = await window.supabase.from('receiving_log').insert({
        label_id: labelId,
        received_at: receiveDate.toISOString(),
        confirmed_by: 'admin' // CONFIG.USER_INFO.name 대신 'admin' 사용
      });
      
      if (insertError) throw insertError;
      successCount++;
    } catch (error) {
      console.error('Error force receiving:', error);
      failCount++;
    }
  }
  
  // Show message only once after all operations are complete
  showMessage(
    formatMessage('msg_force_receive_complete'),
    `${formatMessage('msg_success_count', { count: successCount })}${failCount ? ', ' + formatMessage('msg_fail_count', { count: failCount }) : ''}`
  );
  await loadPlans(true);
}

// 바코드(컨테이너) 입력창 항상 포커스 및 자동 입고 처리
if (containerNoInput && partNoInput && quantityInput && locationInput) {
  containerNoInput.focus();
  containerNoInput.addEventListener('blur', () => setTimeout(() => containerNoInput.focus(), 100));
  containerNoInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      if (containerNoInput.value && partNoInput.value && quantityInput.value && locationInput.value) {
        await handleForceReceiving();
        containerNoInput.value = '';
        partNoInput.value = '';
        quantityInput.value = '';
        locationInput.value = '';
        containerNoInput.focus();
      }
    }
  });
}

// 폼 하단 버튼 동적 생성 함수
function renderPlanFormButton() {
  let btnArea = document.getElementById('planFormBtnArea');
  if (!btnArea) {
    btnArea = document.createElement('div');
    btnArea.id = 'planFormBtnArea';
    btnArea.className = 'mt-6';
    const form = document.getElementById('addPlanForm');
    if (form) form.appendChild(btnArea);
  }
  btnArea.innerHTML = '';
  
  const submitBtn = document.createElement('button');
  submitBtn.className = 'bg-green-600 text-white px-6 py-2 rounded';
  submitBtn.textContent = 'Submit Plan';
  submitBtn.addEventListener('click', () => {
    console.log('Submit Plan clicked');
    handleSubmitPlan();
  });
  btnArea.appendChild(submitBtn);
}

// handleSubmitPlan을 window에 등록
window.handleSubmitPlan = handleSubmitPlan;

// 신규 등록 핸들러
async function handleSubmitPlan() {
  const type = document.getElementById("typeSelect").value;
  let container = document.getElementById("containerInput").value.trim();
  const location = document.getElementById("locationInput").value.trim();
  const receivingPlace = document.getElementById("receivingPlaceInput")?.value.trim() || '';
  const receiveDate = document.getElementById("receiveDateInput").value;
  const parts = Array.from(document.querySelectorAll(".part-input")).map(el => el.value.trim());
  const qtys = Array.from(document.querySelectorAll(".qty-input")).map(el => parseInt(el.value));

  if (parts.length === 0 || qtys.length === 0 || parts.some(p => !p) || qtys.some(q => !q || isNaN(q))) {
    showMessage(
      formatMessage('modal_message_title'),
      formatMessage('msg_enter_parts_qty')
    );
    return;
  }

  try {
    let planId;
    if (type === 'trailer') {
      // 1. Plan 저장 (trailer_seq 자동 생성)
      const { data: planData, error: planError } = await window.supabase
        .from('receiving_plan')
        .insert({
          type,
          receive_date: receiveDate,
        })
        .select('id, trailer_seq')
        .single();
      if (planError) throw planError;
      planId = planData.id;
      const trailerNo = `T-${String(planData.trailer_seq).padStart(5, '0')}`;
      // 2. Plan의 container_no 업데이트
      await window.supabase
        .from('receiving_plan')
        .update({ container_no: trailerNo })
        .eq('id', planId);
      // 3. Items 저장
      const items = [];
      for (let i = 0; i < parts.length; i++) {
        items.push({
          plan_id: planId,
          part_no: parts[i],
          quantity: qtys[i],
          location_code: location,
          label_id: crypto.randomUUID(),
          container_no: trailerNo,
          receiving_place: receivingPlace,
        });
      }
      const { error: itemsError } = await window.supabase.from('receiving_items').insert(items);
      if (itemsError) throw itemsError;
    } else {
      // 컨테이너는 기존 방식(직접 입력/수정)
      const { data: planData, error: planError } = await window.supabase
        .from('receiving_plan')
        .insert({
          type,
          container_no: container,
          receive_date: receiveDate,
        })
        .select('id, trailer_seq')
        .single();
      if (planError) throw planError;
      planId = planData.id;
      // Items 저장
      const items = [];
      for (let i = 0; i < parts.length; i++) {
        items.push({
          plan_id: planId,
          part_no: parts[i],
          quantity: qtys[i],
          location_code: location,
          label_id: crypto.randomUUID(),
          container_no: container,
          receiving_place: receivingPlace,
        });
      }
      const { error: itemsError } = await window.supabase.from('receiving_items').insert(items);
      if (itemsError) throw itemsError;
    }
    showMessage(
      formatMessage('modal_message_title'),
      formatMessage('msg_saved')
    );
    document.getElementById('addPlanForm').classList.add('hidden');
    document.getElementById('itemList').innerHTML = '';
    document.getElementById('containerInput').value = '';
    document.getElementById('locationInput').value = '';
    document.getElementById('receivingPlaceInput') && (document.getElementById('receivingPlaceInput').value = '');
    document.getElementById('receiveDateInput').value = '';
    await loadPlans(true);
  } catch (error) {
    console.error('Error:', error);
    showMessage(
      formatMessage('modal_message_title'),
      formatMessage('msg_save_error', { error: error.message })
    );
  }
}

// 언어 변경 이벤트 리스너
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang')));
});

// 초기 언어 설정
setLang(currentLang);

// SPA 환경에서도 항상 동작하도록 위임 이벤트 리스너 추가
document.body.addEventListener('click', function(e) {
  if (e.target && e.target.id === 'messageConfirm') {
    document.getElementById('messageModal').classList.add('hidden');
    isMessageShowing = false;
  }
});

// =========================
// Location Master 관리 섹션
// =========================

// HTML 삽입
(function() {
  const section = document.createElement('section');
  section.id = 'locationMasterSection';
  section.innerHTML = `
    <h2 class="text-xl font-bold mt-12 mb-4">위치(Location) 마스터 관리</h2>
    <form id="addLocationForm" class="flex gap-2 mb-4">
      <input type="text" id="locationCodeInput" placeholder="위치코드" required class="border px-2 py-1 rounded">
      <select id="statusInput" class="border px-2 py-1 rounded">
        <option value="available">사용가능</option>
        <option value="occupied">점유중</option>
        <option value="maintenance">점검중</option>
        <option value="disabled">사용불가</option>
      </select>
      <input type="text" id="remarkInput" placeholder="비고" class="border px-2 py-1 rounded">
      <button type="submit" class="bg-blue-600 text-white px-4 py-1 rounded">등록</button>
    </form>
    <table id="locationTable" class="w-full border mb-12">
      <thead>
        <tr class="bg-gray-100">
          <th class="border px-2 py-1">위치코드</th>
          <th class="border px-2 py-1">상태</th>
          <th class="border px-2 py-1">비고</th>
          <th class="border px-2 py-1">수정/삭제</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;
  document.body.appendChild(section);
})();

// 위치 목록 불러오기
async function loadLocations() {
  const tbody = document.querySelector('#locationTable tbody');
  tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
  const { data, error } = await window.supabase.from('locations').select('*').order('location_code');
  if (error) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-red-600">Error: ${error.message}</td></tr>`;
    return;
  }
  tbody.innerHTML = '';
  data.forEach(loc => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="border px-2 py-1">${loc.location_code}</td>
      <td class="border px-2 py-1">
        <select data-id="${loc.id}" class="statusEdit border rounded px-1 py-0.5">
          <option value="available" ${loc.status === 'available' ? 'selected' : ''}>사용가능</option>
          <option value="occupied" ${loc.status === 'occupied' ? 'selected' : ''}>점유중</option>
          <option value="maintenance" ${loc.status === 'maintenance' ? 'selected' : ''}>점검중</option>
          <option value="disabled" ${loc.status === 'disabled' ? 'selected' : ''}>사용불가</option>
        </select>
      </td>
      <td class="border px-2 py-1"><input type="text" value="${loc.remark || ''}" data-id="${loc.id}" class="remarkEdit border rounded px-1 py-0.5 w-full"></td>
      <td class="border px-2 py-1">
        <button class="updateLocBtn bg-green-600 text-white px-2 py-0.5 rounded" data-id="${loc.id}">수정</button>
        <button class="deleteLocBtn bg-red-600 text-white px-2 py-0.5 rounded ml-1" data-id="${loc.id}">삭제</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 위치 등록
const addLocationForm = document.getElementById('addLocationForm');
addLocationForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const location_code = document.getElementById('locationCodeInput').value.trim();
  const status = document.getElementById('statusInput').value;
  const remark = document.getElementById('remarkInput').value.trim();
  if (!location_code) return alert('위치코드를 입력하세요.');
  const { error } = await window.supabase.from('locations').insert({ location_code, status, remark });
  if (error) return alert('등록 실패: ' + error.message);
  addLocationForm.reset();
  loadLocations();
});

// 수정/삭제 이벤트 위임
const locationTable = document.getElementById('locationTable');
locationTable.addEventListener('click', async function(e) {
  const id = e.target.dataset.id;
  if (e.target.classList.contains('updateLocBtn')) {
    // 수정
    const status = locationTable.querySelector(`select.statusEdit[data-id='${id}']`).value;
    const remark = locationTable.querySelector(`input.remarkEdit[data-id='${id}']`).value;
    const { error } = await window.supabase.from('locations').update({ status, remark }).eq('id', id);
    if (error) return alert('수정 실패: ' + error.message);
    loadLocations();
  } else if (e.target.classList.contains('deleteLocBtn')) {
    // 삭제
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const { error } = await window.supabase.from('locations').delete().eq('id', id);
    if (error) return alert('삭제 실패: ' + error.message);
    loadLocations();
  }
});

// 최초 로드
loadLocations();

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

// 랜덤 사용가능 로케이션 찾기
async function getRandomAvailableLocation() {
  // 1. status='available'인 위치 목록
  const { data: locations, error: locError } = await window.supabase
    .from('locations')
    .select('location_code')
    .eq('status', 'available');
  if (locError || !locations || locations.length === 0) return null;

  // 2. 점유중 아닌 위치만 필터 (normalizeLocationCode로 비교)
  const available = [];
  for (const loc of locations) {
    const normCode = normalizeLocationCode(loc.location_code);
    // receiving_items 전체를 불러와서 normalizeLocationCode로 비교
    const { data: items, error: itemsError } = await window.supabase
      .from('receiving_items')
      .select('location_code, status');
    if (itemsError) continue;
    const isOccupied = items.some(item =>
      normalizeLocationCode(item.location_code) === normCode && item.status === 'in_stock'
    );
    if (!isOccupied) available.push(loc.location_code); // 원본값으로 push
  }
  if (available.length === 0) return null;
  // 3. 랜덤 선택
  return available[Math.floor(Math.random() * available.length)];
}

// 체크박스 이벤트 리스너 직접 연결 함수
function attachAutoLocationCheckboxListener() {
  const autoLocationCheckbox = document.getElementById('autoLocationCheckbox');
  const locationInput = document.getElementById('locationInput');
  const autoLocDiv = document.getElementById('autoLocationInfo');
  if (autoLocationCheckbox && locationInput) {
    // 기존 리스너 제거 후 재등록 (중복 방지)
    autoLocationCheckbox.onchange = null;
    autoLocationCheckbox.addEventListener('change', async function(e) {
      console.log('체크박스 상태 변경:', e.target.checked);
      if (e.target.checked) {
        locationInput.readOnly = true;
        locationInput.value = '';
        locationInput.placeholder = '자동 할당 중...';
        try {
          const loc = await getRandomAvailableLocation();
          console.log('getRandomAvailableLocation 결과:', loc);
          if (loc) {
            locationInput.value = loc;
            locationInput.placeholder = '자동 할당됨';
            if (autoLocDiv) {
              autoLocDiv.textContent = `자동 할당 위치: ${loc}`;
              autoLocDiv.classList.remove('text-red-600');
              autoLocDiv.classList.add('text-green-700');
            }
          } else {
            locationInput.value = '';
            locationInput.placeholder = '사용 가능한 위치 없음';
            if (autoLocDiv) {
              autoLocDiv.textContent = '사용 가능한 위치가 없습니다!';
              autoLocDiv.classList.remove('text-green-700');
              autoLocDiv.classList.add('text-red-600');
            }
          }
        } catch (error) {
          console.error('위치 할당 중 오류 발생:', error);
          locationInput.value = '';
          locationInput.placeholder = '오류 발생';
          if (autoLocDiv) {
            autoLocDiv.textContent = '위치 할당 중 오류가 발생했습니다.';
            autoLocDiv.classList.add('text-red-600');
          }
        }
      } else {
        locationInput.readOnly = false;
        locationInput.value = '';
        locationInput.placeholder = 'e.g., A1';
        if (autoLocDiv) {
          autoLocDiv.textContent = '';
        }
      }
    });
    console.log('체크박스 이벤트 리스너 직접 연결 완료');
  } else {
    console.log('체크박스/입력란 DOM 요소를 찾지 못함');
  }
}

// Add New Plan 버튼 클릭 시마다 체크박스 리스너 연결
if (addNewPlanBtn) {
  addNewPlanBtn.addEventListener('click', () => {
    setTimeout(attachAutoLocationCheckboxListener, 100); // 폼이 열리고 DOM이 렌더된 후 연결
  });
}
// 폼이 이미 열려있는 경우도 대비해서 최초 1회 연결
setTimeout(attachAutoLocationCheckboxListener, 500);
  