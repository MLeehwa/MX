-- ============================================
-- mx_locations 테이블에 font_size 컬럼 추가
-- ============================================
-- 이 스크립트는 mx_locations 테이블에 font_size 컬럼을 추가합니다.
-- 위치 라벨의 글씨 크기를 저장하기 위한 컬럼입니다.
-- ============================================

-- font_size 컬럼 추가 (기본값: 13)
ALTER TABLE mx_locations
ADD COLUMN IF NOT EXISTS font_size INTEGER DEFAULT 13;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'mx_locations 테이블에 font_size 컬럼이 추가되었습니다.';
  RAISE NOTICE '기본값: 13px';
  RAISE NOTICE '========================================';
END $$;
