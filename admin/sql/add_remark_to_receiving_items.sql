-- mx_receiving_items 테이블에 remark 필드 추가
ALTER TABLE mx_receiving_items 
ADD COLUMN IF NOT EXISTS remark TEXT;
