# Supabase 로컬 개발 환경

이 폴더는 Supabase 로컬 개발 환경을 위한 설정 파일을 포함합니다.

## 🚀 시작하기

### 1. Supabase CLI 설치

```bash
# macOS
brew install supabase/tap/supabase

# Windows (Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
brew install supabase/tap/supabase
```

### 2. Docker 설치

Supabase 로컬 개발 환경은 Docker를 사용합니다.
- [Docker Desktop 다운로드](https://www.docker.com/products/docker-desktop)

### 3. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Google OAuth
SUPABASE_AUTH_GOOGLE_CLIENT_ID=your-google-client-id
SUPABASE_AUTH_GOOGLE_SECRET=your-google-client-secret

# Kakao OAuth
SUPABASE_AUTH_KAKAO_CLIENT_ID=your-kakao-rest-api-key
SUPABASE_AUTH_KAKAO_SECRET=your-kakao-client-secret
```

### 4. Supabase 시작

```bash
# Supabase 로컬 환경 시작
supabase start

# 마이그레이션 적용
supabase db reset
```

### 5. 데이터베이스 마이그레이션

```bash
# SQL 마이그레이션 파일 생성
supabase migration new initial_schema

# 또는 기존 supabase-migration.sql 파일 내용을 복사하여 사용
```

## 📝 OAuth 설정

### Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. "API 및 서비스" > "OAuth 동의 화면" 설정
4. "API 및 서비스" > "사용자 인증 정보" > "OAuth 2.0 클라이언트 ID" 생성
5. **승인된 리디렉션 URI** 추가:
   - 로컬: `http://localhost:54321/auth/v1/callback`
   - 프로덕션: `https://your-project.supabase.co/auth/v1/callback`

### Kakao OAuth

1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 애플리케이션 생성
3. "내 애플리케이션" > "앱 설정" > "플랫폼"에서 웹 플랫폼 추가
4. "제품 설정" > "카카오 로그인" 활성화
5. **Redirect URI** 등록:
   - 로컬: `http://localhost:54321/auth/v1/callback`
   - 프로덕션: `https://your-project.supabase.co/auth/v1/callback`
6. REST API 키와 Client Secret 발급

## 🔗 로컬 서비스 URL

Supabase를 시작하면 다음 서비스를 사용할 수 있습니다:

- **API URL**: `http://localhost:54321`
- **Studio**: `http://localhost:54323`
- **Inbucket (Email Testing)**: `http://localhost:54324`
- **DB**: `postgresql://postgres:postgres@localhost:54322/postgres`

## 📚 유용한 명령어

```bash
# Supabase 상태 확인
supabase status

# Supabase 중지
supabase stop

# 데이터베이스 리셋
supabase db reset

# 마이그레이션 생성
supabase migration new <migration_name>

# 로그 확인
supabase logs
```

## ⚠️ 주의사항

- `.env.local` 파일은 절대 Git에 커밋하지 마세요
- `config.toml` 파일의 `site_url`과 `additional_redirect_urls`를 프론트엔드 URL에 맞게 수정하세요
- Docker가 실행 중이어야 Supabase를 시작할 수 있습니다

## 🔧 트러블슈팅

### Port already in use 오류

```bash
# 사용 중인 포트 확인
lsof -i :54321

# 프로세스 종료
kill -9 <PID>
```

### Docker 오류

```bash
# Docker 재시작
docker restart <container_id>

# 전체 재시작
supabase stop
supabase start
```

