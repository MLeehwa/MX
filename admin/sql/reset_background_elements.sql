-- mx_background_elements 테이블 초기화 (배경 요소 모두 삭제)
-- 주의: 이 SQL을 실행하면 모든 배경 요소가 삭제됩니다.

UPDATE mx_background_elements 
SET elements_data = '[]'::jsonb
WHERE id = 1;

-- 또는 완전히 초기화하려면:
-- DELETE FROM mx_background_elements WHERE id = 1;
-- INSERT INTO mx_background_elements (id, elements_data) VALUES (1, '[]'::jsonb);
