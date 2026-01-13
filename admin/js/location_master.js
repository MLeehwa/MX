// HTML 렌더링 함수
function renderLocationMasterUI() {
  const app = document.getElementById('locationMasterApp');
  if (!app) {
    console.error('locationMasterApp 요소를 찾을 수 없습니다.');
    return;
  }
  
  app.innerHTML = `
  <div class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
    <p class="text-sm text-yellow-800 mb-2">
      <strong>💡 좌표 정보가 없는 위치:</strong> 시각적 편집기에서 표시되지 않습니다. 
      X, Y, 너비, 높이를 입력하면 시각적 편집기에서도 편집할 수 있습니다.
    </p>
  </div>
  <div class="mb-6">
    <h2 class="text-xl font-bold mb-4">위치 등록</h2>
    <form id="addLocationForm" class="bg-white p-4 rounded-lg shadow mb-6">
      <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p class="text-sm text-blue-800 mb-2">
          <strong>💡 일괄 등록 방법:</strong> 여러 위치 코드를 한번에 입력할 수 있습니다. 각 줄에 하나씩 입력하세요.
        </p>
        <p class="text-xs text-blue-600">예: A-01, A-02, A-03 또는 A1, A2, A3 (자동으로 정규화됩니다)</p>
      </div>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div class="col-span-2">
          <label class="block text-sm font-semibold mb-1">위치코드 * (여러 개 입력 가능, 줄바꿈으로 구분)</label>
          <textarea id="locationCodeInput" placeholder="예: A-01&#10;A-02&#10;A-03&#10;또는&#10;A1&#10;A2&#10;A3" required class="w-full border px-3 py-2 rounded" rows="5"></textarea>
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">상태 * (모든 위치에 공통 적용)</label>
          <select id="statusInput" class="w-full border px-3 py-2 rounded">
            <option value="available">사용가능</option>
            <option value="occupied">점유중</option>
            <option value="maintenance">점검중</option>
            <option value="disabled">사용불가</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">X 좌표 (SVG, 선택사항)</label>
          <input type="number" id="xInput" placeholder="예: 2" class="w-full border px-3 py-2 rounded">
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">Y 좌표 (SVG, 선택사항)</label>
          <input type="number" id="yInput" placeholder="예: 1" class="w-full border px-3 py-2 rounded">
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">너비 (SVG, 선택사항)</label>
          <input type="number" id="widthInput" placeholder="예: 60" class="w-full border px-3 py-2 rounded">
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">높이 (SVG, 선택사항)</label>
          <input type="number" id="heightInput" placeholder="예: 20" class="w-full border px-3 py-2 rounded">
        </div>
        <div class="col-span-2">
          <label class="block text-sm font-semibold mb-1">비고 (모든 위치에 공통 적용, 선택사항)</label>
          <input type="text" id="remarkInput" placeholder="비고 입력" class="w-full border px-3 py-2 rounded">
        </div>
      </div>
      <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">일괄 등록</button>
    </form>
    <div class="mt-4">
      <button id="viewCurrentLocationsBtn" class="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
        📍 현재 위치 보기
      </button>
    </div>
  </div>
  <div>
    <h2 class="text-xl font-bold mb-4">위치 목록</h2>
    <div class="mb-4">
      <label class="block text-sm font-semibold mb-1">상태 필터</label>
      <select id="statusFilter" class="border px-3 py-2 rounded">
        <option value="">전체</option>
        <option value="available">사용가능</option>
        <option value="occupied">점유중</option>
        <option value="maintenance">점검중</option>
        <option value="disabled">사용불가</option>
      </select>
    </div>
    <div class="mb-4 flex justify-between items-center">
      <div>
        <button id="batchSaveBtn" class="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">일괄 저장</button>
        <span class="text-sm text-gray-600 ml-4">💡 Excel처럼 편집 가능합니다 (Tab, Enter, 화살표 키 사용)</span>
      </div>
      <div>
        <button id="addRowBtn" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2">행 추가</button>
        <button id="deleteRowBtn" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">행 삭제</button>
      </div>
    </div>
    <div id="locationGrid" class="mb-12"></div>
  </div>
`;
}

