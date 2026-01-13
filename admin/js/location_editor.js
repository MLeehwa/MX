// 시각적 위치 편집기
// supabase는 config.js에서 window.supabase로 설정되므로 직접 사용

// 전역 상태
let locations = [];
let backgroundElements = [];
let selectedLocation = null;
let selectedBackground = null;
let selectedLocations = []; // 다중 선택된 위치들
let selectedBackgrounds = []; // 다중 선택된 배경 요소들
let isDragging = false;
let isResizing = false;
let isDrawing = false; // 그리기 모드
let isSelecting = false; // 범위 선택 모드
let drawStartPos = { x: 0, y: 0 };
let drawPreview = null; // 그리기 미리보기 요소
let selectionBox = null; // 범위 선택 박스
let selectionStartPos = { x: 0, y: 0 }; // 범위 선택 시작 위치
let dragOffset = { x: 0, y: 0 };
let originalPositions = []; // 드래그 시작 시 원래 위치 저장 (원상복구용)
let undoStack = []; // 되돌리기 스택
let maxUndoHistory = 50; // 최대 되돌리기 이력 수
let gridSize = 20;
let snapToGridEnabled = false; // 기본값: 끄기
let showGridEnabled = true;
let currentMode = 'location'; // 'location' or 'background'
let backgroundAddMode = 'draw'; // 'draw' or 'add'
let zoomLevel = 1; // 줌 레벨 (1 = 100%)
let panOffset = { x: 0, y: 0 }; // 패닝 오프셋
let isPanning = false; // 패닝 중인지
let panStartPos = { x: 0, y: 0 }; // 패닝 시작 위치
let clipboard = null; // 클립보드 (복사된 위치들)
let boundingBox = null; // 다중 선택 바운딩 박스
let alignmentGuides = []; // 정렬 가이드라인

// 초기화
document.addEventListener('DOMContentLoaded', async () => {
  if (!window.supabase) {
    alert('Supabase가 로드되지 않았습니다. 페이지를 새로고침하세요.');
    return;
  }
  
  await loadLocations();
  await loadBackgroundElements();
  // 배경 요소를 먼저 렌더링 (DOM 순서상 앞에 위치)
  renderBackgroundElements();
  // 위치 박스를 나중에 렌더링 (z-index로 배경 위에 표시)
  renderLocations();
  setupEventListeners();
  setupCanvasDrawing();
  updateGridDisplay();
  setupModeToggle();
  setupKeyboardShortcuts();
  setupZoomAndPan();
  setupSearch();
  setupContextMenu();
  setupMinimap();
  
  // 초기 줌 적용
  applyTransform();
  
  // 배경 편집 모드일 때 그리기 모드 기본 활성화
  if (currentMode === 'background' && backgroundAddMode === 'draw') {
    const canvas = document.getElementById('canvas');
    if (canvas) canvas.classList.add('drawing');
  }
  
  // 초기 상태를 되돌리기 스택에 저장
  saveToUndoStack();
  updateUndoRedoButtons();
});

// 데이터베이스에서 위치 로드
async function loadLocations() {
  try {
    if (!window.supabase) {
      throw new Error('Supabase가 아직 초기화되지 않았습니다.');
    }
    const { data, error } = await window.supabase
      .from('wp1_locations')
      .select('*')
      .order('location_code');
    
    if (error) throw error;
    
    // 모든 위치 로드 (좌표가 없는 위치도 포함)
    // 시각적 편집기에서는 좌표가 있는 위치만 표시하지만, 모든 데이터는 로드
    locations = (data || []).filter(loc => 
      loc.x !== null && loc.y !== null && loc.width !== null && loc.height !== null
    );
    
    // 좌표가 없는 위치가 있으면 콘솔에 알림
    const locationsWithoutCoords = (data || []).filter(loc => 
      loc.x === null || loc.y === null || loc.width === null || loc.height === null
    );
    if (locationsWithoutCoords.length > 0) {
      console.log(`${locationsWithoutCoords.length}개의 위치가 좌표 정보가 없어 편집기에 표시되지 않습니다. 장소 마스터에서 좌표를 추가하세요.`);
    }
  } catch (error) {
    console.error('위치 로드 실패:', error);
    alert('위치를 불러오는데 실패했습니다: ' + error.message);
  }
}

// 위치 렌더링
function renderLocations() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;
  
  // 기존 위치 박스 제거
  document.querySelectorAll('.location-box').forEach(box => box.remove());
  
  // 위치 박스 생성 (배경 요소 뒤에 추가되도록)
  locations.forEach(loc => {
    const box = createLocationBox(loc);
    // 배경 요소들 뒤에 추가 (DOM 순서상 뒤에 있어도 z-index로 위에 표시됨)
    canvas.appendChild(box);
  });
  
  // 미니맵 업데이트
  updateMinimap();
}

// 위치 박스 생성
function createLocationBox(loc) {
  const box = document.createElement('div');
  box.className = 'location-box';
  
  // 상태에 따른 클래스 추가
  const status = loc.status || 'available';
  box.classList.add(`status-${status}`);
  
  box.dataset.id = loc.id;
  box.style.left = loc.x + 'px';
  box.style.top = loc.y + 'px';
  box.style.width = loc.width + 'px';
  box.style.height = loc.height + 'px';
  
  // 라벨
  const label = document.createElement('div');
  label.className = 'location-label';
  label.textContent = loc.location_code || '위치';
  box.appendChild(label);
  
  // 리사이즈 핸들
  const resizeHandle = document.createElement('div');
  resizeHandle.className = 'resize-handle';
  box.appendChild(resizeHandle);
  
  // 클릭 이벤트
  box.addEventListener('mousedown', (e) => {
    if (e.target === resizeHandle || e.target.closest('.resize-handle')) {
      startResize(loc, box, e);
      return;
    }
    
    // Shift 키를 누르면 다중 선택 (드래그 시작 안 함)
    if (e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      toggleLocationSelection(loc, box);
      return;
    }
    
    // 다중 선택된 상태에서 선택되지 않은 위치를 클릭하면 기존 선택 해제하고 새로 선택
    const isInSelected = selectedLocations.some(l => l.id === loc.id);
    if (selectedLocations.length > 0 && !isInSelected) {
      // 기존 선택 해제하고 새로 선택
      clearAllSelections();
      selectLocation(loc, box);
      startDrag(loc, box, e);
      return;
    }
    
    // 다중 선택된 상태에서 선택된 위치 중 하나를 클릭한 경우
    if (selectedLocations.length > 1 && isInSelected) {
      // 다중 선택 유지하고 드래그 시작
      e.preventDefault();
      startDrag(loc, box, e);
      return;
    }
    
    // 일반 클릭: 단일 선택 및 드래그 시작
    selectLocation(loc, box);
    startDrag(loc, box, e);
  });
  
  return box;
}

// 위치 선택
function selectLocation(loc, box) {
  // 기존 선택 해제
  clearAllSelections();
  
  // 새 위치 선택
  selectedLocation = loc;
  selectedLocations = [loc];
  box.classList.add('selected');
  
  // 정보 패널 업데이트
  updateSelectedLocationInfo(loc);
  updateBatchTools();
}

// 모든 선택 해제
function clearAllSelections() {
  document.querySelectorAll('.location-box').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('.background-element').forEach(el => el.classList.remove('selected'));
  selectedLocations = [];
  selectedLocation = null;
  selectedBackground = null;
  document.getElementById('selectedLocationInfo').classList.add('hidden');
  document.getElementById('selectedBackgroundInfo').classList.add('hidden');
  updateBatchTools();
}

// 위치 다중 선택 토글
function toggleLocationSelection(loc, box) {
  const index = selectedLocations.findIndex(l => l.id === loc.id);
  
  if (index >= 0) {
    // 이미 선택된 경우 해제
    selectedLocations.splice(index, 1);
    box.classList.remove('selected');
    if (selectedLocation && selectedLocation.id === loc.id) {
      selectedLocation = null;
      document.getElementById('selectedLocationInfo').classList.add('hidden');
    }
    
    // 모든 선택이 해제되면 완전히 해제
    if (selectedLocations.length === 0) {
      clearAllSelections();
      return;
    }
    
    // 마지막 하나 남으면 단일 선택으로 변경
    if (selectedLocations.length === 1) {
      selectedLocation = selectedLocations[0];
      const lastBox = document.querySelector(`.location-box[data-id="${selectedLocation.id}"]`);
      if (lastBox) {
        updateSelectedLocationInfo(selectedLocation);
      }
    }
  } else {
    // 선택 추가
    selectedLocations.push(loc);
    box.classList.add('selected');
    
    if (selectedLocations.length === 1) {
      // 첫 번째 선택
      selectedLocation = loc;
      updateSelectedLocationInfo(loc);
    } else {
      // 다중 선택 모드
      selectedLocation = null;
      document.getElementById('selectedLocationInfo').classList.add('hidden');
    }
  }
  
  updateBatchTools();
}

// 일괄 편집 도구 업데이트
function updateBatchTools() {
  const count = selectedLocations.length;
  const countEl = document.getElementById('selectedCount');
  const batchTools = document.getElementById('locationBatchTools');
  
  if (countEl) countEl.textContent = count;
  
  if (batchTools) {
    if (count > 1) {
      batchTools.classList.remove('hidden');
      updateBoundingBox();
    } else {
      batchTools.classList.add('hidden');
      if (boundingBox) {
        boundingBox.remove();
        boundingBox = null;
      }
    }
  }
}

// 선택된 위치 정보 업데이트
function updateSelectedLocationInfo(loc) {
  const infoPanel = document.getElementById('selectedLocationInfo');
  if (!infoPanel) return;
  
  infoPanel.classList.remove('hidden');
  document.getElementById('editLocationCode').value = loc.location_code || '';
  document.getElementById('editX').value = loc.x || 0;
  document.getElementById('editY').value = loc.y || 0;
  document.getElementById('editWidth').value = loc.width || 60;
  document.getElementById('editHeight').value = loc.height || 20;
  document.getElementById('editStatus').value = loc.status || 'available';
}

// 화면 좌표를 캔버스 내부 좌표로 변환 (줌/패닝 고려)
function screenToCanvas(screenX, screenY) {
  const canvas = document.getElementById('canvas');
  const canvasRect = canvas.getBoundingClientRect();
  
  // 화면 좌표를 캔버스 컨테이너 기준 좌표로 변환
  const containerX = screenX - canvasRect.left;
  const containerY = screenY - canvasRect.top;
  
  // 줌과 패닝을 고려하여 실제 캔버스 내부 좌표로 변환
  const canvasX = (containerX - panOffset.x) / zoomLevel;
  const canvasY = (containerY - panOffset.y) / zoomLevel;
  
  return { x: canvasX, y: canvasY };
}

// 드래그 시작
function startDrag(loc, box, e) {
  isDragging = true;
  const canvas = document.getElementById('canvas');
  const canvasRect = canvas.getBoundingClientRect();
  
  // 원래 위치 저장 (원상복구용)
  originalPositions = [];
  
  // 다중 선택된 경우 모든 선택된 위치의 원래 위치 저장
  const isMultiSelect = selectedLocations.length > 1;
  const clickedLocInSelection = selectedLocations.find(l => l.id === loc.id);
  
  // 마우스 위치를 캔버스 내부 좌표로 변환
  const mouseCanvasPos = screenToCanvas(e.clientX, e.clientY);
  
  if (isMultiSelect && clickedLocInSelection) {
    // 다중 선택된 상태에서 선택된 위치 중 하나를 드래그
    console.log('다중 선택 드래그 시작:', selectedLocations.length, '개 위치');
    selectedLocations.forEach(l => {
      originalPositions.push({
        id: l.id,
        x: l.x,
        y: l.y
      });
    });
    
    // 클릭한 위치 기준으로 오프셋 계산 (캔버스 내부 좌표 기준)
    dragOffset.x = mouseCanvasPos.x - clickedLocInSelection.x;
    dragOffset.y = mouseCanvasPos.y - clickedLocInSelection.y;
  } else {
    // 단일 선택인 경우
    // selectedLocation이 없으면 현재 클릭한 위치를 선택
    if (!selectedLocation || selectedLocations.length === 0) {
      selectLocation(loc, box);
    }
    
    originalPositions.push({
      id: loc.id,
      x: loc.x,
      y: loc.y
    });
    
    // 드래그 오프셋 계산 (캔버스 내부 좌표 기준)
    dragOffset.x = mouseCanvasPos.x - loc.x;
    dragOffset.y = mouseCanvasPos.y - loc.y;
  }
  
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', stopDrag);
  e.preventDefault();
}

