// HTML 렌더링 함수
function renderFlaggedContainersUI() {
  const app = document.getElementById('flaggedContainersApp');
  if (!app) {
    console.error('flaggedContainersApp 요소를 찾을 수 없습니다.');
    return;
  }
  
  app.innerHTML = `
  <div class="mb-6">
    <h2 class="text-xl font-bold mb-4">컨테이너/트레일러 번호 등록</h2>
    <form id="addContainerForm" class="bg-gray-50 p-4 rounded-lg shadow mb-6">
      <div class="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label class="block text-sm font-semibold mb-1">컨테이너/트레일러 번호 *</label>
          <input type="text" id="containerNoInput" placeholder="예: TRHU7878105" required class="w-full border px-3 py-2 rounded">
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">사유 (선택사항)</label>
          <input type="text" id="reasonInput" placeholder="문제 사유 입력" class="w-full border px-3 py-2 rounded">
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">하이라이트 색상 *</label>
          <div class="flex items-center gap-2">
            <input type="color" id="colorInput" value="#FF0000" class="w-16 h-10 border rounded cursor-pointer">
            <input type="text" id="colorHexInput" value="#FF0000" placeholder="#FF0000" class="flex-1 border px-3 py-2 rounded" pattern="^#[0-9A-Fa-f]{6}$">
            <button type="button" id="applyColorBtn" class="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 text-sm">적용</button>
          </div>
          <div class="mt-1 text-xs text-gray-500">엑셀 다운로드 시 이 색상으로 하이라이트됩니다</div>
        </div>
      </div>
      <button type="submit" class="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700">등록</button>
    </form>
  </div>
  <div>
    <h2 class="text-xl font-bold mb-4">등록된 컨테이너 목록</h2>
    <div class="mb-4">
      <input type="text" id="searchInput" placeholder="컨테이너 번호 검색..." class="border px-3 py-2 rounded w-64">
    </div>
    <table id="containerTable" class="w-full border mb-12 bg-white">
      <thead>
        <tr class="bg-gray-100">
          <th class="border px-3 py-2">번호</th>
          <th class="border px-3 py-2">컨테이너/트레일러 번호</th>
          <th class="border px-3 py-2">사유</th>
          <th class="border px-3 py-2">하이라이트 색상</th>
          <th class="border px-3 py-2">등록일</th>
          <th class="border px-3 py-2">수정일</th>
          <th class="border px-3 py-2">수정/삭제</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>
`;
}

