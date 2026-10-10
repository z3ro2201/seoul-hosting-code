# 관리자 로그인 1차 적용

## 준비
1. Supabase SQL Editor에서 `supabase/web-admin-roles.sql` 실행 (이전 작업에서 이미 생성했다면 재실행할 필요 없음).
2. Supabase Authentication > Users에서 이메일/비밀번호 관리자를 수동 생성. 테스트 용도로 회원 가입을 공개하지 않음.
3. Auth 사용자 UUID를 복사하고 SQL Editor에서 역할 연결:
```sql
INSERT INTO public.web_admin_roles (user_id,role,school_id)
VALUES ('실제_AUTH_USER_UUID', 'super_admin', NULL)
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, school_id = EXCLUDED.school_id;
```
학교 관리자는 `('실제_AUTH_USER_UUID', 'school_admin', (SELECT id FROM public.schools WHERE public_id=1))`로 변경.
4. 서버 `.env`에 `SUPABASE_URL`, `SUPABASE_SECRET_KEY` 유지. 공개 `VITE_` 키로 사용하지 않기.
5. `npm install`, `npm run typecheck`, `npm run dev`.
6. `/school/admin/login` 로그인, `/api/admin/me`에서 역할 확인, `/school/admin/schoolReg` 최고관리자 UI 확인.

## 구현 범위
- `POST /api/admin/login`: 이메일/비밀번호 확인 + `web_admin_roles` 역할 조회, HttpOnly SameSite=Lax 쿠키 발급
- `GET /api/admin/me`: Supabase Auth 서버 검증 + 학교 소속 읽기. 액세스 만료 시 서버에서 리프레시
- `POST /api/admin/logout`: 브라우저 쿠키 제거 (발급한 JWT 서버 무효화는 아님)
- 관리자 화면 로그인 보호, 최고관리자 전용 학교 등록 화면 라우팅, 로그아웃
- 관리자 설정 **저장/삭제/학교 등록 서버 API는 아직 미구현**: 화면 보호만으로 서버 인가는 완료되지 않음.

## 보안 참고
- 배포 시 HTTPS 필수 (`NODE_ENV=production`이면 Secure 쿠키).
- 로그인 요청 속도 제한·계정 잠금, 로그아웃 세션의 서버 측 폐기 및 보호된 쓰기 API의 서버 인가는 추후 작업.
- Reverse proxy(OCI Nginx 등)에서 `Host`, `Origin`, HTTPS 처리를 동일하게 구성. `requireSameOrigin`이 다르면 403을 반환함.
- 서비스 비밀 키는 반드시 Express 서버에만 보관. DB 서비스 키는 RLS를 우회할 수 있음.