// 드래그 처리
function handleDrag(e) {
  if (!isDragging) return;
  
  const canvas = document.getElementById('canvas');
  
  // 마우스 위치를 캔버스 내부 좌표로 변환
  const mouseCanvasPos = screenToCanvas(e.clientX, e.clientY);
  
  // 다중 선택된 경우 모든 선택된 위치를 함께 이동
  if (selectedLocations.length > 1) {
    // 원래 위치를 기준으로 델타 계산
    const originalFirst = originalPositions.find(p => p.id === selectedLocations[0].id);
    if (!originalFirst) {
      console.warn('원래 위치를 찾을 수 없습니다.');
      return;
    }
    
    // 현재 마우스 위치에서 새 위치 계산 (캔버스 내부 좌표 기준)
    const newBaseX = mouseCanvasPos.x - dragOffset.x;
    const newBaseY = mouseCanvasPos.y - dragOffset.y;
    
    // 원래 위치와의 차이 계산
    const deltaX = newBaseX - originalFirst.x;
    const deltaY = newBaseY - originalFirst.y;
    
    // 그리드 스냅
    let snappedDeltaX = deltaX;
    let snappedDeltaY = deltaY;
    if (snapToGridEnabled) {
      snappedDeltaX = Math.round(deltaX / gridSize) * gridSize;
      snappedDeltaY = Math.round(deltaY / gridSize) * gridSize;
    }
    
    // 모든 선택된 위치를 원래 위치 + 델타로 이동
    selectedLocations.forEach(loc => {
      const original = originalPositions.find(p => p.id === loc.id);
      if (!original) {
        console.warn(`위치 ${loc.id}의 원래 위치를 찾을 수 없습니다.`);
        return;
      }
      
      let newX = original.x + snappedDeltaX;
      let newY = original.y + snappedDeltaY;
      
      // 경계 체크
      newX = Math.max(0, Math.min(newX, canvas.offsetWidth - loc.width));
      newY = Math.max(0, Math.min(newY, canvas.offsetHeight - loc.height));
      
      // 임시로 위치 업데이트 (저장 전)
      loc.x = newX;
      loc.y = newY;
      
      const box = document.querySelector(`.location-box[data-id="${loc.id}"]`);
      if (box) {
        box.style.left = newX + 'px';
        box.style.top = newY + 'px';
      }
    });
    
    // 정렬 가이드라인 표시
    const firstBox = document.querySelector(`.location-box[data-id="${selectedLocations[0].id}"]`);
    if (firstBox) {
      const allBoxes = document.querySelectorAll('.location-box');
      showAlignmentGuides(firstBox, allBoxes);
    }
    
    updateBatchTools();
    return;
  }
  
  if (!selectedLocation) return;
  
  // 단일 선택인 경우
  const original = originalPositions.find(p => p.id === selectedLocation.id);
  if (!original) return;
  
  // 정렬 가이드라인 표시
  const box = document.querySelector(`.location-box[data-id="${selectedLocation.id}"]`);
  if (box) {
    const allBoxes = document.querySelectorAll('.location-box');
    showAlignmentGuides(box, allBoxes);
  }
  
  // 마우스 위치를 캔버스 내부 좌표로 변환하여 새 위치 계산
  let x = mouseCanvasPos.x - dragOffset.x;
  let y = mouseCanvasPos.y - dragOffset.y;
  
  // 그리드 스냅
  if (snapToGridEnabled) {
    x = Math.round(x / gridSize) * gridSize;
    y = Math.round(y / gridSize) * gridSize;
  }
  
  // 경계 체크
  x = Math.max(0, Math.min(x, canvas.offsetWidth - selectedLocation.width));
  y = Math.max(0, Math.min(y, canvas.offsetHeight - selectedLocation.height));
  
  // 임시로 위치 업데이트 (저장 전)
  selectedLocation.x = x;
  selectedLocation.y = y;
  
  // box 변수는 이미 위에서 선언되었으므로 재사용
  if (box) {
    box.style.left = x + 'px';
    box.style.top = y + 'px';
    
    // 정보 패널 업데이트
    document.getElementById('editX').value = x;
    document.getElementById('editY').value = y;
  }
}

// 드래그 종료
async function stopDrag() {
  if (!isDragging) return;
  
  // 정렬 가이드라인 제거
  clearAlignmentGuides();
  
  // 드래그가 실제로 발생했는지 확인 (위치가 변경되었는지)
  let hasChanged = false;
  if (selectedLocations.length > 1) {
    hasChanged = selectedLocations.some(loc => {
      const original = originalPositions.find(p => p.id === loc.id);
      return original && (original.x !== loc.x || original.y !== loc.y);
    });
  } else if (selectedLocation) {
    const original = originalPositions.find(p => p.id === selectedLocation.id);
    hasChanged = original && (original.x !== selectedLocation.x || original.y !== selectedLocation.y);
  }
  
  // 위치가 변경되었으면 자동 저장 및 되돌리기 이력 추가
  if (hasChanged) {
    // 변경 전 상태를 되돌리기 스택에 저장
    saveToUndoStack();
    
    // 자동 저장 (alert 표시 안 함)
    if (selectedLocations.length > 1) {
      await saveAllLocations();
    } else if (selectedLocation) {
      await saveLocation(selectedLocation, false);
    }
  }
  
  isDragging = false;
  originalPositions = [];
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
  
  updateBoundingBox();
  updateMinimap();
}

// 되돌리기 스택에 현재 상태 저장
function saveToUndoStack() {
  // 현재 모든 위치의 상태를 복사
  const state = locations.map(loc => ({
    id: loc.id,
    x: loc.x,
    y: loc.y,
    width: loc.width,
    height: loc.height,
    location_code: loc.location_code,
    status: loc.status
  }));
  
  undoStack.push(state);
  
  // 최대 이력 수 제한
  if (undoStack.length > maxUndoHistory) {
    undoStack.shift();
  }
  
  // 다시하기 스택 초기화 (새로운 변경이 있으면 다시하기 불가)
  redoStack = [];
  
  updateUndoRedoButtons();
}

// 되돌리기 스택
let redoStack = [];

// 되돌리기
async function undo() {
  if (undoStack.length === 0) return;
  
  // 현재 상태를 다시하기 스택에 저장
  const currentState = locations.map(loc => ({
    id: loc.id,
    x: loc.x,
    y: loc.y,
    width: loc.width,
    height: loc.height,
    location_code: loc.location_code,
    status: loc.status
  }));
  redoStack.push(currentState);
  
  // 이전 상태로 복구
  const previousState = undoStack.pop();
  await restoreState(previousState);
  
  updateUndoRedoButtons();
}

// 다시하기
async function redo() {
  if (redoStack.length === 0) return;
  
  // 현재 상태를 되돌리기 스택에 저장
  const currentState = locations.map(loc => ({
    id: loc.id,
    x: loc.x,
    y: loc.y,
    width: loc.width,
    height: loc.height,
    location_code: loc.location_code,
    status: loc.status
  }));
  undoStack.push(currentState);
  
  // 다음 상태로 복구
  const nextState = redoStack.pop();
  await restoreState(nextState);
  
  updateUndoRedoButtons();
}

// 상태 복구
async function restoreState(state) {
  state.forEach(savedLoc => {
    const loc = locations.find(l => l.id === savedLoc.id);
    if (loc) {
      loc.x = savedLoc.x;
      loc.y = savedLoc.y;
      loc.width = savedLoc.width;
      loc.height = savedLoc.height;
      loc.location_code = savedLoc.location_code;
      loc.status = savedLoc.status;
      
      const box = document.querySelector(`.location-box[data-id="${loc.id}"]`);
      if (box) {
        box.style.left = savedLoc.x + 'px';
        box.style.top = savedLoc.y + 'px';
        box.style.width = savedLoc.width + 'px';
        box.style.height = savedLoc.height + 'px';
        const label = box.querySelector('.location-label');
        if (label) label.textContent = savedLoc.location_code;
      }
      
      // 선택된 위치 정보 패널 업데이트
      if (selectedLocation && selectedLocation.id === loc.id) {
        updateSelectedLocationInfo(loc);
      }
    }
  });
  
  // 다중 선택된 경우 모든 위치 정보 업데이트
  if (selectedLocations.length > 1) {
    updateBatchTools();
  }
  
  // 데이터베이스에 저장 (alert 표시 안 함)
  await saveAllLocations();
}

// 되돌리기/다시하기 버튼 상태 업데이트
function updateUndoRedoButtons() {
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  
  if (undoBtn) {
    undoBtn.disabled = undoStack.length === 0;
  }
  if (redoBtn) {
    redoBtn.disabled = redoStack.length === 0;
  }
}

// 리사이즈 시작
function startResize(loc, box, e) {
  isResizing = true;
  const canvas = document.getElementById('canvas');
  
  // 마우스 위치를 캔버스 내부 좌표로 변환
  const mouseCanvasPos = screenToCanvas(e.clientX, e.clientY);
  
  const startX = mouseCanvasPos.x;
  const startY = mouseCanvasPos.y;
  const startWidth = loc.width;
  const startHeight = loc.height;
  const startLeft = loc.x;
  const startTop = loc.y;
  
  selectLocation(loc, box);
  
  function handleResize(e) {
    if (!isResizing) return;
    
    // 마우스 위치를 캔버스 내부 좌표로 변환
    const mouseCanvasPos = screenToCanvas(e.clientX, e.clientY);
    
    let newWidth = startWidth + (mouseCanvasPos.x - startX);
    let newHeight = startHeight + (mouseCanvasPos.y - startY);
    
    // 최소 크기
    newWidth = Math.max(10, newWidth); // 최소 너비 10px
    newHeight = Math.max(10, newHeight); // 최소 높이 10px
    
    // 그리드 스냅
    if (snapToGridEnabled) {
      newWidth = Math.round(newWidth / gridSize) * gridSize;
      newHeight = Math.round(newHeight / gridSize) * gridSize;
    }
    
    // 경계 체크
    const canvas = document.getElementById('canvas');
    const maxWidth = canvas.offsetWidth - startLeft;
    const maxHeight = canvas.offsetHeight - startTop;
    newWidth = Math.min(newWidth, maxWidth);
    newHeight = Math.min(newHeight, maxHeight);
    
    // 크기 업데이트
    selectedLocation.width = newWidth;
    selectedLocation.height = newHeight;
    
    box.style.width = newWidth + 'px';
    box.style.height = newHeight + 'px';
    
    // 정보 패널 업데이트
    document.getElementById('editWidth').value = newWidth;
    document.getElementById('editHeight').value = newHeight;
  }
  
  async function stopResize() {
    if (isResizing) {
      // 리사이즈 전 상태를 되돌리기 스택에 저장
      saveToUndoStack();
      
      // 자동 저장
      if (selectedLocation) {
        await saveLocation(selectedLocation, false);
      }
    }
    isResizing = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
  }
  
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
  e.preventDefault();
  e.stopPropagation();
}

