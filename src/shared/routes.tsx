import type { ReactNode } from "react";
import { Route, Routes, Link, Outlet } from "react-router";
import Home from "./pages/Home";
import About from "./pages/About";
import Meal from "./pages/Meal";
import NotFound from "./pages/NotFound";
import RoutePlaceholder from "./pages/RoutePlaceholder";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLogin from "./pages/admin/AdminLogin";
import SchoolRegistration from "./pages/admin/SchoolRegistration";

export const staticPaths = ["/", "/about"] as const;

type Meta = { title: string; description: string };

// 고정 경로용 메타데이터 (사이트맵/SEO에도 재사용 가능)
export const routeMeta: Record<string, Meta> = {
  "/": { title: "홈", description: "서비스 메인 화면" },
  "/about": { title: "소개", description: "서비스 소개 페이지" },
  "/meal": { title: "급식 조회", description: "급식 조회 서비스" },
  "/daily": { title: "일일업무계획", description: "공개 일일업무계획" },
  "/school/admin": { title: "관리자 대시보드", description: "학교 관리자 대시보드" },
  "/school/admin/login": { title: "관리자 로그인", description: "관리자 로그인" },
  "/school/admin/schoolReg": { title: "학교 등록", description: "최고관리자 학교 등록" },
  "/school/admin/daily": { title: "일일업무계획 목록", description: "일일업무계획 관리" },
  "/school/admin/daily/settings": { title: "일일업무계획 설정", description: "일일업무계획 설정" },
  "/school/admin/daily/write": { title: "일일업무계획 작성", description: "일일업무계획 작성" },
  "/school/admin/booking": { title: "시설 예약현황", description: "시설 예약현황 목록" },
  "/school/admin/booking/settings": { title: "시설 예약 설정", description: "시설 예약 설정" },
};

// Express의 SSR 응답 상태와 HTML 메타를 공통으로 판정한다.
// /school/admin은 동적 학교 ID로 취급하지 않는다.
const dynamicRoutes: { pattern: RegExp; meta: Meta }[] = [
  { pattern: /^\/school\/(?!admin(?:\/|$))[^/]+\/daily\/?$/, meta: { title: "학교 일일업무계획", description: "학교별 일일업무계획" } },
  { pattern: /^\/school\/(?!admin(?:\/|$))[^/]+\/booking\/?$/, meta: { title: "학교 시설예약", description: "학교별 시설예약 목록" } },
  { pattern: /^\/school\/(?!admin(?:\/|$))[^/]+\/booking\/reservation\/?$/, meta: { title: "시설 예약등록", description: "학교 시설 예약등록" } },
  { pattern: /^\/school\/admin\/daily\/[^/]+\/print\/?$/, meta: { title: "일일업무계획 인쇄", description: "일일업무계획 인쇄" } },
  { pattern: /^\/school\/admin\/daily\/[^/]+\/modify\/?$/, meta: { title: "일일업무계획 수정", description: "일일업무계획 수정" } },
  { pattern: /^\/school\/admin\/daily\/[^/]+\/delete\/?$/, meta: { title: "일일업무계획 삭제", description: "일일업무계획 삭제 확인" } },
  { pattern: /^\/school\/admin\/daily\/[^/]+\/?$/, meta: { title: "일일업무계획 보기", description: "일일업무계획 상세 보기" } },
];

export function getRouteMeta(pathname: string): Meta | undefined {
  const normalized = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  return routeMeta[normalized] ?? dynamicRoutes.find((route) => route.pattern.test(normalized))?.meta;
}

function Layout(): ReactNode {
  return (
    <>
      <header className="header">
        <nav aria-label="주 메뉴">
          <Link to="/meal">급식 조회</Link>{" "}
        </nav>
      </header>
      <main id="content">
        <Outlet />
      </main>
      <footer>
        <a href="https://2er0.io" target="_blank" rel="noopener noreferrer">
          2er0.io
        </a>{" "}
        |{" "}
        <a href="https://vitzro.kr" target="_blank" rel="noopener noreferrer">
          vitzro.kr
        </a>
      </footer>
    </>
  );
}

const Page = ({ title, description, backTo }: { title: string; description?: string; backTo?: string }) => <RoutePlaceholder title={title} description={description} backTo={backTo} />;

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="meal" element={<Meal />} />
        <Route path="daily" element={<Page title="일일업무계획" />} />

        {/* 학교별 공개 페이지 */}
        <Route path="school/:id/daily" element={<Page title="학교 일일업무계획" />} />
        <Route path="school/:id/booking" element={<Page title="학교 시설예약 목록" />} />
        <Route path="school/:id/booking/reservation" element={<Page title="시설 예약등록" />} />
      </Route>

      {/* 관리자 로그인: 일반 사이트 레이아웃과 분리 */}
      <Route path="school/admin/login" element={<AdminLogin />} />

      {/* 관리자 공통 레이아웃: 하위 페이지 이동 시 사이드바 유지 */}
      <Route path="school/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="schoolReg" element={<SchoolRegistration />} />
        <Route path="daily" element={<Page title="일일업무계획 목록" />} />
        <Route path="daily/settings" element={<Page title="일일업무계획 설정" />} />
        <Route path="daily/write" element={<Page title="일일업무계획 작성" />} />
        <Route path="daily/:id" element={<Page title="일일업무계획 보기" backTo="/school/admin/daily" />} />
        <Route path="daily/:id/print" element={<Page title="일일업무계획 인쇄" backTo="/school/admin/daily" />} />
        <Route path="daily/:id/modify" element={<Page title="일일업무계획 수정" backTo="/school/admin/daily" />} />
        <Route path="daily/:id/delete" element={<Page title="일일업무계획 삭제 확인" backTo="/school/admin/daily" />} />
        <Route path="booking" element={<Page title="시설 예약현황 목록" />} />
        <Route path="booking/settings" element={<Page title="시설 예약 설정" />} />
      </Route>

      <Route element={<Layout />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
