-- mx_daily_report_remarks 테이블 생성
-- 일일 리포트의 특이사항을 저장하는 테이블

CREATE TABLE IF NOT EXISTS mx_daily_report_remarks (
  id BIGSERIAL PRIMARY KEY,
  report_date DATE NOT NULL UNIQUE,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (날짜 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_mx_daily_report_remarks_report_date 
ON mx_daily_report_remarks(report_date);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_mx_daily_report_remarks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_mx_daily_report_remarks_updated_at ON mx_daily_report_remarks;
CREATE TRIGGER trigger_update_mx_daily_report_remarks_updated_at
  BEFORE UPDATE ON mx_daily_report_remarks
  FOR EACH ROW
  EXECUTE FUNCTION update_mx_daily_report_remarks_updated_at();

-- RLS (Row Level Security) 정책 설정
ALTER TABLE mx_daily_report_remarks ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Anyone can read mx_daily_report_remarks" ON mx_daily_report_remarks;
DROP POLICY IF EXISTS "Anyone can insert mx_daily_report_remarks" ON mx_daily_report_remarks;
DROP POLICY IF EXISTS "Anyone can update mx_daily_report_remarks" ON mx_daily_report_remarks;
DROP POLICY IF EXISTS "Anyone can delete mx_daily_report_remarks" ON mx_daily_report_remarks;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Anyone can read mx_daily_report_remarks"
  ON mx_daily_report_remarks
  FOR SELECT
  USING (true);

-- 모든 사용자가 삽입 가능
CREATE POLICY "Anyone can insert mx_daily_report_remarks"
  ON mx_daily_report_remarks
  FOR INSERT
  WITH CHECK (true);

-- 모든 사용자가 수정 가능
CREATE POLICY "Anyone can update mx_daily_report_remarks"
  ON mx_daily_report_remarks
  FOR UPDATE
  USING (true);

-- 모든 사용자가 삭제 가능
CREATE POLICY "Anyone can delete mx_daily_report_remarks"
  ON mx_daily_report_remarks
  FOR DELETE
  USING (true);

COMMENT ON TABLE mx_daily_report_remarks IS '일일 리포트 특이사항 저장 테이블';
COMMENT ON COLUMN mx_daily_report_remarks.report_date IS '보고서 날짜';
COMMENT ON COLUMN mx_daily_report_remarks.remarks IS '특이사항 내용';
