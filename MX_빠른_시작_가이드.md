# 🚀 MX 시스템 빠른 시작 가이드

## Container 단위 시스템 설정

### 1️⃣ PowerShell 스크립트 실행

```powershell
cd c:\Users\LHA-M\WP1
.\MX_마이그레이션.ps1
```

이 스크립트가 자동으로:
- ✅ WP1 폴더를 MX로 복사
- ✅ 모든 테이블명을 `mx_` 접두사로 변경
- ✅ JavaScript 파일에서 테이블 참조 변경

### 2️⃣ Supabase에서 테이블 생성

1. Supabase 대시보드 → SQL Editor 열기
2. `admin/sql/mx_create_all_tables.sql` 파일 내용 복사
3. SQL Editor에 붙여넣고 **RUN** 클릭

**생성되는 테이블:**
- `mx_locations`
- `mx_delivery_locations`
- `mx_receiving_plan`
- `mx_receiving_items` (part_no, quantity 없음)
- `mx_receiving_log`
- `mx_shipping_instruction` (part_no, qty 없음)
- `mx_shipping_instruction_items` (label_id, qty 없음)
- `mx_flagged_containers`

### 3️⃣ JavaScript 파일 수정 (Container 단위로 변경)

**⚠️ 중요**: 마이그레이션 스크립트는 테이블명만 변경합니다. 
**part_no, quantity 로직은 수동으로 제거해야 합니다.**

#### 주요 수정 파일:

1. **`admin/js/receiving.js`**
   - 입고 계획 폼에서 part_no, quantity 입력 제거
   - receiving_items 저장 시 part_no, quantity 필드 제거

2. **`admin/js/location_view.js`**
   - 출하지시서 생성 시 part_no, qty 제거
   - Container 목록만 표시

3. **`admin/js/report.js`**
   - Container 단위 집계로 변경

4. **`admin/js/shipping_confirmation_admin.js`**
   - Container 기반 확정 로직으로 변경

5. **HTML 파일**
   - `admin/sections/receiving_plan.html`: part_no, quantity 입력 필드 제거
   - 출하지시서 출력: Container 목록만 표시

### 4️⃣ 테스트

1. `c:\Users\LHA-M\MX\index.html` 열기
2. 로그인 (비밀번호: 12345)
3. **입고 계획** - Container만 입력하여 테스트
4. **위치 보기** - Container 단위로 표시 확인
5. **출하지시서** - Container 목록만 표시 확인

## ✅ 완료!

이제 MX 시스템은 Container 단위로만 작동합니다.

## 📝 주요 차이점

| 항목 | WP1 시스템 | MX 시스템 |
|------|-----------|----------|
| 관리 단위 | Part + Quantity | Container만 |
| 입고 | part_no, quantity 입력 | container_no만 |
| 출고 | part_no, qty 표시 | container_no 목록만 |
| 재고 | 수량 합계 | Container 개수 |

## 🔧 문제 해결

**오류: "Could not find the 'mx_receiving_items' column"**
→ Supabase에서 테이블이 생성되지 않았습니다. 2단계를 다시 확인하세요.

**오류: "part_no is required"**
→ JavaScript 파일에서 part_no 관련 코드를 제거하지 않았습니다. `MX_시스템_변경_가이드.md` 참조하세요.

## 📚 상세 가이드

더 자세한 내용은 `MX_시스템_변경_가이드.md` 파일을 참조하세요.
