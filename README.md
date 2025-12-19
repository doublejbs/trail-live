# Trail Live 🏔️

등산 중 여러 명이 실시간으로 자신의 위치를 공유하고, 정해진 루트를 따라 걷는 지도 기반 웹 서비스입니다.

## 🚀 기술 스택

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (Auth, Realtime, Postgres, Storage, Edge Functions)
- **Map SDK**: Naver Maps JavaScript SDK
- **Styling**: TailwindCSS
- **Deployment**: Vercel

## 📋 주요 기능

1. ✅ 이메일 로그인 (Supabase Auth)
2. 🎯 세션 생성 / 참가 (무료: 최대 10명, 유료: 무제한)
3. 📍 실시간 위치 공유 (Supabase Realtime)
4. 🗺️ 지도 위에 루트(GPX → GeoJSON) 표시
5. 👥 자신의 위치와 참가자 위치를 마커로 표시
6. 🔗 초대 코드로 세션 입장
7. 💳 결제 (추후 Stripe 연동 예정)
8. 📱 반응형 UI (모바일 중심)

## 🛠️ 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`env.example` 파일을 복사하여 `.env` 파일을 생성하고 필요한 값을 입력하세요.

```bash
cp env.example .env
```

`.env` 파일 내용:

```env
# Supabase 설정
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Naver Maps API
VITE_NAVER_MAP_CLIENT_ID=your-naver-map-client-id
```

### 3. Supabase 설정

#### 3.1 Supabase 프로젝트 생성

1. [Supabase](https://supabase.com/) 접속 및 회원가입
2. 새 프로젝트 생성
3. Project Settings > API에서 `URL`과 `anon public` 키 확인
4. `.env` 파일에 입력

#### 3.2 데이터베이스 마이그레이션

`supabase-migration.sql` 파일의 내용을 Supabase SQL Editor에서 실행하세요.

1. Supabase Dashboard > SQL Editor 이동
2. `supabase-migration.sql` 파일 내용 복사
3. 실행하여 테이블 및 RLS 정책 생성

#### 3.3 Realtime 활성화 확인

Database > Replication 메뉴에서 `locations` 및 `session_members` 테이블의 Realtime이 활성화되어 있는지 확인하세요.

### 4. Naver Maps API 키 발급

1. [Naver Cloud Platform](https://www.ncloud.com/) 접속 및 회원가입
2. Console > Services > AI·NAVER API > Application 등록
3. Maps > Web Dynamic Map 활성화
4. Client ID를 `.env` 파일에 입력
5. `index.html` 파일의 `YOUR_CLIENT_ID` 부분을 실제 Client ID로 변경

```html
<script type="text/javascript" src="https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=YOUR_CLIENT_ID"></script>
```

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 6. 빌드

```bash
npm run build
```

## 📁 프로젝트 구조

```
trail-live/
├── src/
│   ├── components/        # React 컴포넌트
│   │   └── NaverMapView.tsx
│   ├── pages/            # 페이지 컴포넌트
│   │   └── HomeView.tsx
│   ├── hooks/            # Custom Hooks
│   │   ├── useGeolocation.ts
│   │   └── useRealtimeLocations.ts
│   ├── lib/              # 라이브러리 설정
│   │   └── supabase.ts
│   ├── types/            # TypeScript 타입 정의
│   │   ├── database.ts
│   │   ├── map.ts
│   │   └── session.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase-migration.sql  # 데이터베이스 마이그레이션
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 🗄️ 데이터베이스 스키마

### users
- `id` (UUID, PK): 사용자 고유 ID
- `nickname` (TEXT): 닉네임
- `plan` (TEXT): 플랜 (free | premium)
- `created_at` (TIMESTAMPTZ): 생성일

### sessions
- `id` (UUID, PK): 세션 고유 ID
- `name` (TEXT): 세션 이름
- `host_id` (UUID, FK): 호스트 사용자 ID
- `invite_code` (TEXT): 초대 코드
- `is_active` (BOOLEAN): 활성화 여부
- `created_at` (TIMESTAMPTZ): 생성일

### session_members
- `id` (UUID, PK): 멤버 고유 ID
- `session_id` (UUID, FK): 세션 ID
- `user_id` (UUID, FK): 사용자 ID
- `joined_at` (TIMESTAMPTZ): 참가일

### locations
- `id` (UUID, PK): 위치 고유 ID
- `session_id` (UUID, FK): 세션 ID
- `user_id` (UUID, FK): 사용자 ID
- `lat` (DOUBLE PRECISION): 위도
- `lon` (DOUBLE PRECISION): 경도
- `updated_at` (TIMESTAMPTZ): 업데이트 시간

### routes
- `id` (UUID, PK): 루트 고유 ID
- `session_id` (UUID, FK): 세션 ID
- `geojson` (JSONB): GeoJSON 데이터
- `created_at` (TIMESTAMPTZ): 생성일

## 🔒 RLS 정책

- 세션 참가자만 해당 세션의 위치 데이터에 접근 가능
- 무료 플랜은 세션당 최대 10명 제한 (트리거로 구현)
- 사용자는 자신의 프로필만 조회/수정 가능
- 호스트만 세션 생성 및 루트 업로드 가능

## 📝 TODO

- [ ] 로그인/회원가입 UI 구현
- [ ] 세션 생성/참가 모달 구현
- [ ] GPX 파일 업로드 및 GeoJSON 변환
- [ ] 프로필 페이지
- [ ] Stripe 결제 연동
- [ ] 알림 기능
- [ ] 오프라인 모드

## 📄 라이선스

MIT License

## 👥 기여

Pull Request는 언제나 환영합니다!
