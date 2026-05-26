import fs from "node:fs";

const root = new URL("..", import.meta.url);
const html = fs.readFileSync(new URL("web/index.html", root), "utf8");
const css = fs.readFileSync(new URL("web/styles.css", root), "utf8");
const bundle = fs.readFileSync(new URL("web/app.bundle.js", root), "utf8");
const brotliWasm = fs.readFileSync(new URL("web/brotli_wasm_bg.wasm", root));
const packageJson = JSON.parse(fs.readFileSync(new URL("package.json", root), "utf8"));
const failures = [];

function fail(message) {
  failures.push(message);
}

for (const [relativePath, text] of [
  ["web/index.html", html],
  ["web/styles.css", css],
  ["web/app.bundle.js", bundle],
]) {
  if (text.length < 100) {
    fail(`${relativePath} is unexpectedly small`);
  }
}

for (const [relativePath, text] of [
  ["web/index.html", html],
  ["web/styles.css", css],
]) {
  for (const forbidden of [
    [".", "proofforge-private"].join(""),
    ["/", "Users", "/"].join(""),
    "localhost",
    "http://127.0.0.1",
  ]) {
    if (text.includes(forbidden)) {
      fail(`${relativePath} contains non-public deploy marker: ${forbidden}`);
    }
  }
}

if (brotliWasm.length < 1000) {
  fail("web/brotli_wasm_bg.wasm is unexpectedly small");
}

if (
  brotliWasm[0] !== 0x00 ||
  brotliWasm[1] !== 0x61 ||
  brotliWasm[2] !== 0x73 ||
  brotliWasm[3] !== 0x6d
) {
  fail("web/brotli_wasm_bg.wasm is not a valid WebAssembly binary");
}

for (const expected of [
  "ProofForge Lite",
  "Powered by Arkiv",
  "Private agent work. Public Arkiv proof.",
  "Connect Braga wallet",
  "Run proof path",
  "Build proof packet",
  "Show evidence",
  "Query Braga",
  "Public reads are open. Wallet approval is only required for Braga writes.",
  "runner passed · verifier passed · packager ready · human approval required",
  "RECEIPT_PATH=out/live-proof-memory-receipt.json npm run verify",
  "Work",
  "Preflight",
  "Proof Node",
  "Arkiv Memory",
  "Verify",
  "Write Arkiv entities",
  "Copy live result",
  "6 records · 4 entity types · project=proofforge-lite-arkiv-ethns-2026",
  "Six Arkiv records across four entity types",
]) {
  if (!html.includes(expected)) {
    fail(`web/index.html missing demo phrase: ${expected}`);
  }
}

for (const expected of [
  'href="./styles.css"',
  'src="./app.bundle.js"',
  'aria-label="ProofForge Lite flow"',
  'aria-live="polite"',
]) {
  if (!html.includes(expected)) {
    fail(`web/index.html missing static/accessibility marker: ${expected}`);
  }
}

for (const expected of [
  "grid-template-columns: repeat(auto-fit, minmax(108px, 1fr))",
  "overflow-x: visible",
  "word-break: break-word",
  "@media (max-width: 860px)",
]) {
  if (!css.includes(expected)) {
    fail(`web/styles.css missing mobile-safety marker: ${expected}`);
  }
}

for (const expected of [
  "publishProofMemory",
  "createBrowserWalletClient",
  "queryWorkItemsByProject",
  "queryWorkItemsByStatus",
  "queryProofPacketsByStatus",
  "queryProofPacketsBySourceType",
  "queryRecentProofPackets",
  "queryReviewEventsByProofWorkspace",
  "queryReviewEventsByWorkItem",
  "safeJsonStringify",
  "latestLiveWriteResult",
  "PROJECT_ATTRIBUTE",
]) {
  if (!bundle.includes(expected)) {
    fail(`web/app.bundle.js missing live-flow marker: ${expected}`);
  }
}

if (packageJson.dependencies?.["@arkiv-network/sdk"] !== "0.6.8") {
  fail("package.json must pin @arkiv-network/sdk to 0.6.8");
}

if (failures.length > 0) {
  console.error("Web smoke validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Web smoke validation passed");