// Handsontable 인스턴스
let hotInstance = null;
let locationDataMap = new Map(); // id -> location 객체 매핑

// 위치 목록 불러오기
async function loadLocations() {
  if (!window.supabase) {
    console.error('Supabase가 아직 로드되지 않았습니다.');
    const grid = document.getElementById('locationGrid');
    if (grid) {
      grid.innerHTML = '<div class="text-red-600 text-center py-4">Supabase 로드 중... 페이지를 새로고침하세요.</div>';
    }
    return;
  }
  
  const supabase = window.supabase;
  const grid = document.getElementById('locationGrid');
  if (!grid) {
    console.error('locationGrid 요소를 찾을 수 없습니다.');
    return;
  }
  
  const statusFilter = document.getElementById('statusFilter');
  const filterValue = statusFilter ? statusFilter.value : '';
  
  grid.innerHTML = '<div class="text-center py-4">로딩 중...</div>';
  
  let query = supabase.from('mx_locations').select('*');
  if (filterValue) {
    query = query.eq('status', filterValue);
  }
  query = query.order('location_code');
  
  const { data, error } = await query;
  if (error) {
    grid.innerHTML = `<div class="text-red-600 text-center py-4">Error: ${error.message}</div>`;
    return;
  }
  
  if (!data || data.length === 0) {
    grid.innerHTML = '<div class="text-center py-4 text-gray-500">등록된 위치가 없습니다.</div>';
    if (hotInstance) {
      hotInstance.destroy();
      hotInstance = null;
    }
    return;
  }
  
  // 데이터 매핑 초기화
  locationDataMap.clear();
  data.forEach(loc => {
    locationDataMap.set(loc.id, loc);
  });
  
  // Handsontable 데이터 준비
  const hotData = data.map(loc => [
    loc.id, // 숨김 컬럼: ID
    loc.location_code || '',
    loc.status || 'available',
    loc.x !== null && loc.x !== undefined ? loc.x : '',
    loc.y !== null && loc.y !== undefined ? loc.y : '',
    loc.width !== null && loc.width !== undefined ? loc.width : '',
    loc.height !== null && loc.height !== undefined ? loc.height : '',
    loc.remark || ''
  ]);
  
  // Handsontable 초기화 또는 업데이트
  if (hotInstance) {
    hotInstance.loadData(hotData);
  } else {
    const statusOptions = ['available', 'occupied', 'maintenance', 'disabled'];
    const statusLabels = ['사용가능', '점유중', '점검중', '사용불가'];
    
    hotInstance = new Handsontable(grid, {
      data: hotData,
      colHeaders: ['위치코드', '상태', 'X', 'Y', '너비', '높이', '비고'],
      columns: [
        { data: 0, readOnly: true, width: 0 }, // ID 숨김 (width 0으로)
        { data: 1, type: 'text', validator: function(value, callback) {
          if (!value || value.trim() === '') {
            callback(false);
          } else {
            callback(true);
          }
        }},
        { 
          data: 2, 
          type: 'dropdown',
          source: statusOptions,
          renderer: function(instance, td, row, col, prop, value, cellProperties) {
            const labels = ['사용가능', '점유중', '점검중', '사용불가'];
            const index = statusOptions.indexOf(value);
            td.innerHTML = index >= 0 ? labels[index] : value;
            Handsontable.renderers.TextRenderer.apply(this, arguments);
          }
        },
        { data: 3, type: 'numeric', allowInvalid: false },
        { data: 4, type: 'numeric', allowInvalid: false },
        { data: 5, type: 'numeric', allowInvalid: false },
        { data: 6, type: 'numeric', allowInvalid: false },
        { data: 7, type: 'text' }
      ],
      rowHeaders: true,
      colWidths: [0, 120, 100, 80, 80, 80, 80, 200],
      hiddenColumns: {
        columns: [0], // 첫 번째 컬럼(ID) 숨김
        indicators: false
      },
      manualColumnResize: true,
      manualRowResize: true,
      contextMenu: true,
      filters: true,
      dropdownMenu: true,
      licenseKey: 'non-commercial-and-evaluation',
      afterChange: function(changes, source) {
        if (source !== 'loadData') {
          // 변경사항이 있으면 표시 (선택사항)
        }
      }
    });
  }
}

