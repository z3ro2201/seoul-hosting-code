import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { App, getRouteMeta } from "../shared/routes";

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
export function renderDocument(pathname: string): string {
  const meta = getRouteMeta(pathname) ?? { title: "페이지를 찾을 수 없음", description: "404" };
  // 학교별 화면은 CSR로만 렌더링. (관리자는 기존 SSR 설정 유지)
  const isSchoolCsr = /^\/school\/(?!admin(?:\/|$))[^/]+\/(?:daily|booking)(?:\/reservation)?\/?$/.test(pathname);
  const content = isSchoolCsr ? "" : renderToString(<StaticRouter location={pathname}><App /></StaticRouter>);
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(meta.title)}</title>${pathname === "/school" || pathname.startsWith("/school/") ? '<meta name="robots" content="noindex,nofollow">' : ""}<meta name="description" content="${escapeHtml(meta.description)}">
<link rel="stylesheet" href="/assets/style.css"><script type="module" src="/assets/client.js"></script>
</head><body><div id="app">${content}</div></body></html>`;
}
