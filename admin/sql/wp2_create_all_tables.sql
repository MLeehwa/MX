-- ============================================
-- WP2 로케이션용 테이블 생성 스크립트
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- ============================================
-- 1. wp2_locations 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS wp2_locations (
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
CREATE INDEX IF NOT EXISTS idx_wp2_locations_code ON wp2_locations(location_code);
CREATE INDEX IF NOT EXISTS idx_wp2_locations_status ON wp2_locations(status);

-- updated_at 자동 업데이트 트리거 함수 (이미 존재하면 재사용)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_wp2_locations_updated_at ON wp2_locations;
CREATE TRIGGER update_wp2_locations_updated_at
    BEFORE UPDATE ON wp2_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. wp2_delivery_locations 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS wp2_delivery_locations (
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
ALTER TABLE wp2_delivery_locations ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (이미 생성된 경우)
DROP POLICY IF EXISTS "Anyone can read wp2_delivery_locations" ON wp2_delivery_locations;
DROP POLICY IF EXISTS "Anyone can insert wp2_delivery_locations" ON wp2_delivery_locations;
DROP POLICY IF EXISTS "Anyone can update wp2_delivery_locations" ON wp2_delivery_locations;
DROP POLICY IF EXISTS "Anyone can delete wp2_delivery_locations" ON wp2_delivery_locations;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Anyone can read wp2_delivery_locations"
  ON wp2_delivery_locations
  FOR SELECT
  USING (true);

-- 모든 사용자가 삽입 가능
CREATE POLICY "Anyone can insert wp2_delivery_locations"
  ON wp2_delivery_locations
  FOR INSERT
  WITH CHECK (true);

-- 모든 사용자가 업데이트 가능
CREATE POLICY "Anyone can update wp2_delivery_locations"
  ON wp2_delivery_locations
  FOR UPDATE
  USING (true);

-- 모든 사용자가 삭제 가능
CREATE POLICY "Anyone can delete wp2_delivery_locations"
  ON wp2_delivery_locations
  FOR DELETE
  USING (true);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_delivery_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wp2_delivery_locations_updated_at
  BEFORE UPDATE ON wp2_delivery_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_locations_updated_at();

-- ============================================
-- 3. shipping_instruction에 delivery_location_id 컬럼 추가
-- (이미 추가되어 있으면 무시됨)
-- ============================================
ALTER TABLE shipping_instruction 
ADD COLUMN IF NOT EXISTS delivery_location_id BIGINT REFERENCES wp2_delivery_locations(id);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_shipping_instruction_delivery_location_id 
ON shipping_instruction(delivery_location_id);

-- ============================================
-- 완료 메시지
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'WP2 테이블 생성이 완료되었습니다!';
  RAISE NOTICE '생성된 테이블:';
  RAISE NOTICE '  - wp2_locations';
  RAISE NOTICE '  - wp2_delivery_locations';
  RAISE NOTICE '  - shipping_instruction.delivery_location_id (컬럼 추가)';
END $$;
