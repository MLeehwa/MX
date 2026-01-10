// CKD PALLET 전용 관리 시스템
// 위치와 상관없이 입출고 관리

const supabase = window.supabase;
const CKD_PALLET_PART_NO = 'CKD PALLET';

// DOM 요소
let stockInfo, tabReceiving, tabShipping, tabHistory;
let receivingSection, shippingSection, historySection;
let receiveDateInput, quantityInput, remarkInput;
let receivingPlaceInput; // 읽기 전용 (PTA 고정)
let containerNoInput; // 트레일러 번호 표시용 (읽기 전용)
let shippingDateInput, shippingQuantityInput, shippingRemarkInput;
let submitReceivingBtn, submitShippingBtn;
let historyStartDate, historyEndDate, searchHistoryBtn, historyTableBody;
let messageModal, messageTitle, messageContent, messageConfirmBtn;

// 초기화
function initializeElements() {
  stockInfo = document.getElementById('stockInfo');
  tabReceiving = document.getElementById('tabReceiving');
  tabShipping = document.getElementById('tabShipping');
  tabHistory = document.getElementById('tabHistory');
  receivingSection = document.getElementById('receivingSection');
  shippingSection = document.getElementById('shippingSection');
  historySection = document.getElementById('historySection');
  
  containerNoInput = document.getElementById('containerNoInput'); // 읽기 전용
  receiveDateInput = document.getElementById('receiveDateInput');
  receivingPlaceInput = document.getElementById('receivingPlaceInput'); // 읽기 전용
  quantityInput = document.getElementById('quantityInput');
  remarkInput = document.getElementById('remarkInput');
  
  shippingDateInput = document.getElementById('shippingDateInput');
  shippingQuantityInput = document.getElementById('shippingQuantityInput');
  shippingRemarkInput = document.getElementById('shippingRemarkInput');
  
  submitReceivingBtn = document.getElementById('submitReceivingBtn');
  submitShippingBtn = document.getElementById('submitShippingBtn');
  
  historyStartDate = document.getElementById('historyStartDate');
  historyEndDate = document.getElementById('historyEndDate');
  searchHistoryBtn = document.getElementById('searchHistoryBtn');
  historyTableBody = document.getElementById('historyTableBody');
  
  messageModal = document.getElementById('messageModal');
  messageTitle = document.getElementById('messageTitle');
  messageContent = document.getElementById('messageContent');
  messageConfirmBtn = document.getElementById('messageConfirmBtn');
}

// 현재 재고 조회 (receiving_log에 기록된 것만 카운트)
async function loadCurrentStock() {
  try {
    // 1. receiving_log에 기록된 label_id 조회
    const { data: logs, error: logError } = await supabase
      .from('receiving_log')
      .select('label_id');
    
    if (logError) throw logError;
    
    const receivedLabelIds = new Set((logs || []).map(l => String(l.label_id)));
    
    // 2. receiving_items에서 CKD PALLET 조회 (receiving_log에 기록된 것만)
    const { data: items, error: itemsError } = await supabase
      .from('receiving_items')
      .select('quantity, label_id')
      .eq('part_no', CKD_PALLET_PART_NO);
    
    if (itemsError) throw itemsError;
    
    // receiving_log에 기록된 항목만 수량 합산
    const totalQuantity = (items || [])
      .filter(item => receivedLabelIds.has(String(item.label_id)))
      .reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    if (stockInfo) {
      stockInfo.innerHTML = `${totalQuantity.toLocaleString()} <span class="text-lg">개</span>`;
    }
  } catch (error) {
    console.error('재고 조회 실패:', error);
    if (stockInfo) {
      stockInfo.innerHTML = '<span class="text-red-500">재고 조회 실패</span>';
    }
  }
}

// 탭 전환
function setupTabs() {
  if (tabReceiving) {
    tabReceiving.addEventListener('click', () => {
      switchTab('receiving');
    });
  }
  
  if (tabShipping) {
    tabShipping.addEventListener('click', () => {
      switchTab('shipping');
    });
  }
  
  if (tabHistory) {
    tabHistory.addEventListener('click', () => {
      switchTab('history');
    });
  }
}

