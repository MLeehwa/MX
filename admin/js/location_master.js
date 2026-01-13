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
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-semibold mb-1">위치코드 *</label>
          <input type="text" id="locationCodeInput" placeholder="예: A-01" required class="w-full border px-3 py-2 rounded">
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">상태 *</label>
          <select id="statusInput" class="w-full border px-3 py-2 rounded">
            <option value="available">사용가능</option>
            <option value="occupied">점유중</option>
            <option value="maintenance">점검중</option>
            <option value="disabled">사용불가</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">X 좌표 (SVG)</label>
          <input type="number" id="xInput" placeholder="예: 2" class="w-full border px-3 py-2 rounded">
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">Y 좌표 (SVG)</label>
          <input type="number" id="yInput" placeholder="예: 1" class="w-full border px-3 py-2 rounded">
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">너비 (SVG)</label>
          <input type="number" id="widthInput" placeholder="예: 60" class="w-full border px-3 py-2 rounded">
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">높이 (SVG)</label>
          <input type="number" id="heightInput" placeholder="예: 20" class="w-full border px-3 py-2 rounded">
        </div>
        <div class="col-span-2">
          <label class="block text-sm font-semibold mb-1">비고</label>
          <input type="text" id="remarkInput" placeholder="비고 입력" class="w-full border px-3 py-2 rounded">
        </div>
      </div>
      <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">등록</button>
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
    <table id="locationTable" class="w-full border mb-12 bg-white">
      <thead>
        <tr class="bg-gray-100">
          <th class="border px-3 py-2">위치코드</th>
          <th class="border px-3 py-2">상태</th>
          <th class="border px-3 py-2">X</th>
          <th class="border px-3 py-2">Y</th>
          <th class="border px-3 py-2">너비</th>
          <th class="border px-3 py-2">높이</th>
          <th class="border px-3 py-2">비고</th>
          <th class="border px-3 py-2">수정/삭제</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>
`;
}

// 위치 목록 불러오기
async function loadLocations() {
  if (!window.supabase) {
    console.error('Supabase가 아직 로드되지 않았습니다.');
    const tbody = document.querySelector('#locationTable tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-red-600 text-center py-4">Supabase 로드 중... 페이지를 새로고침하세요.</td></tr>';
    }
    return;
  }
  
  const supabase = window.supabase;
  const tbody = document.querySelector('#locationTable tbody');
  if (!tbody) {
    console.error('locationTable tbody를 찾을 수 없습니다.');
    return;
  }
  
  const statusFilter = document.getElementById('statusFilter');
  const filterValue = statusFilter ? statusFilter.value : '';
  
  tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">로딩 중...</td></tr>';
  
  let query = supabase.from('wp1_locations').select('*');
  if (filterValue) {
    query = query.eq('status', filterValue);
  }
  query = query.order('location_code');
  
  const { data, error } = await query;
  if (error) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-red-600 text-center py-4">Error: ${error.message}</td></tr>`;
    return;
  }
  tbody.innerHTML = '';
  
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-gray-500">등록된 위치가 없습니다.</td></tr>';
    return;
  }
  
  data.forEach(loc => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="border px-3 py-2 font-semibold">${loc.location_code || '-'}</td>
      <td class="border px-3 py-2">
        <select data-id="${loc.id}" class="statusEdit border rounded px-2 py-1 w-full">
          <option value="available" ${loc.status === 'available' ? 'selected' : ''}>사용가능</option>
          <option value="occupied" ${loc.status === 'occupied' ? 'selected' : ''}>점유중</option>
          <option value="maintenance" ${loc.status === 'maintenance' ? 'selected' : ''}>점검중</option>
          <option value="disabled" ${loc.status === 'disabled' ? 'selected' : ''}>사용불가</option>
        </select>
      </td>
      <td class="border px-3 py-2">
        <input type="number" value="${loc.x || ''}" data-id="${loc.id}" data-field="x" class="coordEdit border rounded px-2 py-1 w-20" placeholder="X">
        ${loc.x === null || loc.x === undefined ? '<span class="text-xs text-gray-400 ml-1">(없음)</span>' : ''}
      </td>
      <td class="border px-3 py-2">
        <input type="number" value="${loc.y || ''}" data-id="${loc.id}" data-field="y" class="coordEdit border rounded px-2 py-1 w-20" placeholder="Y">
        ${loc.y === null || loc.y === undefined ? '<span class="text-xs text-gray-400 ml-1">(없음)</span>' : ''}
      </td>
      <td class="border px-3 py-2">
        <input type="number" value="${loc.width || ''}" data-id="${loc.id}" data-field="width" class="coordEdit border rounded px-2 py-1 w-20" placeholder="W">
        ${loc.width === null || loc.width === undefined ? '<span class="text-xs text-gray-400 ml-1">(없음)</span>' : ''}
      </td>
      <td class="border px-3 py-2">
        <input type="number" value="${loc.height || ''}" data-id="${loc.id}" data-field="height" class="coordEdit border rounded px-2 py-1 w-20" placeholder="H">
        ${loc.height === null || loc.height === undefined ? '<span class="text-xs text-gray-400 ml-1">(없음)</span>' : ''}
      </td>
      <td class="border px-3 py-2"><input type="text" value="${loc.remark || ''}" data-id="${loc.id}" class="remarkEdit border rounded px-2 py-1 w-full" placeholder="비고"></td>
      <td class="border px-3 py-2">
        <button class="updateLocBtn bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700" data-id="${loc.id}">수정</button>
        <button class="deleteLocBtn bg-red-600 text-white px-3 py-1 rounded ml-1 hover:bg-red-700" data-id="${loc.id}">삭제</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
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
    
    if (!location_code) {
      alert('위치코드를 입력하세요.');
      return;
    }
    
    // 위치 코드 정규화 (A1 -> A-01)
    location_code = normalizeLocationCode(location_code);
    
    const locationData = {
      location_code,
      status,
      remark: remark || null
    };
    
    if (x !== null) locationData.x = x;
    if (y !== null) locationData.y = y;
    if (width !== null) locationData.width = width;
    if (height !== null) locationData.height = height;
    
    const { error } = await supabase.from('wp1_locations').insert(locationData);
    if (error) {
      alert('등록 실패: ' + error.message);
      return;
    }
    alert('위치가 등록되었습니다.');
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
    loadLocations();
  });
}

