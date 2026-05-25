import fs from "node:fs";

const root = new URL("..", import.meta.url);
const packageJson = JSON.parse(fs.readFileSync(new URL("package.json", root), "utf8"));
const lockPath = new URL("package-lock.json", root);
const failures = [];

if (packageJson.dependencies?.["@arkiv-network/sdk"] !== "0.6.8") {
  failures.push("package.json must pin @arkiv-network/sdk to 0.6.8");
}

if (!fs.existsSync(lockPath)) {
  failures.push("package-lock.json is required for reproducible public setup");
}

const sdk = await import("@arkiv-network/sdk");
const chains = await import("@arkiv-network/sdk/chains");
const query = await import("@arkiv-network/sdk/query");
const utils = await import("@arkiv-network/sdk/utils");
const adapter = await import("../src/arkiv-adapter-template.ts");

for (const name of ["createPublicClient", "createWalletClient", "custom", "http"]) {
  if (typeof sdk[name] !== "function") {
    failures.push(`@arkiv-network/sdk missing function export ${name}`);
  }
}

if (!chains.braga) {
  failures.push("@arkiv-network/sdk/chains missing braga export");
}

for (const name of ["eq", "gte"]) {
  if (typeof query[name] !== "function") {
    failures.push(`@arkiv-network/sdk/query missing function export ${name}`);
  }
}

if (typeof utils.jsonToPayload !== "function") {
  failures.push("@arkiv-network/sdk/utils missing jsonToPayload export");
}

if (typeof utils.ExpirationTime?.fromDays !== "function") {
  failures.push("@arkiv-network/sdk/utils missing ExpirationTime.fromDays");
}

for (const name of [
  "BRAGA_CHAIN_ID_HEX",
  "createArkivPublicClient",
  "createBrowserWalletClient",
  "ensureBragaWalletChain",
  "publishProofMemory",
  "publishProofMemoryBatch",
  "queryWorkItemsByProject",
  "queryWorkItemsByStatus",
  "queryProofPacketsBySourceType",
  "queryProofPacketsByStatus",
  "queryRecentProofPackets",
  "queryReviewEventsByProofWorkspace",
  "queryReviewEventsByWorkItem",
  "toArkivCreatePayload",
]) {
  if (name === "BRAGA_CHAIN_ID_HEX") {
    if (typeof adapter[name] !== "string" || !adapter[name].startsWith("0x")) {
      failures.push("Arkiv adapter missing BRAGA_CHAIN_ID_HEX");
    }
    continue;
  }

  if (typeof adapter[name] !== "function") {
    failures.push(`Arkiv adapter missing ${name}`);
  }
}

if (failures.length > 0) {
  console.error("Arkiv adapter verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Arkiv adapter verification passed");
