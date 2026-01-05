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
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-semibold mb-1">컨테이너/트레일러 번호 *</label>
          <input type="text" id="containerNoInput" placeholder="예: TRHU7878105" required class="w-full border px-3 py-2 rounded">
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">사유 (선택사항)</label>
          <input type="text" id="reasonInput" placeholder="문제 사유 입력" class="w-full border px-3 py-2 rounded">
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
          <th class="border px-3 py-2">등록일</th>
          <th class="border px-3 py-2">수정일</th>
          <th class="border px-3 py-2">삭제</th>
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
      tbody.innerHTML = '<tr><td colspan="6" class="text-red-600 text-center py-4">Supabase 로드 중... 페이지를 새로고침하세요.</td></tr>';
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
  
  tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">로딩 중...</td></tr>';
  
  let query = supabase.from('flagged_containers').select('*');
  
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-red-600 text-center py-4">Error: ${error.message}</td></tr>`;
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
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">등록된 컨테이너가 없습니다.</td></tr>';
    return;
  }
  
  filteredData.forEach((item, index) => {
    const tr = document.createElement('tr');
    const createdDate = item.created_at ? new Date(item.created_at).toLocaleString('ko-KR') : '-';
    const updatedDate = item.updated_at ? new Date(item.updated_at).toLocaleString('ko-KR') : '-';
    
    tr.innerHTML = `
      <td class="border px-3 py-2 text-center">${index + 1}</td>
      <td class="border px-3 py-2 font-semibold text-red-600">${item.container_no || '-'}</td>
      <td class="border px-3 py-2">${item.reason || '-'}</td>
      <td class="border px-3 py-2 text-sm">${createdDate}</td>
      <td class="border px-3 py-2 text-sm">${updatedDate}</td>
      <td class="border px-3 py-2 text-center">
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
    
    if (!container_no) {
      alert('컨테이너/트레일러 번호를 입력하세요.');
      return;
    }
    
    const containerData = {
      container_no: container_no.toUpperCase(),
      reason: reason || null
    };
    
    const { error } = await supabase.from('flagged_containers').insert(containerData);
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
      
      const { error } = await supabase.from('flagged_containers').delete().eq('id', id);
      if (error) {
        alert('삭제 실패: ' + error.message);
        return;
      }
      alert('삭제되었습니다.');
      loadFlaggedContainers();
    }
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
  loadFlaggedContainers();
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