// 수정/삭제 이벤트 위임 설정
function setupLocationTable() {
  const locationTable = document.getElementById('locationTable');
  if (!locationTable) {
    console.error('locationTable을 찾을 수 없습니다.');
    return;
  }
  
  locationTable.addEventListener('click', async function(e) {
    if (!window.supabase) {
      alert('Supabase가 아직 로드되지 않았습니다.');
      return;
    }
    const supabase = window.supabase;
    
    const id = e.target.dataset.id;
    if (e.target.classList.contains('updateLocBtn')) {
      const status = locationTable.querySelector(`select.statusEdit[data-id='${id}']`).value;
      const remark = locationTable.querySelector(`input.remarkEdit[data-id='${id}']`).value;
      const xInput = locationTable.querySelector(`input.coordEdit[data-id='${id}'][data-field='x']`);
      const yInput = locationTable.querySelector(`input.coordEdit[data-id='${id}'][data-field='y']`);
      const widthInput = locationTable.querySelector(`input.coordEdit[data-id='${id}'][data-field='width']`);
      const heightInput = locationTable.querySelector(`input.coordEdit[data-id='${id}'][data-field='height']`);
      
      const updateData = {
        status,
        remark: remark || null
      };
      
      // 좌표 정보도 업데이트 (값이 있으면)
      if (xInput && xInput.value) updateData.x = parseInt(xInput.value);
      else if (xInput && !xInput.value) updateData.x = null; // 빈 값이면 null로 설정
      
      if (yInput && yInput.value) updateData.y = parseInt(yInput.value);
      else if (yInput && !yInput.value) updateData.y = null;
      
      if (widthInput && widthInput.value) updateData.width = parseInt(widthInput.value);
      else if (widthInput && !widthInput.value) updateData.width = null;
      
      if (heightInput && heightInput.value) updateData.height = parseInt(heightInput.value);
      else if (heightInput && !heightInput.value) updateData.height = null;
      
      const { error } = await supabase.from('wp1_locations').update(updateData).eq('id', id);
      if (error) {
        alert('수정 실패: ' + error.message);
        return;
      }
      alert('수정되었습니다.');
      await loadLocations();
      
      // 시각적 편집기가 열려있으면 알림 (선택사항)
      if (window.opener && window.opener.location && window.opener.location.href.includes('location_editor')) {
        console.log('시각적 편집기에서 새로고침이 필요할 수 있습니다.');
      }
    } else if (e.target.classList.contains('deleteLocBtn')) {
      if (!confirm('정말 삭제하시겠습니까? 이 위치를 사용 중인 데이터가 있을 수 있습니다.')) return;
      const { error } = await supabase.from('wp1_locations').delete().eq('id', id);
      if (error) {
        alert('삭제 실패: ' + error.message);
        return;
      }
      alert('삭제되었습니다.');
      loadLocations();
    }
  });
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
    
    // 배경 요소 로드 (Supabase에서, 없으면 localStorage에서)
    let backgroundElements = [];
    try {
      // 먼저 Supabase에서 로드 시도
      if (supabase) {
        const { data, error } = await supabase
          .from('wp1_background_elements')
          .select('elements_data')
          .eq('id', 1)
          .single();
        
        if (!error && data && data.elements_data) {
          backgroundElements = Array.isArray(data.elements_data) ? data.elements_data : [];
          // localStorage에도 백업 저장
          if (backgroundElements.length > 0) {
            localStorage.setItem('wp1_background_elements', JSON.stringify(backgroundElements));
          }
        } else {
          // Supabase에 데이터가 없으면 localStorage에서 로드
          const saved = localStorage.getItem('wp1_background_elements');
          if (saved) {
            backgroundElements = JSON.parse(saved);
          }
        }
      } else {
        // Supabase가 없으면 localStorage에서 로드
        const saved = localStorage.getItem('wp1_background_elements');
        if (saved) {
          backgroundElements = JSON.parse(saved);
        }
      }
    } catch (e) {
      console.error('배경 요소 로드 실패:', e);
      // 에러 발생 시 localStorage에서 로드 시도
      try {
        const saved = localStorage.getItem('wp1_background_elements');
        if (saved) {
          backgroundElements = JSON.parse(saved);
        }
      } catch (e2) {
        console.error('localStorage 로드도 실패:', e2);
      }
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
  setupLocationTable();
  loadLocations();
  
  // 현재 위치 보기 버튼 이벤트 설정
  setTimeout(() => {
    const viewBtn = document.getElementById('viewCurrentLocationsBtn');
    if (viewBtn) {
      viewBtn.addEventListener('click', showCurrentLocationsModal);
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