// 위치 등록 이벤트 리스너 설정
function setupLocationForm() {
  const addLocationForm = document.getElementById('addLocationForm');
  if (!addLocationForm) {
    console.error('addLocationForm을 찾을 수 없습니다.');
    return;
  }
  
  const newForm = addLocationForm.cloneNode(true);
  addLocationForm.parentNode.replaceChild(newForm, addLocationForm);
  
  newForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!window.supabase) {
      alert('Supabase가 아직 로드되지 않았습니다. 페이지를 새로고침하세요.');
      return;
    }
    const supabase = window.supabase;
    
    let location_code = document.getElementById('locationCodeInput').value.trim();
    const status = document.getElementById('statusInput').value;
    const remark = document.getElementById('remarkInput').value.trim();
    const x = document.getElementById('xInput').value ? parseInt(document.getElementById('xInput').value) : null;
    const y = document.getElementById('yInput').value ? parseInt(document.getElementById('yInput').value) : null;
    const width = document.getElementById('widthInput').value ? parseInt(document.getElementById('widthInput').value) : null;
    const height = document.getElementById('heightInput').value ? parseInt(document.getElementById('heightInput').value) : null;
    
    const locationCodesText = document.getElementById('locationCodeInput').value.trim();
    if (!locationCodesText) {
      alert('위치코드를 입력하세요.');
      return;
    }
    
    // 여러 줄로 구분된 위치 코드 파싱
    const locationCodes = locationCodesText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (locationCodes.length === 0) {
      alert('위치코드를 입력하세요.');
      return;
    }
    
    // 정규화된 위치 코드 배열 생성
    const normalizedCodes = locationCodes.map(code => normalizeLocationCode(code));
    
    // 중복 제거
    const uniqueCodes = [...new Set(normalizedCodes)];
    
    // 일괄 등록 데이터 생성
    const locationsToInsert = uniqueCodes.map(location_code => {
      const locationData = {
        location_code,
        status,
        remark: remark || null
      };
      
      if (x !== null) locationData.x = x;
      if (y !== null) locationData.y = y;
      if (width !== null) locationData.width = width;
      if (height !== null) locationData.height = height;
      
      return locationData;
    });
    
    // 일괄 삽입
    const { data, error } = await supabase.from('mx_locations').insert(locationsToInsert).select();
    
    if (error) {
      // 중복 에러인 경우 부분 성공 메시지 표시
      if (error.code === '23505') {
        const successCount = uniqueCodes.length - 1;
        alert(`일부 위치가 이미 존재합니다. ${successCount > 0 ? successCount + '개 위치가 등록되었습니다.' : '등록된 위치가 없습니다.'}`);
      } else {
        alert('등록 실패: ' + error.message);
        return;
      }
    } else {
      alert(`${uniqueCodes.length}개 위치가 등록되었습니다.`);
    }
    
    newForm.reset();
    await loadLocations();
    
    // 시각적 편집기가 열려있으면 알림 (선택사항)
    if (window.opener && window.opener.location && window.opener.location.href.includes('location_editor')) {
      console.log('시각적 편집기에서 새로고침이 필요할 수 있습니다.');
    }
  });
}

// 상태 필터 이벤트 설정
function setupStatusFilter() {
  const statusFilter = document.getElementById('statusFilter');
  if (!statusFilter) {
    console.error('statusFilter를 찾을 수 없습니다.');
    return;
  }
  
  const newFilter = statusFilter.cloneNode(true);
  statusFilter.parentNode.replaceChild(newFilter, statusFilter);
  
  newFilter.addEventListener('change', () => {
    if (hotInstance) {
      hotInstance.destroy();
      hotInstance = null;
    }
    loadLocations();
  });
}