// 이벤트 리스너 설정
function setupEventListeners() {
  // 새 위치 추가
  // localStorage에서 너비/높이 불러오기
  const savedWidth = localStorage.getItem('locationEditor_defaultWidth');
  const savedHeight = localStorage.getItem('locationEditor_defaultHeight');
  const newLocationWidthInput = document.getElementById('newLocationWidth');
  const newLocationHeightInput = document.getElementById('newLocationHeight');
  
  if (newLocationWidthInput && savedWidth) {
    newLocationWidthInput.value = savedWidth;
  }
  if (newLocationHeightInput && savedHeight) {
    newLocationHeightInput.value = savedHeight;
  }
  
  document.getElementById('addLocationBtn').addEventListener('click', () => {
    const code = document.getElementById('newLocationCode').value.trim();
    if (!code) {
      alert('위치 코드를 입력하세요.');
      return;
    }
    
    // 정규화
    const normalizedCode = normalizeLocationCode(code);
    
    // 중복 체크
    if (locations.some(loc => normalizeLocationCode(loc.location_code) === normalizedCode)) {
      alert('이미 존재하는 위치 코드입니다.');
      return;
    }
    
    // 너비/높이 가져오기
    const width = parseInt(newLocationWidthInput.value) || 60;
    const height = parseInt(newLocationHeightInput.value) || 20;
    
    // localStorage에 저장 (다음에 사용할 기본값)
    localStorage.setItem('locationEditor_defaultWidth', width.toString());
    localStorage.setItem('locationEditor_defaultHeight', height.toString());
    
    // 새 위치 생성
    const newLoc = {
      id: 'temp_' + Date.now(),
      location_code: normalizedCode,
      x: 100,
      y: 100,
      width: width,
      height: height,
      status: 'available',
      isNew: true
    };
    
    locations.push(newLoc);
    const box = createLocationBox(newLoc);
    document.getElementById('canvas').appendChild(box);
    selectLocation(newLoc, box);
    
    document.getElementById('newLocationCode').value = '';
  });
  
  // 위치 저장
  document.getElementById('saveLocationBtn').addEventListener('click', async () => {
    if (!selectedLocation) return;
    
    const code = document.getElementById('editLocationCode').value.trim();
    const x = parseInt(document.getElementById('editX').value);
    const y = parseInt(document.getElementById('editY').value);
    const width = parseInt(document.getElementById('editWidth').value);
    const height = parseInt(document.getElementById('editHeight').value);
    const status = document.getElementById('editStatus').value;
    
    if (!code) {
      alert('위치 코드를 입력하세요.');
      return;
    }
    
    selectedLocation.location_code = normalizeLocationCode(code);
    selectedLocation.x = x;
    selectedLocation.y = y;
    selectedLocation.width = width;
    selectedLocation.height = height;
    selectedLocation.status = status;
    
    // 박스 업데이트
    const box = document.querySelector(`.location-box[data-id="${selectedLocation.id}"]`);
    if (box) {
      box.style.left = x + 'px';
      box.style.top = y + 'px';
      box.style.width = width + 'px';
      box.style.height = height + 'px';
      box.querySelector('.location-label').textContent = code;
      
      // 상태 클래스 업데이트
      box.classList.remove('status-available', 'status-occupied', 'status-maintenance', 'status-disabled');
      box.classList.add(`status-${status}`);
    }
    
    // 데이터베이스 저장 (개별 저장이므로 alert 표시)
    await saveLocation(selectedLocation, true);
  });
  
  // 위치 삭제
  document.getElementById('deleteLocationBtn').addEventListener('click', async () => {
    if (selectedLocations.length > 1) {
      await deleteSelectedLocations();
    } else if (selectedLocation) {
      await deleteLocation();
    }
  });
  
  // 일괄 선택 해제
  document.getElementById('clearSelectionBtn').addEventListener('click', () => {
    clearAllSelections();
  });
  
  // 되돌리기
  document.getElementById('undoBtn').addEventListener('click', () => {
    undo();
  });
  
  // 다시하기
  document.getElementById('redoBtn').addEventListener('click', () => {
    redo();
  });
  
  // 모든 변경사항 저장
  document.getElementById('saveAllBtn').addEventListener('click', async () => {
    if (confirm('모든 변경사항을 저장하시겠습니까?')) {
      await saveAllLocations(true); // 수동 저장이므로 alert 표시
      // 저장 후 되돌리기 스택 초기화 (저장된 상태가 기준점)
      undoStack = [];
      redoStack = [];
      updateUndoRedoButtons();
    }
  });
  
  // 일괄 정렬 기능 (자동 저장 및 되돌리기 이력 추가)
  document.getElementById('alignLeftBtn').addEventListener('click', async () => {
    if (selectedLocations.length < 2) return;
    saveToUndoStack();
    const minX = Math.min(...selectedLocations.map(l => l.x));
    selectedLocations.forEach(loc => {
      loc.x = minX;
      const box = document.querySelector(`.location-box[data-id="${loc.id}"]`);
      if (box) box.style.left = minX + 'px';
    });
    updateBatchTools();
    await saveAllLocations();
  });
  
  document.getElementById('alignRightBtn').addEventListener('click', async () => {
    if (selectedLocations.length < 2) return;
    saveToUndoStack();
    const maxX = Math.max(...selectedLocations.map(l => l.x + l.width));
    selectedLocations.forEach(loc => {
      loc.x = maxX - loc.width;
      const box = document.querySelector(`.location-box[data-id="${loc.id}"]`);
      if (box) box.style.left = (maxX - loc.width) + 'px';
    });
    updateBatchTools();
    await saveAllLocations();
  });
  
  document.getElementById('alignTopBtn').addEventListener('click', async () => {
    if (selectedLocations.length < 2) return;
    saveToUndoStack();
    const minY = Math.min(...selectedLocations.map(l => l.y));
    selectedLocations.forEach(loc => {
      loc.y = minY;
      const box = document.querySelector(`.location-box[data-id="${loc.id}"]`);
      if (box) box.style.top = minY + 'px';
    });
    updateBatchTools();
    await saveAllLocations();
  });
  
  document.getElementById('alignBottomBtn').addEventListener('click', async () => {
    if (selectedLocations.length < 2) return;
    saveToUndoStack();
    const maxY = Math.max(...selectedLocations.map(l => l.y + l.height));
    selectedLocations.forEach(loc => {
      loc.y = maxY - loc.height;
      const box = document.querySelector(`.location-box[data-id="${loc.id}"]`);
      if (box) box.style.top = (maxY - loc.height) + 'px';
    });
    updateBatchTools();
    await saveAllLocations();
  });
  
  document.getElementById('matchHeightBtn').addEventListener('click', async () => {
    if (selectedLocations.length < 2) return;
    saveToUndoStack();
    const maxHeight = Math.max(...selectedLocations.map(l => l.height));
    selectedLocations.forEach(loc => {
      loc.height = maxHeight;
      const box = document.querySelector(`.location-box[data-id="${loc.id}"]`);
      if (box) {
        box.style.height = maxHeight + 'px';
        const resizeHandle = box.querySelector('.resize-handle');
        if (resizeHandle) resizeHandle.style.bottom = '-6px';
      }
    });
    updateBatchTools();
    await saveAllLocations();
  });
  
  document.getElementById('matchWidthBtn').addEventListener('click', async () => {
    if (selectedLocations.length < 2) return;
    saveToUndoStack();
    const maxWidth = Math.max(...selectedLocations.map(l => l.width));
    selectedLocations.forEach(loc => {
      loc.width = maxWidth;
      const box = document.querySelector(`.location-box[data-id="${loc.id}"]`);
      if (box) {
        box.style.width = maxWidth + 'px';
        const resizeHandle = box.querySelector('.resize-handle');
        if (resizeHandle) resizeHandle.style.right = '-6px';
      }
    });
    updateBatchTools();
    await saveAllLocations();
  });
  
  document.getElementById('distributeHorizontalBtn').addEventListener('click', async () => {
    if (selectedLocations.length < 2) return;
    saveToUndoStack();
    const sorted = [...selectedLocations].sort((a, b) => a.x - b.x);
    const firstX = sorted[0].x;
    const lastX = sorted[sorted.length - 1].x;
    const totalWidth = lastX - firstX;
    const spacing = totalWidth / (sorted.length - 1);
    
    sorted.forEach((loc, i) => {
      if (i > 0) {
        loc.x = firstX + (spacing * i);
        const box = document.querySelector(`.location-box[data-id="${loc.id}"]`);
        if (box) box.style.left = loc.x + 'px';
      }
    });
    updateBatchTools();
    await saveAllLocations();
  });
  
  document.getElementById('distributeVerticalBtn').addEventListener('click', async () => {
    if (selectedLocations.length < 2) return;
    saveToUndoStack();
    const sorted = [...selectedLocations].sort((a, b) => a.y - b.y);
    const firstY = sorted[0].y;
    const lastY = sorted[sorted.length - 1].y;
    const totalHeight = lastY - firstY;
    const spacing = totalHeight / (sorted.length - 1);
    
    sorted.forEach((loc, i) => {
      if (i > 0) {
        loc.y = firstY + (spacing * i);
        const box = document.querySelector(`.location-box[data-id="${loc.id}"]`);
        if (box) box.style.top = loc.y + 'px';
      }
    });
    updateBatchTools();
    await saveAllLocations();
  });
  
  // 그리드 옵션
  document.getElementById('snapToGrid').addEventListener('change', (e) => {
    snapToGridEnabled = e.target.checked;
  });
  
  document.getElementById('showGrid').addEventListener('change', (e) => {
    showGridEnabled = e.target.checked;
    updateGridDisplay();
  });
  
  
  // 그리기 모드 / 직접 추가 모드 전환
  document.getElementById('drawModeBtn').addEventListener('click', () => {
    backgroundAddMode = 'draw';
    document.getElementById('drawModeBtn').classList.add('bg-purple-600', 'text-white');
    document.getElementById('drawModeBtn').classList.remove('bg-gray-300', 'text-gray-800');
    document.getElementById('addModeBtn').classList.remove('bg-purple-600', 'text-white');
    document.getElementById('addModeBtn').classList.add('bg-gray-300', 'text-gray-800');
    document.getElementById('drawModeInfo').classList.remove('hidden');
    document.getElementById('addModePanel').classList.add('hidden');
    const canvas = document.getElementById('canvas');
    canvas.classList.add('drawing');
  });
  
  document.getElementById('addModeBtn').addEventListener('click', () => {
    backgroundAddMode = 'add';
    document.getElementById('addModeBtn').classList.add('bg-purple-600', 'text-white');
    document.getElementById('addModeBtn').classList.remove('bg-gray-300', 'text-gray-800');
    document.getElementById('drawModeBtn').classList.remove('bg-purple-600', 'text-white');
    document.getElementById('drawModeBtn').classList.add('bg-gray-300', 'text-gray-800');
    document.getElementById('drawModeInfo').classList.add('hidden');
    document.getElementById('addModePanel').classList.remove('hidden');
    const canvas = document.getElementById('canvas');
    canvas.classList.remove('drawing');
    stopDrawing();
  });
  
  // 새 배경 요소 추가 (직접 추가 모드)
  document.getElementById('addBackgroundBtn').addEventListener('click', () => {
    const type = document.getElementById('backgroundType').value;
    const label = document.getElementById('backgroundLabel').value.trim();
    
    // 텍스트 타입인 경우 텍스트 옵션 사용
    let x = 200;
    let y = 200;
    let fontSize = 15;
    let fill = '#000000';
    
    if (type === 'text') {
      if (!label) {
        alert('텍스트 내용을 입력하세요.');
        return;
      }
      x = Math.round(parseFloat(document.getElementById('textX').value) || 200);
      y = Math.round(parseFloat(document.getElementById('textY').value) || 200);
      fontSize = Math.round(parseFloat(document.getElementById('textFontSize').value) || 15);
      fill = document.getElementById('textColor').value || '#000000';
    } else {
      if (!label) {
        label = '새 배경 요소';
      }
    }
    
    const newBg = {
      id: 'bg_' + Date.now(),
      type: type,
      label: label || (type === 'text' ? '텍스트' : '배경'),
      x: x,
      y: y,
      width: type === 'text' ? label.length * fontSize * 0.6 : 200,
      height: type === 'text' ? fontSize * 1.2 : 100,
      fill: type === 'text' ? fill : '#d3d3d3',
      stroke: type === 'text' ? 'transparent' : '#000000',
      strokeWidth: 1,
      text: type === 'text' ? label : '',
      fontSize: type === 'text' ? fontSize : undefined,
      isNew: true
    };
    
    backgroundElements.push(newBg);
    const element = createBackgroundElement(newBg);
    const canvas = document.getElementById('canvas');
    // grid-overlay 바로 다음에 추가하여 배경이 먼저 렌더링되도록
    const gridOverlay = document.getElementById('gridOverlay');
    if (gridOverlay && gridOverlay.nextSibling) {
      canvas.insertBefore(element, gridOverlay.nextSibling);
    } else {
      canvas.appendChild(element);
    }
    selectBackground(newBg, element);
    saveBackgroundElements();
    
    // 입력 필드 초기화
    document.getElementById('backgroundLabel').value = '';
    if (type === 'text') {
      document.getElementById('textX').value = '200';
      document.getElementById('textY').value = '200';
      document.getElementById('textFontSize').value = '15';
      document.getElementById('textColor').value = '#000000';
    }
  });
  
  // 배경 요소 저장
  document.getElementById('saveBackgroundBtn').addEventListener('click', () => {
    if (!selectedBackground) return;
    
    const label = document.getElementById('editBackgroundLabel').value.trim();
    const x = Math.round(parseFloat(document.getElementById('editBgX').value) || 0);
    const y = Math.round(parseFloat(document.getElementById('editBgY').value) || 0);
    const width = Math.round(parseFloat(document.getElementById('editBgWidth').value) || 100);
    const height = Math.round(parseFloat(document.getElementById('editBgHeight').value) || 50);
    const fill = document.getElementById('editBgFill').value;
    const stroke = document.getElementById('editBgStroke').value;
    const textColor = document.getElementById('editBgTextColor').value;
    const fontSize = Math.round(parseFloat(document.getElementById('editBgFontSize').value) || 15);
    
    selectedBackground.label = label;
    selectedBackground.x = x;
    selectedBackground.y = y;
    selectedBackground.width = width;
    selectedBackground.height = height;
    selectedBackground.fill = fill;
    selectedBackground.stroke = stroke;
    
    if (selectedBackground.type === 'text') {
      selectedBackground.fill = textColor;
      selectedBackground.fontSize = fontSize;
      selectedBackground.text = label || selectedBackground.text;
    }
    
    // 요소 업데이트
    const element = document.querySelector(`.background-element[data-id="${selectedBackground.id}"]`);
    if (element) {
      element.style.left = x + 'px';
      element.style.top = y + 'px';
      
      if (selectedBackground.type === 'rect') {
        element.style.width = width + 'px';
        element.style.height = height + 'px';
        element.style.backgroundColor = fill;
        element.style.borderColor = stroke;
      } else if (selectedBackground.type === 'text') {
        element.style.color = textColor;
        element.style.fontSize = fontSize + 'px';
        element.textContent = label || selectedBackground.text;
      }
    }
    
    saveBackgroundElements();
    alert('저장되었습니다.');
  });
  
  // 배경 요소 삭제
  document.getElementById('deleteBackgroundBtn').addEventListener('click', () => {
    deleteBackground();
  });
  
  // 배경 요소 정보 패널에서 직접 수정
  ['editBgX', 'editBgY', 'editBgWidth', 'editBgHeight'].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('change', () => {
        if (!selectedBackground || selectedBackground.type !== 'rect') return;
        
        const x = parseInt(document.getElementById('editBgX').value) || 0;
        const y = parseInt(document.getElementById('editBgY').value) || 0;
        const width = parseInt(document.getElementById('editBgWidth').value) || 100;
        const height = parseInt(document.getElementById('editBgHeight').value) || 50;
        
        selectedBackground.x = x;
        selectedBackground.y = y;
        selectedBackground.width = width;
        selectedBackground.height = height;
        
        const element = document.querySelector(`.background-element[data-id="${selectedBackground.id}"]`);
        if (element) {
          element.style.left = x + 'px';
          element.style.top = y + 'px';
          element.style.width = width + 'px';
          element.style.height = height + 'px';
        }
      });
    }
  });
  
  // 배경 요소 색상 변경
  ['editBgFill', 'editBgStroke', 'editBgTextColor'].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('change', () => {
        if (!selectedBackground) return;
        
        const fill = document.getElementById('editBgFill').value;
        const stroke = document.getElementById('editBgStroke').value;
        const textColor = document.getElementById('editBgTextColor').value;
        
        selectedBackground.fill = selectedBackground.type === 'text' ? textColor : fill;
        selectedBackground.stroke = stroke;
        
        const element = document.querySelector(`.background-element[data-id="${selectedBackground.id}"]`);
        if (element) {
          if (selectedBackground.type === 'rect') {
            element.style.backgroundColor = fill;
            element.style.borderColor = stroke;
          } else if (selectedBackground.type === 'text') {
            element.style.color = textColor;
          }
        }
      });
    }
  });
  
  // 정보 패널에서 직접 수정
  ['editX', 'editY', 'editWidth', 'editHeight'].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('change', () => {
        if (!selectedLocation) return;
        
        const x = parseInt(document.getElementById('editX').value) || 0;
        const y = parseInt(document.getElementById('editY').value) || 0;
        const width = parseInt(document.getElementById('editWidth').value) || 60;
        const height = parseInt(document.getElementById('editHeight').value) || 20;
        
        selectedLocation.x = x;
        selectedLocation.y = y;
        selectedLocation.width = width;
        selectedLocation.height = height;
        
        const box = document.querySelector(`.location-box[data-id="${selectedLocation.id}"]`);
        if (box) {
          box.style.left = x + 'px';
          box.style.top = y + 'px';
          box.style.width = width + 'px';
          box.style.height = height + 'px';
        }
      });
    }
  });
}

