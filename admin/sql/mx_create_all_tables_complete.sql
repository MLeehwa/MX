-- ============================================
-- MX 시스템 전체 테이블 생성 스크립트 (Container 단위)
-- Supabase SQL Editor에서 실행하세요
-- ============================================
-- 특징: 
--   - part_no, quantity 없음. Container 단위로만 관리
--   - mx_receiving_items에 remark 필드 포함 (제품 정보 선택사항)
--   - 모든 테이블은 mx_ 접두사 사용
--   - 기존 테이블이 있어도 안전하게 실행 가능 (IF NOT EXISTS, ADD COLUMN IF NOT EXISTS 사용)
-- ============================================

-- ============================================
-- 1. mx_locations 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS mx_locations (
  id BIGSERIAL PRIMARY KEY,
  location_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'disabled')),
  x INTEGER,
  y INTEGER,
  width INTEGER,
  height INTEGER,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_mx_locations_code ON mx_locations(location_code);
CREATE INDEX IF NOT EXISTS idx_mx_locations_status ON mx_locations(status);

-- ============================================
-- 2. mx_background_elements 테이블 생성
-- 시각적 편집기의 배경 요소를 저장하는 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS mx_background_elements (
  id INTEGER PRIMARY KEY DEFAULT 1,
  elements_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_mx_background_elements_updated ON mx_background_elements(updated_at);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_mx_background_elements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mx_background_elements_updated_at
  BEFORE UPDATE ON mx_background_elements
  FOR EACH ROW
  EXECUTE FUNCTION update_mx_background_elements_updated_at();

-- 초기 데이터 삽입 (하나의 행만 유지)
INSERT INTO mx_background_elements (id, elements_data)
VALUES (1, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. mx_delivery_locations 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS mx_delivery_locations (
  id BIGSERIAL PRIMARY KEY,
  location_name TEXT NOT NULL UNIQUE,
  address TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE mx_delivery_locations ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Anyone can read mx_delivery_locations" ON mx_delivery_locations;
DROP POLICY IF EXISTS "Anyone can insert mx_delivery_locations" ON mx_delivery_locations;
DROP POLICY IF EXISTS "Anyone can update mx_delivery_locations" ON mx_delivery_locations;
DROP POLICY IF EXISTS "Anyone can delete mx_delivery_locations" ON mx_delivery_locations;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Anyone can read mx_delivery_locations"
  ON mx_delivery_locations
  FOR SELECT
  USING (true);

-- 모든 사용자가 삽입 가능
CREATE POLICY "Anyone can insert mx_delivery_locations"
  ON mx_delivery_locations
  FOR INSERT
  WITH CHECK (true);

-- 모든 사용자가 업데이트 가능
CREATE POLICY "Anyone can update mx_delivery_locations"
  ON mx_delivery_locations
  FOR UPDATE
  USING (true);

-- 모든 사용자가 삭제 가능
CREATE POLICY "Anyone can delete mx_delivery_locations"
  ON mx_delivery_locations
  FOR DELETE
  USING (true);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_mx_delivery_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mx_delivery_locations_updated_at
  BEFORE UPDATE ON mx_delivery_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_mx_delivery_locations_updated_at();

-- ============================================
-- 4. mx_receiving_plan 테이블 생성 (Container 단위)
-- ============================================
CREATE TABLE IF NOT EXISTS mx_receiving_plan (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('container', 'trailer')),
  container_no TEXT,
  receive_date DATE NOT NULL,
  trailer_seq INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_mx_receiving_plan_date ON mx_receiving_plan(receive_date);
CREATE INDEX IF NOT EXISTS idx_mx_receiving_plan_container ON mx_receiving_plan(container_no);

-- ============================================
-- 5. mx_receiving_items 테이블 생성 (Container 단위 - part_no, quantity 없음)
-- remark 필드 포함 (제품 정보 선택사항)
-- ============================================
CREATE TABLE IF NOT EXISTS mx_receiving_items (
  id BIGSERIAL PRIMARY KEY,
  plan_id BIGINT NOT NULL REFERENCES mx_receiving_plan(id) ON DELETE CASCADE,
  container_no TEXT NOT NULL,
  location_code TEXT,
  label_id TEXT UNIQUE,
  receiving_place TEXT,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기존 테이블에 remark 필드 추가 (이미 생성된 테이블용)
ALTER TABLE mx_receiving_items 
ADD COLUMN IF NOT EXISTS remark TEXT;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_mx_receiving_items_plan ON mx_receiving_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_mx_receiving_items_container ON mx_receiving_items(container_no);
CREATE INDEX IF NOT EXISTS idx_mx_receiving_items_location ON mx_receiving_items(location_code);
CREATE INDEX IF NOT EXISTS idx_mx_receiving_items_label ON mx_receiving_items(label_id);

-- ============================================
-- 6. mx_receiving_log 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS mx_receiving_log (
  id BIGSERIAL PRIMARY KEY,
  label_id TEXT NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_mx_receiving_log_label ON mx_receiving_log(label_id);
CREATE INDEX IF NOT EXISTS idx_mx_receiving_log_date ON mx_receiving_log(received_at);

-- ============================================
-- 7. mx_shipping_instruction 테이블 생성 (Container 단위 - part_no, qty 없음)
-- delivery_location_id 포함
-- ============================================
CREATE TABLE IF NOT EXISTS mx_shipping_instruction (
  id BIGSERIAL PRIMARY KEY,
  container_no TEXT NOT NULL,
  location_code TEXT,
  shipping_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'shipped')),
  barcode TEXT,
  delivery_location_id BIGINT REFERENCES mx_delivery_locations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_mx_shipping_instruction_container ON mx_shipping_instruction(container_no);
CREATE INDEX IF NOT EXISTS idx_mx_shipping_instruction_status ON mx_shipping_instruction(status);
CREATE INDEX IF NOT EXISTS idx_mx_shipping_instruction_date ON mx_shipping_instruction(shipping_date);
CREATE INDEX IF NOT EXISTS idx_mx_shipping_instruction_delivery ON mx_shipping_instruction(delivery_location_id);

-- ============================================
-- 8. mx_shipping_instruction_items 테이블 생성 (Container 단위 - label_id, qty 없음)
-- ============================================
CREATE TABLE IF NOT EXISTS mx_shipping_instruction_items (
  id BIGSERIAL PRIMARY KEY,
  shipping_instruction_id BIGINT NOT NULL REFERENCES mx_shipping_instruction(id) ON DELETE CASCADE,
  container_no TEXT NOT NULL,
  shipped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_mx_shipping_items_instruction ON mx_shipping_instruction_items(shipping_instruction_id);
CREATE INDEX IF NOT EXISTS idx_mx_shipping_items_container ON mx_shipping_instruction_items(container_no);

-- ============================================
-- 9. mx_flagged_containers 테이블 생성 (highlight_color 포함)
-- ============================================
CREATE TABLE IF NOT EXISTS mx_flagged_containers (
  id BIGSERIAL PRIMARY KEY,
  container_no TEXT NOT NULL UNIQUE,
  reason TEXT,
  highlight_color TEXT DEFAULT '#FF0000',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_mx_flagged_containers_no ON mx_flagged_containers(container_no);

-- ============================================
-- 공통 updated_at 자동 업데이트 트리거 함수
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- 각 테이블에 updated_at 트리거 생성
-- ============================================

-- mx_locations
DROP TRIGGER IF EXISTS update_mx_locations_updated_at ON mx_locations;
CREATE TRIGGER update_mx_locations_updated_at
    BEFORE UPDATE ON mx_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- mx_receiving_plan
DROP TRIGGER IF EXISTS update_mx_receiving_plan_updated_at ON mx_receiving_plan;
CREATE TRIGGER update_mx_receiving_plan_updated_at
    BEFORE UPDATE ON mx_receiving_plan
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- mx_receiving_items
DROP TRIGGER IF EXISTS update_mx_receiving_items_updated_at ON mx_receiving_items;
CREATE TRIGGER update_mx_receiving_items_updated_at
    BEFORE UPDATE ON mx_receiving_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- mx_shipping_instruction
DROP TRIGGER IF EXISTS update_mx_shipping_instruction_updated_at ON mx_shipping_instruction;
CREATE TRIGGER update_mx_shipping_instruction_updated_at
    BEFORE UPDATE ON mx_shipping_instruction
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- mx_flagged_containers
DROP TRIGGER IF EXISTS update_mx_flagged_containers_updated_at ON mx_flagged_containers;
CREATE TRIGGER update_mx_flagged_containers_updated_at
    BEFORE UPDATE ON mx_flagged_containers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 추가 컬럼 (기존 테이블 업데이트)
-- ============================================
-- mx_receiving_items에 remark 컬럼 추가 (이미 있으면 무시)
ALTER TABLE mx_receiving_items
ADD COLUMN IF NOT EXISTS remark TEXT;

-- mx_locations에 font_size 컬럼 추가 (위치 라벨 글씨 크기)
ALTER TABLE mx_locations
ADD COLUMN IF NOT EXISTS font_size INTEGER DEFAULT 13;

-- ============================================
-- 완료 메시지
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MX 시스템 테이블 생성이 완료되었습니다!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '생성된 테이블 (Container 단위):';
  RAISE NOTICE '  1. mx_locations - 위치 정보';
  RAISE NOTICE '  2. mx_background_elements - 배경 요소 (시각적 편집기)';
  RAISE NOTICE '  3. mx_delivery_locations - 배송지 정보';
  RAISE NOTICE '  4. mx_receiving_plan - 입고 계획';
  RAISE NOTICE '  5. mx_receiving_items - 입고 항목 (part_no, quantity 없음, remark 포함)';
  RAISE NOTICE '  6. mx_receiving_log - 입고 로그';
  RAISE NOTICE '  7. mx_shipping_instruction - 출하 지시서 (part_no, qty 없음, delivery_location_id 포함)';
  RAISE NOTICE '  8. mx_shipping_instruction_items - 출하 지시서 항목 (label_id, qty 없음)';
  RAISE NOTICE '  9. mx_flagged_containers - 문제 컨테이너 (highlight_color 포함)';
  RAISE NOTICE '';
  RAISE NOTICE '주의사항:';
  RAISE NOTICE '  - 모든 테이블은 Container 단위로만 관리됩니다';
  RAISE NOTICE '  - part_no, quantity 필드는 제거되었습니다';
  RAISE NOTICE '  - remark 필드는 mx_receiving_items에 포함되어 있습니다 (선택사항)';
  RAISE NOTICE '  - delivery_location_id는 mx_shipping_instruction에 포함되어 있습니다';
  RAISE NOTICE '  - highlight_color는 mx_flagged_containers에 포함되어 있습니다';
  RAISE NOTICE '  - font_size는 mx_locations에 포함되어 있습니다 (위치 라벨 글씨 크기, 기본값: 13)';
  RAISE NOTICE '========================================';
END $$;
