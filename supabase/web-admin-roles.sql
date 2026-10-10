-- 기존 profiles/account_role은 변경하지 않음.
CREATE TABLE IF NOT EXISTS public.web_admin_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('super_admin', 'school_admin')),
  school_id uuid REFERENCES public.schools(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT web_admin_role_school_check CHECK (
    (role = 'super_admin' AND school_id IS NULL)
    OR (role = 'school_admin' AND school_id IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS web_admin_roles_school_idx ON public.web_admin_roles(school_id);
ALTER TABLE public.web_admin_roles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.web_admin_roles FROM anon, authenticated;
-- Supabase Dashboard > Authentication > Users에서 이메일/비밀번호 사용자 생성 후,
-- 아래 SQL의 UUID를 해당 사용자 id로 대체해 별도 실행.
-- INSERT INTO public.web_admin_roles (user_id, role, school_id)
-- VALUES ('AUTH_USER_UUID', 'super_admin', NULL);
-- 학교 관리자는 school_id=(SELECT id FROM public.schools WHERE public_id=1)를 지정.