// 일괄 저장 함수 - Handsontable의 모든 위치 저장
async function batchSaveLocations() {
  if (!window.supabase) {
    alert('Supabase가 아직 로드되지 않았습니다.');
    return;
  }
  
  if (!hotInstance) {
    alert('그리드가 로드되지 않았습니다.');
    return;
  }
  
  const supabase = window.supabase;
  const data = hotInstance.getData();
  
  if (data.length === 0) {
    alert('저장할 위치가 없습니다.');
    return;
  }
  
  if (!confirm(`모든 위치(${data.length}개)의 변경사항을 저장하시겠습니까?`)) {
    return;
  }
  
  const updates = [];
  const inserts = [];
  let errorCount = 0;
  let successCount = 0;
  let insertCount = 0;
  
  // Handsontable 데이터를 순회하며 변경사항 수집
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const id = row[0]; // ID
    const location_code = (row[1] || '').trim();
    const status = row[2] || 'available';
    const x = row[3] !== '' && row[3] !== null && row[3] !== undefined ? parseInt(row[3]) : null;
    const y = row[4] !== '' && row[4] !== null && row[4] !== undefined ? parseInt(row[4]) : null;
    const width = row[5] !== '' && row[5] !== null && row[5] !== undefined ? parseInt(row[5]) : null;
    const height = row[6] !== '' && row[6] !== null && row[6] !== undefined ? parseInt(row[6]) : null;
    const remark = (row[7] || '').trim() || null;
    
    if (!location_code) {
      continue; // 위치 코드가 없으면 스킵
    }
    
    const normalizedCode = normalizeLocationCode(location_code);
    const updateData = {
      location_code: normalizedCode,
      status,
      remark,
      x,
      y,
      width,
      height
    };
    
    if (id && locationDataMap.has(id)) {
      // 기존 위치 업데이트
      updates.push({ id, data: updateData });
    } else {
      // 새 위치 추가
      inserts.push(updateData);
    }
  }
  
  // 업데이트 실행
  for (const update of updates) {
    const { error } = await supabase.from('mx_locations').update(update.data).eq('id', update.id);
    if (error) {
      console.error(`위치 ${update.id} 저장 실패:`, error);
      errorCount++;
    } else {
      successCount++;
    }
  }
  
  // 새 위치 삽입
  if (inserts.length > 0) {
    const { data: insertedData, error } = await supabase.from('mx_locations').insert(inserts).select();
    if (error) {
      console.error('새 위치 추가 실패:', error);
      errorCount += inserts.length;
    } else {
      insertCount = insertedData ? insertedData.length : 0;
    }
  }
  
  const totalSuccess = successCount + insertCount;
  if (errorCount > 0) {
    alert(`${totalSuccess}개 저장 성공, ${errorCount}개 저장 실패`);
  } else {
    alert(`${totalSuccess}개 위치가 저장되었습니다.${insertCount > 0 ? ` (${insertCount}개 새로 추가)` : ''}`);
  }
  
  await loadLocations();
  
  // 시각적 편집기가 열려있으면 알림
  if (window.opener && window.opener.location && window.opener.location.href.includes('location_editor')) {
    console.log('시각적 편집기에서 새로고침이 필요할 수 있습니다.');
  }
}

// 행 추가 함수
function addNewRow() {
  if (!hotInstance) return;
  
  const newRow = [null, '', 'available', '', '', '', '', '']; // ID는 null (새 행)
  hotInstance.alter('insert_row', hotInstance.countRows());
  const lastRow = hotInstance.countRows() - 1;
  hotInstance.setDataAtRowProp(lastRow, 0, null);
  hotInstance.setDataAtRowProp(lastRow, 1, '');
  hotInstance.setDataAtRowProp(lastRow, 2, 'available');
  hotInstance.setDataAtRowProp(lastRow, 3, '');
  hotInstance.setDataAtRowProp(lastRow, 4, '');
  hotInstance.setDataAtRowProp(lastRow, 5, '');
  hotInstance.setDataAtRowProp(lastRow, 6, '');
  hotInstance.setDataAtRowProp(lastRow, 7, '');
  hotInstance.selectCell(lastRow, 1); // 위치 코드 셀로 포커스
}

