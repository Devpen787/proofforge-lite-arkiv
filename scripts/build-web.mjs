import esbuild from "esbuild";
import fs from "node:fs";

const root = new URL("..", import.meta.url);
const brotliWasmSource = new URL(
  "node_modules/brotli-wasm/pkg.web/brotli_wasm_bg.wasm",
  root,
);
const brotliWasmTarget = new URL("web/brotli_wasm_bg.wasm", root);

await esbuild.build({
  entryPoints: ["src/browser-app.ts"],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2022"],
  outfile: "web/app.bundle.js",
  sourcemap: false,
  logLevel: "info",
});

fs.copyFileSync(brotliWasmSource, brotliWasmTarget);
