-- Candidates 테이블 생성
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  link TEXT,
  price TEXT,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_candidates_lat_lon ON candidates(lat, lon);

-- RLS 활성화
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 사용자가 조회 가능
DROP POLICY IF EXISTS "Anyone can view candidates" ON candidates;
CREATE POLICY "Anyone can view candidates"
  ON candidates FOR SELECT
  USING (true);

-- RLS 정책: 인증된 사용자가 추가 가능
DROP POLICY IF EXISTS "Authenticated users can insert candidates" ON candidates;
CREATE POLICY "Authenticated users can insert candidates"
  ON candidates FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS 정책: 인증된 사용자가 수정 가능
DROP POLICY IF EXISTS "Authenticated users can update candidates" ON candidates;
CREATE POLICY "Authenticated users can update candidates"
  ON candidates FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- RLS 정책: 인증된 사용자가 삭제 가능
DROP POLICY IF EXISTS "Authenticated users can delete candidates" ON candidates;
CREATE POLICY "Authenticated users can delete candidates"
  ON candidates FOR DELETE
  USING (auth.uid() IS NOT NULL);