// 위치 저장
async function saveLocation(loc, showAlert = false) {
  try {
    // 좌표 값을 정수로 반올림 (데이터베이스가 INTEGER 타입이므로)
    const roundedX = Math.round(loc.x || 0);
    const roundedY = Math.round(loc.y || 0);
    const roundedWidth = Math.round(loc.width || 60);
    const roundedHeight = Math.round(loc.height || 20);
    
    if (loc.isNew) {
      // 새 위치 생성
      const { data, error } = await window.supabase
        .from('wp1_locations')
        .insert({
          location_code: loc.location_code,
          x: roundedX,
          y: roundedY,
          width: roundedWidth,
          height: roundedHeight,
          status: loc.status
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // ID 업데이트 및 반올림된 값으로 로컬 데이터도 업데이트
      loc.id = data.id;
      loc.x = roundedX;
      loc.y = roundedY;
      loc.width = roundedWidth;
      loc.height = roundedHeight;
      loc.isNew = false;
      
      const box = document.querySelector(`.location-box[data-id="${loc.id}"]`);
      if (box) {
        box.dataset.id = data.id;
        box.style.left = roundedX + 'px';
        box.style.top = roundedY + 'px';
        box.style.width = roundedWidth + 'px';
        box.style.height = roundedHeight + 'px';
      }
    } else {
      // 기존 위치 업데이트
      const { error } = await window.supabase
        .from('wp1_locations')
        .update({
          location_code: loc.location_code,
          x: roundedX,
          y: roundedY,
          width: roundedWidth,
          height: roundedHeight,
          status: loc.status
        })
        .eq('id', loc.id);
      
      if (error) throw error;
      
      // 반올림된 값으로 로컬 데이터도 업데이트
      loc.x = roundedX;
      loc.y = roundedY;
      loc.width = roundedWidth;
      loc.height = roundedHeight;
      
      // UI도 업데이트
      const box = document.querySelector(`.location-box[data-id="${loc.id}"]`);
      if (box) {
        box.style.left = roundedX + 'px';
        box.style.top = roundedY + 'px';
        box.style.width = roundedWidth + 'px';
        box.style.height = roundedHeight + 'px';
      }
    }
    
    // 개별 저장일 때만 alert 표시
    if (showAlert) {
      alert('저장되었습니다.');
    }
    
    // 장소 마스터 관리 페이지가 열려있으면 알림 (선택사항)
    if (window.opener && window.opener.location && window.opener.location.href.includes('location_master')) {
      console.log('장소 마스터 관리 페이지에서 새로고침이 필요할 수 있습니다.');
    }
  } catch (error) {
    console.error('저장 실패:', error);
    if (showAlert) {
      alert('저장 실패: ' + error.message);
    }
    throw error; // 상위 함수에서 처리할 수 있도록 에러 재발생
  }
}

// 모든 위치 저장
async function saveAllLocations(showAlert = false) {
  try {
    let savedCount = 0;
    let failedCount = 0;
    
    for (const loc of locations) {
      try {
        await saveLocation(loc, false); // 일괄 저장이므로 alert 표시 안 함
        savedCount++;
      } catch (error) {
        console.error(`위치 ${loc.location_code} 저장 실패:`, error);
        failedCount++;
      }
    }
    
    // 모든 저장이 끝난 후 한 번만 alert 표시 (수동 저장일 때만)
    if (showAlert) {
      if (failedCount === 0) {
        alert(`모든 변경사항이 저장되었습니다. (${savedCount}개 위치)`);
      } else {
        alert(`${savedCount}개 위치 저장 완료, ${failedCount}개 위치 저장 실패`);
      }
    }
    
    await loadLocations();
    renderLocations();
    
    // 장소 마스터 관리 페이지가 열려있으면 알림
    try {
      if (window.opener && !window.opener.closed) {
        const openerUrl = window.opener.location.href;
        if (openerUrl.includes('location_master')) {
          console.log('💡 장소 마스터 관리 페이지에서 새로고침하면 변경사항을 확인할 수 있습니다.');
        }
      }
    } catch (e) {
      // cross-origin 등으로 접근 불가능한 경우 무시
    }
  } catch (error) {
    console.error('저장 실패:', error);
    alert('저장 중 오류가 발생했습니다: ' + error.message);
  }
}

// 그리드 표시 업데이트
function updateGridDisplay() {
  const gridOverlay = document.getElementById('gridOverlay');
  if (!gridOverlay) return;
  
  gridOverlay.style.display = showGridEnabled ? 'block' : 'none';
}

// 위치 코드 정규화
function normalizeLocationCode(code) {
  if (!code) return code;
  const match = code.match(/^([A-Z])[- ]?(\d{1,2})$/i);
  if (match) {
    const letter = match[1].toUpperCase();
    const num = match[2].padStart(2, '0');
    return `${letter}-${num}`;
  }
  return code.trim();
}

// 캔버스 그리기 기능 설정
function setupCanvasDrawing() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;
  
  // 마우스 다운 - 그리기 시작 또는 범위 선택 시작
  let selectionShiftKey = false; // 범위 선택 시작 시 Shift 키 상태 저장
  
  canvas.addEventListener('mousedown', (e) => {
    // 배경 편집 모드의 그리기
    if (currentMode === 'background' && backgroundAddMode === 'draw') {
      if (e.target === canvas || e.target.classList.contains('grid-overlay')) {
        startDrawing(e);
      }
      return;
    }
    
    // 위치 편집 모드의 범위 선택
    if (currentMode === 'location') {
      // 위치 박스나 배경 요소가 아닌 빈 공간을 클릭한 경우
      if (e.target === canvas || e.target.classList.contains('grid-overlay')) {
        // Shift 키 상태 저장
        selectionShiftKey = e.shiftKey;
        
        // Shift 키를 누르지 않으면 기존 선택 해제
        if (!e.shiftKey) {
          clearAllSelections();
        }
        startSelection(e);
      }
    }
  });
  
  // 마우스 이동 - 그리기 미리보기 또는 범위 선택 업데이트
  canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
      updateDrawingPreview(e);
    } else if (isSelecting) {
      updateSelection(e);
    }
  });
  
  // 마우스 업 - 그리기 완료 또는 범위 선택 완료
  canvas.addEventListener('mouseup', (e) => {
    if (isDrawing) {
      finishDrawing(e);
    } else if (isSelecting) {
      finishSelection(e);
    }
  });
  
  // 마우스가 캔버스 밖으로 나가면 그리기/선택 취소
  canvas.addEventListener('mouseleave', () => {
    if (isDrawing) {
      cancelDrawing();
    } else if (isSelecting) {
      cancelSelection();
    }
  });
}

// 그리기 시작
function startDrawing(e) {
  if (currentMode !== 'background' || backgroundAddMode !== 'draw') return;
  
  isDrawing = true;
  const canvas = document.getElementById('canvas');
  
  // 마우스 위치를 캔버스 내부 좌표로 변환
  const mouseCanvasPos = screenToCanvas(e.clientX, e.clientY);
  
  // 그리드 스냅
  if (snapToGridEnabled) {
    drawStartPos.x = Math.round(mouseCanvasPos.x / gridSize) * gridSize;
    drawStartPos.y = Math.round(mouseCanvasPos.y / gridSize) * gridSize;
  } else {
    // 그리드 스냅이 꺼져있어도 정수로 반올림
    drawStartPos.x = Math.round(mouseCanvasPos.x);
    drawStartPos.y = Math.round(mouseCanvasPos.y);
  }
  
  // 미리보기 요소 생성
  drawPreview = document.createElement('div');
  drawPreview.className = 'draw-preview';
  drawPreview.style.left = drawStartPos.x + 'px';
  drawPreview.style.top = drawStartPos.y + 'px';
  drawPreview.style.width = '0px';
  drawPreview.style.height = '0px';
  canvas.appendChild(drawPreview);
  
  e.preventDefault();
}

