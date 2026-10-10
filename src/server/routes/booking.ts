import { Router } from "express";
import { getSupabase } from "../supabase";

export const bookingRouter = Router();

type SchoolRow = { id: string; public_id: number; name: string };

function schoolId(value: string | undefined): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) return null;

  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function validDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// 공개 읽기 API
bookingRouter.get("/schools/:id/booking", async (req, res) => {
  const id = schoolId(req.params.id);
  const date = req.query.date;

  if (!id || !validDate(date)) {
    res.status(400).json({
      message: "학교 ID와 date(YYYY-MM-DD)가 필요합니다.",
    });
    return;
  }

  try {
    const db = getSupabase();

    // 공개 ID로 학교 UUID 조회
    const school = await db.from("schools").select("id,public_id,name").eq("public_id", id).maybeSingle();

    if (school.error) throw school.error;

    const schoolData = school.data as SchoolRow | null;
    if (!schoolData) {
      res.status(404).json({
        message: "학교를 찾을 수 없습니다.",
      });
      return;
    }

    const schoolUuid = schoolData.id;

    // JS getUTCDay(): 일=0, 월=1 ... 토=6
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();

    const [types, resources, periods, regular, reservations] = await Promise.all([
      db.from("booking_types").select("id,name,sort_order").eq("school_id", schoolUuid).eq("is_active", true).order("sort_order"),

      db.from("booking_resources").select("id,type_id,name,sort_order,description").eq("school_id", schoolUuid).eq("is_active", true).order("sort_order"),

      db.from("booking_periods").select("id,label,start_time,end_time,sort_order").eq("school_id", schoolUuid).eq("is_active", true).order("sort_order"),

      db
        .from("booking_regular_schedules")
        .select("id,resource_id,period_id,weekday,label,valid_from,valid_until")
        .eq("school_id", schoolUuid)
        .eq("weekday", weekday)
        .lte("valid_from", date)
        .or(`valid_until.is.null,valid_until.gt.${date}`),

      db.from("booking_reservations").select("id,resource_id,period_id,reservation_date,label,status").eq("school_id", schoolUuid).eq("reservation_date", date).eq("status", "confirmed"),
    ]);

    for (const result of [types, resources, periods, regular, reservations]) {
      if (result.error) throw result.error;
    }

    res.setHeader("Cache-Control", "no-store");

    res.json({
      school: schoolData,
      date,
      types: types.data ?? [],
      resources: resources.data ?? [],
      periods: periods.data ?? [],
      regular: regular.data ?? [],
      reservations: reservations.data ?? [],
    });
  } catch (error) {
    console.error("booking read", error);

    res.status(500).json({
      message: "예약 데이터를 조회하지 못했습니다.",
    });
  }
});

// 예약 등록: 인증 구현 전 비활성화
bookingRouter.post("/schools/:id/booking/reservations", (_req, res) => {
  res.status(501).json({
    message: "예약 등록은 인증 및 DB 충돌검사 구현 후 활성화됩니다.",
  });
});

// 관리자 API: 인증 구현 전 비활성화
bookingRouter.all("/admin/booking{/*splat}", (_req, res) => {
  res.status(501).json({
    message: "관리자 인증 구현 후 설정 저장 API를 연결하세요.",
  });
});
