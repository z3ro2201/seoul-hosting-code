import type { ReactNode } from "react";
import { Route, Routes, Link, Outlet } from "react-router";
import Home from "./pages/Home";
import About from "./pages/About";
import Geupsik from "./pages/Geupsik";
import NotFound from "./pages/NotFound";

// 이곳과 routeMeta에 새 경로를 등록하세요.
export const staticPaths = ["/", "/about"] as const;
export const routeMeta: Record<string, { title: string; description: string }> = {
  "/": { title: "홈", description: "서비스 메인 화면" },
  "/about": { title: "소개", description: "서비스 소개 페이지" },
  "/geupsik": { title: "급식 조회", description: "급식 조회 서비스" },
};

function Layout(): ReactNode {
  return <>
    <header className="header"><nav aria-label="주 메뉴">
      <Link to="/">홈</Link><Link to="/about">소개</Link><Link to="/geupsik">급식 조회</Link>
    </nav></header>
    <main id="content"><Outlet /></main>
    <footer>Express + React Router · SSR / SSG / SPA</footer>
  </>;
}

export function App() {
  return <Routes><Route element={<Layout />}>
    <Route index element={<Home />} />
    <Route path="about" element={<About />} />
    <Route path="geupsik" element={<Geupsik />} />
    <Route path="*" element={<NotFound />} />
  </Route></Routes>;
}