// 행 삭제 함수
async function deleteSelectedRows() {
  if (!hotInstance) return;
  
  const selected = hotInstance.getSelected();
  if (!selected || selected.length === 0) {
    alert('삭제할 행을 선택하세요.');
    return;
  }
  
  if (!confirm(`선택한 ${selected.length}개 행을 삭제하시겠습니까?`)) {
    return;
  }
  
  if (!window.supabase) {
    alert('Supabase가 아직 로드되지 않았습니다.');
    return;
  }
  
  const supabase = window.supabase;
  const data = hotInstance.getData();
  const rowsToDelete = new Set();
  
  // 선택된 행들의 인덱스 수집
  selected.forEach(([rowStart, colStart, rowEnd, colEnd]) => {
    for (let row = rowStart; row <= rowEnd; row++) {
      rowsToDelete.add(row);
    }
  });
  
  // 데이터베이스에서 삭제할 ID 수집
  const idsToDelete = [];
  rowsToDelete.forEach(rowIndex => {
    const rowData = data[rowIndex];
    if (rowData && rowData[0]) { // ID가 있으면
      idsToDelete.push(rowData[0]);
    }
  });
  
  // 데이터베이스에서 삭제
  if (idsToDelete.length > 0) {
    const { error } = await supabase.from('mx_locations').delete().in('id', idsToDelete);
    if (error) {
      alert('삭제 실패: ' + error.message);
      return;
    }
  }
  
  // Handsontable에서 행 삭제 (역순으로 삭제해야 인덱스가 꼬이지 않음)
  const sortedRows = Array.from(rowsToDelete).sort((a, b) => b - a);
  sortedRows.forEach(rowIndex => {
    hotInstance.alter('remove_row', rowIndex);
  });
  
  alert(`${rowsToDelete.size}개 행이 삭제되었습니다.`);
  await loadLocations();
}

// 현재 위치 보기 모달 표시
async function showCurrentLocationsModal() {
  if (!window.supabase) {
    alert('Supabase가 아직 로드되지 않았습니다.');
    return;
  }
  
  const supabase = window.supabase;
  
  // 모달 HTML 생성
  const modalHTML = `
    <div id="currentLocationsModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div class="p-6 border-b flex justify-between items-center">
          <h2 class="text-2xl font-bold">현재 위치 현황</h2>
          <button id="closeCurrentLocationsModal" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <div class="p-6 overflow-auto flex-1">
          <div id="currentLocationsContent" class="text-center py-8">
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
  const existingModal = document.getElementById('currentLocationsModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // 모달 추가
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // 닫기 버튼 이벤트
  document.getElementById('closeCurrentLocationsModal').addEventListener('click', () => {
    document.getElementById('currentLocationsModal').remove();
  });
  
  // 모달 배경 클릭 시 닫기
  document.getElementById('currentLocationsModal').addEventListener('click', (e) => {
    if (e.target.id === 'currentLocationsModal') {
      e.target.remove();
    }
  });
  
  // 데이터 로드 및 표시
  const contentDiv = document.getElementById('currentLocationsContent');
  contentDiv.innerHTML = '<div class="text-gray-500">데이터를 불러오는 중...</div>';
  
  try {
    // 1. 모든 위치 로드
    const { data: locations, error: locError } = await supabase
      .from('mx_locations')
      .select('location_code, x, y, width, height, status')
      .order('location_code');
    
    if (locError) throw locError;
    
    // 2. 실제 사용 중인 위치 확인 (receiving_items에서)
    const { data: receivingItems, error: recError } = await supabase
      .from('mx_receiving_items')
      .select('location_code, container_no, part_no, quantity');
    
    if (recError) throw recError;
    
    // 3. 출고된 항목 확인 (shipping_instruction에서 shipped된 항목)
    const { data: shippedItems, error: shipError } = await supabase
      .from('mx_shipping_instruction')
      .select('container_no, status')
      .eq('status', 'shipped');
    
    if (shipError) throw shipError;
    
    // 출고된 컨테이너 번호 집합
    const shippedContainers = new Set((shippedItems || []).map(item => item.container_no));
    
    // 실제 사용 중인 위치 집합 (출고되지 않은 항목만)
    const occupiedLocations = new Set();
    (receivingItems || []).forEach(item => {
      if (item.location_code && !shippedContainers.has(item.container_no)) {
        occupiedLocations.add(item.location_code);
      }
    });
    
    // 4. SVG 생성
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '1000');
    svg.setAttribute('height', '800');
    svg.setAttribute('viewBox', '0 0 1000 800');
    svg.style.border = '2px solid #333';
    svg.style.backgroundColor = 'white';
    
    // 배경 요소 로드 (Supabase에서만)
    let backgroundElements = [];
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('mx_background_elements')
          .select('elements_data')
          .eq('id', 1)
          .single();
        
        // Supabase에서 데이터를 성공적으로 가져왔고, 배열이 존재하며 비어있지 않은 경우
        if (!error && data && data.elements_data && Array.isArray(data.elements_data) && data.elements_data.length > 0) {
          backgroundElements = data.elements_data;
        } else {
          backgroundElements = [];
        }
      } else {
        backgroundElements = [];
      }
    } catch (e) {
      console.error('배경 요소 로드 실패:', e);
      backgroundElements = [];
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

// 위치 코드 정규화 함수
function normalizeLocationCode(code) {
  if (!code) return '';
  // A1 -> A-01 형식으로 변환
  const match = code.match(/^([A-Z]+)(\d+)$/);
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}`;
  }
  return code;
}

