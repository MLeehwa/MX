// 일일 입출고 현황 엑셀 다운로드 JS
// supabase-js, xlsx 필요

function getUTCDateRange(localDate) {
  // localDate: 'YYYY-MM-DD'
  const start = new Date(localDate + 'T00:00:00+09:00');
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

let lastReceiving = [];
let lastShipping = [];

export async function initSection() {
  const btn = document.getElementById('excel-download-btn');
  if (btn) btn.onclick = exportDailyReport;

  const dateInput = document.getElementById('report-date');
  if (dateInput) {
    if (!dateInput.value) {
      const today = new Date();
      dateInput.value = today.toISOString().slice(0, 10);
    }
    loadDailyReport(dateInput.value);
    dateInput.addEventListener('change', () => {
      loadDailyReport(dateInput.value);
    });
  }

  // 요약 대시보드 버튼 이벤트
  const captureBtn = document.getElementById('capture-btn');
  if (captureBtn) {
    captureBtn.onclick = captureSummary;
    console.log('캡쳐 버튼 이벤트 등록 완료');
  }

  // 저장 버튼 이벤트
  const saveRemarksBtn = document.getElementById('save-remarks-btn');
  if (saveRemarksBtn) {
    saveRemarksBtn.onclick = function() {
      console.log('💾 저장 버튼 클릭됨!');
      window.saveRemarks();
    };
    console.log('✅ 저장 버튼 이벤트 등록 완료');
  } else {
    console.error('❌ 저장 버튼을 찾을 수 없습니다');
  }

  // 특이사항 자동 로드 (localStorage에서)
  const remarksInput = document.getElementById('remarks-input');
  if (remarksInput && dateInput) {
    window.loadRemarks(dateInput.value);
    console.log('✅ 특이사항 자동 로드 완료');
    
    // 날짜 변경 시에도 로드
    const originalChangeHandler = dateInput.onchange;
    dateInput.addEventListener('change', (e) => {
      console.log('📅 날짜 변경됨:', e.target.value);
      window.loadRemarks(e.target.value);
    });
  } else {
    console.error('❌ 특이사항 입력란 또는 날짜 입력란을 찾을 수 없습니다');
  }
  
  // html2canvas 로드 확인
  setTimeout(() => {
    if (typeof html2canvas !== 'undefined') {
      console.log('✅ html2canvas 로드 성공');
    } else {
      console.error('❌ html2canvas 로드 실패');
    }
  }, 1000);
}

async function loadDailyReport(date) {
  // 1. 해당 날짜의 입고 계획(plan) 모두 조회
  const { data: plans } = await supabase
    .from('mx_receiving_plan')
    .select('id, container_no, receive_date, type')
    .eq('receive_date', date);

  // 2. 해당 container_no 전체에 대해 receiving_items 조회
  const containerNos = (plans || []).map(plan => plan.container_no);
  let items = [];
  if (containerNos.length > 0) {
    const { data } = await supabase
      .from('mx_receiving_items')
      .select('container_no, part_no, quantity, location_code, receiving_place')
      .in('container_no', containerNos);
    items = data || [];
  }

  // 3. plan과 item을 container_no로 매칭해서 화면에 표시
  const receiving = [];
  (plans || []).forEach(plan => {
    const matchedItems = items.filter(item => item.container_no === plan.container_no);
    if (matchedItems.length > 0) {
      matchedItems.forEach(item => {
        receiving.push({
          type: plan.type,
          container_no: plan.container_no,
          receive_date: plan.receive_date,
          part_no: item.part_no,
          quantity: item.quantity,
          location_code: item.location_code,
          receiving_place: item.receiving_place
        });
      });
    } else {
      // 아이템이 없는 plan도 표시하고 싶으면 여기에 추가
      receiving.push({
        type: plan.type,
        container_no: plan.container_no,
        receive_date: plan.receive_date,
        part_no: '',
        quantity: '',
        location_code: '',
        receiving_place: ''
      });
    }
  });

  // 출고: shipping_date 기준, status 조건 없이 모두
  const { data: shipping } = await supabase
    .from('mx_shipping_instruction')
    .select('container_no, location_code, part_no, qty, shipping_date, part_quantities')
    .eq('shipping_date', date);

  console.log('Receiving Query:', date, receiving);
  console.log('Shipping Query:', date, shipping);

  // part_quantities가 있는 경우 여러 파트를 개별 행으로 분리
  const expandedShipping = [];
  (shipping || []).forEach(ship => {
    if (ship.part_quantities) {
      try {
        const partQuantities = JSON.parse(ship.part_quantities);
        Object.entries(partQuantities).forEach(([partNo, qty]) => {
          expandedShipping.push({
            ...ship,
            part_no: partNo,
            qty: qty
          });
        });
      } catch (e) {
        console.error('Error parsing part_quantities:', e);
        expandedShipping.push(ship);
      }
    } else {
      expandedShipping.push(ship);
    }
  });

  lastReceiving = receiving || [];
  lastShipping = expandedShipping || [];
  
  // 요약 통계 계산 및 업데이트
  await updateSummaryDashboard(date, receiving, expandedShipping);
  
  // 금주 일별 현황 업데이트
  await updateWeeklySummary(date);
  
  renderDailyReportTable(date);
}

function renderDailyReportTable(date) {
  // 표만 print-table-wrapper에 렌더링
  const printWrapper = document.getElementById('print-table-wrapper');
  let html = `
      <div class="bg-white p-8 rounded shadow-md">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-2xl font-bold mb-1">일일 입출고 현황</h1>
            <div class="text-gray-600 font-bold text-lg">${date.replace(/-/g, '/')}</div>
          </div>
        </div>
        <h2 class="text-lg font-semibold mt-8 mb-2">1. 입고</h2>
        <div>
          <table class="min-w-full border text-center">
            <thead class="bg-blue-100">
              <tr>
                <th class="py-2 px-3 border font-bold">NO.</th>
                <th class="py-2 px-3 border font-bold">타입</th>
                <th class="py-2 px-3 border font-bold">출고지</th>
                <th class="py-2 px-3 border font-bold">CONTAINER #</th>
                <th class="py-2 px-3 border font-bold">위치</th>
                <th class="py-2 px-3 border font-bold">제품</th>
                <th class="py-2 px-3 border font-bold">수량</th>
                <th class="py-2 px-3 border font-bold">확인</th>
                <th class="py-2 px-3 border font-bold">시간</th>
                <th class="py-2 px-3 border font-bold">메모</th>
              </tr>
            </thead>
            <tbody>
              ${(lastReceiving && lastReceiving.length > 0) ? lastReceiving.map((row, idx) => `
                <tr class="hover:bg-gray-50">
                  <td class="border px-2">${idx + 1}</td>
                  <td class="border px-2">${row.type || '-'}</td>
                  <td class="border px-2">${row.receiving_place || '-'}</td>
                  <td class="border px-2">${row.container_no || '-'}</td>
                  <td class="border px-2">${row.location_code || '-'}</td>
                  <td class="border px-2">${row.part_no || '-'}</td>
                  <td class="border px-2 text-right">${row.quantity ?? '-'}</td>
                  <td class="border px-2"></td>
                  <td class="border px-2"></td>
                  <td class="border px-2"></td>
                </tr>
              `).join('') : `<tr><td class="border px-2" colspan="10">데이터 없음</td></tr>`}
            </tbody>
          </table>
        </div>
        <h2 class="text-lg font-semibold mt-8 mb-2">2. 출고</h2>
        <div>
          <table class="min-w-full border text-center">
            <thead class="bg-blue-100">
              <tr>
                <th class="py-2 px-3 border font-bold">NO.</th>
                <th class="py-2 px-3 border font-bold">운송차</th>
                <th class="py-2 px-3 border font-bold">도착지</th>
                <th class="py-2 px-3 border font-bold">CONTAINER #</th>
                <th class="py-2 px-3 border font-bold">위치</th>
                <th class="py-2 px-3 border font-bold">제품</th>
                <th class="py-2 px-3 border font-bold">수량</th>
                <th class="py-2 px-3 border font-bold">확인</th>
                <th class="py-2 px-3 border font-bold">시간</th>
                <th class="py-2 px-3 border font-bold">메모</th>
              </tr>
            </thead>
            <tbody>
              ${(lastShipping && lastShipping.length > 0) ? lastShipping.map((row, idx) => `
                <tr class="hover:bg-gray-50">
                <td class="border px-2">${idx + 1}</td>
                  <td class="border px-2">KP</td>
                  <td class="border px-2">PTA</td>
                  <td class="border px-2">${row.container_no || '-'}</td>
                  <td class="border px-2">${row.location_code || '-'}</td>
                  <td class="border px-2">${row.part_no || '-'}</td>
                  <td class="border px-2 text-right">${row.qty ?? '-'}</td>
                  <td class="border px-2"></td>
                  <td class="border px-2"></td>
                  <td class="border px-2"></td>
                </tr>
              `).join('') : `<tr><td class="border px-2" colspan="10">데이터 없음</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  printWrapper.innerHTML = html;
  // 기존 날짜/버튼 등은 container에 그대로 유지
  document.getElementById('excel-download-btn').onclick = exportDailyReport;
  document.getElementById('report-date').addEventListener('change', (e) => {
    loadDailyReport(e.target.value);
  });
}

export async function exportDailyReport() {
  const date = document.getElementById('report-date').value;
  const workbook = new window.ExcelJS.Workbook();
  const ws = workbook.addWorksheet('일일입출고현황', {
    pageSetup: {
      paperSize: 1,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      verticalCentered: false,
      margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5 }
    }
  });

  // 컬럼 설정 - key와 width 모두 지정
  ws.columns = [
    { header: '', key: 'no', width: 6 },
    { header: '', key: 'type', width: 8 },
    { header: '', key: 'place', width: 10 },
    { header: '', key: 'container', width: 35 },
    { header: '', key: 'location', width: 10 },
    { header: '', key: 'part', width: 12 },
    { header: '', key: 'qty', width: 8 },
    { header: '', key: 'check', width: 10 },
    { header: '', key: 'time', width: 10 },
    { header: '', key: 'memo', width: 12 }
  ];

  // 1행: 제목 (10개 컬럼)
  ws.addRow({
    no: String(`${parseInt(date.split('-')[1])}월 ${parseInt(date.split('-')[2])}일 일일 입출고 현황 (${date})`),
    type: '', place: '', container: '', location: '', part: '', qty: '', check: '', time: '', memo: ''
  });
  ws.mergeCells('A1:J1');
  ws.getCell('A1').font = { bold: true, size: 16 };
  ws.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' };

  // 2행: 빈 행 (10개 컬럼)
  ws.addRow({no:'', type:'', place:'', container:'', location:'', part:'', qty:'', check:'', time:'', memo:''});

  // 3행: '1. 입고' (10개 컬럼)
  ws.addRow({no:'1. 입고', type:'', place:'', container:'', location:'', part:'', qty:'', check:'', time:'', memo:''});
  ws.mergeCells('A3:J3');
  ws.getCell('A3').font = { bold: true, size: 13 };

  // 4행: 입고 테이블 헤더 (10개 컬럼)
  ws.addRow({no:'NO.', type:'타입', place:'출고지', container:'CONTAINER #', location:'위치', part:'제품', qty:'수량', check:'확인', time:'시간', memo:'메모'});
  const inHeader = ws.getRow(ws.lastRow.number);
  inHeader.font = { bold: true };
  inHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB4C6E7' } };
  inHeader.alignment = { vertical: 'middle', horizontal: 'center' };
  for (let i = 1; i <= 10; i++) {
    inHeader.getCell(i).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  }

  // 입고 데이터 (객체 방식)
  if (lastReceiving && lastReceiving.length > 0) {
    lastReceiving.forEach((row, idx) => {
      const r = ws.addRow({
        no: String(idx + 1),
        type: String(row.type ?? ''),
        place: String(row.receiving_place ?? ''),
        container: String(row.container_no ?? ''),
        location: String(row.location_code ?? ''),
        part: String(row.part_no ?? ''),
        qty: row.quantity !== undefined && row.quantity !== null && !isNaN(row.quantity) ? Number(row.quantity) : '',
        check: '',
        time: '',
        memo: ''
      });
      r.getCell('container').alignment = { vertical: 'middle', horizontal: 'left' };
      r.getCell('qty').alignment = { horizontal: 'right' };
      r.height = 22;
      for (let i = 1; i <= 10; i++) {
        r.getCell(i).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    });
  } else {
    const r = ws.addRow({no:'', type:'', place:'', container:'', location:'', part:'', qty:'', check:'', time:'', memo:''});
    for (let i = 1; i <= 10; i++) {
      r.getCell(i).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
  }

  // 빈 행 (10개 컬럼)
  ws.addRow({no:'', type:'', place:'', container:'', location:'', part:'', qty:'', check:'', time:'', memo:''});

  // '2. 출고' (10개 컬럼)
  ws.addRow({no:'2. 출고', type:'', place:'', container:'', location:'', part:'', qty:'', check:'', time:'', memo:''});
  ws.mergeCells(`A${ws.lastRow.number}:J${ws.lastRow.number}`);
  ws.getCell(`A${ws.lastRow.number}`).font = { bold: true, size: 13 };

  // 출고 테이블 헤더 (10개 컬럼)
  ws.addRow({no:'NO.', type:'운송차', place:'도착지', container:'CONTAINER #', location:'위치', part:'제품', qty:'수량', check:'확인', time:'시간', memo:'메모'});
  const outHeader = ws.getRow(ws.lastRow.number);
  outHeader.font = { bold: true };
  outHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB4C6E7' } };
  outHeader.alignment = { vertical: 'middle', horizontal: 'center' };
  for (let i = 1; i <= 10; i++) {
    outHeader.getCell(i).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  }

  // 출고 데이터 (객체 방식)
  if (lastShipping && lastShipping.length > 0) {
    lastShipping.forEach((row, idx) => {
      const r = ws.addRow({
        no: String(idx + 1),
        type: 'KP',
        place: 'PTA',
        container: String(row.container_no ?? ''),
        location: String(row.location_code ?? ''),
        part: String(row.part_no ?? ''),
        qty: row.qty !== undefined && row.qty !== null && !isNaN(row.qty) ? Number(row.qty) : '',
        check: '',
        time: '',
        memo: ''
      });
      r.getCell('container').alignment = { vertical: 'middle', horizontal: 'left' };
      r.getCell('qty').alignment = { horizontal: 'right' };
      r.height = 22;
      for (let i = 1; i <= 10; i++) {
        r.getCell(i).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    });
  } else {
    const r = ws.addRow({no:'', type:'', place:'', container:'', location:'', part:'', qty:'', check:'', time:'', memo:''});
    for (let i = 1; i <= 10; i++) {
      r.getCell(i).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `일일입출고현황_${date}.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// 인라인 스타일 복사 유틸 함수
function cloneWithInlineStyles(node) {
  const clone = node.cloneNode(true);
  const walk = (src, dest) => {
    if (src.nodeType === 1) {
      const computed = window.getComputedStyle(src);
      for (let i = 0; i < computed.length; i++) {
        dest.style[computed[i]] = computed.getPropertyValue(computed[i]);
      }
    }
    for (let i = 0; i < src.childNodes.length; i++) {
      walk(src.childNodes[i], dest.childNodes[i]);
    }
  };
  walk(node, clone);
  return clone;
}

if (document.querySelector('.print-btn')) {
  document.querySelector('.print-btn').onclick = function() {
    const tableWrapper = document.getElementById('print-table-wrapper');
    const clone = cloneWithInlineStyles(tableWrapper);
    // 헤더(th)에 인라인 스타일 강제 적용 (연한 파랑 배경, 검정 글씨, 진한 테두리)
    clone.querySelectorAll('th').forEach(th => {
      th.style.background = '#e0e7ef';
      th.style.color = '#222';
      th.style.border = '2px solid #222';
    });
    // 모든 셀(td, th)에 진한 테두리, 검정 글씨
    clone.querySelectorAll('td, th').forEach(cell => {
      cell.style.color = '#222';
      cell.style.border = '2px solid #222';
    });
    // 팝업에 인쇄용 스타일 추가
    const printStyle = `<style>
      @page { size: Letter landscape; }
      th, td { color: #222 !important; border: 2px solid #222 !important; }
      th { background: #e0e7ef !important; }
    </style>`;
    const win = window.open('', '_blank', 'width=1200,height=900');
    win.document.write('<html><head><title>인쇄</title>' + printStyle + '</head><body>' + clone.outerHTML + '<script>window.print();setTimeout(()=>window.close(),100);<\/script></body></html>');
    win.document.close();
  };
}

// 요약 대시보드 업데이트 함수
async function updateSummaryDashboard(date, receiving, shipping) {
  // 날짜 표시
  const summaryDateEl = document.getElementById('summary-date');
  if (summaryDateEl) {
    const dateObj = new Date(date);
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const formatted = `${date} (${weekdays[dateObj.getDay()]})`;
    summaryDateEl.textContent = formatted;
  }

  // 오늘 입고 수량 (고유 컨테이너 수)
  const todayInCount = new Set(receiving.map(r => r.container_no)).size;
  const todayInEl = document.getElementById('today-in-count');
  if (todayInEl) todayInEl.textContent = todayInCount;

  // 오늘 출고 수량 (고유 컨테이너 수)
  const todayOutCount = new Set(shipping.map(s => s.container_no)).size;
  const todayOutEl = document.getElementById('today-out-count');
  if (todayOutEl) todayOutEl.textContent = todayOutCount;

  // 현재 재고 현황 (전체 receiving_items에서 location_code가 있는 항목 수)
  const { data: allItems, error } = await supabase
    .from('mx_receiving_items')
    .select('container_no, location_code');
  
  if (!error && allItems) {
    // location_code가 있고 비어있지 않은 고유 컨테이너 수
    const stockCount = new Set(
      allItems
        .filter(item => item.location_code && item.location_code.trim() !== '')
        .map(item => item.container_no)
    ).size;
    
    const stockEl = document.getElementById('current-stock');
    if (stockEl) stockEl.textContent = stockCount;
  }
}

// 특이사항 저장 함수 (Supabase DB 사용)
async function saveRemarks() {
  console.log('💾 saveRemarks 함수 호출됨');
  const date = document.getElementById('report-date').value;
  const remarks = document.getElementById('remarks-input').value;
  
  console.log('저장 데이터:', { date, remarks });
  
  if (!date) {
    alert('날짜를 선택해주세요.');
    return;
  }
  
  try {
    // 기존 데이터 확인
    const { data: existing } = await supabase
      .from('mx_daily_report_remarks')
      .select('id')
      .eq('report_date', date)
      .maybeSingle();
    
    let result;
    if (existing) {
      // 업데이트
      result = await supabase
        .from('mx_daily_report_remarks')
        .update({ remarks: remarks })
        .eq('report_date', date);
      console.log('✅ DB 업데이트 완료');
    } else {
      // 삽입
      result = await supabase
        .from('mx_daily_report_remarks')
        .insert({ report_date: date, remarks: remarks });
      console.log('✅ DB 삽입 완료');
    }
    
    if (result.error) throw result.error;
    
    alert('특이사항이 저장되었습니다.');
  } catch (error) {
    console.error('❌ 저장 실패:', error);
    alert('저장에 실패했습니다:\n' + error.message);
  }
}

// 전역 함수로 노출
window.saveRemarks = saveRemarks;

// 특이사항 로드 함수 (Supabase DB에서)
async function loadRemarks(date) {
  console.log('📖 loadRemarks 함수 호출됨:', date);
  if (!date) {
    console.log('⚠️ 날짜가 없어서 로드 중단');
    return;
  }
  
  try {
    const { data, error } = await supabase
      .from('mx_daily_report_remarks')
      .select('remarks')
      .eq('report_date', date)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    const remarks = data?.remarks || '';
    console.log('📦 DB에서 로드:', { date, remarks });
    
    const remarksInput = document.getElementById('remarks-input');
    if (remarksInput) {
      remarksInput.value = remarks;
      console.log('✅ 특이사항 입력란에 설정 완료');
    } else {
      console.error('❌ 특이사항 입력란(#remarks-input)을 찾을 수 없음');
    }
  } catch (error) {
    console.error('❌ 로드 실패:', error);
    // 오류가 있어도 빈 값으로 설정
    const remarksInput = document.getElementById('remarks-input');
    if (remarksInput) remarksInput.value = '';
  }
}

// 전역 함수로 노출
window.loadRemarks = loadRemarks;

// 요약 대시보드 캡쳐 함수
function captureSummary() {
  console.log('📸 캡쳐 함수 호출됨');
  
  const dashboard = document.getElementById('summary-dashboard');
  const buttons = document.getElementById('action-buttons');
  
  if (!dashboard) {
    alert('캡쳐할 대시보드를 찾을 수 없습니다.');
    return;
  }

  // html2canvas 로드 확인
  if (typeof html2canvas === 'undefined') {
    alert('캡쳐 라이브러리가 로드되지 않았습니다.\n페이지를 새로고침 해주세요.');
    console.error('html2canvas is not loaded');
    return;
  }

  console.log('캡쳐 시작...');
  
  // 캡쳐 전에 버튼 숨기기
  if (buttons) buttons.style.display = 'none';
  
  // html2canvas를 사용하여 캡쳐
  html2canvas(dashboard, {
    backgroundColor: '#ffffff',
    scale: 2,
    logging: false,
    useCORS: true
  }).then(canvas => {
    console.log('캡쳐 완료, 다운로드 시작...');
    
    // 캡쳐 후 버튼 다시 보이기
    if (buttons) buttons.style.display = 'flex';

    // 이미지로 다운로드
    const date = document.getElementById('report-date').value;
    canvas.toBlob((blob) => {
      if (!blob) {
        alert('이미지 생성에 실패했습니다.');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `일일리포트_${date}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('✅ 다운로드 완료!');
    }, 'image/png');
  }).catch(error => {
    // 오류 시에도 버튼 다시 보이기
    if (buttons) buttons.style.display = 'flex';
    console.error('❌ 캡쳐 실패:', error);
    alert('캡쳐에 실패했습니다:\n' + error.message);
  });
}

// 전역 함수로 노출
window.captureSummary = captureSummary;

// 금주 일별 현황 업데이트 함수
async function updateWeeklySummary(selectedDate) {
  // 선택된 날짜가 속한 주의 월요일과 일요일 계산
  const date = new Date(selectedDate);
  const dayOfWeek = date.getDay(); // 0(일요일) ~ 6(토요일)
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 월요일로 조정
  
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates.push(d.toISOString().slice(0, 10));
  }
  
  // 각 날짜별 데이터 조회
  const weeklyData = [];
  let cumulativeStock = 0;
  
  // 해당 주 시작 전의 재고 계산 (월요일 이전의 전체 재고)
  const { data: itemsBeforeWeek } = await supabase
    .from('mx_receiving_items')
    .select('container_no, location_code, created_at')
    .lt('created_at', monday.toISOString());
  
  // 주 시작 전 재고 계산
  if (itemsBeforeWeek) {
    const stockBeforeWeek = new Set(
      itemsBeforeWeek
        .filter(item => item.location_code && item.location_code.trim() !== '')
        .map(item => item.container_no)
    ).size;
    cumulativeStock = stockBeforeWeek;
  }
  
  for (const dateStr of weekDates) {
    // 입고 조회
    const { data: plans } = await supabase
      .from('mx_receiving_plan')
      .select('container_no')
      .eq('receive_date', dateStr);
    
    const inCount = new Set((plans || []).map(p => p.container_no)).size;
    
    // 출고 조회 (shipping_date 기준)
    const { data: shipping } = await supabase
      .from('mx_shipping_instruction')
      .select('container_no')
      .eq('shipping_date', dateStr);
    
    const outCount = new Set((shipping || []).map(s => s.container_no)).size;
    
    // 재고는 누적 계산
    cumulativeStock = cumulativeStock + inCount - outCount;
    
    weeklyData.push({
      date: dateStr,
      in: inCount,
      out: outCount,
      stock: cumulativeStock
    });
  }
  
  // 테이블 렌더링
  const tbody = document.getElementById('weekly-summary-body');
  if (!tbody) return;
  
  const weekdays = ['월', '화', '수', '목', '금', '토', '일'];
  tbody.innerHTML = weeklyData.map((item, index) => {
    const isToday = item.date === selectedDate;
    const dateObj = new Date(item.date);
    const formatted = `${item.date.split('-')[1]}/${item.date.split('-')[2]} (${weekdays[index]})`;
    
    return `
      <tr class="${isToday ? 'today' : ''}">
        <td>${formatted}</td>
        <td>${item.in}대</td>
        <td>${item.out}대</td>
        <td>${item.stock}대</td>
      </tr>
    `;
  }).join('');
}

// 전역 함수로 노출
window.updateWeeklySummary = updateWeeklySummary;

// 요약 대시보드 인쇄 함수
function printSummary() {
  const dashboard = document.getElementById('summary-dashboard');
  if (!dashboard) {
    alert('인쇄할 대시보드를 찾을 수 없습니다.');
    return;
  }

  const clone = dashboard.cloneNode(true);
  // 버튼 제거
  const buttons = clone.querySelector('.action-buttons');
  if (buttons) buttons.remove();

  const printStyle = `
    <style>
      @page { size: A4 portrait; margin: 1cm; }
      body { font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif; }
      .summary-dashboard {
        background: white;
        padding: 30px;
      }
      .summary-title {
        text-align: center;
        font-size: 2em;
        font-weight: bold;
        margin-bottom: 10px;
      }
      .summary-date {
        text-align: center;
        font-size: 1.3em;
        color: #666;
        margin-bottom: 30px;
      }
      .summary-cards {
        display: flex;
        justify-content: space-around;
        gap: 20px;
        margin-bottom: 30px;
      }
      .summary-card {
        flex: 1;
        background: #f8f9fa;
        border: 2px solid #dee2e6;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
      }
      .summary-card h3 {
        font-size: 1.3em;
        margin-bottom: 15px;
        color: #495057;
      }
      .summary-card .number {
        font-size: 3em;
        font-weight: bold;
        color: #2563eb;
      }
      .summary-card .unit {
        font-size: 1.2em;
        color: #6c757d;
      }
      .remarks-section {
        background: #f8f9fa;
        border: 2px solid #dee2e6;
        border-radius: 8px;
        padding: 20px;
      }
      .remarks-section h3 {
        font-size: 1.3em;
        margin-bottom: 15px;
        color: #495057;
      }
      .remarks-section textarea {
        width: 100%;
        min-height: 150px;
        padding: 10px;
        border: 1px solid #ced4da;
        border-radius: 4px;
        font-size: 1.1em;
        background: white;
      }
    </style>
  `;

  const win = window.open('', '_blank', 'width=800,height=600');
  win.document.write('<html><head><title>일일 리포트</title>' + printStyle + '</head><body>' + clone.outerHTML + '<script>window.print();setTimeout(()=>window.close(),500);<\/script></body></html>');
  win.document.close();
} 