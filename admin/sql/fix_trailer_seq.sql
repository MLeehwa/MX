-- ============================================
-- trailer_seq 자동 생성 트리거 수정
-- ============================================
-- 문제: trailer_seq가 NULL로 저장되어 "T-0NULL"이 생성됨
-- 해결: 트리거를 통해 trailer 타입일 때 자동으로 시퀀스 번호 생성
-- ============================================

-- 기존 트리거 삭제
DROP TRIGGER IF EXISTS auto_generate_trailer_seq ON mx_receiving_plan;

-- trailer_seq 자동 생성 함수
CREATE OR REPLACE FUNCTION generate_trailer_seq()
RETURNS TRIGGER AS $$
BEGIN
  -- trailer 타입이고 trailer_seq가 NULL이면 자동 생성
  IF NEW.type = 'trailer' AND (NEW.trailer_seq IS NULL OR NEW.trailer_seq = 0) THEN
    -- 기존 최대 trailer_seq 값 찾기
    SELECT COALESCE(MAX(trailer_seq), 0) + 1
    INTO NEW.trailer_seq
    FROM mx_receiving_plan
    WHERE type = 'trailer' AND trailer_seq IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER auto_generate_trailer_seq
  BEFORE INSERT ON mx_receiving_plan
  FOR EACH ROW
  EXECUTE FUNCTION generate_trailer_seq();

-- 기존 NULL 값 수정 (이미 생성된 데이터가 있다면)
UPDATE mx_receiving_plan
SET trailer_seq = subquery.new_seq
FROM (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as new_seq
  FROM mx_receiving_plan
  WHERE type = 'trailer' AND (trailer_seq IS NULL OR trailer_seq = 0)
) AS subquery
WHERE mx_receiving_plan.id = subquery.id;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE 'trailer_seq 자동 생성 트리거가 설정되었습니다!';
  RAISE NOTICE '이제 trailer 타입의 입고 계획을 생성하면 trailer_seq가 자동으로 생성됩니다.';
END $$;
