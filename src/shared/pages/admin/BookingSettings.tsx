import { useEffect, useMemo, useState } from "react";

type SchoolSettings = {
  school: { public_id: number; name: string };
  types: { id: number; name: string; sort_order: number; is_active: boolean }[];
  resources: { id: number; type_id: number; name: string; description: string | null; sort_order: number; is_active: boolean }[];
  periods: { id: number; label: string; start_time: string; end_time: string; sort_order: number; is_active: boolean }[];
  categories: { id: number; category_code: string }[];
  versions: { id: number; category_id: number; category_name: string; sort_order: number; valid_from: string; valid_until: string | null }[];
  regular: { id: number; resource_id: number; period_id: number; weekday: number; label: string; valid_from: string; valid_until: string | null }[];
};
const tabs = ["예약종류", "시설/장비", "교시 및 시간", "정규 배정", "일일교육계획 카테고리"] as const;
type Tab = (typeof tabs)[number];
const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

export default function BookingSettings() {
  const [tab, setTab] = useState<Tab>("예약종류");
  const [input, setInput] = useState("1");
  const [schoolId, setSchoolId] = useState("1");
  const [data, setData] = useState<SchoolSettings | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setData(null);
    fetch(`/api/schools/${encodeURIComponent(schoolId)}/settings`, { signal: controller.signal })
      .then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.message ?? "조회 실패"); return body as SchoolSettings; })
      .then(setData)
      .catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "조회 실패"); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [schoolId]);
  const types = useMemo(() => new Map(data?.types.map(t => [t.id, t.name]) ?? []), [data]);
  const resources = useMemo(() => new Map(data?.resources.map(r => [r.id, r.name]) ?? []), [data]);
  const periods = useMemo(() => new Map(data?.periods.map(p => [p.id, p.label]) ?? []), [data]);
  const categories = useMemo(() => new Map(data?.categories.map(c => [c.id, c.category_code]) ?? []), [data]);
  const dateLabel = (from: string, until: string | null) => `${from} ~ ${until ? `${until} 이전` : "계속"}`;
  const empty = <p>등록된 설정이 없습니다. 예시 초기 데이터는 supabase/seed-example.sql에서 등록할 수 있습니다.</p>;
  return <section>
    <div className="admin-page-heading"><div><h1>학교별 설정 조회</h1><p>예약 종류·시설·교시·정규 배정과 일일교육계획 카테고리를 Supabase에서 조회합니다.</p></div></div>
    <form onSubmit={e => { e.preventDefault(); setSchoolId(input.trim()); }} style={{display:"flex",alignItems:"end",gap:12,flexWrap:"wrap",marginBottom:16}}>
      <label>학교 공개번호 <input type="number" min="1" step="1" value={input} onChange={e => setInput(e.target.value)} required style={{display:"block",padding:8}} /></label>
      <button type="submit">학교 조회</button>
      {data && <strong>{data.school.name} (#{data.school.public_id})</strong>}
    </form>
    {loading && <p role="status">학교 설정 불러오는 중...</p>}
    {error && <p role="alert">{error}</p>}
    {data && <>
      <div className="booking-settings-tabs" role="tablist" aria-label="설정 조회 종류">{tabs.map(t => <button type="button" role="tab" aria-selected={tab === t} className={tab === t ? "selected" : ""} key={t} onClick={() => setTab(t)}>{t}</button>)}</div>
      <div className="admin-panel"><h2>{tab}</h2>
        {tab === "예약종류" && (data.types.length ? <table><thead><tr><th>순서</th><th>종류</th><th>상태</th></tr></thead><tbody>{data.types.map(t => <tr key={t.id}><td>{t.sort_order}</td><td>{t.name}</td><td>{t.is_active ? "사용" : "중지"}</td></tr>)}</tbody></table> : empty)}
        {tab === "시설/장비" && (data.resources.length ? <table><thead><tr><th>종류</th><th>시설/장비</th><th>설명</th><th>상태</th></tr></thead><tbody>{data.resources.map(r => <tr key={r.id}><td>{types.get(r.type_id) ?? "미지정"}</td><td>{r.name}</td><td>{r.description ?? "-"}</td><td>{r.is_active ? "사용" : "중지"}</td></tr>)}</tbody></table> : empty)}
        {tab === "교시 및 시간" && (data.periods.length ? <table><thead><tr><th>교시</th><th>시작</th><th>종료</th><th>상태</th></tr></thead><tbody>{data.periods.map(p => <tr key={p.id}><td>{p.label}</td><td>{p.start_time.slice(0,5)}</td><td>{p.end_time.slice(0,5)}</td><td>{p.is_active ? "사용" : "중지"}</td></tr>)}</tbody></table> : empty)}
        {tab === "정규 배정" && (data.regular.length ? <table><thead><tr><th>시설</th><th>요일</th><th>교시</th><th>배정</th><th>적용 기간</th></tr></thead><tbody>{data.regular.map(r => <tr key={r.id}><td>{resources.get(r.resource_id) ?? "-"}</td><td>{weekdays[r.weekday] ?? r.weekday}</td><td>{periods.get(r.period_id) ?? "-"}</td><td>{r.label}</td><td>{dateLabel(r.valid_from,r.valid_until)}</td></tr>)}</tbody></table> : empty)}
        {tab === "일일교육계획 카테고리" && (data.versions.length ? <table><thead><tr><th>코드</th><th>명칭</th><th>순서</th><th>적용 기간</th></tr></thead><tbody>{data.versions.map(v => <tr key={v.id}><td>{categories.get(v.category_id) ?? "-"}</td><td>{v.category_name}</td><td>{v.sort_order}</td><td>{dateLabel(v.valid_from,v.valid_until)}</td></tr>)}</tbody></table> : empty)}
        <p className="booking-note">현재는 실데이터 조회 화면입니다. 관리자 인증·학교별 권한 검증 전에는 등록/수정/삭제를 제공하지 않습니다.</p>
      </div>
    </>}
  </section>;
}
