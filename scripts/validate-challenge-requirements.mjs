import fs from "node:fs";

import {
  ENTITY_TYPES,
  PROJECT_ATTRIBUTE,
  REQUIRED_QUERIES,
} from "../src/schema.mjs";

const root = new URL("..", import.meta.url);
const failures = [];

function read(relativePath) {
  return fs.readFileSync(new URL(relativePath, root), "utf8");
}

function fail(message) {
  failures.push(message);
}

function hasProjectAttribute(attributes) {
  return (attributes ?? []).some(
    (attribute) =>
      attribute.key === PROJECT_ATTRIBUTE.key &&
      attribute.value === PROJECT_ATTRIBUTE.value,
  );
}

const packageJson = JSON.parse(read("package.json"));
const receipt = JSON.parse(read("out/proof-memory-receipt.json"));
const liveExample = JSON.parse(read("data/live-write-result.example.json"));
const readmePath = fs.existsSync(new URL("docs/PUBLIC_README_DRAFT.md", root))
  ? "docs/PUBLIC_README_DRAFT.md"
  : "README.md";
const readme = read(readmePath);
const normalizedReadme = readme.replace(/\s+/g, " ");
const requirements = read("docs/REQUIREMENTS_MATRIX.md");
const webHtml = read("web/index.html");
const webBundle = read("web/app.bundle.js");
const licensePath = fs.existsSync(new URL("LICENSE-DRAFT", root))
  ? "LICENSE-DRAFT"
  : "LICENSE";
const license = read(licensePath);

const workItems = receipt.entities.filter(
  (entity) => entity.entityType === ENTITY_TYPES.WorkItem,
);
const entityTypes = new Set(receipt.entities.map((entity) => entity.entityType));

if (!readme.includes("Hybrid: AI + Privacy")) {
  fail("README must declare the AI + Privacy hybrid theme");
}

if (!readme.includes("npm ci") || !readme.includes("npm run check")) {
  fail("README must include setup and local verification instructions");
}

for (const phrase of [
  "all durable public ProofForge Lite records are represented as Arkiv entities",
  "bundled JSON files are only public-safe demo configuration",
  "deployed Braga write as the source of truth",
  "they are not the submitted public database",
  "metadata provenance from the linked",
]) {
  if (!normalizedReadme.includes(phrase)) {
    fail(`README must clarify Arkiv data ownership boundary: ${phrase}`);
  }
}

if (!license.includes("MIT License")) {
  fail("public package must include an open-source license");
}

if (!packageJson.dependencies?.["@arkiv-network/sdk"]) {
  fail("package.json must depend on @arkiv-network/sdk");
}

if (!webHtml.includes("ProofForge Lite") || !webHtml.includes("Write Arkiv entities")) {
  fail("web app must expose a working ProofForge Lite demo surface");
}

for (const marker of [
  "createBrowserWalletClient",
  "publishProofMemory",
  "queryWorkItemsByProject",
  "queryWorkItemsByStatus",
  "queryProofPacketsByStatus",
  "queryProofPacketsBySourceType",
  "queryRecentProofPackets",
  "queryReviewEventsByProofWorkspace",
  "queryReviewEventsByWorkItem",
]) {
  if (!webBundle.includes(marker)) {
    fail(`web bundle missing Arkiv live-flow marker: ${marker}`);
  }
}

for (const requiredType of [
  ENTITY_TYPES.ProofWorkspace,
  ENTITY_TYPES.WorkItem,
  ENTITY_TYPES.ProofPacketSummary,
  ENTITY_TYPES.ReviewEvent,
]) {
  if (!entityTypes.has(requiredType)) {
    fail(`receipt missing required entity type: ${requiredType}`);
  }
}

if (entityTypes.size < 2) {
  fail("challenge requires at least two entity types");
}

if (workItems.length < 3) {
  fail("public-safe Work queue must be represented as Arkiv work_item entities");
}

for (const entity of receipt.entities) {
  if (!hasProjectAttribute(entity.attributes)) {
    fail(`${entity.entityType} missing PROJECT_ATTRIBUTE`);
  }
}

for (const query of REQUIRED_QUERIES) {
  if (!hasProjectAttribute(query.filters)) {
    fail(`query ${query.name} missing PROJECT_ATTRIBUTE`);
  }
}

for (const queryName of [
  "workItemsByProject",
  "workItemsByStatus",
  "packetsByStatus",
  "packetsBySourceType",
  "packetsByCreatedAtRange",
  "reviewEventsByProofWorkspace",
  "reviewEventsByWorkItem",
]) {
  if (!REQUIRED_QUERIES.some((query) => query.name === queryName)) {
    fail(`missing required project-scoped query: ${queryName}`);
  }
}

if (!Array.isArray(liveExample.workItemEntityKeys) || liveExample.workItemEntityKeys.length < workItems.length) {
  fail("live write result shape must include every public-safe work item entity key");
}

if (liveExample.queryEvidence?.workItemsByProjectCount < workItems.length) {
  fail("live write result shape must prove full Work queue query evidence");
}

for (const phrase of [
  "Build a web3-native app where data lives on Arkiv",
  "Arkiv Data Claim",
  "source of truth for every durable public app record",
  "not the submitted public database",
  "Unique `PROJECT_ATTRIBUTE` on every entity",
  "Unique `PROJECT_ATTRIBUTE` on every query",
  "At least 2 entity types",
  "Working deployed demo",
  "README with setup/stack/team/theme/approach",
  "Demo video link",
]) {
  if (!requirements.includes(phrase)) {
    fail(`requirements matrix missing official requirement phrase: ${phrase}`);
  }
}

for (const forbidden of [
  [".", "proofforge-private"].join(""),
  ["/", "Users", "/"].join(""),
  `private ${"key"}`,
  `seed ${"phrase"}`,
  `we ${"submitted"}`,
  "winner",
  `prize ${"received"}`,
]) {
  const publicText = [readme, requirements, webHtml].join("\n").toLowerCase();
  if (publicText.includes(forbidden.toLowerCase())) {
    fail(`public surface contains forbidden marker: ${forbidden}`);
  }
}

if (failures.length > 0) {
  console.error("Challenge requirements validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Challenge requirements validation passed");
