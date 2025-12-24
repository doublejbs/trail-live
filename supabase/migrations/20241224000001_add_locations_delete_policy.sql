-- Locations 테이블에 DELETE 정책 추가
-- 사용자가 자신의 위치 정보를 삭제할 수 있도록 허용

DROP POLICY IF EXISTS "Users can delete their own location" ON locations;
CREATE POLICY "Users can delete their own location"
  ON locations FOR DELETE
  USING (auth.uid() = user_id);

