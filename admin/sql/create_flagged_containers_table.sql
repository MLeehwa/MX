-- flagged_containers 테이블 생성 스크립트
-- Supabase SQL Editor에서 실행하세요
-- 문제가 되는 컨테이너/트레일러 번호를 등록하는 테이블

-- 기존 테이블이 있으면 삭제 (주의: 데이터가 모두 삭제됩니다)
-- DROP TABLE IF EXISTS flagged_containers CASCADE;

-- flagged_containers 테이블 생성
CREATE TABLE IF NOT EXISTS flagged_containers (
  id BIGSERIAL PRIMARY KEY,
  container_no TEXT NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_flagged_containers_no ON flagged_containers(container_no);

-- updated_at 자동 업데이트 트리거 함수 (이미 존재하는 경우 재사용)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_flagged_containers_updated_at ON flagged_containers;
CREATE TRIGGER update_flagged_containers_updated_at
    BEFORE UPDATE ON flagged_containers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 정책 설정 (필요한 경우)
-- ALTER TABLE flagged_containers ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능하도록 설정 (필요에 따라 수정)
-- CREATE POLICY "Allow public read access" ON flagged_containers FOR SELECT USING (true);

-- 인증된 사용자만 쓰기 가능하도록 설정 (필요에 따라 수정)
-- CREATE POLICY "Allow authenticated insert" ON flagged_containers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Allow authenticated update" ON flagged_containers FOR UPDATE USING (auth.role() = 'authenticated');
-- CREATE POLICY "Allow authenticated delete" ON flagged_containers FOR DELETE USING (auth.role() = 'authenticated');