// 초기화 함수
function initLocationMaster() {
  if (!window.supabase) {
    console.error('Supabase가 아직 로드되지 않았습니다.');
    const app = document.getElementById('locationMasterApp');
    if (app) {
      app.innerHTML = '<div class="text-red-600 p-4">Supabase가 로드되지 않았습니다. 페이지를 새로고침하세요.</div>';
    }
    return;
  }
  
  renderLocationMasterUI();
  setupLocationForm();
  setupStatusFilter();
  loadLocations();
  
  // 현재 위치 보기 버튼 이벤트 설정
  setTimeout(() => {
    const viewBtn = document.getElementById('viewCurrentLocationsBtn');
    if (viewBtn) {
      viewBtn.addEventListener('click', showCurrentLocationsModal);
    }
    
    // 일괄 저장 버튼 이벤트 설정
    const batchSaveBtn = document.getElementById('batchSaveBtn');
    if (batchSaveBtn) {
      batchSaveBtn.addEventListener('click', batchSaveLocations);
    }
    
    // 행 추가 버튼 이벤트 설정
    const addRowBtn = document.getElementById('addRowBtn');
    if (addRowBtn) {
      addRowBtn.addEventListener('click', addNewRow);
    }
    
    // 행 삭제 버튼 이벤트 설정
    const deleteRowBtn = document.getElementById('deleteRowBtn');
    if (deleteRowBtn) {
      deleteRowBtn.addEventListener('click', deleteSelectedRows);
    }
  }, 100);
}

// DOM 로드 및 Supabase 준비 대기
document.addEventListener('DOMContentLoaded', function() {
  function tryInit() {
    if (window.supabase) {
      initLocationMaster();
    } else {
      window.addEventListener('supabaseReady', initLocationMaster, { once: true });
      setTimeout(function() {
        if (!window.supabase) {
          console.error('Supabase 초기화 타임아웃');
          const app = document.getElementById('locationMasterApp');
          if (app) {
            app.innerHTML = '<div class="text-red-600 p-4">Supabase 초기화에 실패했습니다. 페이지를 새로고침하세요.</div>';
          }
        }
      }, 5000);
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInit);
  } else {
    tryInit();
  }
});
