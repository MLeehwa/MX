// Delivery Location 관리
// supabase는 window.supabase로 직접 사용 (중복 선언 방지)

// DOM 요소
let addForm, editForm, editModal, cancelEditBtn, locationsList;

// 초기화
document.addEventListener('DOMContentLoaded', async () => {
  addForm = document.getElementById('addDeliveryLocationForm');
  editForm = document.getElementById('editDeliveryLocationForm');
  editModal = document.getElementById('editModal');
  cancelEditBtn = document.getElementById('cancelEditBtn');
  locationsList = document.getElementById('deliveryLocationsList');
  
  // 이벤트 리스너 설정
  if (addForm) {
    addForm.addEventListener('submit', handleAdd);
  }
  
  if (editForm) {
    editForm.addEventListener('submit', handleUpdate);
  }
  
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
      editModal.classList.add('hidden');
    });
  }
  
  // 목록 로드
  await loadDeliveryLocations();
});

// Delivery Location 목록 로드
async function loadDeliveryLocations() {
  try {
    if (!window.supabase) {
      throw new Error('Supabase가 아직 로드되지 않았습니다.');
    }
    const { data, error } = await window.supabase
      .from('mx_delivery_locations')
      .select('*')
      .order('location_name', { ascending: true });
    
    if (error) throw error;
    
    if (!locationsList) return;
    
    if (!data || data.length === 0) {
      locationsList.innerHTML = '<div class="text-center text-gray-500 py-8">등록된 Delivery Location이 없습니다.</div>';
      return;
    }
    
    locationsList.innerHTML = `
      <div class="overflow-x-auto">
        <table class="min-w-full border">
          <thead class="bg-gray-100">
            <tr>
              <th class="border px-4 py-2 text-left">Location Name</th>
              <th class="border px-4 py-2 text-left">Address</th>
              <th class="border px-4 py-2 text-left">Contact Person</th>
              <th class="border px-4 py-2 text-left">Contact Phone</th>
              <th class="border px-4 py-2 text-left">Contact Email</th>
              <th class="border px-4 py-2 text-center">상태</th>
              <th class="border px-4 py-2 text-center">작업</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(loc => `
              <tr class="${!loc.is_active ? 'bg-gray-50' : ''}">
                <td class="border px-4 py-2">${loc.location_name || '-'}</td>
                <td class="border px-4 py-2">${loc.address || '-'}</td>
                <td class="border px-4 py-2">${loc.contact_person || '-'}</td>
                <td class="border px-4 py-2">${loc.contact_phone || '-'}</td>
                <td class="border px-4 py-2">${loc.contact_email || '-'}</td>
                <td class="border px-4 py-2 text-center">
                  <span class="px-2 py-1 rounded text-sm ${loc.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                    ${loc.is_active ? '활성' : '비활성'}
                  </span>
                </td>
                <td class="border px-4 py-2 text-center">
                  <button onclick="editDeliveryLocation(${loc.id})" 
                          class="text-blue-600 hover:text-blue-800 mr-2">수정</button>
                  <button onclick="deleteDeliveryLocation(${loc.id})" 
                          class="text-red-600 hover:text-red-800">삭제</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Delivery Location 목록 로드 실패:', error);
    if (locationsList) {
      locationsList.innerHTML = `<div class="text-center text-red-500 py-8">로드 실패: ${error.message}</div>`;
    }
  }
}

// Delivery Location 추가
async function handleAdd(e) {
  e.preventDefault();
  
  const locationName = document.getElementById('locationNameInput').value.trim();
  const address = document.getElementById('addressInput').value.trim();
  const contactPerson = document.getElementById('contactPersonInput').value.trim();
  const contactPhone = document.getElementById('contactPhoneInput').value.trim();
  const contactEmail = document.getElementById('contactEmailInput').value.trim();
  const isActive = document.getElementById('isActiveInput').checked;
  
  // 필수 필드 검증
  if (!locationName) {
    alert('Location Name을 입력해주세요.');
    return;
  }
  
  if (!address) {
    alert('Address를 입력해주세요.');
    return;
  }
  
  try {
    if (!window.supabase) {
      alert('Supabase가 아직 로드되지 않았습니다. 페이지를 새로고침하세요.');
      return;
    }
    const { error } = await window.supabase
      .from('mx_delivery_locations')
      .insert({
        location_name: locationName,
        address: address || null,
        contact_person: contactPerson || null,
        contact_phone: contactPhone || null,
        contact_email: contactEmail || null,
        is_active: isActive
      });
    
    if (error) throw error;
    
    alert('Delivery Location이 추가되었습니다.');
    addForm.reset();
    document.getElementById('isActiveInput').checked = true;
    await loadDeliveryLocations();
  } catch (error) {
    console.error('Delivery Location 추가 실패:', error);
    alert('추가 실패: ' + error.message);
  }
}

