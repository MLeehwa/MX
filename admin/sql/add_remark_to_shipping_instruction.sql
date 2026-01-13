-- mx_shipping_instruction 테이블에 remark 컬럼 추가
-- 입고 계획의 제품 정보(remark)를 출하 지시서에도 저장하기 위함

ALTER TABLE mx_shipping_instruction
ADD COLUMN IF NOT EXISTS remark TEXT;

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_mx_shipping_instruction_remark ON mx_shipping_instruction(remark);

DO $$
BEGIN
  RAISE NOTICE 'mx_shipping_instruction 테이블에 remark 컬럼이 추가되었습니다.';
END $$;
