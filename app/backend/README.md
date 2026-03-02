# PIU Quests — 백엔드

펌프 잇 업(Pump It Up) 리듬게임 기록을 친구들과 함께 추적하는 서비스의 백엔드 API 서버입니다.

## 기술 스택

| 항목 | 내용 |
|---|---|
| 언어 | Python 3.11 |
| 프레임워크 | FastAPI |
| ORM | SQLAlchemy 2.0 (async) |
| DB | Supabase PostgreSQL |
| 파일 스토리지 | Supabase Storage |
| 마이그레이션 | Alembic |
| 패키지 관리 | uv |
| 테스트 | pytest + pytest-asyncio |

## 디렉토리 구조

```
backend/
├── app/
│   ├── main.py              # FastAPI 앱 진입점
│   ├── core/
│   │   ├── config.py        # 환경변수 설정 (pydantic-settings)
│   │   ├── database.py      # SQLAlchemy 비동기 엔진 및 세션
│   │   └── auth.py          # Google JWT 검증 의존성
│   ├── models/              # SQLAlchemy ORM 모델
│   │   ├── user.py
│   │   ├── quest.py
│   │   ├── chart.py
│   │   ├── participant.py
│   │   ├── record.py
│   │   └── photo.py
│   ├── schemas/             # Pydantic 요청/응답 스키마
│   │   ├── user.py
│   │   ├── quest.py
│   │   └── record.py
│   ├── routers/             # API 라우터
│   │   ├── users.py
│   │   ├── quests.py
│   │   ├── records.py
│   │   └── photos.py
│   └── services/            # 비즈니스 로직
│       ├── storage.py       # Supabase Storage 업로드/삭제
│       └── participant.py   # 참가자 상태 계산
├── tests/
│   ├── conftest.py          # pytest 픽스처, 테스트 DB 설정
│   ├── test_users.py
│   ├── test_quests.py
│   ├── test_records.py
│   └── test_photos.py
├── alembic/                 # DB 마이그레이션
├── .env.example             # 환경변수 예시
├── pyproject.toml           # uv 의존성 정의
└── alembic.ini
```

## 로컬 개발 환경 설정

### 1. 사전 요구사항

- Python 3.11 이상
- [uv](https://docs.astral.sh/uv/) 패키지 매니저

uv가 없다면 설치:
```bash
pip install uv
```

### 2. 의존성 설치

```bash
uv sync --extra dev
```

### 3. 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 실제 값으로 채웁니다:

```env
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/piu_quests
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
GOOGLE_CLIENT_ID=your-google-client-id
```

### 4. DB 마이그레이션 실행

```bash
# 최초 마이그레이션 파일 생성
alembic revision --autogenerate -m "initial"

# 마이그레이션 적용
alembic upgrade head
```

### 5. 개발 서버 실행

```bash
uvicorn app.main:app --reload
```

서버가 실행되면:
- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 테스트 실행

```bash
pytest
```

테스트는 SQLite 인메모리 DB를 사용하므로 별도의 DB 연결 없이 실행됩니다.

## API 엔드포인트

| 메서드 | 경로 | 설명 | 인증 |
|---|---|---|---|
| GET | `/health` | 헬스 체크 | 불필요 |
| GET | `/users/me` | 내 정보 조회 | 필요 |
| GET | `/quests` | 퀘스트 목록 조회 | 불필요 |
| GET | `/quests/{id}` | 퀘스트 상세 조회 | 불필요 |
| POST | `/quests` | 퀘스트 생성 | 필요 |
| GET | `/records/quests/{quest_id}` | 퀘스트 전체 기록 조회 | 불필요 |
| GET | `/records/me/quests/{quest_id}` | 내 기록 조회 | 필요 |
| POST | `/photos` | 사진 업로드 | 필요 |
| DELETE | `/photos/{id}` | 사진 삭제 | 필요 |

인증이 필요한 엔드포인트는 `Authorization: Bearer <Google id_token>` 헤더가 필요합니다.

## 데이터 모델

```
User        id, google_id, name, created_at
Quest       id, title, start_date, end_date, created_at
Chart       id, quest_id, song_name, difficulty, order
Participant id, user_id, quest_id, joined_at
Record      id, user_id, quest_id, created_at, updated_at
Photo       id, record_id, chart_id, file_url, created_at
```

**참가자 상태** (저장하지 않고 계산):
- `FINISHED` — 제출 사진 수 == 퀘스트 차트 수
- `SUBMITTING` — 0 < 제출 사진 수 < 전체 차트 수
- `UNSUBMITTED` — 제출한 사진 없음

## 인증 흐름

1. 프론트엔드(NextAuth.js)가 Google OAuth2 로그인을 처리하고 `id_token`을 세션에 저장
2. 프론트엔드가 API 요청 시 `Authorization: Bearer <id_token>` 헤더를 포함
3. FastAPI가 Google의 공개 JWKS 엔드포인트로 토큰 검증
4. `google_id`로 유저를 조회하거나, 없으면 자동 생성

## 배포 (Render)

```bash
# 빌드 커맨드
uv sync --no-dev

# 시작 커맨드
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```
