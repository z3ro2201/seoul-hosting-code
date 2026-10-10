import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "../shared/routes";

const container = document.getElementById("app");
if (!container) throw new Error("#app이 없습니다.");
// CSR 페이지는 서버가 비어 있는 #app을 반환하므로 createRoot 사용
// SSR/SSG 페이지는 기존 HTML에 hydrateRoot 사용
const app = <BrowserRouter><App /></BrowserRouter>;
if (container.hasChildNodes()) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}
