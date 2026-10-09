import { Router } from "express";
export const apiRouter = Router();

// 실제 API는 여기에서 별도 라우터로 나눠 추가하세요.
apiRouter.get("/health", (_req, res) => res.json({ ok: true, message: "API 연결 정상" }));
