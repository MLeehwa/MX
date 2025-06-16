// Supabase 연결 (receiving.js, config.js와 동일하게)
if (!window.supabase) {
  alert('supabase-js가 아직 로드되지 않았습니다! 새로고침 해보세요.');
  throw new Error('supabase not loaded');
}
const supabase = window.supabase;

// HTML 렌더링
const app = document.getElementById('locationMasterApp');
app.innerHTML = `
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

// 위치 목록 불러오기
async function loadLocations() {
  const tbody = document.querySelector('#locationTable tbody');
  tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
  const { data, error } = await supabase.from('locations').select('*').order('location_code');
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
  const { error } = await supabase.from('locations').insert({ location_code, status, remark });
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
    const { error } = await supabase.from('locations').update({ status, remark }).eq('id', id);
    if (error) return alert('수정 실패: ' + error.message);
    loadLocations();
  } else if (e.target.classList.contains('deleteLocBtn')) {
    // 삭제
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) return alert('삭제 실패: ' + error.message);
    loadLocations();
  }
});

// 최초 로드
loadLocations(); 