// 컨테이너 목록 불러오기
async function loadFlaggedContainers() {
  if (!window.supabase) {
    console.error('Supabase가 아직 로드되지 않았습니다.');
    const tbody = document.querySelector('#containerTable tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-red-600 text-center py-4">Supabase 로드 중... 페이지를 새로고침하세요.</td></tr>';
    }
    return;
  }
  
  const supabase = window.supabase;
  const tbody = document.querySelector('#containerTable tbody');
  if (!tbody) {
    console.error('containerTable tbody를 찾을 수 없습니다.');
    return;
  }
  
  const searchInput = document.getElementById('searchInput');
  const searchValue = searchInput ? searchInput.value.trim().toLowerCase() : '';
  
  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">로딩 중...</td></tr>';
  
  let query = supabase.from('mx_flagged_containers').select('*');
  
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-red-600 text-center py-4">Error: ${error.message}</td></tr>`;
    return;
  }
  
  // 검색 필터 적용
  let filteredData = data || [];
  if (searchValue) {
    filteredData = filteredData.filter(item => 
      (item.container_no || '').toLowerCase().includes(searchValue)
    );
  }
  
  tbody.innerHTML = '';
  
  if (!filteredData || filteredData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-500">등록된 컨테이너가 없습니다.</td></tr>';
    return;
  }
  
  filteredData.forEach((item, index) => {
    const tr = document.createElement('tr');
    const createdDate = item.created_at ? new Date(item.created_at).toLocaleString('ko-KR') : '-';
    const updatedDate = item.updated_at ? new Date(item.updated_at).toLocaleString('ko-KR') : '-';
    const highlightColor = item.highlight_color || '#FF0000';
    
    tr.innerHTML = `
      <td class="border px-3 py-2 text-center">${index + 1}</td>
      <td class="border px-3 py-2 font-semibold text-red-600">${item.container_no || '-'}</td>
      <td class="border px-3 py-2">${item.reason || '-'}</td>
      <td class="border px-3 py-2">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 border border-gray-300 rounded" style="background-color: ${highlightColor}"></div>
          <span class="text-sm">${highlightColor}</span>
        </div>
      </td>
      <td class="border px-3 py-2 text-sm">${createdDate}</td>
      <td class="border px-3 py-2 text-sm">${updatedDate}</td>
      <td class="border px-3 py-2 text-center">
        <button class="editContainerBtn bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 mr-1" data-id="${item.id}">수정</button>
        <button class="deleteContainerBtn bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700" data-id="${item.id}">삭제</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 컨테이너 등록 이벤트 리스너 설정
function setupContainerForm() {
  const addContainerForm = document.getElementById('addContainerForm');
  if (!addContainerForm) {
    console.error('addContainerForm을 찾을 수 없습니다.');
    return;
  }
  
  const newForm = addContainerForm.cloneNode(true);
  addContainerForm.parentNode.replaceChild(newForm, addContainerForm);
  
  newForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!window.supabase) {
      alert('Supabase가 아직 로드되지 않았습니다. 페이지를 새로고침하세요.');
      return;
    }
    const supabase = window.supabase;
    
    const container_no = document.getElementById('containerNoInput').value.trim();
    const reason = document.getElementById('reasonInput').value.trim();
    const highlightColor = document.getElementById('colorHexInput').value.trim().toUpperCase() || '#FF0000';
    
    if (!container_no) {
      alert('컨테이너/트레일러 번호를 입력하세요.');
      return;
    }
    
    // 색상 형식 검증 (#RRGGBB)
    if (!/^#[0-9A-F]{6}$/i.test(highlightColor)) {
      alert('올바른 색상 코드를 입력하세요. (예: #FF0000)');
      return;
    }
    
    const containerData = {
      container_no: container_no.toUpperCase(),
      reason: reason || null,
      highlight_color: highlightColor
    };
    
    const { error } = await supabase.from('mx_flagged_containers').insert(containerData);
    if (error) {
      if (error.code === '23505') {
        alert('이미 등록된 컨테이너 번호입니다.');
      } else {
        alert('등록 실패: ' + error.message);
      }
      return;
    }
    alert('컨테이너가 등록되었습니다.');
    newForm.reset();
    loadFlaggedContainers();
  });
}

// 검색 이벤트 설정
function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) {
    console.error('searchInput을 찾을 수 없습니다.');
    return;
  }
  
  const newInput = searchInput.cloneNode(true);
  searchInput.parentNode.replaceChild(newInput, searchInput);
  
  let searchTimeout;
  newInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadFlaggedContainers();
    }, 300);
  });
}

// 삭제 이벤트 위임 설정
function setupContainerTable() {
  const containerTable = document.getElementById('containerTable');
  if (!containerTable) {
    console.error('containerTable을 찾을 수 없습니다.');
    return;
  }
  
  containerTable.addEventListener('click', async function(e) {
    if (!window.supabase) {
      alert('Supabase가 아직 로드되지 않았습니다.');
      return;
    }
    const supabase = window.supabase;
    
    const id = e.target.dataset.id;
    if (e.target.classList.contains('deleteContainerBtn')) {
      const containerNo = e.target.closest('tr').querySelector('td:nth-child(2)').textContent.trim();
      if (!confirm(`정말 "${containerNo}" 컨테이너를 삭제하시겠습니까?`)) return;
      
      const { error } = await supabase.from('mx_flagged_containers').delete().eq('id', id);
      if (error) {
        alert('삭제 실패: ' + error.message);
        return;
      }
      alert('삭제되었습니다.');
      loadFlaggedContainers();
    } else if (e.target.classList.contains('editContainerBtn')) {
      // 수정 모달 표시
      const row = e.target.closest('tr');
      const containerNo = row.querySelector('td:nth-child(2)').textContent.trim();
      const reason = row.querySelector('td:nth-child(3)').textContent.trim();
      const colorCell = row.querySelector('td:nth-child(4)');
      const currentColor = colorCell ? colorCell.querySelector('span').textContent.trim() : '#FF0000';
      
      // 수정 모달 표시
      showEditModal(id, containerNo, reason, currentColor);
    }
  });
}

// 수정 모달 표시
function showEditModal(id, containerNo, reason, currentColor) {
  const modalHTML = `
    <div id="editContainerModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">컨테이너 정보 수정</h2>
          <button id="closeEditModal" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold mb-1">컨테이너/트레일러 번호</label>
            <input type="text" id="editContainerNo" value="${containerNo}" readonly class="w-full border px-3 py-2 rounded bg-gray-100">
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">사유</label>
            <input type="text" id="editReason" value="${reason}" placeholder="문제 사유 입력" class="w-full border px-3 py-2 rounded">
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">하이라이트 색상</label>
            <div class="flex items-center gap-2">
              <input type="color" id="editColorInput" value="${currentColor}" class="w-16 h-10 border rounded cursor-pointer">
              <input type="text" id="editColorHexInput" value="${currentColor}" placeholder="#FF0000" class="flex-1 border px-3 py-2 rounded" pattern="^#[0-9A-Fa-f]{6}$">
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <button id="cancelEditBtn" class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">취소</button>
          <button id="saveEditBtn" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" data-id="${id}">저장</button>
        </div>
      </div>
    </div>
  `;
  
  // 기존 모달 제거
  const existingModal = document.getElementById('editContainerModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // 모달 추가
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // 색상 선택기 이벤트
  const editColorInput = document.getElementById('editColorInput');
  const editColorHexInput = document.getElementById('editColorHexInput');
  
  editColorInput.addEventListener('input', (e) => {
    editColorHexInput.value = e.target.value.toUpperCase();
  });
  
  editColorHexInput.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      editColorInput.value = value;
    }
  });
  
  // 닫기 버튼
  document.getElementById('closeEditModal').addEventListener('click', () => {
    document.getElementById('editContainerModal').remove();
  });
  
  document.getElementById('cancelEditBtn').addEventListener('click', () => {
    document.getElementById('editContainerModal').remove();
  });
  
  // 저장 버튼
  document.getElementById('saveEditBtn').addEventListener('click', async () => {
    const reason = document.getElementById('editReason').value.trim();
    const highlightColor = document.getElementById('editColorHexInput').value.trim().toUpperCase() || '#FF0000';
    
    // 색상 형식 검증
    if (!/^#[0-9A-F]{6}$/i.test(highlightColor)) {
      alert('올바른 색상 코드를 입력하세요. (예: #FF0000)');
      return;
    }
    
    const updateData = {
      reason: reason || null,
      highlight_color: highlightColor
    };
    
    const { error } = await window.supabase
      .from('mx_flagged_containers')
      .update(updateData)
      .eq('id', id);
    
    if (error) {
      alert('수정 실패: ' + error.message);
      return;
    }
    
    alert('수정되었습니다.');
    document.getElementById('editContainerModal').remove();
    loadFlaggedContainers();
  });
}

// 초기화 함수
function initFlaggedContainers() {
  if (!window.supabase) {
    console.error('Supabase가 아직 로드되지 않았습니다.');
    const app = document.getElementById('flaggedContainersApp');
    if (app) {
      app.innerHTML = '<div class="text-red-600 p-4">Supabase가 로드되지 않았습니다. 페이지를 새로고침하세요.</div>';
    }
    return;
  }
  
  renderFlaggedContainersUI();
  setupContainerForm();
  setupSearch();
  setupContainerTable();
  setupColorPicker();
  loadFlaggedContainers();
}

// 색상 선택기 이벤트 설정
function setupColorPicker() {
  const colorInput = document.getElementById('colorInput');
  const colorHexInput = document.getElementById('colorHexInput');
  const applyColorBtn = document.getElementById('applyColorBtn');
  
  if (!colorInput || !colorHexInput) return;
  
  // color input 변경 시 hex input 업데이트
  colorInput.addEventListener('input', (e) => {
    colorHexInput.value = e.target.value.toUpperCase();
  });
  
  // hex input 변경 시 color input 업데이트
  colorHexInput.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      colorInput.value = value;
    }
  });
  
  // 적용 버튼 클릭 시 hex input 검증
  if (applyColorBtn) {
    applyColorBtn.addEventListener('click', () => {
      const value = colorHexInput.value.trim().toUpperCase();
      if (!/^#[0-9A-F]{6}$/i.test(value)) {
        alert('올바른 색상 코드를 입력하세요. (예: #FF0000)');
        colorHexInput.value = '#FF0000';
        colorInput.value = '#FF0000';
        return;
      }
      colorInput.value = value;
    });
  }
}

// DOM 로드 및 Supabase 준비 대기
document.addEventListener('DOMContentLoaded', function() {
  function tryInit() {
    if (window.supabase) {
      initFlaggedContainers();
    } else {
      window.addEventListener('supabaseReady', initFlaggedContainers, { once: true });
      setTimeout(function() {
        if (!window.supabase) {
          console.error('Supabase 초기화 타임아웃');
          const app = document.getElementById('flaggedContainersApp');
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
