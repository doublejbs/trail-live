-- 기존 RLS 정책 삭제 및 재생성
-- session_members 테이블의 무한 재귀 문제 해결

-- 1. 기존 session_members 정책 삭제
DROP POLICY IF EXISTS "Members can view session members" ON session_members;
DROP POLICY IF EXISTS "Users can join sessions" ON session_members;
DROP POLICY IF EXISTS "Users can leave sessions" ON session_members;

-- 2. 새로운 session_members 정책 생성 (재귀 방지)
-- 모든 인증된 사용자는 세션 멤버를 조회할 수 있음 (간단한 정책)
CREATE POLICY "Authenticated users can view session members"
  ON session_members FOR SELECT
  USING (auth.role() = 'authenticated');

-- 사용자는 자신을 세션에 추가할 수 있음
CREATE POLICY "Users can join sessions"
  ON session_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신을 세션에서 제거할 수 있음
CREATE POLICY "Users can leave sessions"
  ON session_members FOR DELETE
  USING (auth.uid() = user_id);

-- 3. locations 정책도 단순화 (재귀 방지)
DROP POLICY IF EXISTS "Members can view locations in their session" ON locations;
DROP POLICY IF EXISTS "Members can update their location" ON locations;
DROP POLICY IF EXISTS "Members can update their location via UPDATE" ON locations;

-- 모든 인증된 사용자는 위치 정보를 조회할 수 있음
CREATE POLICY "Authenticated users can view locations"
  ON locations FOR SELECT
  USING (auth.role() = 'authenticated');

-- 사용자는 자신의 위치를 삽입할 수 있음
CREATE POLICY "Users can insert their location"
  ON locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 위치를 업데이트할 수 있음
CREATE POLICY "Users can update their location"
  ON locations FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. routes 정책도 단순화
DROP POLICY IF EXISTS "Members can view routes in their session" ON routes;
DROP POLICY IF EXISTS "Host can create routes" ON routes;

-- 모든 인증된 사용자는 경로를 조회할 수 있음
CREATE POLICY "Authenticated users can view routes"
  ON routes FOR SELECT
  USING (auth.role() = 'authenticated');

-- 세션 호스트는 경로를 생성할 수 있음
CREATE POLICY "Session hosts can create routes"
  ON routes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = routes.session_id
        AND s.host_id = auth.uid()
    )
  );

