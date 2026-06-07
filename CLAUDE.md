# PIU Quests — Project Guidelines

## Project Overview

Pump It Up 숙제(지정곡) 보드. ~30명의 친구가 사용.
현재/지난 숙제 조회 + 진행 중 숙제가 없을 때 **누구나 선착순으로** 다음 숙제 등록.
로그인·기록 제출·사진 업로드 **없음**.
App title: **망겜기록제출소**

## Tech Stack

| Layer     | Technology                                                |
|-----------|-----------------------------------------------------------|
| Frontend  | Next.js 16 (App Router, `output: 'export'`) + TypeScript + Tailwind v4 + shadcn/ui |
| API       | Cloudflare Pages Functions (`functions/api/*`), 프론트와 same-origin |
| Database  | Cloudflare D1 (SQLite) — 테이블 1개(`quests`, charts는 JSON 컬럼) |
| Deploy    | Cloudflare Pages                                          |

직접 관리하는 백엔드 서버·인증이 없다. 공유 쓰기(선착순 등록)는 D1 + Pages Functions로 처리한다.

## Key Paths

- 앱 전체: `app/frontend/`
- Next.js 앱: `app/frontend/src/`
- API 함수: `app/frontend/functions/api/`
- 함수 공유 헬퍼(라우트 아님): `app/frontend/functions-shared/`
- D1 스키마: `app/frontend/schema.sql`
- Cloudflare 설정: `app/frontend/wrangler.toml`

## UI / Localization

- **All users are Korean.** 사용자에게 보이는 모든 문자열은 한국어.
- 적용 대상: 라벨, 버튼, placeholder, 에러 메시지, 빈 상태, 툴팁 등 모든 가시 텍스트.
- App title은 어디서나 **망겜기록제출소** (페이지 타이틀, navbar 등).

## Design Principles

- [piurank.com](https://piurank.com) 반응형 스타일: PC는 넓은 레이아웃, 모바일은 사이드바.
- PC: 상단 가로 내비게이션 바.
- 모바일: **왼쪽** 햄버거 → **왼쪽**에서 사이드바 슬라이드.
- 홈(`/`)은 진행 중 숙제 페이지(`/quests/ongoing`)와 동일 내용을 보여준다.

## Git Workflow

- **gitflow**: `main`에서 `feature/<name>` 브랜치 → PR → squash-merge → 브랜치 삭제.
- `/git-start-feature` 로 새 feature 브랜치 시작.
- `/git-make-pr` 로 커밋·푸시·PR 생성.
- `main`에 직접 커밋 금지.
- `.env`, secret 포함 파일 커밋 금지.

## API / D1 Conventions

- Pages Functions는 `onRequestGet`/`onRequestPost` 를 export하고 `context.env.DB`(D1 바인딩)를 쓴다.
- `functions/` 내부 파일은 전부 라우트가 되므로, 공유 코드는 `functions-shared/`(밖)에 두고 상대경로로 import한다.
- 정적 라우트(`ongoing.ts`)가 동적 라우트(`[id].ts`)보다 우선한다.
- 선착순 등록은 단일 `INSERT ... WHERE NOT EXISTS (겹치는 숙제)` 로 원자적으로 처리한다 (`meta.changes === 0` → 409).
- 날짜는 모두 KST 기준 `YYYY-MM-DD` 문자열.

## Frontend Conventions

- `output: 'export'` 정적 빌드 → 동적 라우트(`[id]`) 불가. id가 필요한 페이지는 `?id=` 쿼리 + `useSearchParams`(Suspense 경계 필수)로 처리한다 (`/quests/detail`).
- 데이터는 같은 출처의 `/api/*` 를 `fetch`로 호출 (`src/lib/api.ts`, `src/hooks/useQuest.ts`).
- Tailwind v4 — 테마 색은 `globals.css`의 CSS 변수, `tailwind.config.ts` 없음.
- shadcn/ui 컴포넌트는 `npx shadcn@latest add <component>` 로 추가.
- `layout.tsx`의 `<body>`에 `suppressHydrationWarning` 유지 (브라우저 확장 hydration 경고 억제).
