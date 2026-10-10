import { NavLink, Outlet, useParams } from "react-router";

/** /school/:id/booking 및 reservation 에 공통 적용 */
export default function BookingLayout() {
  const { id } = useParams<{ id: string }>();
  const base = `/school/${encodeURIComponent(id ?? "")}/booking`;
  return (
    <div className="school-app school-booking">
      <header className="school-app-header">
        <div className="school-app-brand">시설예약</div>
        <nav aria-label="시설예약 메뉴">
          <NavLink to={base} end>예약현황</NavLink>
          <NavLink to={`${base}/reservation`}>예약등록</NavLink>
        </nav>
      </header>
      <main className="school-app-main"><Outlet /></main>
      <footer className="school-app-footer">학교 시설예약 서비스</footer>
    </div>
  );
}
