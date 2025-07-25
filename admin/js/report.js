// import { CONFIG } from '../config/config.js';
// import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = window.supabase;

export async function loadReport() {
  const content = document.getElementById('mainContent');
  // 1. HTML 동적 로드
  const res = await fetch('sections/report.html');
  const html = await res.text();
  content.innerHTML = html;

  // 2. DOM Elements 재선언 (동적 로드 후)
  const filterInDateFrom = document.getElementById('filterInDateFrom');
  const filterInDateTo = document.getElementById('filterInDateTo');
  const filterOutDateFrom = document.getElementById('filterOutDateFrom');
  const filterOutDateTo = document.getElementById('filterOutDateTo');
  const filterContainer = document.getElementById('filterContainer');
  const filterPartNo = document.getElementById('filterPartNo');
  const filterStatus = document.getElementById('filterStatus');
  const searchBtn = document.getElementById('searchBtn');
  const excelBtn = document.getElementById('excelBtn');
  const reportTableBody = document.getElementById('reportTableBody');
  const reportLoading = document.getElementById('reportLoading');
  const reportError = document.getElementById('reportError');

  searchBtn.addEventListener('click', loadReportData);
  excelBtn.addEventListener('click', downloadExcel);

  // 최초 로딩
  loadReportData();

  async function loadReportData() {
    reportLoading.classList.remove('hidden');
    reportError.classList.add('hidden');
    reportTableBody.innerHTML = '';
    try {
      // 1. 입고 데이터 조회
      const { data: receiving, error: recError } = await supabase
        .from('receiving_items')
        .select('container_no, part_no, quantity, location_code, receiving_place, receiving_plan(receive_date), label_id');
      if (recError) throw recError;

      // 2. 출고 데이터 조회 (shipping_instruction에서 출고일 추출)
      const { data: shipping, error: shipError } = await supabase
        .from('shipping_instruction')
        .select('container_no, part_no, shipping_date, status, part_quantities');
      if (shipError) throw shipError;

      // 2-1. 출고 실물 단위 조회 (shipping_instruction_items의 shipped_at)
      const { data: shippedItems, error: shippedItemsError } = await supabase
        .from('shipping_instruction_items')
        .select('label_id, shipped_at, shipping_instruction_id');
      if (shippedItemsError) throw shippedItemsError;
      const shippedLabelSet = new Set((shippedItems || []).filter(i => i.shipped_at).map(i => String(i.label_id)));
      const shippedLabelToDate = {};
      (shippedItems || []).forEach(i => {
        if (i.shipped_at && i.label_id) shippedLabelToDate[String(i.label_id)] = i.shipped_at;
      });

      // 3. 실입고 기록 조회
      const { data: logs, error: logError } = await supabase
        .from('receiving_log')
        .select('label_id, received_at');
      if (logError) throw logError;
      // label_id -> received_at 매핑
      const receivedMap = new Map();
      (logs || []).forEach(l => {
        if (l.label_id) receivedMap.set(String(l.label_id), l.received_at);
      });

      // 4. 컨테이너/파트별로 입고/출고/입고대기 매칭
      const normalize = v => (v === undefined || v === null) ? '' : String(v).trim().toLowerCase();
      
      // label_id로 그룹화하여 중복 제거
      const groupedReceiving = {};
      receiving.forEach(rec => {
        const key = String(rec.label_id);
        if (!groupedReceiving[key]) {
          groupedReceiving[key] = rec;
        }
      });

      const reportRows = Object.values(groupedReceiving).map(rec => {
        let status = 'Waiting for Receiving';
        let out_date = '-';
        let in_date = '-';
        // 입고 확정일
        if (receivedMap.has(String(rec.label_id))) {
          status = 'In Stock';
          in_date = receivedMap.get(String(rec.label_id))?.slice(0, 10) || '-';
        }
        // 출고 여부 - part_quantities가 있는 경우 해당 파트가 포함되어 있는지 확인
        const ships = shipping.filter(s => {
          if (normalize(s.container_no) !== normalize(rec.container_no)) return false;
          
          // part_quantities가 있는 경우 (여러 파트)
          if (s.part_quantities) {
            try {
              const partQuantities = JSON.parse(s.part_quantities);
              return Object.keys(partQuantities).some(part => 
                normalize(part) === normalize(rec.part_no)
              );
            } catch (e) {
              console.error('Error parsing part_quantities:', e);
              return false;
            }
          }
          
          // 기존 방식 (단일 파트)
          return normalize(s.part_no) === normalize(rec.part_no);
        });
        const ship = ships.find(s => s.status === 'shipped' && s.shipping_date);
        if (ship && receivedMap.has(String(rec.label_id))) {
          status = 'Shipped';
          out_date = ship.shipping_date || '-';
        }
        return {
          container_no: rec.container_no,
          part_no: rec.part_no,
          in_date: in_date,
          out_date: out_date,
          status: status,
          remarks: '',
          quantity: rec.quantity || 0,
          receiving_place: rec.receiving_place || '',
          location_code: rec.location_code || ''
        };
      })
      // 입고 확정(receiving_log에 있는) 항목만 남김
      .filter(row => row.in_date !== '-');

      // 6. 필터 적용 (모두 비어있으면 전체 출력)
      let filtered = reportRows.filter(row => {
        if (filterInDateFrom.value && row.in_date < filterInDateFrom.value) return false;
        if (filterInDateTo.value && row.in_date > filterInDateTo.value) return false;
        if (filterOutDateFrom.value && (row.out_date === '-' || row.out_date < filterOutDateFrom.value)) return false;
        if (filterOutDateTo.value && (row.out_date === '-' || row.out_date > filterOutDateTo.value)) return false;
        if (filterContainer.value && !(row.container_no || '').toLowerCase().includes(filterContainer.value.toLowerCase())) return false;
        if (filterPartNo.value && !(row.part_no || '').toLowerCase().includes(filterPartNo.value.toLowerCase())) return false;
        if (filterStatus.value && (filterStatus.value === 'shipped' ? row.status !== 'Shipped' : row.status !== 'In Stock')) return false;
        return true;
      });
      if (
        !filterInDateFrom.value &&
        !filterInDateTo.value &&
        !filterOutDateFrom.value &&
        !filterOutDateTo.value &&
        !filterContainer.value &&
        !filterPartNo.value &&
        !filterStatus.value
      ) {
        filtered = reportRows;
      }

      // 7. 정렬 (동적)
      filtered.sort((a, b) => {
        // in_date 오름차순 정렬
        if (a.in_date === b.in_date) return 0;
        return a.in_date > b.in_date ? 1 : -1;
      });

      // 전역에 저장 (엑셀 다운로드용)
      window._lastReportRows = filtered;

      // 8. 렌더링
      for (const row of filtered) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="p-2 border">${row.container_no || '-'}</td>
          <td class="p-2 border">${row.part_no || '-'}</td>
          <td class="p-2 border">${row.in_date || '-'}</td>
          <td class="p-2 border">${row.out_date || '-'}</td>
          <td class="p-2 border">${row.receiving_place || '-'}</td>
          <td class="p-2 border">${row.location_code || '-'}</td>
          <td class="p-2 border">${row.status}</td>
          <td class="p-2 border">${row.remarks || ''}</td>
          <td class="p-2 border">${row.quantity || 0}</td>
        `;
        reportTableBody.appendChild(tr);
      }
      if (filtered.length === 0) {
        reportTableBody.innerHTML = '<tr><td colspan="9" class="text-center text-gray-400 py-8">검색 결과가 없습니다.</td></tr>';
      }
    } catch (err) {
      reportError.textContent = '데이터 로드 실패: ' + err.message;
      reportError.classList.remove('hidden');
    }
    reportLoading.classList.add('hidden');
  }

  async function downloadExcel() {
    const selectedDate = document.getElementById('excelDate').value;
    let today;
    if (selectedDate) {
      today = new Date(selectedDate + 'T00:00:00');
    } else {
      today = new Date();
    }
    const todayStr = today.toISOString().slice(0,10).replace(/-/g, '');
    const workbook = new window.ExcelJS.Workbook();
    workbook.creator = 'Admin';
    workbook.lastModifiedBy = 'Admin';
    workbook.created = new Date();
    workbook.modified = new Date();

    // normalize 함수 추가
    const normalize = v => (v === undefined || v === null) ? '' : String(v).trim().toLowerCase();

    // 1. receiving_log 데이터 조회 (label_id, received_at)
    const { data: logs, error: logError } = await supabase
      .from('receiving_log')
      .select('label_id, received_at');
    if (logError) throw logError;
    const receivedMap = new Map();
    (logs || []).forEach(l => {
      if (l.label_id) receivedMap.set(String(l.label_id), l.received_at);
    });

    // 시트1: INOUT REPORT
    const ws1 = workbook.addWorksheet('INOUT REPORT', {
      properties: { tabColor: { argb: 'FF4472C4' } }
    });

    // 시트1 헤더 및 컬럼 정의 (REMARKS 컬럼 제거)
    ws1.columns = [
      { header: 'NO.', key: 'no', width: 6 },
      { header: 'CONTAINER NO.', key: 'container', width: 20 },
      { header: 'PART NO.', key: 'part', width: 12 },
      { header: 'IN DATE', key: 'in_date', width: 12 },
      { header: 'OUT DATE', key: 'out_date', width: 12 },
      { header: 'FROM', key: 'from', width: 12 },
      { header: 'LOCATION', key: 'location', width: 10 },
      { header: 'DURATION', key: 'duration', width: 10 },
      { header: 'QTY', key: 'qty', width: 8 },
      { header: 'STATUS', key: 'status', width: 12 }
    ];

    // 시트1 헤더 스타일
    const headerRow1 = ws1.getRow(1);
    headerRow1.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    headerRow1.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow1.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow1.height = 30;
    headerRow1.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    // 필터 입력값 확인
    const hasFilter = !!(
      filterInDateFrom.value || filterInDateTo.value ||
      filterOutDateFrom.value || filterOutDateTo.value ||
      filterContainer.value || filterPartNo.value || filterStatus.value
    );

    let exportRows = [];
    if (hasFilter && window._lastReportRows && Array.isArray(window._lastReportRows)) {
      exportRows = window._lastReportRows;
    } else {
      // 전체 데이터 재조회 (기존 방식)
      const { data: receiving, error: recError } = await supabase
        .from('receiving_items')
        .select('container_no, part_no, quantity, location_code, receiving_place, receiving_plan(receive_date), label_id');
      if (recError) throw recError;
      const { data: shipping, error: shipError } = await supabase
        .from('shipping_instruction')
        .select('container_no, part_no, shipping_date, status, part_quantities');
      if (shipError) throw shipError;
      const { data: shippedItems, error: shippedItemsError } = await supabase
        .from('shipping_instruction_items')
        .select('label_id, shipped_at, shipping_instruction_id');
      if (shippedItemsError) throw shippedItemsError;
      const shippedLabelSet = new Set((shippedItems || []).filter(i => i.shipped_at).map(i => String(i.label_id)));
      const shippedLabelToDate = {};
      (shippedItems || []).forEach(i => {
        if (i.shipped_at && i.label_id) shippedLabelToDate[String(i.label_id)] = i.shipped_at;
      });

      // label_id로 그룹화하여 중복 제거
      const groupedReceiving = {};
      receiving.forEach(rec => {
        const key = String(rec.label_id);
        if (!groupedReceiving[key]) {
          groupedReceiving[key] = rec;
        }
      });

      exportRows = Object.values(groupedReceiving).map(rec => {
        let status = 'Waiting for Receiving';
        let out_date = '-';
        let in_date = '-';
        if (receivedMap.has(String(rec.label_id))) {
          status = 'In Stock';
          in_date = receivedMap.get(String(rec.label_id))?.slice(0, 10) || '-';
        }
        // 컨테이너와 파트 매칭 - part_quantities가 있는 경우 해당 파트가 포함되어 있는지 확인
        const ships = shipping.filter(s => {
          if (normalize(s.container_no) !== normalize(rec.container_no)) return false;
          
          // part_quantities가 있는 경우 (여러 파트)
          if (s.part_quantities) {
            try {
              const partQuantities = JSON.parse(s.part_quantities);
              return Object.keys(partQuantities).some(part => 
                normalize(part) === normalize(rec.part_no)
              );
            } catch (e) {
              console.error('Error parsing part_quantities:', e);
              return false;
            }
          }
          
          // 기존 방식 (단일 파트)
          return normalize(s.part_no) === normalize(rec.part_no);
        });
        const ship = ships.find(s => s.status === 'shipped' && s.shipping_date);
        if (ship && receivedMap.has(String(rec.label_id))) {
          status = 'Shipped';
          out_date = ship.shipping_date || '-';
        }
        return {
          container_no: rec.container_no,
          part_no: rec.part_no,
          in_date: in_date,
          out_date: out_date,
          status: status,
          remarks: '',
          quantity: rec.quantity || 0,
          receiving_place: rec.receiving_place || '',
          location_code: rec.location_code || ''
        };
      })
      // 입고 확정(receiving_log에 있는) 항목만 남김
      .filter(row => row.in_date !== '-');
    }

    // 데이터 행 추가 (REMARKS 컬럼 제거)
    exportRows.sort((a, b) => {
      if (a.in_date === b.in_date) return 0;
      return a.in_date > b.in_date ? 1 : -1;
    });
    exportRows.forEach((row, idx) => {
      let duration = '';
      if (row.in_date && row.in_date !== '-') {
        const inD = new Date(row.in_date);
        duration = Math.max(0, Math.floor((today - inD) / (1000*60*60*24)));
      }
      const formatDate = (dateStr) => {
        if (dateStr === '-') return '-';
        return dateStr.replace(/-/g, '/');
      };
      ws1.addRow({
        no: idx + 1,
        container: row.container_no,
        part: row.part_no,
        in_date: formatDate(row.in_date),
        out_date: formatDate(row.out_date),
        from: row.receiving_place || '',
        location: row.location_code || '',
        duration: duration,
        qty: Number(row.quantity),
        status: row.status
      });
      // 데이터 행에도 모든 셀에 테두리 추가
      const dataRow = ws1.getRow(ws1.rowCount);
      dataRow.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
        if (colNumber === 9) { // QTY 컬럼
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = '#,##0';
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });
      if (idx % 2 === 1) {
        dataRow.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
          };
        });
      }
    });

    ws1.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 11 }
    };

    // 시트2: CURRENT STOCK (In Stock만 집계)
    const ws2 = workbook.addWorksheet('CURRENT STOCK', {
      properties: { tabColor: { argb: 'FF70AD47' } }
    });
    ws2.columns = [
      { header: 'PART NO.', key: 'part', width: 18 },
      { header: 'QTY', key: 'qty', width: 12 }
    ];
    const headerRow2 = ws2.getRow(1);
    headerRow2.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    headerRow2.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    };
    headerRow2.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow2.height = 30;
    headerRow2.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });
    // PART NO별 보유수량 합산 (In Stock만)
    const partStock = {};
    exportRows.forEach(row => {
      // receiving_log에 있는 항목만 집계 (in_date가 '-'가 아닌 것)
      if (row.status === 'In Stock' && row.in_date !== '-') {
        const partNo = row.part_no;
        const qty = Number(row.quantity || 0);
        if (partNo) {
          partStock[partNo] = (partStock[partNo] || 0) + qty;
        }
      }
    });
    const sortedParts = Object.entries(partStock)
      .sort(([partA], [partB]) => partA.localeCompare(partB));
    sortedParts.forEach(([part, qty], idx) => {
      const dataRow = ws2.addRow({ 
        part: part, 
        qty: Number(qty)
      });
      dataRow.height = 25;
      dataRow.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
        if (colNumber === 2) { // QTY 컬럼
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = '#,##0'; // 숫자 형식 적용
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });
      if (idx % 2 === 1) {
        dataRow.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
          };
        });
      }
    });
    ws2.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 2 }
    };

    // 시트3: TODAY INOUT (오늘 입고/출고 내역)
    // 시트3 생성 전, receiving, shippedItems, logs, shipping 등 항상 조회 (변수명 중복 방지)
    const { data: todayReceiving, error: todayRecError } = await supabase
      .from('receiving_items')
      .select('container_no, part_no, quantity, location_code, receiving_place, receiving_plan(receive_date), label_id');
    if (todayRecError) throw todayRecError;
    const { data: todayShipping, error: todayShipError } = await supabase
      .from('shipping_instruction')
      .select('container_no, part_no, shipping_date, status');
    if (todayShipError) throw todayShipError;
    const { data: todayShippedItems, error: todayShippedItemsError } = await supabase
      .from('shipping_instruction_items')
      .select('label_id, shipped_at, shipping_instruction_id');
    if (todayShippedItemsError) throw todayShippedItemsError;
    const { data: todayLogs, error: todayLogError } = await supabase
      .from('receiving_log')
      .select('label_id, received_at');
    if (todayLogError) throw todayLogError;

    const ws3 = workbook.addWorksheet('TODAY INOUT', {
      properties: { tabColor: { argb: 'FFFFC000' } }
    });
    ws3.columns = [
      { header: 'NO.', key: 'no', width: 8 },
      { header: 'TYPE', key: 'type', width: 10 },
      { header: 'CONTAINER NO.', key: 'container', width: 20 },
      { header: 'PART NO.', key: 'part', width: 18 },
      { header: 'DATE', key: 'date', width: 15 },
      { header: 'QTY', key: 'qty', width: 12 },
      { header: 'LOCATION', key: 'location', width: 15 },
      { header: 'REMARKS', key: 'remarks', width: 15 }
    ];
    const headerRow3 = ws3.getRow(1);
    headerRow3.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    headerRow3.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFC000' }
    };
    headerRow3.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow3.height = 30;
    headerRow3.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });
    // 오늘 날짜(YYYY-MM-DD)
    const todayStrYMD = today.toISOString().slice(0,10);
    // 오늘 입고 내역 (receiving_log)
    let todayInRows = [];
    (todayLogs || []).forEach((log, idx) => {
      if (log.received_at && log.received_at.slice(0,10) === todayStrYMD) {
        // receiving_items에서 정보 찾기
        const rec = (todayReceiving || []).find(r => String(r.label_id) === String(log.label_id));
        if (rec) {
          todayInRows.push({
            type: 'IN',
            container: rec.container_no,
            part: rec.part_no,
            date: log.received_at.slice(0,10),
            qty: rec.quantity,
            location: rec.location_code || '',
            remarks: ''
          });
        }
      }
    });
    // 오늘 출고 내역 (shipping_instruction_items)
    (todayShippedItems || []).forEach((item, idx) => {
      if (item.shipped_at && item.shipped_at.slice(0,10) === todayStrYMD) {
        // receiving_items에서 정보 찾기
        const rec = (todayReceiving || []).find(r => String(r.label_id) === String(item.label_id));
        if (rec) {
          todayInRows.push({
            type: 'OUT',
            container: rec.container_no,
            part: rec.part_no,
            date: item.shipped_at.slice(0,10),
            qty: rec.quantity,
            location: rec.location_code || '',
            remarks: ''
          });
        }
      }
    });
    // 날짜, 타입, 컨테이너, 파트, 수량 등으로 정렬
    todayInRows.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'IN' ? -1 : 1;
      if (a.date !== b.date) return a.date > b.date ? 1 : -1;
      if (a.container !== b.container) return a.container > b.container ? 1 : -1;
      if (a.part !== b.part) return a.part > b.part ? 1 : -1;
      return 0;
    });
    todayInRows.forEach((row, idx) => {
      const dataRow = ws3.addRow({
        no: idx + 1,
        type: row.type,
        container: row.container,
        part: row.part,
        date: row.date,
        qty: row.qty,
        location: row.location,
        remarks: row.remarks
      });
      dataRow.height = 25;
      dataRow.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
        if (colNumber === 6) { // QTY 컬럼
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = '#,##0';
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });
      if (idx % 2 === 1) {
        dataRow.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFF2CC' }
          };
        });
      }
    });
    ws3.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 8 }
    };

    // 파일 다운로드
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `INOUT_REPORT_${todayStr}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async function handleSubmitPlan() {
    // 입력값 읽기
    const type = document.getElementById("typeSelect").value;
    let container = document.getElementById("containerInput").value.trim();
    const location = document.getElementById("locationInput").value.trim();
    const receivingPlace = document.getElementById("receivingPlaceInput")?.value.trim() || '';
    const receiveDate = document.getElementById("receiveDateInput").value;
    const parts = Array.from(document.querySelectorAll(".part-input")).map(el => el.value.trim());
    const qtys = Array.from(document.querySelectorAll(".qty-input")).map(el => parseInt(el.value));

    // 입력값 검증
    if (parts.length === 0 || qtys.length === 0 || parts.some(p => !p) || qtys.some(q => !q || isNaN(q))) {
      alert('모든 품번과 수량을 입력하세요.');
      return;
    }

    try {
      let planId;
      if (type === 'trailer') {
        // 1. Plan 저장 (trailer_seq 자동 생성)
        const { data: planData, error: planError } = await supabase
          .from('receiving_plan')
          .insert({
            type,
            receive_date: receiveDate,
          })
          .select('id, trailer_seq')
          .single();
        if (planError) throw planError;
        planId = planData.id;
        const trailerNo = `T-${String(planData.trailer_seq).padStart(5, '0')}`;
        // 2. Plan의 container_no 업데이트
        await supabase
          .from('receiving_plan')
          .update({ container_no: trailerNo })
          .eq('id', planId);
        // 3. Items 저장
        const items = [];
        for (let i = 0; i < parts.length; i++) {
          items.push({
            plan_id: planId,
            part_no: parts[i],
            quantity: qtys[i],
            location_code: location,
            label_id: crypto.randomUUID(),
            container_no: trailerNo,
            receiving_place: receivingPlace,
          });
        }
        const { error: itemsError } = await supabase.from('receiving_items').insert(items);
        if (itemsError) throw itemsError;
      } else {
        // 컨테이너는 기존 방식(직접 입력/수정)
        const { data: planData, error: planError } = await supabase
          .from('receiving_plan')
          .insert({
            type,
            container_no: container,
            receive_date: receiveDate,
          })
          .select('id, trailer_seq')
          .single();
        if (planError) throw planError;
        planId = planData.id;
        // Items 저장
        const items = [];
        for (let i = 0; i < parts.length; i++) {
          items.push({
            plan_id: planId,
            part_no: parts[i],
            quantity: qtys[i],
            location_code: location,
            label_id: crypto.randomUUID(),
            container_no: container,
            receiving_place: receivingPlace,
          });
        }
        const { error: itemsError } = await supabase.from('receiving_items').insert(items);
        if (itemsError) throw itemsError;
      }
      alert('Saved!');
      document.getElementById('addPlanForm').classList.add('hidden');
      document.getElementById('itemList').innerHTML = '';
      // 목록 새로고침
      await loadPlans(true);
    } catch (error) {
      console.error('Error:', error);
      alert('저장 실패: ' + error.message);
    }
  }

  // 메시지 모달 닫기
  if (messageConfirm) {
    messageConfirm.addEventListener('click', () => {
      messageModal.classList.add('hidden');
      isMessageShowing = false;
    });
  }
  if (messageModal) {
    messageModal.addEventListener('click', (e) => {
      if (e.target === messageModal) {
        messageModal.classList.add('hidden');
        isMessageShowing = false;
      }
    });
  }

  // 강제입고 모달 닫기
  if (cancelForceReceive) {
    cancelForceReceive.addEventListener('click', () => {
      forceReceiveModal.classList.add('hidden');
      pendingForceReceive = null;
    });
  }
  if (forceReceiveModal) {
    forceReceiveModal.addEventListener('click', (e) => {
      if (e.target === forceReceiveModal) {
        forceReceiveModal.classList.add('hidden');
        pendingForceReceive = null;
      }
    });
  }
}

export async function initSection() {
  await loadReport();
} 