# Express + React SSR / SSG / SPA 시작 틀

기존 `backup.tar`의 목표(Express 백엔드와 React 프론트)를 바탕으로 새로 정리한 **구조용 프로젝트**입니다. 기존 화면과 API 구현은 가져오지 않았습니다.

## 요구 사항
- Node.js 22 이상
- `npm install` → `npm run build` → `npm start`
- 개발 중: `npm run dev` (1회 빌드 후 실행, HMR 없음)
- `npm run typecheck`

## 동작
- `/`, `/about`: 빌드 시 완성 HTML 생성(SSG)
- `/geupsik`: Express가 React 컴포넌트를 HTML로 렌더링(SSR)
- 내부 메뉴 `<Link>` 이동: 전체 문서 새로고침 없는 SPA 라우팅
- `/api/health`: fetch 요청 예시 (실제 API는 직접 구현)
- 미등록 URL: 404 HTTP 상태와 404 화면

## 파일 위치
- `src/shared/routes.tsx`: 라우팅, 메타데이터, 공통 레이아웃
- `src/shared/pages/`: 직접 디자인할 React 페이지
- `src/server/routes/api.ts`: 직접 작성할 API
- `src/server/render.tsx`: 서버 렌더링 및 HTML 구조
- `src/server/index.ts`: Express 서버, SSG 우선/SSR 처리
- `src/client/entry.tsx`: Hydration
- `scripts/build.mjs`: 브라우저/서버 빌드 + 정적 HTML 생성

## 라우트 추가법
1. `src/shared/pages/`에 컴포넌트 작성
2. `src/shared/routes.tsx`의 `<Routes>`에 등록
3. 검색엔진용 `routeMeta` 등록
4. 빌드 시 생성할 정적 페이지라면 `staticPaths`와 `scripts/build.mjs`의 prerender 목록에 추가

주의: 새 경로가 동적이라면 SSG 목록에 넣지 마세요. 공개 동적 콘텐츠는 SSR 페이지에 서버 데이터 로딩을 별도로 구현해야 합니다. 최초 렌더링과 Hydration 결과는 동일해야 합니다.

## OCI 배포
개발 컴퓨터에서 `npm install && npm run build`. 서버에 `dist/`, `package.json`, `package-lock.json`(설치 후 생성)을 옮겨 `npm ci --omit=dev && node dist/server.mjs`로 실행. 서버에서도 `react`, `react-dom`, `react-router`, `express`는 필요합니다. 메모리 제한은 실제 RSS/부하를 측정한 뒤 정하세요.

## 주의
이 환경에서는 npm 저장소 DNS 연결이 안 되어 의존성 설치 및 HTTP 실동작 테스트를 완료하지 못했습니다. 압축에는 `node_modules`, 비밀 `.env` 파일이 없습니다.
