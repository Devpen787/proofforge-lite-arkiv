import esbuild from "esbuild";

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
