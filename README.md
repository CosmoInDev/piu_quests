# PIU Quests

펌프 잇 업(Pump It Up) 리듬게임 **숙제(지정곡) 보드**입니다.

현재 숙제와 지난 숙제를 조회하고, 진행 중인 숙제가 없을 때 **누구나 선착순으로** 다음 숙제를 등록할 수 있습니다. 로그인·기록 제출·사진 업로드 기능은 없습니다.

```
piu_quests/
└── app/frontend/        # Next.js 16 정적 사이트 + Cloudflare Pages Functions + D1
    ├── src/             # Next.js 앱 (App Router, 전부 클라이언트 컴포넌트)
    ├── functions/       # Pages Functions (/api/*) — 작은 API
    ├── functions-shared/ # functions 공유 헬퍼 (라우트 아님)
    ├── schema.sql       # D1(SQLite) 스키마
    └── wrangler.toml    # Cloudflare Pages + D1 설정
```

## 아키텍처

직접 관리하는 서버가 없는 구조입니다. Cloudflare 한 곳에서 정적 호스팅 + 작은 API + DB를 모두 제공하며, 사용량이 없어도 일시정지되지 않습니다.

| 구성 | 기술 |
|---|---|
| 프론트 | Next.js 16 (`output: 'export'` 정적 빌드) + Tailwind v4 + shadcn/ui |
| API | Cloudflare Pages Functions (`functions/api/*`) — 프론트와 같은 출처 |
| DB | Cloudflare D1 (SQLite), 테이블 1개(`quests`, charts는 JSON 컬럼) |
| 호스팅/배포 | Cloudflare Pages |

### API

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/quests` | 전체 숙제 목록 |
| GET | `/api/quests/ongoing` | 오늘 진행 중인 숙제 (없으면 `null`) |
| GET | `/api/quests/:id` | 숙제 단건 |
| POST | `/api/quests` | 숙제 등록. 겹치는 숙제가 없을 때만 원자적으로 생성(선착순), 있으면 409 |
| POST | `/api/pick` | piurise.com 곡 추첨 프록시 |

---

## 로컬 실행

```bash
cd app/frontend

# 1. 의존성 설치
npm install

# 2. 로컬 D1에 스키마 적용 (최초 1회)
npm run db:init:local

# 3. 정적 빌드 + Pages Functions + 로컬 D1로 실행
npm run preview
```

- `npm run preview` 는 `next build`(정적 export) 후 `wrangler pages dev out` 으로 실행해 프론트와 `/api/*` 함수를 같은 출처에서 띄웁니다.
- 순수 프론트만 빠르게 보려면 `npm run dev` (단, 이때는 `/api/*` 가 없어 데이터가 안 뜸).

---

## 배포 (Cloudflare Pages)

운영 사이트: **https://piu-quests.pages.dev**

### 자동 배포 (기본)

`main` 브랜치에 push되면 GitHub Actions(`.github/workflows/deploy.yml`)가 빌드·배포한다. 별도 명령 불필요.

필요한 **GitHub Secrets** (Settings → Secrets and variables → Actions):

| 이름 | 값 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API 토큰 (My Profile → API Tokens). 권한: Account → **Cloudflare Pages: Edit**, Account → **D1: Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 계정 ID |

### 수동 배포 / 최초 1회 셋업

```bash
cd app/frontend

# (최초 1회) D1 생성 — 출력된 database_id를 wrangler.toml에 입력
npx wrangler d1 create piu-quests
# (최초 1회) 원격 D1에 스키마 적용
npm run db:init

# 수동 배포가 필요할 때
npm run deploy
```

- `wrangler.toml` 의 `database_id` 는 `wrangler d1 create` 출력값으로 채워야 한다 (이미 설정됨).