// Delivery Location 수정
async function editDeliveryLocation(id) {
  try {
    if (!window.supabase) {
      alert('Supabase가 아직 로드되지 않았습니다. 페이지를 새로고침하세요.');
      return;
    }
    const { data, error } = await window.supabase
      .from('mx_delivery_locations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    document.getElementById('editId').value = data.id;
    document.getElementById('editLocationName').value = data.location_name || '';
    document.getElementById('editAddress').value = data.address || '';
    document.getElementById('editContactPerson').value = data.contact_person || '';
    document.getElementById('editContactPhone').value = data.contact_phone || '';
    document.getElementById('editContactEmail').value = data.contact_email || '';
    document.getElementById('editIsActive').checked = data.is_active !== false;
    
    editModal.classList.remove('hidden');
  } catch (error) {
    console.error('Delivery Location 조회 실패:', error);
    alert('조회 실패: ' + error.message);
  }
}

// Delivery Location 업데이트
async function handleUpdate(e) {
  e.preventDefault();
  
  const id = parseInt(document.getElementById('editId').value);
  const locationName = document.getElementById('editLocationName').value.trim();
  const address = document.getElementById('editAddress').value.trim();
  const contactPerson = document.getElementById('editContactPerson').value.trim();
  const contactPhone = document.getElementById('editContactPhone').value.trim();
  const contactEmail = document.getElementById('editContactEmail').value.trim();
  const isActive = document.getElementById('editIsActive').checked;
  
  // 필수 필드 검증
  if (!locationName) {
    alert('Location Name을 입력해주세요.');
    return;
  }
  
  if (!address) {
    alert('Address를 입력해주세요.');
    return;
  }
  
  try {
    if (!window.supabase) {
      alert('Supabase가 아직 로드되지 않았습니다. 페이지를 새로고침하세요.');
      return;
    }
    const { error } = await window.supabase
      .from('mx_delivery_locations')
      .update({
        location_name: locationName,
        address: address || null,
        contact_person: contactPerson || null,
        contact_phone: contactPhone || null,
        contact_email: contactEmail || null,
        is_active: isActive
      })
      .eq('id', id);
    
    if (error) throw error;
    
    alert('Delivery Location이 수정되었습니다.');
    editModal.classList.add('hidden');
    await loadDeliveryLocations();
  } catch (error) {
    console.error('Delivery Location 수정 실패:', error);
    alert('수정 실패: ' + error.message);
  }
}

// Delivery Location 삭제
async function deleteDeliveryLocation(id) {
  if (!confirm('정말로 이 Delivery Location을 삭제하시겠습니까?')) {
    return;
  }
  
  try {
    if (!window.supabase) {
      alert('Supabase가 아직 로드되지 않았습니다. 페이지를 새로고침하세요.');
      return;
    }
    
    // shipping_instruction에서 사용 중인지 확인
    const { data: shippingInstructions, error: checkError } = await window.supabase
      .from('mx_shipping_instruction')
      .select('id')
      .eq('delivery_location_id', id)
      .limit(1);
    
    if (checkError) throw checkError;
    
    if (shippingInstructions && shippingInstructions.length > 0) {
      alert('이 Delivery Location은 출하지시서에서 사용 중이어서 삭제할 수 없습니다. 비활성화하세요.');
      return;
    }
    
    const { error } = await window.supabase
      .from('mx_delivery_locations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    alert('Delivery Location이 삭제되었습니다.');
    await loadDeliveryLocations();
  } catch (error) {
    console.error('Delivery Location 삭제 실패:', error);
    alert('삭제 실패: ' + error.message);
  }
}

// 전역 함수로 노출
window.editDeliveryLocation = editDeliveryLocation;
window.deleteDeliveryLocation = deleteDeliveryLocation;
