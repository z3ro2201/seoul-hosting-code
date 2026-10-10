import { Router, type Request, type Response, type NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { getSupabase } from "../supabase";

export type AdminIdentity = { user_id: string; email: string | null; role: "super_admin" | "school_admin"; school_id: string | null };
type RoleRow = { role: "super_admin" | "school_admin"; school_id: string | null };
const ACCESS = "sh_admin_access";
const REFRESH = "sh_admin_refresh";
const production = () => process.env.NODE_ENV === "production";
const cookieOptions = (maxAge: number) => `Path=/api/admin; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${production() ? "; Secure" : ""}`;
const setCookie = (res: Response, name: string, value: string, maxAge: number) => res.append("Set-Cookie", `${name}=${encodeURIComponent(value)}; ${cookieOptions(maxAge)}`);
const clearCookies = (res: Response) => { setCookie(res, ACCESS, "", 0); setCookie(res, REFRESH, "", 0); };
const cookies = (req: Request) => Object.fromEntries((req.headers.cookie ?? "").split(";").map(part => part.trim().split(/=(.*)/s).slice(0, 2)).filter(pair => pair.length === 2).map(([k, v]) => { try { return [k, decodeURIComponent(v)]; } catch { return [k, ""]; } }));
const authClient = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server environment is missing");
  // Request-scoped instance: never store individual user sessions in the shared service client.
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
};
const sessionCookies = (res: Response, session: { access_token: string; refresh_token: string; expires_in: number }) => {
  setCookie(res, ACCESS, session.access_token, Math.max(1, session.expires_in));
  setCookie(res, REFRESH, session.refresh_token, 60 * 60 * 24 * 7);
};
async function identity(userId: string, email: string | undefined): Promise<AdminIdentity | null> {
  const { data, error } = await getSupabase().from("web_admin_roles").select("role,school_id").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  const role = data as RoleRow | null;
  if (!role || !["super_admin", "school_admin"].includes(role.role)) return null;
  return { user_id: userId, email: email ?? null, role: role.role, school_id: role.school_id };
}
async function resolveAdmin(req: Request, res: Response): Promise<AdminIdentity | null> {
  const stored = cookies(req);
  const client = authClient();
  let access = stored[ACCESS];
  let user = access ? (await client.auth.getUser(access)).data.user : null;
  if (!user && stored[REFRESH]) {
    const refreshed = await client.auth.refreshSession({ refresh_token: stored[REFRESH] });
    if (refreshed.error || !refreshed.data.session) { clearCookies(res); return null; }
    sessionCookies(res, refreshed.data.session);
    access = refreshed.data.session.access_token;
    user = (await client.auth.getUser(access)).data.user;
  }
  if (!user) return null;
  return identity(user.id, user.email);
}
// Refuse cross-site state-changing requests even with SameSite=Lax cookies.
export function requireSameOrigin(req: Request, res: Response, next: NextFunction) {
  const origin = req.get("origin");
  const host = req.get("host");
  const expected = `${req.protocol}://${host}`;
  if (!origin || !host || origin !== expected) { res.status(403).json({ message: "요청 출처를 확인할 수 없습니다." }); return; }
  next();
}
export const adminAuthRouter = Router();
adminAuthRouter.post("/login", requireSameOrigin, async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string" || !email.includes("@") || password.length < 1 || email.length > 254 || password.length > 1024) {
    res.status(400).json({ message: "이메일과 비밀번호를 확인해 주세요." }); return;
  }
  try {
    const result = await authClient().auth.signInWithPassword({ email, password });
    if (result.error || !result.data.user || !result.data.session) { res.status(401).json({ message: "로그인 정보가 올바르지 않습니다." }); return; }
    const admin = await identity(result.data.user.id, result.data.user.email);
    if (!admin) { res.status(403).json({ message: "관리자 권한이 등록되지 않았습니다." }); return; }
    sessionCookies(res, result.data.session);
    res.setHeader("Cache-Control", "no-store");
    res.json({ admin });
  } catch (error) { console.error("admin login", error); res.status(500).json({ message: "로그인 처리 중 오류가 발생했습니다." }); }
});
adminAuthRouter.get("/me", async (req, res) => {
  try {
    const admin = await resolveAdmin(req, res);
    res.setHeader("Cache-Control", "no-store");
    if (!admin) { res.status(401).json({ message: "로그인이 필요합니다." }); return; }
    res.json({ admin });
  } catch (error) { console.error("admin me", error); res.status(500).json({ message: "로그인 확인 중 오류가 발생했습니다." }); }
});
adminAuthRouter.post("/logout", requireSameOrigin, (_req, res) => {
  // Cookies are invalidated locally. Previously issued JWTs remain valid until expiry.
  clearCookies(res);
  res.setHeader("Cache-Control", "no-store");
  res.json({ ok: true });
});
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const admin = await resolveAdmin(req, res);
    if (!admin) { res.status(401).json({ message: "로그인이 필요합니다." }); return; }
    res.locals.admin = admin;
    next();
  } catch (error) { console.error("admin auth", error); res.status(500).json({ message: "관리자 인증 오류" }); }
}
export function requireSchoolAdmin(req: Request, res: Response, next: NextFunction) {
  const admin = res.locals.admin as AdminIdentity | undefined;
  const schoolUuid = res.locals.schoolUuid as string | undefined;
  if (!admin || !schoolUuid || (admin.role !== "super_admin" && admin.school_id !== schoolUuid)) { res.status(403).json({ message: "이 학교에 대한 관리 권한이 없습니다." }); return; }
  next();
}
