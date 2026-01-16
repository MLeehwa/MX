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
      // 1. 입고 데이터 조회 (Container 단위, plan_id를 통한 관계 조회)
      const { data: receiving, error: recError } = await supabase
        .from('mx_receiving_items')
        .select('container_no, remark, location_code, receiving_place, label_id, plan_id, mx_receiving_plan:plan_id(receive_date)');
      if (recError) throw recError;

      // 2. 출고 데이터 조회 (Container 단위)
      const { data: shipping, error: shipError } = await supabase
        .from('mx_shipping_instruction')
        .select('container_no, shipping_date, status');
      if (shipError) throw shipError;

      // 2-1. 출고 실물 단위 조회 (shipping_instruction_items의 shipped_at)
      // Container 단위: label_id 대신 container_no 사용
      const { data: shippedItems, error: shippedItemsError } = await supabase
        .from('mx_shipping_instruction_items')
        .select('container_no, shipped_at, shipping_instruction_id');
      if (shippedItemsError) throw shippedItemsError;
      const shippedContainerSet = new Set((shippedItems || []).filter(i => i.shipped_at).map(i => String(i.container_no)));
      const shippedContainerToDate = {};
      (shippedItems || []).forEach(i => {
        if (i.shipped_at && i.container_no) shippedContainerToDate[String(i.container_no)] = i.shipped_at;
      });

      // 3. 실입고 기록 조회
      const { data: logs, error: logError } = await supabase
        .from('mx_receiving_log')
        .select('label_id, received_at');
      if (logError) throw logError;
      // label_id -> received_at 매핑
      const receivedMap = new Map();
      (logs || []).forEach(l => {
        if (l.label_id) receivedMap.set(String(l.label_id), l.received_at);
      });

      // 4. 컨테이너별로 입고/출고/입고대기 매칭 (Container 단위)
      const normalize = v => (v === undefined || v === null) ? '' : String(v).trim().toLowerCase();
      
      // container_no로 그룹화하여 중복 제거
      const groupedReceiving = {};
      receiving.forEach(rec => {
        const key = String(rec.container_no);
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
        // 출고 여부 - Container 단위로 매칭
        const ships = shipping.filter(s => {
          return normalize(s.container_no) === normalize(rec.container_no);
        });
        const ship = ships.find(s => s.status === 'shipped' && s.shipping_date);
        if (ship && receivedMap.has(String(rec.label_id))) {
          status = 'Shipped';
          out_date = ship.shipping_date || '-';
        }
        // receive_date는 mx_receiving_plan에서 가져오기
        const receiveDate = rec.mx_receiving_plan?.receive_date || '-';
        return {
          container_no: rec.container_no,
          remark: rec.remark || '-',
          in_date: in_date,
          out_date: out_date,
          status: status,
          receiving_place: rec.receiving_place || '',
          location_code: rec.location_code || '',
          receive_date: receiveDate
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
        if (filterPartNo.value && !(row.remark || '').toLowerCase().includes(filterPartNo.value.toLowerCase())) return false;
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
          <td class="p-2 border">${row.remark || '-'}</td>
          <td class="p-2 border">${row.in_date || '-'}</td>
          <td class="p-2 border">${row.out_date || '-'}</td>
          <td class="p-2 border">${row.receiving_place || '-'}</td>
          <td class="p-2 border">${row.location_code || '-'}</td>
          <td class="p-2 border">${row.status}</td>
        `;
        reportTableBody.appendChild(tr);
      }
      if (filtered.length === 0) {
        reportTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-gray-400 py-8">검색 결과가 없습니다.</td></tr>';
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

    // 0. flagged_containers 테이블에서 문제 컨테이너 번호, 사유, 색상 조회
    const { data: flaggedContainers, error: flaggedError } = await supabase
        .from('mx_flagged_containers')
      .select('container_no, reason, highlight_color');
    const flaggedContainerSet = new Set();
    const flaggedContainerReasonMap = new Map();
    const flaggedContainerColorMap = new Map();
    if (!flaggedError && flaggedContainers) {
      flaggedContainers.forEach(fc => {
        if (fc.container_no) {
          const normalizedNo = normalize(fc.container_no);
          flaggedContainerSet.add(normalizedNo);
          if (fc.reason) {
            flaggedContainerReasonMap.set(normalizedNo, fc.reason);
          }
          // 색상 저장 (기본값: 빨간색)
          const color = fc.highlight_color || '#FF0000';
          flaggedContainerColorMap.set(normalizedNo, color);
        }
      });
    }

    // 1. receiving_log 데이터 조회 (label_id, received_at)
    const { data: logs, error: logError } = await supabase
      .from('mx_receiving_log')
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

    // 컬럼 너비 설정
    ws1.columns = [
      { width: 6 },
      { width: 20 },
      { width: 20 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
      { width: 10 },
      { width: 10 },
      { width: 12 },
      { width: 30 }
    ];

    // 1행: 제목 추가
    ws1.getCell('A1').value = 'LHM Pesqueria Hub Report';
    ws1.mergeCells('A1:J1');
    const titleRow = ws1.getRow(1);
    titleRow.font = { bold: true, size: 16, color: { argb: 'FF000000' } };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    titleRow.height = 35;

    // 3행: 헤더 추가
    const headerRow1 = ws1.getRow(3);
    headerRow1.values = ['NO.', 'CONTAINER NO.', '제품 정보', 'IN DATE', 'OUT DATE', 'FROM', 'LOCATION', 'DURATION', 'STATUS', 'REMARK'];
    headerRow1.height = 30;
    headerRow1.eachCell((cell, colNumber) => {
      if (colNumber <= 10) { // J열까지만
        cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      }
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
      // 전체 데이터 재조회 (Container 단위)
      const { data: receiving, error: recError } = await supabase
        .from('mx_receiving_items')
        .select('container_no, remark, location_code, receiving_place, label_id, plan_id, mx_receiving_plan:plan_id(receive_date)');
      if (recError) throw recError;
      const { data: shipping, error: shipError } = await supabase
        .from('mx_shipping_instruction')
        .select('container_no, shipping_date, status');
      if (shipError) throw shipError;
      // Container 단위: label_id 대신 container_no 사용
      const { data: shippedItems, error: shippedItemsError } = await supabase
        .from('mx_shipping_instruction_items')
        .select('container_no, shipped_at, shipping_instruction_id');
      if (shippedItemsError) throw shippedItemsError;
      const shippedContainerSet = new Set((shippedItems || []).filter(i => i.shipped_at).map(i => String(i.container_no)));
      const shippedContainerToDate = {};
      (shippedItems || []).forEach(i => {
        if (i.shipped_at && i.container_no) shippedContainerToDate[String(i.container_no)] = i.shipped_at;
      });

      // container_no로 그룹화하여 중복 제거 (Container 단위)
      const groupedReceiving = {};
      receiving.forEach(rec => {
        const key = String(rec.container_no);
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
        // 컨테이너 매칭 (Container 단위)
        const ships = shipping.filter(s => {
          return normalize(s.container_no) === normalize(rec.container_no);
        });
        const ship = ships.find(s => s.status === 'shipped' && s.shipping_date);
        if (ship && receivedMap.has(String(rec.label_id))) {
          status = 'Shipped';
          out_date = ship.shipping_date || '-';
        }
        // receive_date는 mx_receiving_plan에서 가져오기
        const receiveDate = rec.mx_receiving_plan?.receive_date || '-';
        return {
          container_no: rec.container_no,
          remark: rec.remark || '-',
          in_date: in_date,
          out_date: out_date,
          status: status,
          receiving_place: rec.receiving_place || '',
          location_code: rec.location_code || '',
          receive_date: receiveDate
        };
      })
      // 입고 확정(receiving_log에 있는) 항목만 남김
      .filter(row => row.in_date !== '-');
    }

    // 데이터 행 추가 (REMARK 컬럼 포함)
    exportRows.sort((a, b) => {
      if (a.in_date === b.in_date) return 0;
      return a.in_date > b.in_date ? 1 : -1;
    });
    exportRows.forEach((row, idx) => {
      let duration = '';
      if (row.in_date && row.in_date !== '-' && row.out_date && row.out_date !== '-') {
        const inD = new Date(row.in_date);
        const outD = new Date(row.out_date);
        duration = Math.max(0, Math.floor((outD - inD) / (1000*60*60*24)));
      } else if (row.in_date && row.in_date !== '-' && (!row.out_date || row.out_date === '-')) {
        // 출고일이 없으면 오늘 날짜 기준으로 계산
        const inD = new Date(row.in_date);
        duration = Math.max(0, Math.floor((today - inD) / (1000*60*60*24)));
      }
      const formatDate = (dateStr) => {
        if (dateStr === '-') return '-';
        return dateStr.replace(/-/g, '/');
      };
      // flagged_containers에 등록된 컨테이너 번호인지 확인 및 사유 가져오기
      const normalizedContainerNo = row.container_no ? normalize(row.container_no) : '';
      const isFlaggedContainer = normalizedContainerNo && flaggedContainerSet.has(normalizedContainerNo);
      const remark = isFlaggedContainer && flaggedContainerReasonMap.has(normalizedContainerNo) 
        ? flaggedContainerReasonMap.get(normalizedContainerNo) 
        : '';
      
      ws1.addRow([
        idx + 1,
        row.container_no,
        row.remark || '-',
        formatDate(row.in_date),
        formatDate(row.out_date),
        row.receiving_place || '',
        row.location_code || '',
        duration,
        row.status,
        remark
      ]);
      // 데이터 행에도 모든 셀에 테두리 추가 (J열까지만)
      const dataRow = ws1.getRow(ws1.rowCount);
      dataRow.eachCell((cell, colNumber) => {
        if (colNumber <= 10) { // J열까지만
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
          if (colNumber === 10) { // REMARK 컬럼
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }
        }
      });
      // flagged_containers에 등록된 컨테이너인 경우 선택된 색상으로 음영 적용
      if (isFlaggedContainer) {
        // 색상 가져오기 (기본값: 빨간색)
        const highlightColor = flaggedContainerColorMap.has(normalizedContainerNo) 
          ? flaggedContainerColorMap.get(normalizedContainerNo) 
          : '#FF0000';
        
        // #RRGGBB 형식을 ARGB 형식으로 변환 (FF + RRGGBB)
        const argbColor = 'FF' + highlightColor.replace('#', '');
        
        dataRow.eachCell((cell, colNumber) => {
          if (colNumber <= 10) { // J열까지만
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: argbColor }
            };
          }
        });
      } else if (idx % 2 === 1) {
        // 기존 로직: 짝수 행에 회색 음영 (J열까지만)
        dataRow.eachCell((cell, colNumber) => {
          if (colNumber <= 10) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF2F2F2' }
            };
          }
        });
      }
    });

    ws1.autoFilter = {
      from: { row: 3, column: 1 },
      to: { row: 3, column: 10 }
    };

    // 시트2: TODAY INOUT (오늘 입고/출고 내역)
    // 시트3 생성 전, receiving, shippedItems, logs, shipping 등 항상 조회 (변수명 중복 방지, Container 단위)
    const { data: todayReceiving, error: todayRecError } = await supabase
      .from('mx_receiving_items')
      .select('container_no, remark, location_code, receiving_place, label_id, plan_id, mx_receiving_plan:plan_id(receive_date)');
    if (todayRecError) throw todayRecError;
    const { data: todayShipping, error: todayShipError } = await supabase
      .from('mx_shipping_instruction')
      .select('container_no, shipping_date, status');
    if (todayShipError) throw todayShipError;
    const { data: todayShippedItems, error: todayShippedItemsError } = await supabase
      .from('mx_shipping_instruction_items')
      .select('container_no, shipped_at, shipping_instruction_id');
    if (todayShippedItemsError) throw todayShippedItemsError;
    const { data: todayLogs, error: todayLogError } = await supabase
      .from('mx_receiving_log')
      .select('label_id, received_at');
    if (todayLogError) throw todayLogError;

    const ws2 = workbook.addWorksheet('TODAY INOUT', {
      properties: { tabColor: { argb: 'FFFFC000' } }
    });
    
    // 컬럼 너비 설정
    ws2.columns = [
      { width: 8 },
      { width: 10 },
      { width: 20 },
      { width: 20 },
      { width: 15 },
      { width: 15 },
      { width: 15 }
    ];

    // 1행: 제목 추가
    ws2.getCell('A1').value = 'LHM Pesqueria Hub Report';
    ws2.mergeCells('A1:G1');
    const titleRow2 = ws2.getRow(1);
    titleRow2.font = { bold: true, size: 16, color: { argb: 'FF000000' } };
    titleRow2.alignment = { vertical: 'middle', horizontal: 'center' };
    titleRow2.height = 35;

    // 3행: 헤더 추가
    const headerRow2 = ws2.getRow(3);
    headerRow2.values = ['NO.', 'TYPE', 'CONTAINER NO.', '제품 정보', 'DATE', 'LOCATION', 'REMARKS'];
    headerRow2.height = 30;
    headerRow2.eachCell((cell, colNumber) => {
      if (colNumber <= 7) { // G열까지만
        cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC000' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      }
    });
    // 오늘 날짜(YYYY-MM-DD)
    const todayStrYMD = today.toISOString().slice(0,10);
    // 오늘 입고 내역 (receiving_log)
    let todayInRows = [];
    (todayLogs || []).forEach((log, idx) => {
      if (log.received_at && log.received_at.slice(0,10) === todayStrYMD) {
        // receiving_items에서 정보 찾기 (Container 단위, label_id로 찾기)
        const rec = (todayReceiving || []).find(r => String(r.label_id) === String(log.label_id));
        if (rec) {
          todayInRows.push({
            type: 'IN',
            container: rec.container_no,
            part: rec.remark || '-',
            date: log.received_at.slice(0,10),
            location: rec.location_code || '',
            remarks: ''
          });
        }
      }
    });
    // 오늘 출고 내역 (shipping_instruction_items, Container 단위)
    (todayShippedItems || []).forEach((item, idx) => {
      if (item.shipped_at && item.shipped_at.slice(0,10) === todayStrYMD) {
        // receiving_items에서 container_no로 정보 찾기
        const rec = (todayReceiving || []).find(r => String(r.container_no) === String(item.container_no));
        if (rec) {
          todayInRows.push({
            type: 'OUT',
            container: rec.container_no,
            part: rec.remark || '-',
            date: item.shipped_at.slice(0,10),
            location: rec.location_code || '',
            remarks: ''
          });
        }
      }
    });
    // 날짜, 타입, 컨테이너, 제품 정보로 정렬
    todayInRows.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'IN' ? -1 : 1;
      if (a.date !== b.date) return a.date > b.date ? 1 : -1;
      if (a.container !== b.container) return a.container > b.container ? 1 : -1;
      if (a.part !== b.part) return a.part > b.part ? 1 : -1;
      return 0;
    });
    todayInRows.forEach((row, idx) => {
      const dataRow = ws2.addRow([
        idx + 1,
        row.type,
        row.container,
        row.part,
        row.date,
        row.location,
        row.remarks
      ]);
      dataRow.height = 25;
      dataRow.eachCell((cell, colNumber) => {
        if (colNumber <= 7) { // G열까지만
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });
      if (idx % 2 === 1) {
        dataRow.eachCell((cell, colNumber) => {
          if (colNumber <= 7) { // G열까지만
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFF2CC' }
            };
          }
        });
      }
    });
    ws2.autoFilter = {
      from: { row: 3, column: 1 },
      to: { row: 3, column: 7 }
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
          .from('mx_receiving_plan')
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
          .from('mx_receiving_plan')
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
        const { error: itemsError } = await supabase.from('mx_receiving_items').insert(items);
        if (itemsError) throw itemsError;
      } else {
        // 컨테이너는 기존 방식(직접 입력/수정)
        const { data: planData, error: planError } = await supabase
          .from('mx_receiving_plan')
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
        const { error: itemsError } = await supabase.from('mx_receiving_items').insert(items);
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