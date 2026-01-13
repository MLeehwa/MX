# MX 시스템 변경 가이드

MX 시스템은 **Container 단위**로만 관리하는 시스템입니다. part_no와 quantity가 없습니다.

## 📋 주요 변경사항

### 1. 테이블 구조 변경

#### mx_receiving_items (기존 receiving_items와 비교)
**제거된 필드:**
- `part_no` ❌
- `quantity` ❌

**유지되는 필드:**
- `plan_id`
- `container_no` ✅
- `location_code` ✅
- `label_id` ✅
- `receiving_place` ✅

#### mx_shipping_instruction (기존 shipping_instruction과 비교)
**제거된 필드:**
- `part_no` ❌
- `qty` ❌
- `part_quantities` ❌
- `label_id` ❌

**유지되는 필드:**
- `container_no` ✅
- `location_code` ✅
- `shipping_date` ✅
- `status` ✅
- `barcode` ✅
- `delivery_location_id` ✅

#### mx_shipping_instruction_items (기존 shipping_instruction_items와 비교)
**제거된 필드:**
- `label_id` ❌
- `qty` ❌

**유지되는 필드:**
- `shipping_instruction_id` ✅
- `container_no` ✅ (새로 추가)
- `shipped_at` ✅

## 🔧 JavaScript 파일 수정 필요

### 1. 입고 관련 파일 (`admin/js/receiving.js`)

**변경 전:**
```javascript
items.push({
  plan_id: planId,
  part_no: parts[i],  // ❌ 제거
  quantity: qtys[i],   // ❌ 제거
  location_code: location,
  label_id: crypto.randomUUID(),
  container_no: container,
  receiving_place: receivingPlace,
});
```

**변경 후:**
```javascript
items.push({
  plan_id: planId,
  container_no: container,
  location_code: location,
  label_id: crypto.randomUUID(),
  receiving_place: receivingPlace,
});
```

**입고 계획 폼:**
- part_no, quantity 입력 필드 제거
- container_no만 입력

### 2. 출고 관련 파일 (`admin/js/location_view.js`)

**변경 전:**
```javascript
const { data, error } = await supabase.from('shipping_instruction').insert({
  location_code: loc,
  part_no: info.part_no,        // ❌ 제거
  qty: totalQty,                // ❌ 제거
  shipping_date: shippingDate,
  status: 'pending',
  barcode: crypto.randomUUID(),
  container_no: info.container_id,
  label_id: null,               // ❌ 제거
  part_quantities: partQuantitiesJson,  // ❌ 제거
  delivery_location_id: deliveryLocationId
});
```

**변경 후:**
```javascript
const { data, error } = await supabase.from('mx_shipping_instruction').insert({
  location_code: loc,
  container_no: info.container_id,  // ✅ Container만
  shipping_date: shippingDate,
  status: 'pending',
  barcode: crypto.randomUUID(),
  delivery_location_id: deliveryLocationId
});
```

**shipping_instruction_items:**
```javascript
// 변경 전
itemsToInsert = [{
  shipping_instruction_id: shippingInstructionId,
  label_id: item.label_id,  // ❌ 제거
  qty: quantity            // ❌ 제거
}];

// 변경 후
itemsToInsert = [{
  shipping_instruction_id: shippingInstructionId,
  container_no: containerNo  // ✅ Container만
}];
```

### 3. 위치 보기 (`admin/js/location_view.js`)

**변경 전:**
```javascript
const { data: items } = await supabase
  .from('receiving_items')
  .select('part_no,quantity,location_code,plan_id,label_id,container_no,receiving_plan:plan_id(container_no,receive_date)');
```

**변경 후:**
```javascript
const { data: items } = await supabase
  .from('mx_receiving_items')
  .select('location_code,plan_id,label_id,container_no,receiving_plan:plan_id(container_no,receive_date)');
  // part_no, quantity 제거
```

### 4. 보고서 (`admin/js/report.js`)

**변경 전:**
- part_no별 집계
- quantity 합계 계산

**변경 후:**
- container_no별 집계
- Container 개수만 표시

### 5. 출하 확정 (`admin/js/shipping_confirmation_admin.js`)

**변경 전:**
- label_id, qty 기반으로 receiving_items 업데이트

**변경 후:**
- container_no 기반으로 receiving_items의 location_code를 null로 설정

## 📝 체크리스트

### 테이블 생성
- [ ] `mx_create_all_tables.sql` 실행 완료

### JavaScript 파일 수정
- [ ] `admin/js/receiving.js` - part_no, quantity 제거
- [ ] `admin/js/location_view.js` - 출고 로직 변경
- [ ] `admin/js/report.js` - Container 단위 집계로 변경
- [ ] `admin/js/shipping_confirmation_admin.js` - Container 기반 확정
- [ ] `admin/js/location_master.js` - part_no, quantity 표시 제거
- [ ] `admin/js/daily_report.js` - Container 단위로 변경

### HTML 파일 수정
- [ ] `admin/sections/receiving_plan.html` - part_no, quantity 입력 필드 제거
- [ ] `admin/sections/location_view.html` - part_no, quantity 표시 제거
- [ ] 출하지시서 출력 - Container 목록만 표시

## 🎯 출하지시서 표시 방식

**변경 전:**
```
Part No: ABC123
Quantity: 100
```

**변경 후:**
```
Containers:
- TRHU7878105
- TRHU7878106
- TRHU7878107
```

## ⚠️ 주의사항

1. **데이터 마이그레이션**: 기존 WP1 데이터는 마이그레이션 불가 (구조가 다름)
2. **새로 시작**: MX 시스템은 처음부터 새로 데이터 입력
3. **테스트**: 각 기능별로 Container 단위로 정상 작동하는지 확인
