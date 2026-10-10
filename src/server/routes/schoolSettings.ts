import { Router } from "express";
import { getSupabase } from "../supabase";

export const schoolSettingsRouter = Router();

type SchoolRow = { id: string; public_id: number; name: string };

// 공개 설정 읽기 전용: 공개 학교 번호를 UUID로 변환한 뒤 해당 학교 자료만 조회
schoolSettingsRouter.get("/schools/:id/settings", async (req, res) => {
  const raw = req.params.id;
  const publicId = Number(raw);
  if (!/^[1-9]\d*$/.test(raw ?? "") || !Number.isSafeInteger(publicId)) {
    res.status(400).json({ message: "올바른 학교 번호가 필요합니다." });
    return;
  }
  try {
    const db = getSupabase();
    const school = await db.from("schools").select("id,public_id,name").eq("public_id", publicId).maybeSingle();
    if (school.error) throw school.error;
    const schoolData = school.data as SchoolRow | null;
    if (!schoolData) {
      res.status(404).json({ message: "학교를 찾을 수 없습니다." });
      return;
    }
    const schoolUuid = schoolData.id;
    const [types, resources, periods, categories, versions, regular] = await Promise.all([
      db.from("booking_types").select("id,name,sort_order,is_active").eq("school_id", schoolUuid).order("sort_order"),
      db.from("booking_resources").select("id,type_id,name,description,sort_order,is_active").eq("school_id", schoolUuid).order("sort_order"),
      db.from("booking_periods").select("id,label,start_time,end_time,sort_order,is_active").eq("school_id", schoolUuid).order("sort_order"),
      db.from("daily_categories").select("id,category_code").eq("school_id", schoolUuid).order("id"),
      db.from("daily_category_versions").select("id,category_id,category_name,sort_order,valid_from,valid_until").eq("school_id", schoolUuid).order("valid_from", { ascending: false }),
      db.from("booking_regular_schedules").select("id,resource_id,period_id,weekday,label,valid_from,valid_until").eq("school_id", schoolUuid).order("weekday"),
    ]);
    for (const result of [types, resources, periods, categories, versions, regular]) {
      if (result.error) throw result.error;
    }
    res.setHeader("Cache-Control", "no-store");
    res.json({
      school: { public_id: schoolData.public_id, name: schoolData.name },
      types: types.data ?? [], resources: resources.data ?? [], periods: periods.data ?? [],
      categories: categories.data ?? [], versions: versions.data ?? [], regular: regular.data ?? [],
    });
  } catch (error) {
    console.error("school settings read", error);
    res.status(500).json({ message: "학교 설정을 불러오지 못했습니다." });
  }
});

// 쓰기 API는 학교별 실제 인증·인가를 구현하기 전까지 열지 않습니다.
