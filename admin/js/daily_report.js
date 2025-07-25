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
}

async function loadDailyReport(date) {
  // 1. 해당 날짜의 입고 계획(plan) 모두 조회
  const { data: plans } = await supabase
    .from('receiving_plan')
    .select('id, container_no, receive_date, type')
    .eq('receive_date', date);

  // 2. 해당 container_no 전체에 대해 receiving_items 조회
  const containerNos = (plans || []).map(plan => plan.container_no);
  let items = [];
  if (containerNos.length > 0) {
    const { data } = await supabase
      .from('receiving_items')
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
    .from('shipping_instruction')
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