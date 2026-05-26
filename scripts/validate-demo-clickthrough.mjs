import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = new URL("..", import.meta.url);
const webRoot = new URL("web/", root);
const outRoot = new URL("out/", root);
const rootPath = fileURLToPath(root);
const webRootPath = fileURLToPath(webRoot);

const failures = [];

function fail(message) {
  failures.push(message);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function mimeTypeFor(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

function createStaticServer() {
  return http.createServer((request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
    const decodedPath = decodeURIComponent(requestUrl.pathname);
    const relativePath = decodedPath === "/" ? "index.html" : decodedPath.slice(1);
    const filePath = path.resolve(webRootPath, relativePath);

    if (!filePath.startsWith(webRootPath) || !fs.existsSync(filePath)) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("not found");
      return;
    }

    response.writeHead(200, { "content-type": mimeTypeFor(filePath) });
    response.end(fs.readFileSync(filePath));
  });
}

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Static demo server did not bind to a TCP port");
  }
  return `http://127.0.0.1:${address.port}/`;
}

async function clickStep(page, step, expectedPanel, expectedHeading) {
  await page.getByRole("button", { name: step, exact: true }).click();
  await page.waitForTimeout(50);
  const activePanel = await page.locator(".step-panel.active").getAttribute("data-step");
  const heading = (
    (await page.locator(".step-panel.active h2, .step-panel.active h3").first().textContent()) ??
    ""
  ).trim();

  assert(activePanel === expectedPanel, `${step} opened ${activePanel}, expected ${expectedPanel}`);
  assert(
    heading.includes(expectedHeading),
    `${step} heading was "${heading}", expected to include "${expectedHeading}"`,
  );
}

async function runViewport(page, viewport, label) {
  await page.setViewportSize(viewport);
  await page.reload({ waitUntil: "networkidle" });

  const productHeading = ((await page.locator("h1").first().textContent()) ?? "").trim();
  assert(
    productHeading === "ProofForge Lite",
    `${label} primary heading was "${productHeading}", expected "ProofForge Lite"`,
  );
  const proofPathText = ((await page.locator(".proof-path").first().textContent()) ?? "").replace(/\s+/g, " ");
  assert(
    proofPathText.includes("Work lead") &&
      proofPathText.includes("Mission gate") &&
      proofPathText.includes("Proof node") &&
      proofPathText.includes("Case file") &&
      proofPathText.includes("Public proof"),
    `${label} proof path strip is missing the agent-ops proof story`,
  );
  const arkivRoleCount = await page.locator(".arkiv-role-grid article").count();
  assert(arkivRoleCount === 4, `${label} expected 4 Arkiv role cards, found ${arkivRoleCount}`);

  for (const [step, panel, heading] of [
    ["Work", "work", "Source-backed work"],
    ["Preflight", "preflight", "Run only if"],
    ["Proof Packet", "packet", "Only public-safe facts"],
    ["Arkiv Memory", "memory", "Six Arkiv records"],
    ["Verify", "verify", "Reviewer reads proof history"],
  ]) {
    await clickStep(page, step, panel, heading);
  }

  await page.getByRole("button", { name: "Build proof packet", exact: true }).click();
  await page.waitForTimeout(50);
  const packetText = (await page.locator("#receiptOutput").textContent()) ?? "";
  assert(packetText.includes("proofforge-lite-arkiv-ethns-2026"), `${label} packet omits project attribute`);
  assert(packetText.includes("every durable public ProofForge Lite record"), `${label} packet omits Arkiv durable-data claim`);
  assert(packetText.includes("proof_packet_summary.workItemKey -> work_item.$key"), `${label} packet omits work item relationship`);

  await page.getByRole("button", { name: "Inspect Arkiv schema", exact: true }).click();
  await page.waitForTimeout(50);
  const schemaText = (await page.locator("#receiptOutput").textContent()) ?? "";
  assert(schemaText.includes("work_item"), `${label} schema omits work_item`);
  assert(schemaText.includes("reviewEventsByWorkItem"), `${label} schema omits reviewEventsByWorkItem`);

  await page.getByRole("button", { name: "Arkiv Memory", exact: true }).click();
  assert(await page.locator("#liveWrite").isDisabled(), `${label} live write must stay disabled before wallet approval`);
  assert(!(await page.locator("#queryArkiv").isDisabled()), `${label} Braga query should be public-read enabled before wallet approval`);

  await page.getByRole("button", { name: "Verify", exact: true }).click();
  assert(
    await page.locator("#copyLiveResult").isDisabled(),
    `${label} copy live result must stay disabled before approved live write`,
  );

  const noHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
  assert(noHorizontalOverflow, `${label} has horizontal overflow`);
}

for (const required of ["index.html", "styles.css", "app.bundle.js"]) {
  if (!fs.existsSync(new URL(required, webRoot))) {
    fail(`web/${required} is missing; run npm run build:web first`);
  }
}

let browser;
let server;

try {
  if (failures.length === 0) {
    server = createStaticServer();
    const url = await listen(server);
    browser = await chromium.launch({
      channel: process.env.DEMO_BROWSER_CHANNEL ?? "chrome",
      headless: true,
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle" });

    await runViewport(page, { width: 1440, height: 1100 }, "desktop");
    await runViewport(page, { width: 390, height: 920 }, "mobile");

    fs.mkdirSync(outRoot, { recursive: true });
    await page.screenshot({
      path: fileURLToPath(new URL("demo-clickthrough-verify.png", outRoot)),
      fullPage: true,
    });
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
} finally {
  await browser?.close();
  await new Promise((resolve) => server?.close(resolve) ?? resolve());
}

if (failures.length > 0) {
  console.error("Demo click-through validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Demo click-through validation passed for ${path.relative(process.cwd(), rootPath) || "."}`);
