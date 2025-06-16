const supabase = window.supabase;

export async function loadLocation() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="max-w-7xl mx-auto">
      <h1 class="text-2xl font-bold mb-4">🗺️ 위치 보기</h1>
      <div class="bg-white shadow-xl rounded-xl p-6">
        <div id="locationLoading" class="text-center py-4 text-lg text-gray-500">로딩 중...</div>
        <div id="locationError" class="hidden text-center py-4 text-red-600 font-bold"></div>
        <div id="locationMap" class="mt-4"></div>
      </div>
    </div>
  `;

  const locationLoading = document.getElementById('locationLoading');
  const locationError = document.getElementById('locationError');
  const locationMap = document.getElementById('locationMap');

  try {
    // 1. 먼저 입고 데이터 로드
    const { data: receivingItems, error: recError } = await supabase
      .from('receiving_items')
      .select(`
        id,
        container_no,
        part_no,
        quantity,
        location,
        receiving_plan (
          receive_date
        )
      `)
      .order('receiving_plan(receive_date)', { ascending: false });

    if (recError) throw recError;

    // 2. 그 다음 출고 데이터 로드
    const { data: shippingItems, error: shipError } = await supabase
      .from('shipping_instruction')
      .select(`
        id,
        container_no,
        part_no,
        shipping_date,
        status
      `)
      .eq('status', 'shipped');

    if (shipError) throw shipError;

    // 3. 위치별 상태 매핑
    const locationStatus = new Map();
    
    // 먼저 입고된 아이템으로 초기화
    receivingItems.forEach(item => {
      if (item.location) {
        locationStatus.set(item.location, {
          status: 'occupied',
          container_no: item.container_no,
          part_no: item.part_no,
          quantity: item.quantity,
          receive_date: item.receiving_plan?.receive_date
        });
      }
    });

    // 출고된 아이템은 빈 상태로 변경
    shippingItems.forEach(item => {
      if (item.container_no) {
        for (const [location, data] of locationStatus.entries()) {
          if (data.container_no === item.container_no) {
            locationStatus.set(location, {
              ...data,
              status: 'empty'
            });
          }
        }
      }
    });

    // 4. SVG 생성
    const svg = createLocationSVG(locationStatus);
    locationMap.innerHTML = '';
    locationMap.appendChild(svg);

    // 5. 로딩 상태 제거
    locationLoading.classList.add('hidden');

  } catch (error) {
    console.error('Error loading location data:', error);
    locationError.textContent = '위치 데이터 로드 실패: ' + error.message;
    locationError.classList.remove('hidden');
    locationLoading.classList.add('hidden');
  }
}

function createLocationSVG(locationStatus) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '600');
  svg.setAttribute('viewBox', '0 0 1000 600');
  svg.style.backgroundColor = '#f8fafc';

  // 위치 그리드 생성 (10x5)
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 5; j++) {
      const location = `${String.fromCharCode(65 + i)}${j + 1}`;
      const status = locationStatus.get(location);
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', i * 100);
      rect.setAttribute('y', j * 100);
      rect.setAttribute('width', '90');
      rect.setAttribute('height', '90');
      rect.setAttribute('rx', '5');
      rect.setAttribute('ry', '5');
      
      // 상태에 따른 색상 설정
      if (status) {
        rect.setAttribute('fill', status.status === 'occupied' ? '#ef4444' : '#22c55e');
        rect.setAttribute('stroke', '#1e293b');
        rect.setAttribute('stroke-width', '2');
        
        // 툴팁 추가
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `위치: ${location}
컨테이너: ${status.container_no}
제품: ${status.part_no}
수량: ${status.quantity}
입고일: ${status.receive_date || '-'}`;
        rect.appendChild(title);
      } else {
        rect.setAttribute('fill', '#e2e8f0');
        rect.setAttribute('stroke', '#94a3b8');
        rect.setAttribute('stroke-width', '1');
      }
      
      // 위치 텍스트 추가
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', i * 100 + 45);
      text.setAttribute('y', j * 100 + 45);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', '#1e293b');
      text.setAttribute('font-size', '16');
      text.setAttribute('font-weight', 'bold');
      text.textContent = location;
      
      svg.appendChild(rect);
      svg.appendChild(text);
    }
  }

  return svg;
} 