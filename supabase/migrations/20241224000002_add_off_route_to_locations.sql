-- Locations 테이블에 경로 이탈 정보 컬럼 추가
-- 사용자가 GPX 경로에서 벗어났는지 여부를 저장

ALTER TABLE locations ADD COLUMN IF NOT EXISTS off_route BOOLEAN NOT NULL DEFAULT false;

-- 기존 데이터는 모두 경로 내에 있는 것으로 처리
UPDATE locations SET off_route = false WHERE off_route IS NULL;