function switchTab(tabName) {
  // 탭 버튼 스타일
  [tabReceiving, tabShipping, tabHistory].forEach(btn => {
    if (btn) {
      btn.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
      btn.classList.add('text-gray-500');
    }
  });
  
  // 섹션 표시/숨김
  [receivingSection, shippingSection, historySection].forEach(section => {
    if (section) {
      section.classList.add('hidden');
    }
  });
  
  if (tabName === 'receiving') {
    if (tabReceiving) {
      tabReceiving.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
      tabReceiving.classList.remove('text-gray-500');
    }
    if (receivingSection) receivingSection.classList.remove('hidden');
  } else if (tabName === 'shipping') {
    if (tabShipping) {
      tabShipping.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
      tabShipping.classList.remove('text-gray-500');
    }
    if (shippingSection) shippingSection.classList.remove('hidden');
  } else if (tabName === 'history') {
    if (tabHistory) {
      tabHistory.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
      tabHistory.classList.remove('text-gray-500');
    }
    if (historySection) historySection.classList.remove('hidden');
  }
}

// 입고 등록 (트레일러 번호 자동 부여, 입고처는 항상 PTA)
async function handleReceiving() {
  const receiveDate = receiveDateInput?.value;
  const quantity = parseInt(quantityInput?.value);
  const remark = remarkInput?.value.trim();
  const receivingPlace = 'PTA'; // 항상 PTA로 고정
  
  // 검증
  if (!receiveDate) {
    showMessage('알림', '입고일을 선택해주세요.');
    return;
  }
  
  if (!quantity || quantity <= 0) {
    showMessage('알림', '수량을 올바르게 입력해주세요.');
    return;
  }
  
  try {
    // 1. receiving_plan 생성 (trailer 타입, trailer_seq 자동 생성)
    const { data: plan, error: planError } = await supabase
      .from('receiving_plan')
      .insert({
        type: 'trailer',
        receive_date: receiveDate
      })
      .select('id, trailer_seq')
      .single();
    
    if (planError) throw planError;
    
    // 2. 트레일러 번호 자동 생성 (T-00001 형식)
    const trailerNo = `T-${String(plan.trailer_seq).padStart(5, '0')}`;
    
    // 3. Plan의 container_no 업데이트
    await supabase
      .from('receiving_plan')
      .update({ container_no: trailerNo })
      .eq('id', plan.id);
    
    // 4. receiving_items 생성
    const labelId = crypto.randomUUID();
    const { error: itemsError } = await supabase
      .from('receiving_items')
      .insert({
        plan_id: plan.id,
        part_no: CKD_PALLET_PART_NO,
        quantity: quantity,
        container_no: trailerNo,
        receiving_place: receivingPlace,
        location_code: null, // 위치 무관
        label_id: labelId
      });
    
    if (itemsError) throw itemsError;
    
    // 5. receiving_log 생성 (실제 입고 처리 기록 - 이것이 있어야 재고에 반영됨)
    const now = new Date();
    const etTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    
    const { error: logError } = await supabase
      .from('receiving_log')
      .insert({
        label_id: labelId,
        received_at: etTime.toISOString()
      });
    
    if (logError) throw logError;
    
    // 폼 초기화
    receiveDateInput.value = '';
    quantityInput.value = '';
    remarkInput.value = '';
    
    showMessage('성공', `입고가 등록되었습니다. (트레일러 번호: ${trailerNo}, 수량: ${quantity}개)`);
    await loadCurrentStock();
  } catch (error) {
    console.error('입고 등록 실패:', error);
    showMessage('오류', '입고 등록 중 오류가 발생했습니다: ' + error.message);
  }
}