// 그리기 미리보기 업데이트
function updateDrawingPreview(e) {
  if (!isDrawing || !drawPreview) return;
  
  const canvas = document.getElementById('canvas');
  
  // 마우스 위치를 캔버스 내부 좌표로 변환
  const mouseCanvasPos = screenToCanvas(e.clientX, e.clientY);
  let currentX = mouseCanvasPos.x;
  let currentY = mouseCanvasPos.y;
  
  // 그리드 스냅
  if (snapToGridEnabled) {
    currentX = Math.round(currentX / gridSize) * gridSize;
    currentY = Math.round(currentY / gridSize) * gridSize;
  }
  
  // 크기 계산
  const width = Math.abs(currentX - drawStartPos.x);
  const height = Math.abs(currentY - drawStartPos.y);
  
  // 최소 크기
  const minSize = 20;
  const finalWidth = Math.max(minSize, width);
  const finalHeight = Math.max(minSize, height);
  
  // 위치와 크기 설정
  const left = Math.min(drawStartPos.x, currentX);
  const top = Math.min(drawStartPos.y, currentY);
  
  drawPreview.style.left = left + 'px';
  drawPreview.style.top = top + 'px';
  drawPreview.style.width = finalWidth + 'px';
  drawPreview.style.height = finalHeight + 'px';
}

// 그리기 완료
function finishDrawing(e) {
  if (!isDrawing || !drawPreview) return;
  
  const canvas = document.getElementById('canvas');
  
  // 마우스 위치를 캔버스 내부 좌표로 변환
  const mouseCanvasPos = screenToCanvas(e.clientX, e.clientY);
  let endX = mouseCanvasPos.x;
  let endY = mouseCanvasPos.y;
  
  // 그리드 스냅
  if (snapToGridEnabled) {
    endX = Math.round(endX / gridSize) * gridSize;
    endY = Math.round(endY / gridSize) * gridSize;
  }
  
  const width = Math.abs(endX - drawStartPos.x);
  const height = Math.abs(endY - drawStartPos.y);
  
  // 최소 크기 체크
  if (width < 20 || height < 20) {
    cancelDrawing();
    return;
  }
  
  const left = Math.min(drawStartPos.x, endX);
  const top = Math.min(drawStartPos.y, endY);
  
  // 새 배경 요소 생성
  const label = prompt('배경 요소 이름을 입력하세요 (선택사항):', '새 구역');
  const newBg = {
    id: 'bg_' + Date.now(),
    type: 'rect',
    label: label || '새 구역',
    x: left,
    y: top,
    width: width,
    height: height,
    fill: '#d3d3d3',
    stroke: '#000',
    strokeWidth: 1,
    isNew: true
  };
  
  backgroundElements.push(newBg);
  const element = createBackgroundElement(newBg);
  // grid-overlay 바로 다음에 추가하여 배경이 먼저 렌더링되도록
  const gridOverlay = document.getElementById('gridOverlay');
  if (gridOverlay && gridOverlay.nextSibling) {
    canvas.insertBefore(element, gridOverlay.nextSibling);
  } else {
    canvas.appendChild(element);
  }
  selectBackground(newBg, element);
  saveBackgroundElements();
  
  // 미리보기 제거
  cancelDrawing();
}

// 그리기 취소
function cancelDrawing() {
  isDrawing = false;
  if (drawPreview) {
    drawPreview.remove();
    drawPreview = null;
  }
}

// 범위 선택 시작
function startSelection(e) {
  if (currentMode !== 'location') return;
  
  isSelecting = true;
  const canvas = document.getElementById('canvas');
  
  // 마우스 위치를 캔버스 내부 좌표로 변환
  const mouseCanvasPos = screenToCanvas(e.clientX, e.clientY);
  selectionStartPos.x = mouseCanvasPos.x;
  selectionStartPos.y = mouseCanvasPos.y;
  
  // 선택 박스 생성
  selectionBox = document.createElement('div');
  selectionBox.className = 'selection-box';
  selectionBox.style.left = selectionStartPos.x + 'px';
  selectionBox.style.top = selectionStartPos.y + 'px';
  selectionBox.style.width = '0px';
  selectionBox.style.height = '0px';
  canvas.appendChild(selectionBox);
  
  e.preventDefault();
}

// 범위 선택 업데이트
function updateSelection(e) {
  if (!isSelecting || !selectionBox) return;
  
  const canvas = document.getElementById('canvas');
  
  // 마우스 위치를 캔버스 내부 좌표로 변환
  const mouseCanvasPos = screenToCanvas(e.clientX, e.clientY);
  let currentX = mouseCanvasPos.x;
  let currentY = mouseCanvasPos.y;
  
  // 선택 영역 계산
  const left = Math.min(selectionStartPos.x, currentX);
  const top = Math.min(selectionStartPos.y, currentY);
  const width = Math.abs(currentX - selectionStartPos.x);
  const height = Math.abs(currentY - selectionStartPos.y);
  
  // 선택 박스 업데이트
  selectionBox.style.left = left + 'px';
  selectionBox.style.top = top + 'px';
  selectionBox.style.width = width + 'px';
  selectionBox.style.height = height + 'px';
  
  // 선택 영역과 겹치는 위치 박스들을 하이라이트
  highlightLocationsInSelection(left, top, width, height);
}

// 선택 영역과 겹치는 위치 박스 하이라이트
function highlightLocationsInSelection(selLeft, selTop, selWidth, selHeight) {
  const canvas = document.getElementById('canvas');
  const allBoxes = canvas.querySelectorAll('.location-box');
  
  allBoxes.forEach(box => {
    // 박스의 실제 캔버스 내부 좌표 사용 (이미 저장된 loc.x, loc.y 사용)
    const locId = parseInt(box.getAttribute('data-id'));
    const loc = locations.find(l => l.id === locId);
    if (!loc) return;
    
    const boxLeft = loc.x;
    const boxTop = loc.y;
    const boxRight = boxLeft + (loc.width || 60);
    const boxBottom = boxTop + (loc.height || 20);
    
    const selRight = selLeft + selWidth;
    const selBottom = selTop + selHeight;
    
    // 박스가 선택 영역과 겹치는지 확인
    const isOverlapping = !(boxRight < selLeft || boxLeft > selRight || boxBottom < selTop || boxTop > selBottom);
    
    // 임시 하이라이트 클래스 추가/제거
    if (isOverlapping) {
      box.classList.add('selection-highlight');
    } else {
      box.classList.remove('selection-highlight');
    }
  });
}

// 범위 선택 완료
function finishSelection(e) {
  if (!isSelecting || !selectionBox) return;
  
  const canvas = document.getElementById('canvas');
  
  // 마우스 위치를 캔버스 내부 좌표로 변환
  const mouseCanvasPos = screenToCanvas(e.clientX, e.clientY);
  const currentX = mouseCanvasPos.x;
  const currentY = mouseCanvasPos.y;
  
  // 선택 영역 계산 (캔버스 내부 좌표 기준)
  const left = Math.min(selectionStartPos.x, currentX);
  const top = Math.min(selectionStartPos.y, currentY);
  const width = Math.abs(currentX - selectionStartPos.x);
  const height = Math.abs(currentY - selectionStartPos.y);
  
  // 최소 크기 체크 (너무 작은 선택은 무시)
  if (width > 5 && height > 5) {
    // 선택 영역 안의 위치 박스들 찾기
    selectLocationsInSelection(left, top, width, height);
  }
  
  // 선택 박스 제거 및 하이라이트 제거
  if (selectionBox) {
    selectionBox.remove();
    selectionBox = null;
  }
  
  // 모든 임시 하이라이트 제거
  document.querySelectorAll('.location-box.selection-highlight').forEach(box => {
    box.classList.remove('selection-highlight');
  });
  
  isSelecting = false;
  e.preventDefault();
}

// 선택 영역 안의 위치 박스들 선택
function selectLocationsInSelection(selLeft, selTop, selWidth, selHeight) {
  const canvas = document.getElementById('canvas');
  const allBoxes = canvas.querySelectorAll('.location-box');
  const selectedIds = new Set();
  
  allBoxes.forEach(box => {
    // 박스의 실제 캔버스 내부 좌표 사용 (이미 저장된 loc.x, loc.y 사용)
    const locId = parseInt(box.getAttribute('data-id'));
    const loc = locations.find(l => l.id === locId);
    if (!loc) return;
    
    const boxLeft = loc.x;
    const boxTop = loc.y;
    const boxRight = boxLeft + (loc.width || 60);
    const boxBottom = boxTop + (loc.height || 20);
    
    const selRight = selLeft + selWidth;
    const selBottom = selTop + selHeight;
    
    // 박스가 선택 영역과 겹치는지 확인
    const isOverlapping = !(boxRight < selLeft || boxLeft > selRight || boxBottom < selTop || boxTop > selBottom);
    
    if (isOverlapping) {
      const locId = parseInt(box.getAttribute('data-id'));
      selectedIds.add(locId);
    }
  });
  
  // 선택된 위치들을 selectedLocations에 추가
  selectedIds.forEach(id => {
    const loc = locations.find(l => l.id === id);
    if (loc) {
      const box = document.querySelector(`.location-box[data-id="${id}"]`);
      if (box && !selectedLocations.some(l => l.id === id)) {
        selectedLocations.push(loc);
        box.classList.add('selected');
      }
    }
  });
  
  // 선택 상태 업데이트
  if (selectedLocations.length === 1) {
    selectedLocation = selectedLocations[0];
    updateSelectedLocationInfo(selectedLocation);
  } else if (selectedLocations.length > 1) {
    selectedLocation = null;
    document.getElementById('selectedLocationInfo').classList.add('hidden');
  }
  
  updateBatchTools();
}

// 범위 선택 취소
function cancelSelection() {
  if (selectionBox) {
    selectionBox.remove();
    selectionBox = null;
  }
  
  // 모든 임시 하이라이트 제거
  document.querySelectorAll('.location-box.selection-highlight').forEach(box => {
    box.classList.remove('selection-highlight');
  });
  
  isSelecting = false;
}

// 그리기 중지
function stopDrawing() {
  cancelDrawing();
  const canvas = document.getElementById('canvas');
  if (canvas) {
    canvas.classList.remove('drawing');
  }
}

// 배경 요소 로드 (localStorage에서, 없으면 현재 코드의 기본값 사용)
function loadBackgroundElements() {
  try {
    const saved = localStorage.getItem('wp1_background_elements');
    if (saved) {
      backgroundElements = JSON.parse(saved);
    } else {
      // 현재 location_view.html과 location_view.js에 하드코딩된 기본 배경 요소
      // location_view.html 기준으로 설정
      backgroundElements = [
        { id: 'bg1', type: 'rect', label: '왼쪽 세로 구역', x: 1, y: 1, width: 175, height: 575, fill: '#d3d3d3', stroke: '#000', strokeWidth: 1 },
        { id: 'bg2', type: 'rect', label: '하단 가로 구역', x: 177.5, y: 151, width: 480, height: 425, fill: '#d3d3d3', stroke: '#000', strokeWidth: 1 },
        { id: 'bg3', type: 'rect', label: 'LOADING DOCK 배경', x: 250, y: 120, width: 300, height: 25, fill: '#176687', stroke: '#000', strokeWidth: 1 },
        { id: 'bg4', type: 'text', label: 'LOADING DOCK', text: 'LOADING DOCK', x: 400, y: 135, fontSize: 15, fill: '#fff' }
      ];
      saveBackgroundElements();
    }
  } catch (error) {
    console.error('배경 요소 로드 실패:', error);
    // 에러 발생 시 기본값 사용
    backgroundElements = [
      { id: 'bg1', type: 'rect', label: '왼쪽 세로 구역', x: 1, y: 1, width: 175, height: 575, fill: '#d3d3d3', stroke: '#000', strokeWidth: 1 },
      { id: 'bg2', type: 'rect', label: '하단 가로 구역', x: 177.5, y: 151, width: 480, height: 425, fill: '#d3d3d3', stroke: '#000', strokeWidth: 1 },
      { id: 'bg3', type: 'rect', label: 'LOADING DOCK 배경', x: 250, y: 120, width: 300, height: 25, fill: '#176687', stroke: '#000', strokeWidth: 1 },
      { id: 'bg4', type: 'text', label: 'LOADING DOCK', text: 'LOADING DOCK', x: 400, y: 135, fontSize: 15, fill: '#fff' }
    ];
  }
}

