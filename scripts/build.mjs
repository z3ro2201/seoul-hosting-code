import { build } from "esbuild";
import { rm, mkdir, cp, writeFile } from "node:fs/promises";
import path from "node:path";
const root = process.cwd();
await rm("dist", { recursive: true, force: true });
await mkdir("dist/assets", { recursive: true });
await cp("public", "dist/public", { recursive: true });
await cp("public/style.css", "dist/assets/style.css");
await build({ entryPoints: ["src/client/entry.tsx"], bundle: true, minify: true, format: "esm", platform: "browser", target: "es2022", outfile: "dist/assets/client.js" });
const serverOptions = { bundle: true, platform: "node", format: "esm", target: "node22", packages: "external", banner: { js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);' } };
await build({ ...serverOptions, entryPoints: ["src/server/index.ts"], outfile: "dist/server.mjs" });
await build({ ...serverOptions, entryPoints: ["src/server/render.tsx"], outfile: "dist/render.mjs" });
await mkdir("dist/prerender", { recursive: true });
const { renderDocument } = await import(path.join(root, "dist/render.mjs"));
for (const route of ["/", "/about"]) {
  await writeFile(path.join("dist/prerender", route === "/" ? "index.html" : `${route.slice(1)}.html`), renderDocument(route));
}
console.log("Build completed: SSR + prerendered / and /about");
