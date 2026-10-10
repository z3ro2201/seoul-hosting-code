import { Link } from "react-router";

const cards = [
  { title: "등록된 일일업무계획", icon: "▤", description: "일일업무계획 현황을 확인합니다." },
  { title: "시설예약 현황", icon: "▣", description: "예약 현황과 이용 일정을 확인합니다." },
  { title: "관리 항목", icon: "⚙", description: "서비스별 설정을 관리합니다." },
];

export default function AdminDashboard() {
  return <div className="admin-dashboard">
    <div className="admin-page-heading"><div><p className="admin-eyebrow">OVERVIEW</p><h1>관리자 대시보드</h1><p>학교 업무와 시설예약을 한곳에서 관리하세요.</p></div></div>
    <div className="admin-stats">
      {cards.map(card => <section className="admin-stat-card" key={card.title}><div className="admin-stat-top"><span>{card.title}</span><span className="admin-stat-icon" aria-hidden="true">{card.icon}</span></div><div className="admin-stat-value">—</div><p>{card.description}</p></section>)}
    </div>
    <div className="admin-dashboard-grid">
      <section className="admin-panel"><div className="admin-panel-head"><div><h2>빠른 작업</h2><p>자주 사용하는 기능을 바로 실행하세요.</p></div></div><div className="admin-quick-actions">
        <Link to="/school/admin/daily/write"><span aria-hidden="true">＋</span><strong>업무계획 작성</strong><small>새 업무계획 등록</small></Link>
        <Link to="/school/admin/daily"><span aria-hidden="true">▤</span><strong>업무계획 목록</strong><small>등록된 계획 확인</small></Link>
        <Link to="/school/admin/booking"><span aria-hidden="true">▣</span><strong>시설예약 현황</strong><small>예약 목록 및 일정</small></Link>
        <Link to="/school/admin/booking/settings"><span aria-hidden="true">⚙</span><strong>예약 설정</strong><small>시설 및 이용 정책</small></Link>
      </div></section>
      <section className="admin-panel"><div className="admin-panel-head"><div><h2>최근 활동</h2><p>업무계획 및 예약 관련 변경 내역</p></div></div><div className="admin-empty"><span aria-hidden="true">▤</span><strong>표시할 활동이 없습니다</strong><p>활동 API 연결 후 이곳에 표시됩니다.</p></div></section>
    </div>
    <section className="admin-panel admin-info-panel"><h2>시작하기</h2><p>각 메뉴는 페이지 기본 틀만 마련된 상태입니다. API 및 학교별 권한 검증을 연결하면 실제 관리 기능으로 확장할 수 있어요.</p></section>
  </div>;
}