// 출고 등록 (위치 보기와 동일하게 pending 상태로 생성, 확정 시 차감)
async function handleShipping() {
  const shippingDate = shippingDateInput?.value;
  const shippingQuantity = parseInt(shippingQuantityInput?.value);
  const remark = shippingRemarkInput?.value.trim();
  
  // 검증
  if (!shippingDate) {
    showMessage('알림', '출고일을 선택해주세요.');
    return;
  }
  
  if (!shippingQuantity || shippingQuantity <= 0) {
    showMessage('알림', '출고 수량을 올바르게 입력해주세요.');
    return;
  }
  
  try {
    // 1. receiving_log에 기록된 label_id 조회 (실제 입고 처리된 것만)
    const { data: logs, error: logError } = await supabase
      .from('receiving_log')
      .select('label_id');
    
    if (logError) throw logError;
    
    const receivedLabelIds = new Set((logs || []).map(l => String(l.label_id)));
    
    // 2. 현재 재고 확인 (receiving_log에 기록된 것만)
    const { data: items, error: itemsError } = await supabase
      .from('receiving_items')
      .select('id, quantity, label_id, container_no, receiving_plan(receive_date)')
      .eq('part_no', CKD_PALLET_PART_NO)
      .order('receiving_plan(receive_date)', { ascending: true }); // FIFO: 오래된 것부터
    
    if (itemsError) throw itemsError;
    
    // receiving_log에 기록된 항목만 필터링
    const availableItems = items.filter(item => receivedLabelIds.has(String(item.label_id)));
    
    const totalStock = availableItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    if (totalStock < shippingQuantity) {
      showMessage('오류', `재고가 부족합니다. 현재 재고: ${totalStock}개`);
      return;
    }
    
    // 3. FIFO 방식으로 출고할 항목 선택 (아직 차감하지 않음)
    let remainingQuantity = shippingQuantity;
    const shippingItems = []; // shipping_instruction_items에 저장할 항목들
    
    for (const item of availableItems) {
      if (remainingQuantity <= 0) break;
      
      const itemQuantity = item.quantity || 0;
      
      if (itemQuantity <= remainingQuantity) {
        // 전체 출고
        shippingItems.push({
          label_id: item.label_id,
          qty: itemQuantity
        });
        remainingQuantity -= itemQuantity;
      } else {
        // 부분 출고
        shippingItems.push({
          label_id: item.label_id,
          qty: remainingQuantity
        });
        remainingQuantity = 0;
      }
    }
    
    // 3. shipping_instruction 생성 (pending 상태)
    const partQuantitiesJson = JSON.stringify({ [CKD_PALLET_PART_NO]: shippingQuantity });
    
    const { data: shippingInstruction, error: siError } = await supabase
      .from('shipping_instruction')
      .insert({
        container_no: 'CKD PALLET',
        part_no: CKD_PALLET_PART_NO,
        shipping_date: shippingDate,
        status: 'pending', // pending 상태로 생성
        barcode: crypto.randomUUID(),
        qty: shippingQuantity,
        part_quantities: partQuantitiesJson
      })
      .select('id, barcode')
      .single();
    
    if (siError) throw siError;
    
    // 4. shipping_instruction_items 생성 (shipped_at은 null, 확정 시 업데이트)
    const itemsToInsert = shippingItems.map(item => ({
      shipping_instruction_id: shippingInstruction.id,
      label_id: item.label_id,
      qty: item.qty
    }));
    
    const { error: itemError } = await supabase
      .from('shipping_instruction_items')
      .insert(itemsToInsert);
    
    if (itemError) throw itemError;
    
    // 5. 출고증 프린트
    printShippingLabel(shippingInstruction.barcode);
    
    // 폼 초기화
    shippingDateInput.value = '';
    shippingQuantityInput.value = '';
    shippingRemarkInput.value = '';
    
    showMessage('성공', `출고 지시서가 생성되었습니다. (${shippingQuantity}개)\n출하 확정 페이지에서 확정해주세요.`);
    await loadCurrentStock();
  } catch (error) {
    console.error('출고 등록 실패:', error);
    showMessage('오류', '출고 등록 중 오류가 발생했습니다: ' + error.message);
  }
}

// 출고증 프린트 함수 (shipping_confirmation_admin.js의 printShippingLabel 재사용)
async function printShippingLabel(barcode) {
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

    // 라벨 출력 로직
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
        if (typeof shipping.part_quantities === 'string') {
          partQuantities = JSON.parse(shipping.part_quantities);
        } else {
          partQuantities = shipping.part_quantities;
        }
      } catch (e) {
        console.error('Error parsing part_quantities:', e);
      }
    }
    
    // part_quantities가 비어있고 qty가 있으면 사용
    if (Object.keys(partQuantities).length === 0 && shipping.qty) {
      partQuantities[shipping.part_no || 'CKD PALLET'] = shipping.qty;
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
            <th>Date</th>
            <td>${dateStr}</td>
            <th>Time</th>
            <td>${timeStr}</td>
          </tr>
        </table>
        <table class='bol-table'>
          <tr>
            <th style='width:20%'>Part No.</th>
            <th style='width:40%'>Description</th>
            <th style='width:20%'>Qty</th>
            <th style='width:20%'>Location</th>
          </tr>
          ${Object.entries(partQuantities).map(([part, qty]) => `
            <tr>
              <td>${part}</td>
              <td>${description}</td>
              <td>${qty}</td>
              <td>${location}</td>
            </tr>
          `).join('')}
        </table>
        <div class='bol-barcode'>Barcode: ${bolNo}</div>
        <table class='bol-table bol-sign'>
          <tr>
            <th style='width:50%'>Shipper Signature</th>
            <th style='width:50%'>Receiver Signature</th>
          </tr>
          <tr>
            <td style='height:60px;'></td>
            <td style='height:60px;'></td>
          </tr>
        </table>
        <div class='bol-footer'>Remarks: ${remarks}</div>
      </div>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  } catch (error) {
    console.error('출고증 프린트 실패:', error);
    alert('출고증 프린트 중 오류가 발생했습니다: ' + error.message);
  }
}

