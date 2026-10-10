import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { useAdmin } from "./AdminSession";

export default function AdminLogin() {
  const { admin, loading, reload } = useAdmin();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/login", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "로그인 실패");
      await reload();
      navigate("/school/admin", { replace: true });
    } catch (e) { setError(e instanceof Error ? e.message : "로그인 실패"); }
    finally { setBusy(false); }
  }
  if (!loading && admin) return <Navigate to="/school/admin" replace />;
  return <section className="admin-login-page"><div className="admin-login-box">
    <span className="admin-login-logo">S</span><h1>관리자 로그인</h1><p>등록된 관리자 계정으로 로그인하세요.</p>
    <form onSubmit={submit} style={{ display: "grid", gap: 14, textAlign: "left" }}>
      <label>이메일<input type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} style={{ display: "block", width: "100%", padding: 10 }} /></label>
      <label>비밀번호<input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} style={{ display: "block", width: "100%", padding: 10 }} /></label>
      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
      <button type="submit" disabled={busy || loading}>{busy ? "로그인 중…" : "로그인"}</button>
    </form>
  </div></section>;
}
