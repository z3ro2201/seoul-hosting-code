## 요구 사항

- Node.js 22 이상
- `npm install` → `npm run build` → `npm start`
- 개발 중: `npm run dev` (1회 빌드 후 실행, HMR 없음)
- `npm run typecheck`

## 동작

- `/`, `/about`: 빌드 시 완성 HTML 생성(SSG)
- `/meal`: Express가 React 컴포넌트를 HTML로 렌더링(SSR)
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


## 추가된 라우트 틀

- 공개: `/daily`, `/school/:id/daily`, `/school/:id/booking`, `/school/:id/booking/reservation`
- 관리자: `/school/admin`, `/school/admin/daily`, `/school/admin/daily/settings`, `/school/admin/daily/write`, `/school/admin/daily/:id`, `/school/admin/daily/:id/print`, `/school/admin/daily/:id/modify`, `/school/admin/daily/:id/delete`, `/school/admin/booking`, `/school/admin/booking/settings`
- 실제 화면 및 API 구현은 포함하지 않았습니다. `src/shared/pages/RoutePlaceholder.tsx`를 원하는 컴포넌트로 교체하세요.
- 동적 URL의 SEO 및 200/404 판정은 `getRouteMeta()`에서 공통 처리합니다.
- `/school/admin` 하위 경로는 클라이언트 라우팅만으로 보호되지 않습니다. 서버 인증/인가를 추가하세요.


## 학교별 독립 레이아웃

- `/school/:id/daily` → `src/shared/layouts/DailyLayout.tsx` + `src/shared/pages/school/Daily.tsx`
- `/school/:id/booking` → `src/shared/layouts/BookingLayout.tsx` + `src/shared/pages/school/Booking.tsx`
- `/school/:id/booking/reservation` → 같은 BookingLayout + `Reservation.tsx`
- `/school/admin/*` → 기존 AdminLayout 유지 (로그인 독립 화면)
- 그 외 `/`, `/daily`, `/meal` 등 → 기존 사이트 Layout 유지

위 학교별 페이지는 SSR HTML 본문을 생성하지 않는 CSR 엔트리로 구성했습니다. 최초 요청에는 빈 `#app`이 전달되고 클라이언트에서 `createRoot`로 렌더링됩니다. 학교 경로의 검색 색인 방지 지시와 `robots.txt`도 포함되어 있습니다. 다만 실제 로그인·학교별 접근 권한 검증은 구현하지 않았습니다.

참고: 현재 운영 번들 이름은 `client.js`로 고정되어 있으므로 장기 immutable 캐시를 활성화하면 배포 갱신 문제가 생길 수 있습니다. 장기 캐싱은 별도 해시 파일명 빌드 구성 후 사용하세요.