// 입출고 이력 조회
async function loadHistory() {
  const startDate = historyStartDate?.value;
  const endDate = historyEndDate?.value;
  
  if (!startDate || !endDate) {
    showMessage('알림', '시작일과 종료일을 모두 선택해주세요.');
    return;
  }
  
  try {
    historyTableBody.innerHTML = '<tr><td colspan="6" class="border px-4 py-4 text-center text-gray-500">로딩 중...</td></tr>';
    
    // 입고 이력 (receiving_plan + receiving_items)
    const { data: receivingPlans, error: recError } = await supabase
      .from('receiving_plan')
      .select(`
        id,
        receive_date,
        container_no,
        receiving_items (
          quantity,
          receiving_place,
          part_no
        )
      `)
      .gte('receive_date', startDate)
      .lte('receive_date', endDate);
    
    if (recError) throw recError;
    
    // 출고 이력 (shipping_instruction)
    const { data: shippingInstructions, error: shipError } = await supabase
      .from('shipping_instruction')
      .select('shipping_date, part_quantities, container_no')
      .eq('part_no', CKD_PALLET_PART_NO)
      .gte('shipping_date', startDate)
      .lte('shipping_date', endDate);
    
    if (shipError) throw shipError;
    
    // 데이터 합치기 및 정렬
    const history = [];
    
    // 입고 이력 추가
    receivingPlans.forEach(plan => {
      plan.receiving_items?.forEach(item => {
        if (item.part_no === CKD_PALLET_PART_NO) {
          history.push({
            date: plan.receive_date,
            type: '입고',
            container: plan.container_no || '-',
            quantity: item.quantity || 0,
            receivingPlace: item.receiving_place || '-',
            remark: ''
          });
        }
      });
    });
    
    // 출고 이력 추가
    shippingInstructions.forEach(si => {
      const quantity = si.part_quantities?.[CKD_PALLET_PART_NO] || 0;
      if (quantity > 0) {
        history.push({
          date: si.shipping_date,
          type: '출고',
          container: si.container_no || '-',
          quantity: quantity,
          receivingPlace: '-',
          remark: ''
        });
      }
    });
    
    // 날짜순 정렬
    history.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // 테이블 렌더링
    if (history.length === 0) {
      historyTableBody.innerHTML = '<tr><td colspan="6" class="border px-4 py-4 text-center text-gray-500">해당 기간의 이력이 없습니다.</td></tr>';
    } else {
      historyTableBody.innerHTML = history.map(item => `
        <tr>
          <td class="border px-4 py-2">${item.date}</td>
          <td class="border px-4 py-2 ${item.type === '입고' ? 'text-green-600 font-semibold' : 'text-blue-600 font-semibold'}">${item.type}</td>
          <td class="border px-4 py-2">${item.container}</td>
          <td class="border px-4 py-2">${item.quantity.toLocaleString()}개</td>
          <td class="border px-4 py-2">${item.receivingPlace}</td>
          <td class="border px-4 py-2">${item.remark || '-'}</td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error('이력 조회 실패:', error);
    historyTableBody.innerHTML = '<tr><td colspan="6" class="border px-4 py-4 text-center text-red-500">이력 조회 중 오류가 발생했습니다.</td></tr>';
  }
}

// 메시지 모달 표시
function showMessage(title, content) {
  if (messageTitle) messageTitle.textContent = title;
  if (messageContent) messageContent.textContent = content;
  if (messageModal) messageModal.classList.remove('hidden');
}

// 이벤트 리스너 설정
function setupEventListeners() {
  if (submitReceivingBtn) {
    submitReceivingBtn.addEventListener('click', handleReceiving);
  }
  
  if (submitShippingBtn) {
    submitShippingBtn.addEventListener('click', handleShipping);
  }
  
  if (searchHistoryBtn) {
    searchHistoryBtn.addEventListener('click', loadHistory);
  }
  
  if (messageConfirmBtn) {
    messageConfirmBtn.addEventListener('click', () => {
      if (messageModal) messageModal.classList.add('hidden');
    });
  }
  
  // 오늘 날짜 기본값 설정
  const today = new Date().toISOString().split('T')[0];
  if (receiveDateInput) receiveDateInput.value = today;
  if (shippingDateInput) shippingDateInput.value = today;
  if (historyStartDate) historyStartDate.value = today;
  if (historyEndDate) historyEndDate.value = today;
}

// 메인 초기화 함수
export async function initSection() {
  console.log('CKD PALLET 섹션 초기화 중...');
  
  initializeElements();
  setupTabs();
  setupEventListeners();
  await loadCurrentStock();
  
  console.log('CKD PALLET 섹션 초기화 완료');
}
