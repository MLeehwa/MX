-- shipping_instruction 테이블에 delivery_location_id 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

-- delivery_location_id 컬럼 추가 (외래키)
ALTER TABLE shipping_instruction 
ADD COLUMN IF NOT EXISTS delivery_location_id BIGINT REFERENCES wp1_delivery_locations(id);

-- 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_shipping_instruction_delivery_location_id 
ON shipping_instruction(delivery_location_id);
