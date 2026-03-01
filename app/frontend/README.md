# PIU Quests — 프론트엔드

펌프 잇 업(Pump It Up) 리듬게임 기록을 친구들과 함께 추적하는 서비스의 프론트엔드 앱입니다.

## 기술 스택

| 항목 | 내용 |
|---|---|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 |
| UI 컴포넌트 | shadcn/ui |
| 인증 | NextAuth.js v4 (Google OAuth2) |
| API 클라이언트 | Axios + TanStack Query |
| 배포 | Vercel |

## 디렉토리 구조

```
frontend/
├── src/
│   ├── app/                          # App Router 페이지
│   │   ├── layout.tsx                # 루트 레이아웃
│   │   ├── page.tsx                  # 홈 (퀘스트 보드)
│   │   ├── api/auth/[...nextauth]/   # NextAuth API 라우트
│   │   └── quests/[id]/page.tsx      # 퀘스트 상세 페이지
│   ├── components/
│   │   └── providers.tsx             # SessionProvider + QueryClientProvider
│   ├── lib/
│   │   ├── auth.ts                   # NextAuth 설정
│   │   └── api.ts                    # Axios 클라이언트 (JWT 자동 주입)
│   └── types/
│       ├── index.ts                  # 공유 TypeScript 타입
│       └── next-auth.d.ts            # NextAuth 세션 타입 확장
├── public/
├── .env.local.example                # 환경변수 예시
└── next.config.ts
```

## 로컬 개발 환경 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local` 파일을 열어 실제 값으로 채웁니다:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=          # openssl rand -base64 32 로 생성
GOOGLE_CLIENT_ID=         # Google Cloud Console에서 발급
GOOGLE_CLIENT_SECRET=     # Google Cloud Console에서 발급
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 으로 접속합니다.

백엔드 서버도 함께 실행되어 있어야 합니다 (기본: http://localhost:8000).

## Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. **API 및 서비스 → 사용자 인증 정보 → OAuth 2.0 클라이언트 ID** 생성
3. 승인된 리디렉션 URI에 추가:
   - 개발: `http://localhost:3000/api/auth/callback/google`
   - 프로덕션: `https://your-domain.com/api/auth/callback/google`
4. 발급된 클라이언트 ID / 시크릿을 `.env.local`에 입력

## 주요 커맨드

```bash
npm run dev      # 개발 서버 실행 (localhost:3000)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 실행
```

## 색상 테마

`src/app/globals.css`에서 CSS 변수로 관리합니다.

| 변수 | 색상 | 용도 |
|---|---|---|
| `--primary` | `#A31621` | 주요 버튼, 강조 |
| `--secondary` | `#90C2E7` | 보조 요소 |
| `--background` | `#FCF7F8` | 배경 |

## 인증 흐름

1. 사용자가 "Google로 로그인" 클릭
2. NextAuth.js가 Google OAuth2 리디렉션 처리
3. 로그인 완료 후 Google `id_token`을 세션에 저장
4. API 요청 시 `Authorization: Bearer <id_token>` 헤더 자동 주입 (`src/lib/api.ts`)
5. 백엔드(FastAPI)가 토큰 검증 후 응답

## 배포 (Vercel)

GitHub 저장소를 Vercel에 연결하고, 환경변수를 Vercel 대시보드에서 설정합니다.

`NEXTAUTH_URL`은 배포된 도메인으로 변경해야 합니다.
