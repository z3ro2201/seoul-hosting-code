# 예약시스템 + Supabase 기반 틀

## 설치
1. 새 Supabase 프로젝트를 만들고 SQL Editor에서 `supabase/schema.sql` 실행
2. 데모 데이터는 `supabase/seed-example.sql` 실행 (테스트 학교 ID를 schools 테이블에서 확인)
3. `.env.example`을 `.env`로 복사하고 URL과 server secret key 설정
4. `npm install && npm run dev` 실행
5. `/school/1/booking` 방문 (학교 ID는 DB 실제 id로 변경)
6. `/school/admin/booking`, `/school/admin/booking/settings` 방문

## API
- `GET /api/schools/:id/booking?date=2026-10-10`: 학교 시설, 교시, 해당 날짜의 정규배정 및 예약 조회
- `POST /api/schools/:id/booking/reservations`: **501** (인증 및 충돌 방지 구현 전까지 안전하게 차단)

## 설계 주의점
- 기존 프로젝트 테이블이 이미 존재한다면 `schema.sql`을 무작정 실행하지 말 것. 새 프로젝트 기준으로 작성됨.
- `schools.id`는 bigint 숫자이고 URL의 `/school/1`과 매칭됨. 기존 UUID 기반 schema와 혼용 금지.
- 정규배정 기간은 `[valid_from, valid_until)`이고 종료일은 미포함.
- 동일 자원/요일/교시 정규배정 중복과 동일 날짜/자원/교시 예약 중복은 DB에서 방지.
- **정규배정과 개별예약 간 충돌은 서로 다른 테이블이므로 아직 자동 차단되지 않음.** 실예약 전 트랜잭션/RPC 보호 필수.
- 주간 전체 보기, 관리자 편집 저장, 승인, 로그인, 계정권한, Daily category 버전 편집 UI는 아직 미구현.
- 현재 학교별 예약 페이지는 선택 날짜의 시설별 교시 현황을 보여주는 실행 가능한 첫 화면.
- Supabase secret 키를 절대 클라이언트 JS에 넣지 말 것.
- JS 해시 캐싱은 별도 후속 작업. 기존 빌드/배포 방식 유지.
