import { useState } from "react";
import { useAdmin } from "./AdminSession";
import { Link, NavLink, Outlet, useLocation } from "react-router";


const menu = [
  { to: "/school/admin", title: "대시보드", symbol: "▦", end: true },
  { to: "/school/admin/daily", title: "일일업무계획", symbol: "▤" },
  { to: "/school/admin/booking", title: "시설예약 관리", symbol: "▣" },
];

export default function AdminLayout() {
  const { admin, logout } = useAdmin();
  const role = admin?.role ?? "school_admin";
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const heading = location.pathname.includes("/booking") ? "시설예약 관리"
    : location.pathname.includes("/daily") ? "일일업무계획 관리"
    : location.pathname.endsWith("/schoolReg") ? "학교 등록"
    : "관리자 대시보드";

  return (
    <div className="admin-shell">
      {mobileOpen && <button className="admin-backdrop" aria-label="메뉴 닫기" onClick={() => setMobileOpen(false)} />}
      <aside className={`admin-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <Link to="/school/admin" className="admin-brand" onClick={() => setMobileOpen(false)}>
          <span className="admin-brand-icon">S</span><span><strong>School Admin</strong><small>학교 통합관리</small></span>
        </Link>
        <div className="admin-menu-label">WORKSPACE</div>
        <nav aria-label="관리자 메뉴" className="admin-side-nav">
          {menu.map(item => <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMobileOpen(false)} className={({ isActive }) => `admin-nav-link ${isActive ? "is-active" : ""}`}><span aria-hidden="true">{item.symbol}</span>{item.title}</NavLink>)}
          {role === "super_admin" && <NavLink to="/school/admin/schoolReg" onClick={() => setMobileOpen(false)} className={({ isActive }) => `admin-nav-link ${isActive ? "is-active" : ""}`}><span aria-hidden="true">⊞</span>학교 등록</NavLink>}
        </nav>
        <div className="admin-sidebar-bottom"><Link to="/">← 사이트로 돌아가기</Link><span>관리자 전용 영역</span></div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-topbar-left"><button type="button" className="admin-menu-button" onClick={() => setMobileOpen(true)} aria-label="관리자 메뉴 열기">☰</button><span className="admin-breadcrumb">학교 관리 / <b>{heading}</b></span></div>
          <div className="admin-topbar-right"><span className="admin-role">{role === "super_admin" ? "최고관리자" : "학교 관리자"}</span><span className="admin-avatar" aria-hidden="true">A</span><button type="button" onClick={() => void logout()}>로그아웃</button></div>
        </header>
        <main id="admin-content" className="admin-main"><Outlet /></main>
      </div>
    </div>
  );
}
