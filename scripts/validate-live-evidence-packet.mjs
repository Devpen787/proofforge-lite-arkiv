import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateLiveWriteResult } from "./live-write-result-rules.mjs";

const root = new URL("..", import.meta.url);
const packetPath = path.resolve(
  process.env.LIVE_EVIDENCE_PACKET_PATH ??
    fileURLToPath(new URL("data/live-evidence-packet.example.json", root)),
);
const packet = JSON.parse(fs.readFileSync(packetPath, "utf8"));
const allowExample = packetPath.endsWith("live-evidence-packet.example.json");
const failures = [];
const evmAddressPattern = /^0x[0-9a-f]{40}$/i;
const httpsUrlPattern = /^https:\/\/\S+\.\S+/i;

function resolveRootPath(relativePath) {
  return path.resolve(fileURLToPath(root), relativePath);
}

function fail(message) {
  failures.push(message);
}

if (!Number.isFinite(Date.parse(packet.capturedAt ?? ""))) {
  fail("capturedAt must be an ISO timestamp");
}

for (const field of ["publicRepoUrl", "deployedDemoUrl", "demoVideoUrl"]) {
  const value = packet[field] ?? "";
  if (allowExample) {
    if (!value.startsWith("PENDING_")) {
      fail(`${field} must use a PENDING_ marker in the example packet`);
    }
  } else if (!httpsUrlPattern.test(value) || value.includes("PENDING")) {
    fail(`${field} must be a non-pending https URL`);
  }
}

if (!evmAddressPattern.test(packet.approvedWalletAddress ?? "")) {
  fail("approvedWalletAddress must be a valid EVM address");
}

if (packet.bragaExplorerBaseUrl !== "https://explorer.braga.hoodi.arkiv.network") {
  fail("bragaExplorerBaseUrl must be the Braga explorer URL");
}

if (packet.verifierCommand !== "RECEIPT_PATH=out/live-proof-memory-receipt.json npm run verify") {
  fail("verifierCommand must match the expected live receipt verifier command");
}

if (packet.verifierStatus !== "passed") {
  fail("verifierStatus must be passed");
}

if (!Array.isArray(packet.screenshotPaths) || packet.screenshotPaths.length < 2) {
  fail("screenshotPaths must include desktop and mobile evidence");
}

for (const screenshotPath of packet.screenshotPaths ?? []) {
  if (!fs.existsSync(resolveRootPath(screenshotPath))) {
    fail(`screenshot path is missing: ${screenshotPath}`);
  }
}

for (const field of ["liveWriteResultPath", "liveReceiptPath"]) {
  if (!packet[field] || path.isAbsolute(packet[field]) || packet[field].includes("..")) {
    fail(`${field} must be a relative in-package path`);
  } else if (!fs.existsSync(resolveRootPath(packet[field]))) {
    fail(`${field} does not exist: ${packet[field]}`);
  }
}

if (packet.liveWriteResultPath && fs.existsSync(resolveRootPath(packet.liveWriteResultPath))) {
  const liveWriteResult = JSON.parse(
    fs.readFileSync(resolveRootPath(packet.liveWriteResultPath), "utf8"),
  );
  for (const finding of validateLiveWriteResult(liveWriteResult, { allowExampleRefs: allowExample })) {
    fail(`liveWriteResult: ${finding}`);
  }

  if (
    !allowExample &&
    packet.approvedWalletAddress.toLowerCase() !== liveWriteResult.owner.toLowerCase()
  ) {
    fail("approvedWalletAddress must match live write owner");
  }
}

if (packet.liveReceiptPath && fs.existsSync(resolveRootPath(packet.liveReceiptPath))) {
  const liveReceiptText = fs.readFileSync(resolveRootPath(packet.liveReceiptPath), "utf8");
  const liveReceipt = JSON.parse(liveReceiptText);
  if (liveReceipt.status !== "live_written_pending_submission") {
    fail(`live receipt status is ${liveReceipt.status}`);
  }
  if (!allowExample && /(111111111111|222222222222|333333333333|aaaaaaaa|bbbbbbbb)/i.test(liveReceiptText)) {
    fail("live receipt still contains example refs");
  }
}

const serialized = JSON.stringify(packet);
for (const forbidden of [
  [".", "proofforge-private"].join(""),
  ["", "Users", ""].join("/"),
]) {
  if (serialized.includes(forbidden)) {
    fail(`live evidence packet contains forbidden private marker: ${forbidden}`);
  }
}

if (!allowExample && serialized.includes("PENDING_")) {
  fail("real live evidence packet contains a PENDING_ marker");
}

if (failures.length > 0) {
  console.error("Live evidence packet validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Live evidence packet validation passed (${allowExample ? "example packet" : "real packet"})`,
);
