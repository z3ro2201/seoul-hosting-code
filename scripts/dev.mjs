import { execFileSync } from "node:child_process";
execFileSync(process.execPath, ["scripts/build.mjs"], { stdio: "inherit" });
await import("../dist/server.mjs");
