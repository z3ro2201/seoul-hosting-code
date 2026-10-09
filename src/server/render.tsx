import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { App, routeMeta } from "../shared/routes";

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
export function renderDocument(pathname: string): string {
  const meta = routeMeta[pathname] ?? { title: "페이지를 찾을 수 없음", description: "404" };
  const content = renderToString(<StaticRouter location={pathname}><App /></StaticRouter>);
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(meta.title)}</title><meta name="description" content="${escapeHtml(meta.description)}">
<link rel="stylesheet" href="/assets/style.css"><script type="module" src="/assets/client.js"></script>
</head><body><div id="app">${content}</div></body></html>`;
}
