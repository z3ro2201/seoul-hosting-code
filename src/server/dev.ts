import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import react from "@vitejs/plugin-react";
import { apiRouter } from "./routes/api";

async function main() {
  const app = express();

  const port = Number(process.env.PORT ?? 8080);
  const host = process.env.HOST ?? "127.0.0.1";

  app.disable("x-powered-by");
  app.use(express.json({ limit: "128kb" }));

  // Express API
  app.use((req, res, next) => {
    if (req.path === "/school" || req.path.startsWith("/school/")) {
      res.setHeader("X-Robots-Tag", "noindex, nofollow");
      res.setHeader("Cache-Control", "no-cache");
    }
    next();
  });
  app.use("/api", apiRouter);

  // Vite 개발 서버
  const vite = await createViteServer({
    configFile: false,
    plugins: [react()],
    server: {
      middlewareMode: true,
    },
    appType: "custom",
  });

  app.use(vite.middlewares);

  // React SSR
  app.get("/{*splat}", async (req, res, next) => {
    try {
      const pathname = req.path;

      const { renderDocument } = await vite.ssrLoadModule("/src/server/render.tsx");

      const { getRouteMeta } = await vite.ssrLoadModule("/src/shared/routes.tsx");

      let html = renderDocument(pathname) as string;

      html = html.replace("/assets/style.css", "/style.css").replace("/assets/client.js", "/src/client/entry.tsx");

      html = await vite.transformIndexHtml(req.originalUrl, html);

      res
        .status(Boolean(getRouteMeta(pathname)) ? 200 : 404)
        .type("html")
        .send(html);
    } catch (error) {
      vite.ssrFixStacktrace(error as Error);
      next(error);
    }
  });

  const server = app.listen(port, host, () => {
    console.log(`Development: http://${host}:${port}`);
  });

  const shutdown = () => {
    server.close();
    void vite.close();
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch(console.error);
