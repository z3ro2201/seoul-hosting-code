import { Link, Outlet, useParams } from "react-router";

/** /school/:id/daily 에만 적용되는 별도 레이아웃 */
export default function DailyLayout() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="school-app school-daily">
      <header className="school-app-header">
        <div className="school-app-brand">일일업무계획</div>
        <nav aria-label="일일업무계획 메뉴">
          <Link to={`/school/${encodeURIComponent(id ?? "")}/daily`}>업무계획</Link>
        </nav>
      </header>
      <main className="school-app-main"><Outlet /></main>
      <footer className="school-app-footer">학교 일일업무계획</footer>
    </div>
  );
}
