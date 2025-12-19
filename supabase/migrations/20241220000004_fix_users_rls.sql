-- users 테이블의 RLS 정책 수정
-- 모든 인증된 사용자가 다른 사용자 정보를 조회할 수 있도록 변경

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- 새로운 정책 생성
-- 모든 인증된 사용자는 다른 사용자의 프로필을 조회할 수 있음
CREATE POLICY "Authenticated users can view all profiles"
  ON users FOR SELECT
  USING (auth.role() = 'authenticated');

-- 사용자는 자신의 프로필만 업데이트할 수 있음
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- 사용자는 자신의 프로필을 생성할 수 있음
CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

