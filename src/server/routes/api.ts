import { Router } from "express";
import { excelRouter } from "./mealExcel";
import { bookingRouter } from "./booking";
import { schoolSettingsRouter } from "./schoolSettings";
import { adminAuthRouter } from "./adminAuth";
export const apiRouter = Router();
apiRouter.use("/admin", adminAuthRouter);
apiRouter.use(bookingRouter);
apiRouter.use(schoolSettingsRouter);

apiRouter.get("/health", (_req, res) => res.json({ ok: true, message: "API 연결 정상" }));

// 학교 검색
apiRouter.get("/school/search", async (_req, res) => {
  const { keyword } = _req.query;
  if (typeof keyword !== "string") return res.status(400).json({ status: 400, message: "학교명을 입력하세요." });

  const response = await fetch(`https://open.neis.go.kr/hub/schoolInfo?Type=json&pIndex=1&pSize=100&SCHUL_NM=${encodeURIComponent(keyword)}&ATPT_OFCDC_SC_CODE=B10`);
  if (!response.ok) return res.status(500).json({ status: 500, message: "검색에 문제가 발생했습니다." });

  const result = await response.json();
  const schoolList = result.schoolInfo?.[1]?.row ?? [];
  console.log(schoolList);
  return res.json({
    status: 200,
    message: "조회 성공",
    data: schoolList.map((school: any) => ({
      name: school.SCHUL_NM,
      officeCode: school.ATPT_OFCDC_SC_CODE,
      schoolCode: school.SD_SCHUL_CODE,
      officeName: school.ATPT_OFCDC_SC_NM,
      subOfficeName: school.JU_ORG_NM,
      schoolAddress: school.ORG_RDNMA,
      schoolPostalCode: school.ORG_RDNZC,
      schoolHomepage: school.HMPG_ADRES,
      schoolTel: school.ORG_TELNO,
      schoolType: school.SCHUL_KND_SC_NM,
    })),
  });
});

// 급식 조회
// 날짜,아침0점심1저녁2,제목,식단,kcal
apiRouter.get("/meal", async (_req, res) => {
  const { officeCode, schoolCode, date } = _req.query;
  if (typeof officeCode !== "string" || typeof schoolCode !== "string" || typeof date !== "string") {
    return res.status(400).json({ status: 400, message: "급식 조회에 필요한 정보가 부족합니다." });
  }

  const [year, month] = date.split("-").map((v) => parseInt(v, 10));
  if (!year || !month) return res.status(400).json({ status: 400, message: "급식 조회에 필요한 정보가 부족합니다." });

  const response = await fetch(
    `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=${encodeURIComponent(officeCode)}&SD_SCHUL_CODE=${encodeURIComponent(schoolCode)}&MLSV_YMD=${year}${month.toString().padStart(2, "0")}`,
  );
  if (!response.ok) return res.status(500).json({ status: 500, message: "조회에 문제가 발생했습니다." });

  const result = await response.json();
  const mealList = result.mealServiceDietInfo?.[1]?.row ?? [];
  return res.json({
    status: 200,
    message: "조회 성공",
    data: mealList.map((meal: any) => ({
      MealCode: Number(meal.MMEAL_SC_CODE) - 1,
      MealTitle: meal.MMEAL_SC_NM,
      MealKcal: meal.CAL_INFO.replace(/[^\d.]/g, ""),
      MealDate: meal.MLSV_YMD,
      MealMenu: String(meal.DDISH_NM ?? "")
        .split(/<br\s*\/?>/i)
        .map((menu: string) => menu.replace(/\([\d.]+\)/g, "").trim())
        .filter(Boolean)
        .join(", "),
    })),
  });
});

apiRouter.use("/meal", excelRouter);