// 배경 요소 저장 (localStorage에)
function saveBackgroundElements() {
  try {
    // 저장 전에 모든 좌표와 크기를 정수로 반올림
    const normalizedElements = backgroundElements.map(bg => ({
      ...bg,
      x: Math.round(bg.x || 0),
      y: Math.round(bg.y || 0),
      width: Math.round(bg.width || (bg.type === 'text' ? 100 : 200)),
      height: Math.round(bg.height || (bg.type === 'text' ? 20 : 100))
    }));
    localStorage.setItem('wp1_background_elements', JSON.stringify(normalizedElements));
    // backgroundElements 배열도 업데이트
    backgroundElements = normalizedElements;
  } catch (error) {
    console.error('배경 요소 저장 실패:', error);
  }
}

// 배경 요소 렌더링
function renderBackgroundElements() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;
  
  // 기존 배경 요소 제거
  document.querySelectorAll('.background-element').forEach(el => el.remove());
  
  // 배경 요소 생성 (위치 박스보다 먼저 추가하여 DOM 순서상 앞에 위치)
  // z-index로 위에 표시되도록 설정됨
  backgroundElements.forEach(bg => {
    const element = createBackgroundElement(bg);
    // grid-overlay 바로 다음에 추가 (배경이 먼저 렌더링되도록)
    const gridOverlay = document.getElementById('gridOverlay');
    if (gridOverlay && gridOverlay.nextSibling) {
      canvas.insertBefore(element, gridOverlay.nextSibling);
    } else {
      canvas.appendChild(element);
    }
  });
}

// 배경 요소 생성
function createBackgroundElement(bg) {
  const element = document.createElement('div');
  element.className = `background-element ${bg.type}-element`;
  element.dataset.id = bg.id;
  // 좌표를 정수로 반올림하여 표시
  element.style.left = Math.round(bg.x || 0) + 'px';
  element.style.top = Math.round(bg.y || 0) + 'px';
  
  if (bg.type === 'rect') {
    element.style.width = bg.width + 'px';
    element.style.height = bg.height + 'px';
    element.style.backgroundColor = bg.fill || '#d3d3d3';
    element.style.borderColor = bg.stroke || '#000';
    element.style.borderWidth = (bg.strokeWidth || 1) + 'px';
    element.style.borderStyle = 'solid';
  } else if (bg.type === 'text') {
    element.style.width = 'auto';
    element.style.height = 'auto';
    element.style.color = bg.fill || '#000';
    element.style.fontSize = (bg.fontSize || 15) + 'px';
    element.style.fontWeight = 'bold';
    element.textContent = bg.text || bg.label || '';
    element.style.padding = '4px 8px';
  }
  
  // 리사이즈 핸들 (rect만)
  if (bg.type === 'rect') {
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    resizeHandle.style.background = '#9333ea';
    resizeHandle.style.zIndex = '100'; // 리사이즈 핸들이 항상 위에
    element.appendChild(resizeHandle);
  }
  
  // 클릭 이벤트
  element.addEventListener('mousedown', (e) => {
    if (currentMode !== 'background' || isDrawing) {
      e.stopPropagation();
      return;
    }
    
    // 리사이즈 핸들 클릭
    if (bg.type === 'rect' && (e.target.classList.contains('resize-handle') || e.target.closest('.resize-handle'))) {
      startResizeBackground(bg, element, e);
    } else {
      // 배경 요소 선택 및 드래그 시작
      selectBackground(bg, element);
      startDragBackground(bg, element, e);
    }
    e.stopPropagation(); // 캔버스 그리기 이벤트와 충돌 방지
  });
  
  return element;
}

// 배경 요소 선택
function selectBackground(bg, element) {
  // 기존 선택 해제
  document.querySelectorAll('.background-element').forEach(el => el.classList.remove('selected'));
  document.querySelectorAll('.location-box').forEach(b => b.classList.remove('selected'));
  
  selectedBackground = bg;
  selectedLocation = null;
  element.classList.add('selected');
  
  // 정보 패널 업데이트
  updateSelectedBackgroundInfo(bg);
}

// 선택된 배경 요소 정보 업데이트
function updateSelectedBackgroundInfo(bg) {
  const infoPanel = document.getElementById('selectedBackgroundInfo');
  if (!infoPanel) return;
  
  infoPanel.classList.remove('hidden');
  document.getElementById('selectedLocationInfo').classList.add('hidden');
  
  document.getElementById('editBackgroundLabel').value = bg.label || '';
  document.getElementById('editBgX').value = bg.x || 0;
  document.getElementById('editBgY').value = bg.y || 0;
  document.getElementById('editBgWidth').value = bg.width || 100;
  document.getElementById('editBgHeight').value = bg.height || 50;
  document.getElementById('editBgFill').value = bg.fill || '#d3d3d3';
  document.getElementById('editBgStroke').value = bg.stroke || '#000';
  document.getElementById('editBgTextColor').value = bg.type === 'text' ? (bg.fill || '#000') : '#000';
  document.getElementById('editBgFontSize').value = bg.fontSize || 15;
  
  // 텍스트 전용 필드 표시/숨김
  const textFields = ['editBgTextColor', 'editBgFontSize'];
  textFields.forEach(id => {
    const field = document.getElementById(id).parentElement;
    field.style.display = bg.type === 'text' ? 'block' : 'none';
  });
}

  // 배경 요소 드래그 시작
  function startDragBackground(bg, element, e) {
    if (currentMode !== 'background' || isDrawing) return;
    isDragging = true;
  const canvas = document.getElementById('canvas');
  
  // 마우스 위치를 캔버스 내부 좌표로 변환
  const mouseCanvasPos = screenToCanvas(e.clientX, e.clientY);
  
  dragOffset.x = mouseCanvasPos.x - bg.x;
  dragOffset.y = mouseCanvasPos.y - bg.y;
  
  document.addEventListener('mousemove', handleDragBackground);
  document.addEventListener('mouseup', stopDragBackground);
  e.preventDefault();
}

// 배경 요소 드래그 처리
function handleDragBackground(e) {
  if (!isDragging || !selectedBackground) return;
  
  const canvas = document.getElementById('canvas');
  
  // 마우스 위치를 캔버스 내부 좌표로 변환
  const mouseCanvasPos = screenToCanvas(e.clientX, e.clientY);
  let x = mouseCanvasPos.x - dragOffset.x;
  let y = mouseCanvasPos.y - dragOffset.y;
  
  // 그리드 스냅
  if (snapToGridEnabled) {
    x = Math.round(x / gridSize) * gridSize;
    y = Math.round(y / gridSize) * gridSize;
  }
  
  // 경계 체크
  x = Math.max(0, x);
  y = Math.max(0, y);
  
  if (selectedBackground.type === 'rect') {
    x = Math.min(x, canvas.offsetWidth - selectedBackground.width);
    y = Math.min(y, canvas.offsetHeight - selectedBackground.height);
  }
  
  // 위치 업데이트 (정수로 반올림하여 저장)
  const roundedX = Math.round(x);
  const roundedY = Math.round(y);
  selectedBackground.x = roundedX;
  selectedBackground.y = roundedY;
  
  const element = document.querySelector(`.background-element[data-id="${selectedBackground.id}"]`);
  if (element) {
    element.style.left = roundedX + 'px';
    element.style.top = roundedY + 'px';
    
    // 정보 패널 업데이트
    document.getElementById('editBgX').value = roundedX;
    document.getElementById('editBgY').value = roundedY;
  }
}

// 배경 요소 드래그 종료
function stopDragBackground() {
  isDragging = false;
  document.removeEventListener('mousemove', handleDragBackground);
  document.removeEventListener('mouseup', stopDragBackground);
  saveBackgroundElements();
}

// 배경 요소 리사이즈 시작
function startResizeBackground(bg, element, e) {
  if (currentMode !== 'background' || bg.type !== 'rect') return;
  isResizing = true;
  const canvas = document.getElementById('canvas');
  
  // 마우스 위치를 캔버스 내부 좌표로 변환
  const mouseCanvasPos = screenToCanvas(e.clientX, e.clientY);
  
  const startX = mouseCanvasPos.x;
  const startY = mouseCanvasPos.y;
  const startWidth = bg.width;
  const startHeight = bg.height;
  const startLeft = bg.x;
  const startTop = bg.y;
  
  selectBackground(bg, element);
  
  function handleResize(e) {
    if (!isResizing) return;
    
    // 마우스 위치를 캔버스 내부 좌표로 변환
    const mouseCanvasPos = screenToCanvas(e.clientX, e.clientY);
    
    let newWidth = startWidth + (mouseCanvasPos.x - startX);
    let newHeight = startHeight + (mouseCanvasPos.y - startY);
    
    // 최소 크기
    newWidth = Math.max(20, newWidth);
    newHeight = Math.max(20, newHeight);
    
    // 그리드 스냅
    if (snapToGridEnabled) {
      newWidth = Math.round(newWidth / gridSize) * gridSize;
      newHeight = Math.round(newHeight / gridSize) * gridSize;
    }
    
    // 경계 체크
    const canvas = document.getElementById('canvas');
    const maxWidth = canvas.offsetWidth - startLeft;
    const maxHeight = canvas.offsetHeight - startTop;
    newWidth = Math.min(newWidth, maxWidth);
    newHeight = Math.min(newHeight, maxHeight);
    
    // 크기 업데이트 (정수로 반올림하여 저장)
    const roundedWidth = Math.round(newWidth);
    const roundedHeight = Math.round(newHeight);
    selectedBackground.width = roundedWidth;
    selectedBackground.height = roundedHeight;
    
    element.style.width = roundedWidth + 'px';
    element.style.height = roundedHeight + 'px';
    
    // 정보 패널 업데이트
    document.getElementById('editBgWidth').value = roundedWidth;
    document.getElementById('editBgHeight').value = roundedHeight;
  }
  
  function stopResize() {
    isResizing = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    saveBackgroundElements();
  }
  
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
  e.preventDefault();
  e.stopPropagation();
}

// 모드 전환 설정
function setupModeToggle() {
  document.getElementById('modeLocation').addEventListener('click', () => {
    currentMode = 'location';
    document.body.classList.remove('background-mode');
    document.getElementById('modeLocation').classList.add('bg-blue-600', 'text-white');
    document.getElementById('modeLocation').classList.remove('bg-gray-300', 'text-gray-800');
    document.getElementById('modeBackground').classList.remove('bg-purple-600', 'text-white');
    document.getElementById('modeBackground').classList.add('bg-gray-300', 'text-gray-800');
    document.getElementById('locationMode').classList.remove('hidden');
    document.getElementById('backgroundMode').classList.add('hidden');
    
    // 선택 해제
    document.querySelectorAll('.background-element').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.location-box').forEach(b => b.classList.remove('selected'));
    selectedBackground = null;
    selectedLocation = null;
    document.getElementById('selectedLocationInfo').classList.add('hidden');
    document.getElementById('selectedBackgroundInfo').classList.add('hidden');
    
    // 그리기 중지
    stopDrawing();
  });
  
  document.getElementById('modeBackground').addEventListener('click', () => {
    currentMode = 'background';
    document.body.classList.add('background-mode');
    document.getElementById('modeBackground').classList.add('bg-purple-600', 'text-white');
    document.getElementById('modeBackground').classList.remove('bg-gray-300', 'text-gray-800');
    document.getElementById('modeLocation').classList.remove('bg-blue-600', 'text-white');
    document.getElementById('modeLocation').classList.add('bg-gray-300', 'text-gray-800');
    document.getElementById('locationMode').classList.add('hidden');
    document.getElementById('backgroundMode').classList.remove('hidden');
    
    // 그리기 모드 기본 설정
    if (backgroundAddMode === 'draw') {
      const canvas = document.getElementById('canvas');
      if (canvas) canvas.classList.add('drawing');
    }
    
    // 선택 해제
    document.querySelectorAll('.background-element').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.location-box').forEach(b => b.classList.remove('selected'));
    selectedBackground = null;
    selectedLocation = null;
    document.getElementById('selectedLocationInfo').classList.add('hidden');
    document.getElementById('selectedBackgroundInfo').classList.add('hidden');
    
    // 그리기 중지
    stopDrawing();
  });
}

