import React from "react";
import { hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "../shared/routes";

const container = document.getElementById("app");
if (!container) throw new Error("#app이 없습니다.");
hydrateRoot(container, <BrowserRouter><App /></BrowserRouter>);
