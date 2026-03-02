# PIU Quests

펌프 잇 업(Pump It Up) 리듬게임 기록을 친구들과 함께 추적하는 서비스입니다.

퀘스트 보드에서 진행 중인 퀘스트를 확인하고, 각 차트에 맞는 게임 결과 사진을 업로드해 기록을 남길 수 있습니다.

```
piu_quests/
├── app/
│   ├── frontend/   # Next.js 16 (App Router) + Tailwind v4 + shadcn/ui
│   └── backend/    # FastAPI + SQLAlchemy 2.0 (async)
└── specs/          # 프로젝트 기획 문서
```

---

## 로컬 실행 방법

백엔드와 프론트엔드를 **각각 별도의 터미널**에서 실행합니다.

### 백엔드 (FastAPI)

```bash
cd app/backend

# 1. 의존성 설치
pip install uv
uv sync --extra dev

# 2. 환경변수 설정
cp .env.example .env
# .env 파일을 열어 값 입력 (아래 TODO 참고)

# 3. DB 마이그레이션
alembic upgrade head

# 4. 서버 실행
uvicorn app.main:app --reload
```

- API 서버: http://localhost:8000
- Swagger UI: http://localhost:8000/docs

### 프론트엔드 (Next.js)

```bash
cd app/frontend

# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.local.example .env.local
# .env.local 파일을 열어 값 입력 (아래 TODO 참고)

# 3. 개발 서버 실행
npm run dev
```

- 앱: http://localhost:3000

---

## TODO — 실제 서비스 실행 전 완료해야 할 작업

### 1. Supabase 프로젝트 생성

- [ ] [Supabase](https://supabase.com)에서 새 프로젝트 생성
- [ ] **Settings → Database** 에서 연결 문자열 확인 후 백엔드 `.env`에 입력
  ```
  DATABASE_URL=postgresql+asyncpg://postgres:[password]@db.[ref].supabase.co:5432/postgres
  ```
- [ ] **Settings → API** 에서 `SUPABASE_URL`, `service_role` 키 확인 후 `.env`에 입력
  ```
  SUPABASE_URL=https://[ref].supabase.co
  SUPABASE_SERVICE_KEY=...
  ```

### 2. Supabase Storage 버킷 생성

- [ ] Supabase 대시보드 → **Storage** → 새 버킷 생성
- [ ] 버킷 이름: `photos`
- [ ] 버킷 공개 여부: **Public** (사진 URL로 직접 접근 가능하도록)

### 3. Google OAuth 앱 생성

- [ ] [Google Cloud Console](https://console.cloud.google.com/) → 새 프로젝트 생성
- [ ] **API 및 서비스 → OAuth 동의 화면** 설정
- [ ] **API 및 서비스 → 사용자 인증 정보 → OAuth 2.0 클라이언트 ID** 생성
  - 애플리케이션 유형: **웹 애플리케이션**
  - 승인된 리디렉션 URI: `http://localhost:3000/api/auth/callback/google`
- [ ] 발급된 클라이언트 ID / 시크릿을 각 환경변수 파일에 입력
  - 프론트엔드 `.env.local`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - 백엔드 `.env`: `GOOGLE_CLIENT_ID`

### 4. 환경변수 입력

- [ ] `app/backend/.env` 작성 (`.env.example` 참고)
- [ ] `app/frontend/.env.local` 작성 (`.env.local.example` 참고)
- [ ] `NEXTAUTH_SECRET` 생성 후 입력
  ```bash
  openssl rand -base64 32
  ```

### 5. DB 마이그레이션 실행

- [ ] Supabase DB 연결 확인 후 최초 마이그레이션 생성 및 적용
  ```bash
  cd app/backend
  alembic revision --autogenerate -m "initial"
  alembic upgrade head
  ```

---

## 환경변수 요약

### 백엔드 (`app/backend/.env`)

| 변수명 | 설명 |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL 연결 문자열 (`postgresql+asyncpg://...`) |
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_KEY` | Supabase `service_role` 키 (Storage 업로드용) |
| `GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID (JWT 검증용) |

### 프론트엔드 (`app/frontend/.env.local`)

| 변수명 | 설명 |
|---|---|
| `NEXTAUTH_URL` | 앱 URL (로컬: `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | NextAuth 서명 비밀키 |
| `GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 클라이언트 시크릿 |
| `NEXT_PUBLIC_API_URL` | 백엔드 API URL (로컬: `http://localhost:8000`) |
