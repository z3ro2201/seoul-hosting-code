import { Router } from "express";
import ExcelJS from "exceljs";

export const excelRouter = Router();

interface Meal {
  MealCode: number;
  MealTitle: string;
  MealKcal: string | number;
  MealDate: string;
  MealMenu: string;
}

excelRouter.post("/excel", async (req, res) => {
  try {
    const meals: Meal[] = req.body?.meals;

    if (!Array.isArray(meals) || meals.length === 0 || meals.length > 1000) {
      res.status(400).json({
        status: 400,
        message: "급식 데이터가 올바르지 않습니다.",
      });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("급식정보");

    sheet.columns = [
      { header: "년월일", key: "date", width: 15 },
      { header: "식사구분", key: "type", width: 12 },
      { header: "제목", key: "title", width: 20 },
      { header: "식단", key: "menu", width: 65 },
      { header: "Kcal", key: "calories", width: 15 },
    ];

    for (const meal of meals) {
      const type = Number(meal.MealCode);

      if (!/^\d{8}$/.test(String(meal.MealDate)) || ![0, 1, 2].includes(type)) {
        res.status(400).json({
          message: "급식 날짜 또는 식사 코드가 올바르지 않습니다.",
        });
        return;
      }

      const menu = String(meal.MealMenu ?? "").trim();

      const calories = Number.parseFloat(String(meal.MealKcal ?? "")) || 0;

      sheet.addRow({
        date: String(meal.MealDate),
        type,
        title: String(meal.MealTitle ?? "").trim() || String(type),
        menu: menu || "메뉴없음",
        calories,
      });
    }

    sheet.getColumn("date").numFmt = "@";
    sheet.getColumn("calories").numFmt = "0.##";

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    sheet.getColumn("menu").alignment = {
      vertical: "middle",
      wrapText: true,
    };

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    res.setHeader("Content-Disposition", 'attachment; filename="meal.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("엑셀 생성 오류:", error);

    if (!res.headersSent) {
      res.status(500).json({
        status: 500,
        message: "엑셀 생성에 실패했습니다.",
      });
    } else {
      res.destroy();
    }
  }
});
