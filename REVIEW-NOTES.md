# Code review / 2026-10-10

- `src/server/routes/booking.ts`: already had Express 5 compatible `/admin/booking{/*splat}` in the user uploaded ZIP; the current reported `/*` error therefore reflects a different local file or an older process.
- `src/shared/pages/school/Booking.tsx`: corrected school name expected from API: `school.name`, not `school.school_name`.
- `supabase/schema.sql`: replaced stale brand-new DB schema with a copy of the UUID-compatible existing-DB migration. Do not re-run against the already migrated database without verifying your schema.
- `supabase/seed-example.sql`: adjusted to use schools.public_id=1 and schools.id UUID. Optional; only run after confirming school 1 is intended.
- API `/api/schools/1/booking?date=2026-10-12`: checks school via `public_id`, uses UUID for booking joins.
- Admin booking writes remain intentionally 501 until proper authorization and conflict validation.
- Original meal API still queries NEIS with `MLSV_YMD=YYYYMM`; monthly date-range fix is still needed. Unrelated to boot error.
- No live npm/TypeScript/Supabase tests have been executed.
