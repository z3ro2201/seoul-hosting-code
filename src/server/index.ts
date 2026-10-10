import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { apiRouter } from "./routes/api";
import { renderDocument } from "./render";
import { getRouteMeta, staticPaths } from "../shared/routes";

const app = express();
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const port = Number(process.env.PORT ?? 8080);
const host = process.env.HOST ?? "0.0.0.0";
app.disable("x-powered-by");
app.use(express.json({ limit: "128kb" }));
app.use((req, res, next) => {
    if (req.path === "/school" || req.path.startsWith("/school/")) {
      res.setHeader("X-Robots-Tag", "noindex, nofollow");
      res.setHeader("Cache-Control", "no-cache");
    }
    next();
  });
  app.use("/api", apiRouter);
app.use("/assets", express.static(path.join(dist, "assets"), { maxAge: "7d", immutable: true }));
app.use(express.static(path.join(dist, "public"), { index: false }));

// 빌드 시 생성된 정적 페이지(SSG) 우선 반환
for (const route of staticPaths) {
  app.get(route, (_req, res) => {
    const filename = route === "/" ? "index.html" : `${route.slice(1)}.html`;
    res.type("html").sendFile(path.join(dist, "prerender", filename));
  });
}
// 나머지 페이지는 실제 React SSR. 정의되지 않은 주소는 HTTP 404.
app.get("/{*splat}", (req, res) => {
  const pathname = req.path;
  const known = Boolean(getRouteMeta(pathname));
  res.status(known ? 200 : 404).type("html").send(renderDocument(pathname));
});
app.listen(port, host, () => console.log(`Listening on http://${host}:${port}`));
