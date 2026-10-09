import { useState } from "react";

export default function Geupsik() {
  const [message, setMessage] = useState("API 조회 전");
  async function checkApi() {
    try {
      const response = await fetch("/api/health");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result: { message: string } = await response.json();
      setMessage(result.message);
    } catch {
      setMessage("API 요청 실패");
    }
  }
  return <section><h1>급식 조회</h1><p>직접 접속 시 SSR, 내부 이동 시 SPA입니다.</p><button onClick={checkApi}>API 연결 예시</button><p role="status">{message}</p></section>;
}