// 키보드 단축키 설정
let arrowKeyPressed = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false
};
let arrowKeyMoveInterval = null;

function setupKeyboardShortcuts() {
  // 키를 누를 때
  document.addEventListener('keydown', async (e) => {
    // 입력 필드에 포커스가 있으면 키보드 단축키 무시 (일부 제외)
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      // Ctrl+A, Ctrl+C, Ctrl+V는 입력 필드에서도 허용
      if (!(e.ctrlKey || e.metaKey) && !['a', 'c', 'v'].includes(e.key.toLowerCase())) {
        return;
      }
    }
    
    // 복사 (Ctrl+C)
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      e.preventDefault();
      copySelectedLocations();
      return;
    }
    
    // 붙여넣기 (Ctrl+V)
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault();
      await pasteLocations();
      return;
    }
    
    // 복제 (Ctrl+D)
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      await duplicateSelectedLocations();
      return;
    }
    
    // 전체 선택 (Ctrl+A)
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      if (currentMode === 'location') {
        e.preventDefault();
        clearAllSelections();
        locations.forEach(loc => {
          const box = document.querySelector(`.location-box[data-id="${loc.id}"]`);
          if (box) {
            selectedLocations.push(loc);
            box.classList.add('selected');
          }
        });
        updateBatchTools();
      }
      return;
    }
    
    // DELETE 또는 Backspace 키로 삭제
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      
      // 위치 편집 모드에서 다중 선택된 위치 삭제
      if (currentMode === 'location' && selectedLocations.length > 0) {
        await deleteSelectedLocations();
      }
      // 위치 편집 모드에서 단일 선택된 위치 삭제
      else if (currentMode === 'location' && selectedLocation) {
        await deleteLocation();
      }
      // 배경 편집 모드에서 선택된 배경 요소 삭제
      else if (currentMode === 'background' && selectedBackground) {
        deleteBackground();
      }
      return;
    }
    
    // 화살표 키로 위치 이동 (위치 편집 모드에서만)
    if (currentMode === 'location' && (selectedLocations.length > 0 || selectedLocation)) {
      const arrowKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
      if (arrowKeys.includes(e.key) && !arrowKeyPressed[e.key]) {
        e.preventDefault();
        arrowKeyPressed[e.key] = true;
        
        // 첫 번째 이동 시작 시 undo stack에 저장
        if (!arrowKeyMoveInterval) {
          saveToUndoStack();
        }
        
        // 첫 번째 이동은 즉시 실행
        moveWithArrowKey(e.key, e.shiftKey);
        
        // 이후 반복 이동은 간격을 두고 실행
        if (arrowKeyMoveInterval) {
          clearInterval(arrowKeyMoveInterval);
        }
        arrowKeyMoveInterval = setInterval(() => {
          // 현재 눌려있는 모든 화살표 키 확인
          const activeKeys = arrowKeys.filter(key => arrowKeyPressed[key]);
          if (activeKeys.length > 0) {
            // 가장 최근에 눌린 키 사용 (또는 첫 번째 활성 키)
            moveWithArrowKey(activeKeys[0], e.shiftKey);
          }
        }, 50); // 50ms마다 이동
      }
    }
  });
  
  // 키를 뗄 때
  document.addEventListener('keyup', async (e) => {
    const arrowKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    if (arrowKeys.includes(e.key)) {
      const wasPressed = arrowKeyPressed[e.key];
      arrowKeyPressed[e.key] = false;
      
      // 키를 뗄 때 저장
      if (wasPressed && currentMode === 'location' && (selectedLocations.length > 0 || selectedLocation)) {
        await saveAfterArrowKeyMove();
      }
      
      // 모든 화살표 키가 떼어지면 인터벌 정리
      const allReleased = arrowKeys.every(key => !arrowKeyPressed[key]);
      if (allReleased && arrowKeyMoveInterval) {
        clearInterval(arrowKeyMoveInterval);
        arrowKeyMoveInterval = null;
      }
    }
  });
}

// 화살표 키로 이동하는 함수
async function moveWithArrowKey(key, shiftPressed) {
  const moveStep = shiftPressed ? 10 : 1;
  let moved = false;
  
  // 첫 번째 이동일 때만 undo stack에 저장
  if (!arrowKeyMoveInterval) {
    saveToUndoStack();
  }
  
  if (key === 'ArrowLeft') {
    if (selectedLocations.length > 0) {
      selectedLocations.forEach(loc => {
        loc.x = Math.max(0, loc.x - moveStep);
        const box = document.querySelector(`.location-box[data-id="${loc.id}"]`);
        if (box) box.style.left = loc.x + 'px';
      });
    } else if (selectedLocation) {
      selectedLocation.x = Math.max(0, selectedLocation.x - moveStep);
      const box = document.querySelector(`.location-box[data-id="${selectedLocation.id}"]`);
      if (box) {
        box.style.left = selectedLocation.x + 'px';
        document.getElementById('editX').value = selectedLocation.x;
      }
    }
    moved = true;
  } else if (key === 'ArrowRight') {
    const canvas = document.getElementById('canvas');
    if (selectedLocations.length > 0) {
      selectedLocations.forEach(loc => {
        loc.x = Math.min(canvas.offsetWidth - loc.width, loc.x + moveStep);
        const box = document.querySelector(`.location-box[data-id="${loc.id}"]`);
        if (box) box.style.left = loc.x + 'px';
      });
    } else if (selectedLocation) {
      selectedLocation.x = Math.min(canvas.offsetWidth - selectedLocation.width, selectedLocation.x + moveStep);
      const box = document.querySelector(`.location-box[data-id="${selectedLocation.id}"]`);
      if (box) {
        box.style.left = selectedLocation.x + 'px';
        document.getElementById('editX').value = selectedLocation.x;
      }
    }
    moved = true;
  } else if (key === 'ArrowUp') {
    if (selectedLocations.length > 0) {
      selectedLocations.forEach(loc => {
        loc.y = Math.max(0, loc.y - moveStep);
        const box = document.querySelector(`.location-box[data-id="${loc.id}"]`);
        if (box) box.style.top = loc.y + 'px';
      });
    } else if (selectedLocation) {
      selectedLocation.y = Math.max(0, selectedLocation.y - moveStep);
      const box = document.querySelector(`.location-box[data-id="${selectedLocation.id}"]`);
      if (box) {
        box.style.top = selectedLocation.y + 'px';
        document.getElementById('editY').value = selectedLocation.y;
      }
    }
    moved = true;
  } else if (key === 'ArrowDown') {
    const canvas = document.getElementById('canvas');
    if (selectedLocations.length > 0) {
      selectedLocations.forEach(loc => {
        loc.y = Math.min(canvas.offsetHeight - loc.height, loc.y + moveStep);
        const box = document.querySelector(`.location-box[data-id="${loc.id}"]`);
        if (box) box.style.top = loc.y + 'px';
      });
    } else if (selectedLocation) {
      selectedLocation.y = Math.min(canvas.offsetHeight - selectedLocation.height, selectedLocation.y + moveStep);
      const box = document.querySelector(`.location-box[data-id="${selectedLocation.id}"]`);
      if (box) {
        box.style.top = selectedLocation.y + 'px';
        document.getElementById('editY').value = selectedLocation.y;
      }
    }
    moved = true;
  }
  
  updateBatchTools();
}

// 키를 뗄 때 저장하는 함수
async function saveAfterArrowKeyMove() {
  if (selectedLocations.length > 0) {
    await saveAllLocations();
  } else if (selectedLocation) {
    await saveLocation(selectedLocation, false);
  }
}

// 다중 선택된 위치들 삭제
async function deleteSelectedLocations() {
  if (selectedLocations.length === 0) return;
  
  const count = selectedLocations.length;
  if (!confirm(`${count}개의 위치를 삭제하시겠습니까?`)) return;
  
  const idsToDelete = selectedLocations.map(loc => loc.id);
  
  // 데이터베이스에서 삭제
  for (const loc of selectedLocations) {
    if (!loc.isNew) {
      const { error } = await window.supabase
        .from('wp1_locations')
        .delete()
        .eq('id', loc.id);
      
      if (error) {
        console.error(`위치 ${loc.location_code} 삭제 실패:`, error);
      }
    }
  }
  
  // UI에서 제거
  idsToDelete.forEach(id => {
    const box = document.querySelector(`.location-box[data-id="${id}"]`);
    if (box) box.remove();
  });
  
  // 배열에서 제거
  locations = locations.filter(loc => !idsToDelete.includes(loc.id));
  
  // 선택 해제
  selectedLocations = [];
  selectedLocation = null;
  document.getElementById('selectedLocationInfo').classList.add('hidden');
  updateBatchTools();
  
  alert(`${count}개의 위치가 삭제되었습니다.`);
}

// 단일 위치 삭제 (기존 함수 재사용)
async function deleteLocation() {
  if (!selectedLocation) return;
  
  if (!confirm(`"${selectedLocation.location_code}" 위치를 삭제하시겠습니까?`)) return;
  
  // 데이터베이스에서 삭제
  if (!selectedLocation.isNew) {
    const { error } = await window.supabase
      .from('wp1_locations')
      .delete()
      .eq('id', selectedLocation.id);
    
    if (error) {
      alert('삭제 실패: ' + error.message);
      return;
    }
  }
  
  // UI에서 제거
  const box = document.querySelector(`.location-box[data-id="${selectedLocation.id}"]`);
  if (box) box.remove();
  
  locations = locations.filter(loc => loc.id !== selectedLocation.id);
  selectedLocation = null;
  selectedLocations = [];
  document.getElementById('selectedLocationInfo').classList.add('hidden');
  updateBatchTools();
}

// 배경 요소 삭제
function deleteBackground() {
  if (!selectedBackground) return;
  
  if (!confirm(`"${selectedBackground.label || '배경 요소'}"를 삭제하시겠습니까?`)) return;
  
  // UI에서 제거
  const element = document.querySelector(`.background-element[data-id="${selectedBackground.id}"]`);
  if (element) element.remove();
  
  backgroundElements = backgroundElements.filter(bg => bg.id !== selectedBackground.id);
  selectedBackground = null;
  document.getElementById('selectedBackgroundInfo').classList.add('hidden');
  saveBackgroundElements();
}

// ==================== 줌/패닝 기능 ====================
function setupZoomAndPan() {
  const canvas = document.getElementById('canvas');
  const canvasContainer = document.getElementById('canvasContainer');
  
  // 줌 인/아웃 버튼
  document.getElementById('zoomInBtn').addEventListener('click', () => {
    setZoom(zoomLevel + 0.1);
  });
  
  document.getElementById('zoomOutBtn').addEventListener('click', () => {
    setZoom(zoomLevel - 0.1);
  });
  
  document.getElementById('resetZoomBtn').addEventListener('click', () => {
    setZoom(1);
    panOffset = { x: 0, y: 0 };
    applyTransform();
  });
  
  // 마우스 휠 줌
  canvasContainer.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.1, Math.min(5, zoomLevel + delta));
      
      // 마우스 위치를 중심으로 줌
      const rect = canvasContainer.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const zoomFactor = newZoom / zoomLevel;
      panOffset.x = mouseX - (mouseX - panOffset.x) * zoomFactor;
      panOffset.y = mouseY - (mouseY - panOffset.y) * zoomFactor;
      
      setZoom(newZoom);
    }
  });
  
  // Space + 드래그로 패닝
  let spacePressed = false;
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !e.target.tagName.match(/INPUT|TEXTAREA/)) {
      spacePressed = true;
      canvasContainer.style.cursor = 'grab';
      e.preventDefault();
    }
  });
  
  document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      spacePressed = false;
      isPanning = false;
      canvasContainer.style.cursor = 'default';
    }
  });
  
  canvasContainer.addEventListener('mousedown', (e) => {
    if (spacePressed && (e.target === canvasContainer || e.target === canvas || e.target.classList.contains('grid-overlay'))) {
      isPanning = true;
      panStartPos.x = e.clientX - panOffset.x;
      panStartPos.y = e.clientY - panOffset.y;
      canvasContainer.style.cursor = 'grabbing';
      e.preventDefault();
    }
  });
  
  canvasContainer.addEventListener('mousemove', (e) => {
    if (isPanning && spacePressed) {
      panOffset.x = e.clientX - panStartPos.x;
      panOffset.y = e.clientY - panStartPos.y;
      applyTransform();
    }
  });
  
  canvasContainer.addEventListener('mouseup', () => {
    if (isPanning) {
      isPanning = false;
      canvasContainer.style.cursor = spacePressed ? 'grab' : 'default';
    }
  });
}

