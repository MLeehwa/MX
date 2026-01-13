-- wp1_delivery_locations 테이블 생성
-- Supabase SQL Editor에서 실행하세요

CREATE TABLE IF NOT EXISTS wp1_delivery_locations (
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
ALTER TABLE wp1_delivery_locations ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (이미 생성된 경우)
DROP POLICY IF EXISTS "Anyone can read wp1_delivery_locations" ON wp1_delivery_locations;
DROP POLICY IF EXISTS "Authenticated users can insert wp1_delivery_locations" ON wp1_delivery_locations;
DROP POLICY IF EXISTS "Anyone can insert wp1_delivery_locations" ON wp1_delivery_locations;
DROP POLICY IF EXISTS "Authenticated users can update wp1_delivery_locations" ON wp1_delivery_locations;
DROP POLICY IF EXISTS "Anyone can update wp1_delivery_locations" ON wp1_delivery_locations;
DROP POLICY IF EXISTS "Authenticated users can delete wp1_delivery_locations" ON wp1_delivery_locations;
DROP POLICY IF EXISTS "Anyone can delete wp1_delivery_locations" ON wp1_delivery_locations;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Anyone can read wp1_delivery_locations"
  ON wp1_delivery_locations
  FOR SELECT
  USING (true);

-- 모든 사용자가 삽입 가능 (필요시 auth.uid() IS NOT NULL로 변경)
CREATE POLICY "Anyone can insert wp1_delivery_locations"
  ON wp1_delivery_locations
  FOR INSERT
  WITH CHECK (true);

-- 모든 사용자가 업데이트 가능 (필요시 auth.uid() IS NOT NULL로 변경)
CREATE POLICY "Anyone can update wp1_delivery_locations"
  ON wp1_delivery_locations
  FOR UPDATE
  USING (true);

-- 모든 사용자가 삭제 가능 (필요시 auth.uid() IS NOT NULL로 변경)
CREATE POLICY "Anyone can delete wp1_delivery_locations"
  ON wp1_delivery_locations
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

CREATE TRIGGER update_wp1_delivery_locations_updated_at
  BEFORE UPDATE ON wp1_delivery_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_locations_updated_at();
