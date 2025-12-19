-- Trail Live 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

-- Users 테이블
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sessions 테이블
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Session Members 테이블
CREATE TABLE IF NOT EXISTS session_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- Locations 테이블
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- Routes 테이블
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  geojson JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_sessions_invite_code ON sessions(invite_code);
CREATE INDEX IF NOT EXISTS idx_session_members_session_id ON session_members(session_id);
CREATE INDEX IF NOT EXISTS idx_locations_session_id ON locations(session_id);
CREATE INDEX IF NOT EXISTS idx_routes_session_id ON routes(session_id);

-- RLS (Row Level Security) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

-- Users RLS 정책
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Sessions RLS 정책
CREATE POLICY "Anyone can view active sessions"
  ON sessions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Host can create sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update their sessions"
  ON sessions FOR UPDATE
  USING (auth.uid() = host_id);

-- Session Members RLS 정책
CREATE POLICY "Members can view session members"
  ON session_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM session_members sm
      WHERE sm.session_id = session_members.session_id
        AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join sessions"
  ON session_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave sessions"
  ON session_members FOR DELETE
  USING (auth.uid() = user_id);

-- Locations RLS 정책
CREATE POLICY "Members can view locations in their session"
  ON locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM session_members sm
      WHERE sm.session_id = locations.session_id
        AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update their location"
  ON locations FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM session_members sm
      WHERE sm.session_id = locations.session_id
        AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update their location via UPDATE"
  ON locations FOR UPDATE
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM session_members sm
      WHERE sm.session_id = locations.session_id
        AND sm.user_id = auth.uid()
    )
  );

-- Routes RLS 정책
CREATE POLICY "Members can view routes in their session"
  ON routes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM session_members sm
      WHERE sm.session_id = routes.session_id
        AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Host can create routes"
  ON routes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = routes.session_id
        AND s.host_id = auth.uid()
    )
  );

-- 세션 인원 제한을 위한 함수
CREATE OR REPLACE FUNCTION check_session_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  member_count INTEGER;
  host_plan TEXT;
BEGIN
  -- 현재 세션의 멤버 수 확인
  SELECT COUNT(*) INTO member_count
  FROM session_members
  WHERE session_id = NEW.session_id;

  -- 호스트의 플랜 확인
  SELECT u.plan INTO host_plan
  FROM sessions s
  JOIN users u ON s.host_id = u.id
  WHERE s.id = NEW.session_id;

  -- 무료 플랜은 최대 10명까지
  IF host_plan = 'free' AND member_count >= 10 THEN
    RAISE EXCEPTION '무료 플랜은 최대 10명까지만 참가할 수 있습니다.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER enforce_session_member_limit
  BEFORE INSERT ON session_members
  FOR EACH ROW
  EXECUTE FUNCTION check_session_member_limit();

