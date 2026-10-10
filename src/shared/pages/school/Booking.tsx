import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
type Resource={id:number;type_id:number;name:string;description:string|null};
type Period={id:number;label:string;start_time:string;end_time:string};
type Occupancy={resource_id:number;period_id:number;label:string;weekday?:number;reservation_date?:string};
type BookingData={school:{name:string;public_id:number};resources:Resource[];periods:Period[];regular:Occupancy[];reservations:Occupancy[]};
const localDate=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export default function Booking(){
 const {id}=useParams();
 const [date,setDate]=useState('');
 const [data,setData]=useState<BookingData|null>(null);
 const [resource,setResource]=useState<number|null>(null);
 const [error,setError]=useState('');
 useEffect(()=>{setDate(localDate())},[]);
 useEffect(()=>{if(!id||!date)return;const controller=new AbortController();setError('');fetch(`/api/schools/${encodeURIComponent(id)}/booking?date=${encodeURIComponent(date)}`,{signal:controller.signal}).then(async r=>{const body=await r.json();if(!r.ok)throw new Error(body.message||'조회 오류');return body as BookingData}).then(setData).catch(e=>{if(!controller.signal.aborted)setError(String(e))});return()=>controller.abort()},[id,date]);
 useEffect(()=>{if(data&&!data.resources.some(r=>r.id===resource))setResource(data.resources[0]?.id??null)},[data,resource]);
 const weekday=useMemo(()=>date?new Date(`${date}T12:00:00+09:00`).getUTCDay():-1,[date]);
 return <section className="booking-page"><h1>{data?.school.name??'학교'} 시설예약</h1><div className="booking-toolbar"><label>조회 날짜 <input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>시설 <select value={resource??''} onChange={e=>setResource(Number(e.target.value))}>{data?.resources.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label></div>{error&&<p role="alert">{error}</p>}{!data&&!error&&<p>예약표 불러오는 중...</p>}{data&&<div className="booking-board"><table><thead><tr><th>교시</th><th>시간</th><th>예약현황</th></tr></thead><tbody>{data.periods.map(p=>{const regular=data.regular.find(x=>x.resource_id===resource&&x.period_id===p.id&&x.weekday===weekday);const reserved=data.reservations.find(x=>x.resource_id===resource&&x.period_id===p.id);const taken=regular??reserved;return <tr key={p.id}><th>{p.label}</th><td>{p.start_time.slice(0,5)}~{p.end_time.slice(0,5)}</td><td className={taken?'booking-busy':'booking-free'}>{taken?taken.label:<Link to={`/school/${id}/booking/reservation?date=${date}&resource=${resource}&period=${p.id}`}>예약 가능 · 신청</Link>}</td></tr>})}</tbody></table></div>}<p className="booking-note">정규 배정은 학기별 설정을 따르며 실제 예약은 날짜별로 표시됩니다. 예약 신청은 인증 연동 후 활성화됩니다.</p></section>
}