function setZoom(level) {
  zoomLevel = Math.max(0.1, Math.min(5, level));
  const zoomLevelEl = document.getElementById('zoomLevel');
  if (zoomLevelEl) {
    zoomLevelEl.textContent = Math.round(zoomLevel * 100) + '%';
  }
  applyTransform();
  updateMinimap();
}

function applyTransform() {
  const canvas = document.getElementById('canvas');
  if (canvas) {
    canvas.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`;
    canvas.style.transformOrigin = '0 0';
  }
}

// ==================== 복사/붙여넣기 기능 ====================
function copySelectedLocations() {
  if (selectedLocations.length > 0) {
    clipboard = selectedLocations.map(loc => ({
      ...loc,
      id: undefined, // 새 ID 생성
      isNew: true
    }));
  } else if (selectedLocation) {
    clipboard = [{
      ...selectedLocation,
      id: undefined,
      isNew: true
    }];
  }
}

async function pasteLocations() {
  if (!clipboard || clipboard.length === 0) return;
  
  saveToUndoStack();
  clearAllSelections();
  
  const offset = 20; // 붙여넣기 시 약간 오프셋
  clipboard.forEach((loc, index) => {
    const newLoc = {
      ...loc,
      id: 'loc_' + Date.now() + '_' + index,
      location_code: loc.location_code ? (loc.location_code.replace(/_copy\d*$/, '') + '_copy') : 'NEW_' + Date.now(),
      x: (loc.x || 0) + offset,
      y: (loc.y || 0) + offset,
      isNew: true
    };
    
    locations.push(newLoc);
    const box = createLocationBox(newLoc);
    document.getElementById('canvas').appendChild(box);
    selectedLocations.push(newLoc);
    box.classList.add('selected');
  });
  
  updateBatchTools();
  await saveAllLocations();
  updateMinimap();
}

async function duplicateSelectedLocations() {
  copySelectedLocations();
  await pasteLocations();
}

// ==================== 정렬 가이드라인 ====================
function showAlignmentGuides(movingBox, allBoxes) {
  clearAlignmentGuides();
  
  if (!movingBox) return;
  
  // 이동 중인 박스의 실제 캔버스 내부 좌표 사용
  const movingLocId = parseInt(movingBox.getAttribute('data-id'));
  const movingLoc = locations.find(l => l.id === movingLocId);
  if (!movingLoc) return;
  
  const movingLeft = movingLoc.x;
  const movingTop = movingLoc.y;
  const movingRight = movingLeft + (movingLoc.width || 60);
  const movingBottom = movingTop + (movingLoc.height || 20);
  const movingCenterX = movingLeft + (movingLoc.width || 60) / 2;
  const movingCenterY = movingTop + (movingLoc.height || 20) / 2;
  
  const threshold = 5; // 정렬 감지 임계값
  
  allBoxes.forEach(box => {
    if (box === movingBox || !box.classList.contains('location-box')) return;
    
    // 다른 박스의 실제 캔버스 내부 좌표 사용
    const locId = parseInt(box.getAttribute('data-id'));
    const loc = locations.find(l => l.id === locId);
    if (!loc) return;
    
    const left = loc.x;
    const top = loc.y;
    const right = left + (loc.width || 60);
    const bottom = top + (loc.height || 20);
    const centerX = left + (loc.width || 60) / 2;
    const centerY = top + (loc.height || 20) / 2;
    
    // 수평 정렬 체크
    if (Math.abs(movingTop - top) < threshold) {
      createGuide('horizontal', top);
    }
    if (Math.abs(movingBottom - bottom) < threshold) {
      createGuide('horizontal', bottom);
    }
    if (Math.abs(movingCenterY - centerY) < threshold) {
      createGuide('horizontal', centerY);
    }
    
    // 수직 정렬 체크
    if (Math.abs(movingLeft - left) < threshold) {
      createGuide('vertical', left);
    }
    if (Math.abs(movingRight - right) < threshold) {
      createGuide('vertical', right);
    }
    if (Math.abs(movingCenterX - centerX) < threshold) {
      createGuide('vertical', centerX);
    }
  });
}

function createGuide(type, position) {
  const guide = document.createElement('div');
  guide.className = `alignment-guide ${type}`;
  
  if (type === 'horizontal') {
    guide.style.top = position + 'px';
    guide.style.left = '0px';
  } else {
    guide.style.left = position + 'px';
    guide.style.top = '0px';
  }
  
  document.getElementById('canvas').appendChild(guide);
  alignmentGuides.push(guide);
}

function clearAlignmentGuides() {
  alignmentGuides.forEach(guide => guide.remove());
  alignmentGuides = [];
}

// ==================== 바운딩 박스 ====================
function updateBoundingBox() {
  if (selectedLocations.length < 2) {
    if (boundingBox) {
      boundingBox.remove();
      boundingBox = null;
    }
    return;
  }
  
  const canvas = document.getElementById('canvas');
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  selectedLocations.forEach(loc => {
    minX = Math.min(minX, loc.x || 0);
    minY = Math.min(minY, loc.y || 0);
    maxX = Math.max(maxX, (loc.x || 0) + (loc.width || 60));
    maxY = Math.max(maxY, (loc.y || 0) + (loc.height || 20));
  });
  
  if (!boundingBox) {
    boundingBox = document.createElement('div');
    boundingBox.className = 'bounding-box';
    canvas.appendChild(boundingBox);
  }
  
  boundingBox.style.left = minX + 'px';
  boundingBox.style.top = minY + 'px';
  boundingBox.style.width = (maxX - minX) + 'px';
  boundingBox.style.height = (maxY - minY) + 'px';
}

// ==================== 검색 기능 ====================
function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    
    if (query.length === 0) {
      searchResults.classList.add('hidden');
      return;
    }
    
    const matches = locations.filter(loc => 
      loc.location_code && loc.location_code.toLowerCase().includes(query)
    );
    
    if (matches.length === 0) {
      searchResults.innerHTML = '<div class="text-sm text-gray-500 p-2">검색 결과 없음</div>';
      searchResults.classList.remove('hidden');
      return;
    }
    
    searchResults.innerHTML = matches.slice(0, 10).map(loc => `
      <div class="text-sm p-2 hover:bg-gray-100 cursor-pointer border-b" 
           data-id="${loc.id}">
        ${loc.location_code}
      </div>
    `).join('');
    
    searchResults.classList.remove('hidden');
    
    // 검색 결과 클릭 시 해당 위치로 이동
    searchResults.querySelectorAll('[data-id]').forEach(item => {
      item.addEventListener('click', () => {
        const locId = parseInt(item.getAttribute('data-id'));
        const loc = locations.find(l => l.id === locId);
        if (loc) {
          clearAllSelections();
          selectLocation(loc, document.querySelector(`.location-box[data-id="${loc.id}"]`));
          
          // 해당 위치로 스크롤
          const box = document.querySelector(`.location-box[data-id="${loc.id}"]`);
          if (box) {
            box.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          
          searchInput.value = '';
          searchResults.classList.add('hidden');
        }
      });
    });
  });
  
  // 검색 박스 외부 클릭 시 닫기
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.classList.add('hidden');
    }
  });
}

// ==================== 컨텍스트 메뉴 ====================
function setupContextMenu() {
  const contextMenu = document.getElementById('contextMenu');
  let contextMenuVisible = false;
  
  document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('#canvas') || e.target.closest('.location-box')) {
      e.preventDefault();
      
      contextMenu.style.display = 'block';
      contextMenu.style.left = e.clientX + 'px';
      contextMenu.style.top = e.clientY + 'px';
      contextMenuVisible = true;
    }
  });
  
  document.addEventListener('click', (e) => {
    if (contextMenuVisible && !contextMenu.contains(e.target)) {
      contextMenu.style.display = 'none';
      contextMenuVisible = false;
    }
  });
  
  contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.getAttribute('data-action');
      handleContextMenuAction(action);
      contextMenu.style.display = 'none';
      contextMenuVisible = false;
    });
  });
}

async function handleContextMenuAction(action) {
  switch (action) {
    case 'copy':
      copySelectedLocations();
      break;
    case 'paste':
      await pasteLocations();
      break;
    case 'duplicate':
      await duplicateSelectedLocations();
      break;
    case 'delete':
      if (selectedLocations.length > 0) {
        await deleteSelectedLocations();
      } else if (selectedLocation) {
        await deleteLocation();
      }
      break;
    case 'selectAll':
      clearAllSelections();
      locations.forEach(loc => {
        const box = document.querySelector(`.location-box[data-id="${loc.id}"]`);
        if (box) {
          selectedLocations.push(loc);
          box.classList.add('selected');
        }
      });
      updateBatchTools();
      break;
    case 'clearSelection':
      clearAllSelections();
      break;
  }
}

// ==================== 미니맵 ====================
function setupMinimap() {
  updateMinimap();
  
  const minimap = document.getElementById('minimap');
  minimap.addEventListener('click', (e) => {
    const rect = minimap.getBoundingClientRect();
    const x = (e.clientX - rect.left) / minimap.offsetWidth;
    const y = (e.clientY - rect.top) / minimap.offsetHeight;
    
    const canvas = document.getElementById('canvas');
    const canvasContainer = document.getElementById('canvasContainer');
    
    panOffset.x = -x * canvas.offsetWidth * zoomLevel + canvasContainer.offsetWidth / 2;
    panOffset.y = -y * canvas.offsetHeight * zoomLevel + canvasContainer.offsetHeight / 2;
    
    applyTransform();
    updateMinimap();
  });
}

function updateMinimap() {
  const minimap = document.getElementById('minimap');
  const viewport = document.getElementById('minimapViewport');
  const canvas = document.getElementById('canvas');
  const canvasContainer = document.getElementById('canvasContainer');
  
  if (!minimap || !viewport || !canvas || !canvasContainer) return;
  
  const canvasWidth = Math.max(canvas.offsetWidth, 1000);
  const canvasHeight = Math.max(canvas.offsetHeight, 800);
  const scaleX = minimap.offsetWidth / canvasWidth;
  const scaleY = minimap.offsetHeight / canvasHeight;
  
  // 뷰포트 위치 계산
  const viewportX = (-panOffset.x / zoomLevel) * scaleX;
  const viewportY = (-panOffset.y / zoomLevel) * scaleY;
  const viewportWidth = (canvasContainer.offsetWidth / zoomLevel) * scaleX;
  const viewportHeight = (canvasContainer.offsetHeight / zoomLevel) * scaleY;
  
  viewport.style.left = Math.max(0, Math.min(viewportX, minimap.offsetWidth - viewportWidth)) + 'px';
  viewport.style.top = Math.max(0, Math.min(viewportY, minimap.offsetHeight - viewportHeight)) + 'px';
  viewport.style.width = Math.min(viewportWidth, minimap.offsetWidth) + 'px';
  viewport.style.height = Math.min(viewportHeight, minimap.offsetHeight) + 'px';
  
  // 미니맵에 위치 박스 미리보기 그리기
  const existingPreview = minimap.querySelector('.minimap-preview');
  if (existingPreview) existingPreview.remove();
  
  const preview = document.createElement('div');
  preview.className = 'minimap-preview';
  preview.style.position = 'absolute';
  preview.style.top = '0';
  preview.style.left = '0';
  preview.style.width = '100%';
  preview.style.height = '100%';
  preview.style.pointerEvents = 'none';
  
  locations.forEach(loc => {
    const box = document.createElement('div');
    box.style.position = 'absolute';
    box.style.left = ((loc.x || 0) * scaleX) + 'px';
    box.style.top = ((loc.y || 0) * scaleY) + 'px';
    box.style.width = ((loc.width || 60) * scaleX) + 'px';
    box.style.height = ((loc.height || 20) * scaleY) + 'px';
    const isSelected = selectedLocations.some(sl => sl.id === loc.id) || selectedLocation?.id === loc.id;
    box.style.background = isSelected ? '#ef4444' : '#3b82f6';
    box.style.opacity = '0.5';
    preview.appendChild(box);
  });
  
  minimap.appendChild(preview);
}
