-- flagged_containers 테이블에 highlight_color 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

-- highlight_color 컬럼 추가 (기본값: 빨간색 #FF0000)
ALTER TABLE flagged_containers 
ADD COLUMN IF NOT EXISTS highlight_color TEXT DEFAULT '#FF0000';

-- 기존 데이터에 기본 색상 설정 (NULL인 경우)
UPDATE flagged_containers 
SET highlight_color = '#FF0000' 
WHERE highlight_color IS NULL;
