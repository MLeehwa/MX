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
        let location = document.getElementById("locationInput").value.trim();
        // 위치 코드 정규화 (A1 -> A-01)
        if (location) {
          location = normalizeLocationCode(location);
        }
        // 입고처 값 가져오기 (드롭다운 또는 직접 입력)
        const receivingPlaceSelect = document.getElementById("receivingPlaceSelect");
        const receivingPlaceInput = document.getElementById("receivingPlaceInput");
        let receivingPlace = '';
        
        if (receivingPlaceSelect && !receivingPlaceSelect.classList.contains('hidden') && receivingPlaceSelect.value) {
          receivingPlace = receivingPlaceSelect.value.trim();
        } else if (receivingPlaceInput && !receivingPlaceInput.classList.contains('hidden')) {
          receivingPlace = receivingPlaceInput.value.trim();
        }
        
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
    // 필터 없이도 오늘 날짜 + 과거 미확정 데이터 보여주기
    try {
      // 오늘 날짜 구하기 (YYYY-MM-DD 형식)
      const today = new Date().toISOString().split('T')[0];
      
      // 1. 오늘 날짜인 계획 조회
      const { data: todayPlans, error: todayError } = await window.supabase
        .from('receiving_plan')
        .select(`
          *,
          receiving_items (*)
        `)
        .eq('receive_date', today)
        .order('id', { ascending: false });

      if (todayError) throw todayError;

      // 2. 과거 날짜 계획 조회 (최근 30일)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
      
      const { data: pastPlans, error: pastError } = await window.supabase
        .from('receiving_plan')
        .select(`
          *,
          receiving_items (*)
        `)
        .lt('receive_date', today)
        .gte('receive_date', thirtyDaysAgoStr)
        .order('id', { ascending: false });

      if (pastError) throw pastError;

      // 3. receiving_log 조회하여 입고 확정된 label_id 확인
      const { data: logs, error: logError } = await window.supabase
        .from('receiving_log')
        .select('label_id');
      
      if (logError) throw logError;
      const receivedLabelIds = new Set((logs || []).map(l => String(l.label_id)));

      // 4. 과거 계획 중 입고 확정이 안 된 것만 필터링
      const unconfirmedPastPlans = (pastPlans || []).filter(plan => {
        const items = (plan && Array.isArray(plan.receiving_items)) ? plan.receiving_items : [];
        // 모든 items가 입고 확정되지 않은 경우만 포함
        return items.length > 0 && items.some(item => !receivedLabelIds.has(String(item.label_id)));
      });

      // 5. 오늘 계획 + 미확정 과거 계획 합치기
      const allPlans = [...(todayPlans || []), ...unconfirmedPastPlans];
      
      // id로 정렬 (최근 생성 순)
      allPlans.sort((a, b) => (b.id || 0) - (a.id || 0));

      if (allPlans.length === 0) {
        planListBody.innerHTML = `
          <tr>
            <td colspan="12" class="text-center py-4 text-muted">
              <i class="fas fa-info-circle me-2"></i>
              데이터가 없습니다. 테스트 데이터를 생성해보세요.
            </td>
          </tr>
        `;
        return;
      }

      // 최근 데이터 표시
      await displayPlans(allPlans);
      
      // 이벤트 리스너 바인딩
      isEventListenersBound = false;
      bindEventListeners();
      return;
    } catch (error) {
      console.error('최근 데이터 로드 실패:', error);
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

    // receiving_log는 displayPlans 함수에서 조회하므로 여기서는 제거

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

    // 데이터 표시 함수 호출
    await displayPlans(plans);

    // 7. 이벤트 리스너 바인딩 (반드시 planListBody.innerHTML 이후 호출)
    // displayPlans 후 planListBody가 다시 초기화되므로 플래그 리셋
    isEventListenersBound = false;
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
let isEventListenersBound = false;

function bindEventListeners() {
  console.log('Binding event listeners...');  // 디버깅용 로그

  // Delete 버튼 및 강제입고 버튼 - 이벤트 위임 사용
  // planListBody에 직접 이벤트 리스너 등록 (한 번만)
  if (planListBody && !isEventListenersBound) {
    console.log('Registering click event listener on planListBody');
    planListBody.addEventListener("click", function(e) {
      console.log('Click event detected on planListBody', e.target);
      
      // Delete 버튼 클릭 처리
      const deleteBtn = e.target.closest(".delete-btn");
      if (deleteBtn) {
        // 비활성화된 버튼은 클릭 무시
        if (deleteBtn.disabled) {
          console.log('Delete button is disabled (already received)');
          return false;
        }
        console.log('Delete button clicked', deleteBtn);
        e.preventDefault();
        e.stopPropagation();
        handleDelete(e);
        return false;
      }
      
      // 강제입고 버튼 클릭 처리
      const forceBtn = e.target.closest(".force-receive-btn");
      if (forceBtn) {
        console.log('Force receive button clicked', forceBtn);
        const labelIds = forceBtn.dataset.labelIds;
        if (labelIds) {
          pendingForceReceive = labelIds.split(',');
          forceReceiveDate.value = new Date().toISOString().split('T')[0];
          forceReceiveModal.classList.remove('hidden');
        }
        return false;
      }
    });
    isEventListenersBound = true;
    console.log('Event listeners bound successfully');
  } else if (!planListBody) {
    console.error('planListBody not found, cannot bind event listeners');
  } else {
    console.log('Event listeners already bound');
  }

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
  console.log('handleDelete called', event);
  
  // 이벤트 위임을 고려하여 버튼 요소 찾기
  const deleteBtn = event.target.closest(".delete-btn");
  
  if (!deleteBtn) {
    console.error('Delete button not found', event.target);
    return;
  }
  
  console.log('Delete button found', deleteBtn);
  const id = deleteBtn.dataset.id;
  console.log('Plan ID:', id);
  
  if (!id) {
    console.error('Plan ID not found in dataset', deleteBtn.dataset);
    alert('계획 ID를 찾을 수 없습니다.');
    return;
  }
  
  if (!confirm(formatMessage('msg_confirm_delete'))) {
    console.log('Delete cancelled by user');
    return;
  }
  
  console.log('Deleting plan with ID:', id);
  
  try {
    const { error } = await window.supabase.from("receiving_plan").delete().eq("id", id);
    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }
    
    console.log('Plan deleted successfully');
    
    // 캐시 업데이트
    currentPlans = currentPlans.filter(p => p.id !== parseInt(id));
    currentItems.delete(parseInt(id));
    
    // UI 업데이트
    await loadPlans();
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
    addNewPlanBtn.addEventListener('click', async () => {
      console.log('Add New Plan button clicked');
      if (addPlanForm) {
        addPlanForm.classList.remove('hidden');
        renderPlanFormButton();
        // 폼이 열릴 때 드롭다운 이벤트 리스너 다시 설정 및 드롭다운 로드
        setTimeout(async () => {
          setupLocationDropdownToggle();
          attachAutoLocationCheckboxListener();
          setupReceivingPlaceToggle();
          // 드롭다운이 기본이므로 초기 로드
          await loadAvailableLocationsDropdown();
        }, 100);
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

  // 8. 테스트 데이터 버튼 추가
  addTestDataButton();
  
  // 9. 데이터베이스 상태 확인 버튼 추가
  addDatabaseStatusButton();
  
  // 10. 초기 데이터 로드
  console.log('Loading initial data...');
  await loadPlans();
  
  // 11. 폼이 열려있으면 드롭다운 설정 (폼이 숨겨져 있으면 Add New Plan 버튼 클릭 시 설정됨)
  const addPlanForm = document.getElementById('addPlanForm');
  if (addPlanForm && !addPlanForm.classList.contains('hidden')) {
    setupLocationDropdownToggle();
    attachAutoLocationCheckboxListener();
    setupReceivingPlaceToggle();
    // 드롭다운이 기본이므로 초기 로드
    await loadAvailableLocationsDropdown();
  }
  
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
  const locationSelect = document.getElementById("locationSelect");
  const locationInput = document.getElementById("locationInput");
  // 드롭다운 또는 입력란에서 위치 가져오기
  let location = (locationSelect && !locationSelect.classList.contains('hidden') && locationSelect.value) 
    ? locationSelect.value.trim() 
    : locationInput.value.trim();
  // 위치 코드 정규화 (A1 -> A-01)
  if (location) {
    location = normalizeLocationCode(location);
    
    // 수동 입력인 경우 위치 유효성 검증
    if (locationInput && !locationInput.classList.contains('hidden') && locationInput.value.trim()) {
      const { data: locData, error: locError } = await window.supabase
        .from('wp1_locations')
        .select('status')
        .eq('location_code', location)
        .single();
      
      if (locError || !locData) {
        showMessage(
          formatMessage('modal_message_title'),
          `입력한 위치 코드 "${location}"가 위치 마스터에 등록되어 있지 않습니다.`
        );
        return;
      }
      
      if (locData.status === 'disabled' || locData.status === 'maintenance') {
        showMessage(
          formatMessage('modal_message_title'),
          `입력한 위치 "${location}"는 ${locData.status === 'disabled' ? '사용 불가' : '점검중'} 상태입니다. 다른 위치를 선택해주세요.`
        );
        return;
      }
    }
  }
  // 입고처 값 가져오기 (드롭다운 또는 직접 입력)
  const receivingPlaceSelect = document.getElementById("receivingPlaceSelect");
  const receivingPlaceInput = document.getElementById("receivingPlaceInput");
  let receivingPlace = '';
  
  if (receivingPlaceSelect && !receivingPlaceSelect.classList.contains('hidden') && receivingPlaceSelect.value) {
    receivingPlace = receivingPlaceSelect.value.trim();
  } else if (receivingPlaceInput && !receivingPlaceInput.classList.contains('hidden')) {
    receivingPlace = receivingPlaceInput.value.trim();
  }
  
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

// 아래 코드를 주석 처리하여 본문에 항상 보이지 않게 함
/*
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
*/

// 위치 목록 불러오기
async function loadLocations() {
  const tbody = document.querySelector('#locationTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
  const { data, error } = await window.supabase.from('wp1_locations').select('*').order('location_code');
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
if (addLocationForm) {
  addLocationForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    let location_code = document.getElementById('locationCodeInput').value.trim();
    const status = document.getElementById('statusInput').value;
    const remark = document.getElementById('remarkInput').value.trim();
    if (!location_code) return alert('위치코드를 입력하세요.');
    
    // 위치 코드 정규화 (A1 -> A-01)
    location_code = normalizeLocationCode(location_code);
    
    const { error } = await window.supabase.from('wp1_locations').insert({ location_code, status, remark });
    if (error) return alert('등록 실패: ' + error.message);
    addLocationForm.reset();
    loadLocations();
  });
}

// 수정/삭제 이벤트 위임
const locationTable = document.getElementById('locationTable');
if (locationTable) {
  locationTable.addEventListener('click', async function(e) {
    const id = e.target.dataset.id;
    if (e.target.classList.contains('updateLocBtn')) {
      // 수정
      const status = locationTable.querySelector(`select.statusEdit[data-id='${id}']`).value;
      const remark = locationTable.querySelector(`input.remarkEdit[data-id='${id}']`).value;
      const { error } = await window.supabase.from('wp1_locations').update({ status, remark }).eq('id', id);
      if (error) return alert('수정 실패: ' + error.message);
      loadLocations();
    } else if (e.target.classList.contains('deleteLocBtn')) {
      // 삭제
      if (!confirm('정말 삭제하시겠습니까?')) return;
      const { error } = await window.supabase.from('wp1_locations').delete().eq('id', id);
      if (error) return alert('삭제 실패: ' + error.message);
      loadLocations();
    }
  });
}

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

// 사용 가능한 위치 목록 가져오기 (빈 위치만)
async function getAvailableLocations() {
  try {
    // 1. status='available'이고 disabled가 아닌 위치 목록
    const { data: locations, error: locError } = await window.supabase
      .from('wp1_locations')
      .select('location_code')
      .eq('status', 'available')
      .neq('status', 'disabled')
      .order('location_code');
    if (locError || !locations || locations.length === 0) return [];

    // 2. receiving_items에서 모든 항목의 위치 조회 (입고 확정 여부와 관계없이)
    const { data: allItems, error: itemsError } = await window.supabase
      .from('receiving_items')
      .select('location_code, label_id');
    
    if (itemsError) {
      console.error('Error loading receiving_items:', itemsError);
      return [];
    }
    
    // 3. 출고 완료된 항목의 label_id 조회 (출고 완료된 항목은 점유에서 제외)
    const { data: shippedItems } = await window.supabase
      .from('shipping_instruction_items')
      .select('label_id, shipped_at');
    
    const shippedLabelIds = new Set(
      (shippedItems || [])
        .filter(i => i.shipped_at)
        .map(i => String(i.label_id))
    );
    
    // 4. 점유된 위치 코드 집합 생성
    // 입고 계획에 할당된 모든 위치를 점유로 간주 (입고 확정 여부와 관계없이)
    // 단, 출고 완료된 항목은 제외
    const occupiedCodes = new Set();
    (allItems || []).forEach(item => {
      if (!item.location_code) return;
      const labelId = String(item.label_id);
      // 출고 완료되지 않은 항목의 위치는 모두 점유로 간주
      if (!shippedLabelIds.has(labelId)) {
        const normCode = normalizeLocationCode(item.location_code);
        occupiedCodes.add(normCode);
      }
    });
    
    // 6. 사용 가능한 위치 필터링
    const available = locations
      .map(loc => loc.location_code)
      .filter(locCode => {
        const normCode = normalizeLocationCode(locCode);
        return !occupiedCodes.has(normCode);
      });
    
    return available;
  } catch (error) {
    console.error('Error in getAvailableLocations:', error);
    return [];
  }
}

// 랜덤 사용가능 로케이션 찾기
async function getRandomAvailableLocation() {
  const available = await getAvailableLocations();
  if (available.length === 0) return null;
  // 랜덤 선택
  return available[Math.floor(Math.random() * available.length)];
}

// 빈 위치 드롭다운 로드
async function loadAvailableLocationsDropdown() {
  const locationSelect = document.getElementById('locationSelect');
  if (!locationSelect) return;
  
  const available = await getAvailableLocations();
  locationSelect.innerHTML = '<option value="">빈 위치 선택...</option>';
  
  if (available.length === 0) {
    locationSelect.innerHTML = '<option value="">사용 가능한 위치가 없습니다</option>';
    return;
  }
  
  available.forEach(loc => {
    const option = document.createElement('option');
    option.value = loc;
    option.textContent = loc;
    locationSelect.appendChild(option);
  });
}

// 빈 위치 보기/숨기기 토글
function setupLocationDropdownToggle() {
  const showBtn = document.getElementById('showAvailableLocationsBtn');
  const hideBtn = document.getElementById('hideAvailableLocationsBtn');
  const locationSelect = document.getElementById('locationSelect');
  const locationInput = document.getElementById('locationInput');
  const autoLocationCheckbox = document.getElementById('autoLocationCheckbox');
  
  if (!showBtn || !hideBtn || !locationSelect || !locationInput) {
    console.log('드롭다운 요소를 찾을 수 없습니다:', {
      showBtn: !!showBtn,
      hideBtn: !!hideBtn,
      locationSelect: !!locationSelect,
      locationInput: !!locationInput
    });
    return;
  }
  
  // 기존 이벤트 리스너 제거 (중복 방지)
  const newShowBtn = showBtn.cloneNode(true);
  showBtn.parentNode.replaceChild(newShowBtn, showBtn);
  const newHideBtn = hideBtn.cloneNode(true);
  hideBtn.parentNode.replaceChild(newHideBtn, hideBtn);
  const newLocationSelect = locationSelect.cloneNode(true);
  locationSelect.parentNode.replaceChild(newLocationSelect, locationSelect);
  
  // 새로운 요소 참조
  const actualShowBtn = document.getElementById('showAvailableLocationsBtn');
  const actualHideBtn = document.getElementById('hideAvailableLocationsBtn');
  const actualLocationSelect = document.getElementById('locationSelect');
  
  actualShowBtn.addEventListener('click', async () => {
    console.log('빈 위치 보기 버튼 클릭');
    await loadAvailableLocationsDropdown();
    actualLocationSelect.classList.remove('hidden');
    locationInput.classList.add('hidden');
    actualShowBtn.classList.add('hidden');
    actualHideBtn.classList.remove('hidden');
    if (autoLocationCheckbox) autoLocationCheckbox.checked = false;
  });
  
  actualHideBtn.addEventListener('click', () => {
    console.log('수동 입력 버튼 클릭');
    actualLocationSelect.classList.add('hidden');
    locationInput.classList.remove('hidden');
    actualShowBtn.classList.remove('hidden');
    actualHideBtn.classList.add('hidden');
    actualLocationSelect.value = '';
  });
  
  // 드롭다운 선택 시 입력란에 값 설정
  actualLocationSelect.addEventListener('change', (e) => {
    console.log('드롭다운 선택:', e.target.value);
    if (e.target.value) {
      locationInput.value = e.target.value;
    }
  });
  
  console.log('드롭다운 토글 이벤트 리스너 설정 완료');
  
  // 빈 위치 시각적으로 보기 버튼 이벤트
  const viewLocationMapBtn = document.getElementById('viewLocationMapBtn');
  if (viewLocationMapBtn) {
    const newViewBtn = viewLocationMapBtn.cloneNode(true);
    viewLocationMapBtn.parentNode.replaceChild(newViewBtn, viewLocationMapBtn);
    
    newViewBtn.addEventListener('click', async () => {
      await showLocationMapModal();
    });
  }
}

// 위치 맵 모달 표시 (입고 계획 폼에서 사용)
async function showLocationMapModal() {
  if (!window.supabase) {
    alert('Supabase가 아직 로드되지 않았습니다.');
    return;
  }
  
  const supabase = window.supabase;
  
  // 모달 HTML 생성
  const modalHTML = `
    <div id="locationMapModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div class="p-6 border-b flex justify-between items-center">
          <h2 class="text-2xl font-bold">빈 위치 확인</h2>
          <button id="closeLocationMapModal" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <div class="p-6 overflow-auto flex-1">
          <div id="locationMapContent" class="text-center py-8">
            <div class="text-gray-500">로딩 중...</div>
          </div>
        </div>
        <div class="p-4 border-t bg-gray-50">
          <div class="flex gap-4 text-sm">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-green-200 border border-green-400"></div>
              <span>빈 위치 (사용 가능)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-red-200 border border-red-400"></div>
              <span>사용 중</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-gray-200 border border-gray-400"></div>
              <span>사용 불가/점검 중</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // 기존 모달이 있으면 제거
  const existingModal = document.getElementById('locationMapModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // 모달 추가
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // 닫기 버튼 이벤트
  document.getElementById('closeLocationMapModal').addEventListener('click', () => {
    document.getElementById('locationMapModal').remove();
  });
  
  // 모달 배경 클릭 시 닫기
  document.getElementById('locationMapModal').addEventListener('click', (e) => {
    if (e.target.id === 'locationMapModal') {
      e.target.remove();
    }
  });
  
  // 데이터 로드 및 표시
  const contentDiv = document.getElementById('locationMapContent');
  contentDiv.innerHTML = '<div class="text-gray-500">데이터를 불러오는 중...</div>';
  
  try {
    // 1. 모든 위치 로드
    const { data: locations, error: locError } = await supabase
      .from('wp1_locations')
      .select('location_code, x, y, width, height, status')
      .order('location_code');
    
    if (locError) throw locError;
    
    // 2. 실제 사용 중인 위치 확인 (receiving_items에서)
    const { data: receivingItems, error: recError } = await supabase
      .from('receiving_items')
      .select('location_code, container_no, part_no, quantity');
    
    if (recError) throw recError;
    
    // 3. 출고된 항목 확인 (shipping_instruction에서 shipped된 항목)
    const { data: shippedItems, error: shipError } = await supabase
      .from('shipping_instruction')
      .select('container_no, status')
      .eq('status', 'shipped');
    
    if (shipError) throw shipError;
    
    // 출고된 컨테이너 번호 집합
    const shippedContainers = new Set((shippedItems || []).map(item => item.container_no));
    
    // 실제 사용 중인 위치 집합 (출고되지 않은 항목만)
    const occupiedLocations = new Set();
    (receivingItems || []).forEach(item => {
      if (item.location_code && !shippedContainers.has(item.container_no)) {
        const normalizedCode = normalizeLocationCode(item.location_code);
        occupiedLocations.add(normalizedCode);
      }
    });
    
    // 4. SVG 생성
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '1000');
    svg.setAttribute('height', '800');
    svg.setAttribute('viewBox', '0 0 1000 800');
    svg.style.border = '2px solid #333';
    svg.style.backgroundColor = 'white';
    
    // 배경 요소 로드 (localStorage에서)
    let backgroundElements = [];
    try {
      const saved = localStorage.getItem('wp1_background_elements');
      if (saved) {
        backgroundElements = JSON.parse(saved);
      }
    } catch (e) {
      console.error('배경 요소 로드 실패:', e);
    }
    
    // 배경 요소 렌더링
    backgroundElements.forEach(bg => {
      if (bg.type === 'rect') {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', bg.x);
        rect.setAttribute('y', bg.y);
        rect.setAttribute('width', bg.width);
        rect.setAttribute('height', bg.height);
        rect.setAttribute('fill', bg.fill || '#d3d3d3');
        rect.setAttribute('stroke', bg.stroke || '#000');
        rect.setAttribute('stroke-width', bg.strokeWidth || 1);
        svg.appendChild(rect);
      } else if (bg.type === 'text') {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', bg.x);
        text.setAttribute('y', bg.y);
        text.setAttribute('font-size', bg.fontSize || 15);
        text.setAttribute('fill', bg.fill || '#000');
        text.setAttribute('text-anchor', 'middle');
        text.textContent = bg.text || bg.label || '';
        svg.appendChild(text);
      }
    });
    
    // 위치 렌더링
    const locationsWithCoords = (locations || []).filter(loc => 
      loc.x !== null && loc.y !== null && loc.width !== null && loc.height !== null
    );
    
    locationsWithCoords.forEach(loc => {
      const normalizedCode = normalizeLocationCode(loc.location_code);
      const isOccupied = occupiedLocations.has(normalizedCode);
      const isAvailable = loc.status === 'available' && !isOccupied;
      
      // 위치 박스
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', loc.x);
      rect.setAttribute('y', loc.y);
      rect.setAttribute('width', loc.width);
      rect.setAttribute('height', loc.height);
      
      if (isAvailable) {
        // 빈 위치 - 하이라이트 (초록색)
        rect.setAttribute('fill', '#90EE90');
        rect.setAttribute('fill-opacity', '0.7');
        rect.setAttribute('stroke', '#228B22');
        rect.setAttribute('stroke-width', '2');
      } else if (isOccupied) {
        // 사용 중 (빨간색)
        rect.setAttribute('fill', '#FFB6C1');
        rect.setAttribute('fill-opacity', '0.7');
        rect.setAttribute('stroke', '#DC143C');
        rect.setAttribute('stroke-width', '2');
      } else {
        // 사용 불가/점검 중 (회색)
        rect.setAttribute('fill', '#D3D3D3');
        rect.setAttribute('fill-opacity', '0.5');
        rect.setAttribute('stroke', '#808080');
        rect.setAttribute('stroke-width', '1');
      }
      
      svg.appendChild(rect);
      
      // 위치 코드 텍스트
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', loc.x + loc.width / 2);
      text.setAttribute('y', loc.y + loc.height / 2);
      text.setAttribute('font-size', '10');
      text.setAttribute('fill', '#000');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.textContent = normalizedCode;
      svg.appendChild(text);
    });
    
    contentDiv.innerHTML = '';
    contentDiv.appendChild(svg);
    
    // 통계 정보 추가
    const stats = {
      total: locationsWithCoords.length,
      empty: locationsWithCoords.filter(loc => 
        loc.status === 'available' && !occupiedLocations.has(normalizeLocationCode(loc.location_code))
      ).length,
      occupied: locationsWithCoords.filter(loc => 
        occupiedLocations.has(normalizeLocationCode(loc.location_code))
      ).length,
      unavailable: locationsWithCoords.filter(loc => 
        loc.status !== 'available' || (loc.status === 'available' && occupiedLocations.has(normalizeLocationCode(loc.location_code)))
      ).length - locationsWithCoords.filter(loc => 
        occupiedLocations.has(normalizeLocationCode(loc.location_code))
      ).length
    };
    
    const statsDiv = document.createElement('div');
    statsDiv.className = 'mt-4 p-4 bg-gray-50 rounded-lg';
    statsDiv.innerHTML = `
      <div class="grid grid-cols-4 gap-4 text-center">
        <div>
          <div class="text-2xl font-bold">${stats.total}</div>
          <div class="text-sm text-gray-600">전체 위치</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-green-600">${stats.empty}</div>
          <div class="text-sm text-gray-600">빈 위치</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-red-600">${stats.occupied}</div>
          <div class="text-sm text-gray-600">사용 중</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-gray-600">${stats.unavailable}</div>
          <div class="text-sm text-gray-600">사용 불가/점검</div>
        </div>
      </div>
    `;
    contentDiv.appendChild(statsDiv);
    
  } catch (error) {
    console.error('위치 현황 로드 실패:', error);
    contentDiv.innerHTML = `<div class="text-red-600">데이터 로드 실패: ${error.message}</div>`;
  }
}

// 입고처 드롭다운/직접 입력 토글 설정
function setupReceivingPlaceToggle() {
  const showBtn = document.getElementById('showReceivingPlaceInputBtn');
  const hideBtn = document.getElementById('hideReceivingPlaceInputBtn');
  const receivingPlaceSelect = document.getElementById('receivingPlaceSelect');
  const receivingPlaceInput = document.getElementById('receivingPlaceInput');
  
  if (!showBtn || !hideBtn || !receivingPlaceSelect || !receivingPlaceInput) {
    console.log('입고처 드롭다운 요소를 찾을 수 없습니다:', {
      showBtn: !!showBtn,
      hideBtn: !!hideBtn,
      receivingPlaceSelect: !!receivingPlaceSelect,
      receivingPlaceInput: !!receivingPlaceInput
    });
    return;
  }
  
  // 기존 이벤트 리스너 제거 (중복 방지)
  const newShowBtn = showBtn.cloneNode(true);
  showBtn.parentNode.replaceChild(newShowBtn, showBtn);
  const newHideBtn = hideBtn.cloneNode(true);
  hideBtn.parentNode.replaceChild(newHideBtn, hideBtn);
  const newSelect = receivingPlaceSelect.cloneNode(true);
  receivingPlaceSelect.parentNode.replaceChild(newSelect, receivingPlaceSelect);
  
  // 새로운 요소 참조
  const actualShowBtn = document.getElementById('showReceivingPlaceInputBtn');
  const actualHideBtn = document.getElementById('hideReceivingPlaceInputBtn');
  const actualSelect = document.getElementById('receivingPlaceSelect');
  
  actualShowBtn.addEventListener('click', () => {
    console.log('직접 입력 버튼 클릭');
    actualSelect.classList.add('hidden');
    receivingPlaceInput.classList.remove('hidden');
    actualShowBtn.classList.add('hidden');
    actualHideBtn.classList.remove('hidden');
    actualSelect.value = '';
  });
  
  actualHideBtn.addEventListener('click', () => {
    console.log('드롭다운 선택 버튼 클릭');
    actualSelect.classList.remove('hidden');
    receivingPlaceInput.classList.add('hidden');
    actualShowBtn.classList.remove('hidden');
    actualHideBtn.classList.add('hidden');
    receivingPlaceInput.value = '';
    // 드롭다운도 초기화
    const receivingPlaceSelect = document.getElementById('receivingPlaceSelect');
    if (receivingPlaceSelect) receivingPlaceSelect.value = '';
  });
  
  // 드롭다운 선택 시 입력란에 값 설정 (참고용)
  actualSelect.addEventListener('change', (e) => {
    console.log('입고처 드롭다운 선택:', e.target.value);
  });
  
  console.log('입고처 드롭다운 토글 이벤트 리스너 설정 완료');
}

// 체크박스 이벤트 리스너 직접 연결 함수
function attachAutoLocationCheckboxListener() {
  const autoLocationCheckbox = document.getElementById('autoLocationCheckbox');
  const locationInput = document.getElementById('locationInput');
  const locationSelect = document.getElementById('locationSelect');
  const autoLocDiv = document.getElementById('autoLocationInfo');
  if (autoLocationCheckbox && locationInput) {
    // 기존 리스너 제거 후 재등록 (중복 방지)
    autoLocationCheckbox.onchange = null;
    autoLocationCheckbox.addEventListener('change', async function(e) {
      console.log('체크박스 상태 변경:', e.target.checked);
      if (e.target.checked) {
        // 드롭다운 숨기고 입력란만 사용
        if (locationSelect) {
          locationSelect.classList.add('hidden');
          locationInput.classList.remove('hidden');
        }
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

// Add New Plan 버튼 클릭 시마다 체크박스 리스너 연결은 initSection에서 처리됨

// 테스트 데이터 생성 함수
async function createTestData() {
  try {
    console.log('테스트 데이터 생성 시작...');
    
    // 1. 테스트 receiving_plan 생성
    const { data: planData, error: planError } = await window.supabase
      .from('receiving_plan')
      .insert({
        type: 'container',
        container_no: 'TEST-001',
        receive_date: new Date().toISOString().slice(0, 10),
      })
      .select('id')
      .single();
    
    if (planError) {
      console.error('Plan 생성 실패:', planError);
      return;
    }
    
    console.log('Plan 생성 성공:', planData);
    
    // 2. 테스트 receiving_items 생성
    const testItems = [
      {
        plan_id: planData.id,
        part_no: 'PART-A001',
        quantity: 100,
        location_code: 'A-01',
        label_id: crypto.randomUUID(),
        container_no: 'TEST-001',
        receiving_place: 'Test Warehouse',
      },
      {
        plan_id: planData.id,
        part_no: 'PART-B002',
        quantity: 50,
        location_code: 'A-02',
        label_id: crypto.randomUUID(),
        container_no: 'TEST-001',
        receiving_place: 'Test Warehouse',
      }
    ];
    
    const { data: itemsData, error: itemsError } = await window.supabase
      .from('receiving_items')
      .insert(testItems)
      .select('*');
    
    if (itemsError) {
      console.error('Items 생성 실패:', itemsError);
      return;
    }
    
    console.log('Items 생성 성공:', itemsData);
    
    // 3. 테스트 receiving_log 생성 (입고 완료)
    const logData = testItems.map(item => ({
      label_id: item.label_id,
      received_at: new Date().toISOString(),
      confirmed_by: 'admin',
    }));
    
    const { data: logDataResult, error: logError } = await window.supabase
      .from('receiving_log')
      .insert(logData)
      .select('*');
    
    if (logError) {
      console.error('Log 생성 실패:', logError);
      return;
    }
    
    console.log('Log 생성 성공:', logDataResult);
    console.log('테스트 데이터 생성 완료!');
    
    // 페이지 새로고침
    window.location.reload();
    
  } catch (error) {
    console.error('테스트 데이터 생성 중 오류:', error);
  }
}

// 테스트 데이터 생성 버튼 추가
function addTestDataButton() {
  const container = document.querySelector('.container');
  if (container) {
    const testButton = document.createElement('button');
    testButton.textContent = '테스트 데이터 생성';
    testButton.className = 'bg-red-600 text-white px-4 py-2 rounded font-semibold mb-4';
    testButton.onclick = createTestData;
    container.insertBefore(testButton, container.firstChild);
  }
}

// 데이터 표시 함수
async function displayPlans(plans) {
  // receiving_log 데이터 조회
  const { data: logs, error: logError } = await window.supabase.from('receiving_log').select('label_id, received_at');
  if (logError) throw logError;
  const logMap = new Map();
  (logs || []).forEach(log => logMap.set(String(log.label_id), log));

  if (!planListBody) {
    console.error('planListBody is null in displayPlans');
    if (!initializeElements()) {
      console.error('Failed to initialize elements');
      return;
    }
  }

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
    
    // DELETE 버튼: 입고 완료된 경우 비활성화
    const deleteBtnDisabled = allReceived ? 'disabled' : '';
    const deleteBtnClass = allReceived ? 'delete-btn text-gray-400 cursor-not-allowed' : 'delete-btn text-red-600';
    const deleteBtnTitle = allReceived ? '입고 완료된 계획은 삭제할 수 없습니다' : '';
    
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
          <button class="${deleteBtnClass}" data-id="${plan.id}" ${deleteBtnDisabled} title="${deleteBtnTitle}">Delete</button>
        </td>
        <td class="px-2 py-2 border">
          ${forceBtn}
        </td>
      </tr>
    `;
  }).join('');
  
  // displayPlans 후 항상 이벤트 리스너 바인딩
  isEventListenersBound = false;
  bindEventListeners();
}

// 데이터베이스 상태 확인 함수
async function checkDatabaseStatus() {
  try {
    console.log('=== 데이터베이스 상태 확인 ===');
    
    // 1. receiving_plan 테이블 확인
    const { data: plans, error: planError } = await window.supabase
      .from('receiving_plan')
      .select('*')
      .limit(5);
    
    if (planError) {
      console.error('receiving_plan 조회 실패:', planError);
    } else {
      console.log('receiving_plan 데이터:', plans);
    }
    
    // 2. receiving_items 테이블 확인
    const { data: items, error: itemError } = await window.supabase
      .from('receiving_items')
      .select('*')
      .limit(5);
    
    if (itemError) {
      console.error('receiving_items 조회 실패:', itemError);
    } else {
      console.log('receiving_items 데이터:', items);
    }
    
    // 3. receiving_log 테이블 확인
    const { data: logs, error: logError } = await window.supabase
      .from('receiving_log')
      .select('*')
      .limit(5);
    
    if (logError) {
      console.error('receiving_log 조회 실패:', logError);
    } else {
      console.log('receiving_log 데이터:', logs);
    }
    
    // 4. 테이블 스키마 확인 (가능한 경우)
    console.log('=== 테이블 스키마 정보 ===');
    console.log('receiving_plan 필드:', plans && plans.length > 0 ? Object.keys(plans[0]) : '데이터 없음');
    console.log('receiving_items 필드:', items && items.length > 0 ? Object.keys(items[0]) : '데이터 없음');
    console.log('receiving_log 필드:', logs && logs.length > 0 ? Object.keys(logs[0]) : '데이터 없음');
    
  } catch (error) {
    console.error('데이터베이스 상태 확인 중 오류:', error);
  }
}

// 데이터베이스 상태 확인 버튼 추가
function addDatabaseStatusButton() {
  const container = document.querySelector('.container');
  if (container) {
    const statusButton = document.createElement('button');
    statusButton.textContent = 'DB 상태 확인';
    statusButton.className = 'bg-yellow-600 text-white px-4 py-2 rounded font-semibold mb-4 ml-2';
    statusButton.onclick = checkDatabaseStatus;
    container.insertBefore(statusButton, container.firstChild.nextSibling);
  }
}
  