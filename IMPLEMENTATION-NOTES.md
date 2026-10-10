# 학교별 설정 조회 기능 (1차)

- `/school/admin/booking/settings` 에서 학교 공개번호를 입력하여 Supabase 설정 조회
- `/api/schools/:id/settings` 는 `schools.public_id`로 UUID를 구한 뒤 동일 학교의 booking/daily 설정만 조회
- 예약종류, 시설, 교시, 정규 배정, 일일교육계획 카테고리 버전을 조회
- **저장/삭제 미지원**: 관리자 UI 자체에 인증이 아직 없고 `AdminLayout`의 역할은 단순 표시용 하드코딩이므로 쓰기 API를 열면 안 됨
- 기존 인증 완료 후 Supabase Auth JWT 검증, profiles.school_id 와 school UUID 대조, 역할 검증, 입력 검증, 충돌 방지 트랜잭션 후 쓰기 API 구현 권장
- 기존 `supabase/schema.sql` 재실행하지 말 것: 이미 DB에 마이그레이션됨
- 최초 설정 예시는 `supabase/seed-example.sql` 참고. 운영환경에 적용 전 내용 확인

테스트: `npm install`, `npm run typecheck`, `npm run dev`, `/api/schools/1/settings`, `/school/admin/booking/settings`.
