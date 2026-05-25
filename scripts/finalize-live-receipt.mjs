import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ENTITY_TYPES } from "../src/schema.mjs";
import { validateLiveWriteResult } from "./live-write-result-rules.mjs";

const root = new URL("..", import.meta.url);
const inputPath = path.resolve(
  process.env.LIVE_WRITE_RESULT_PATH ?? fileURLToPath(new URL("data/live-write-result.example.json", root)),
);
const baseReceiptPath = path.resolve(
  process.env.BASE_RECEIPT_PATH ?? fileURLToPath(new URL("out/proof-memory-receipt.json", root)),
);
const outputPath = path.resolve(
  process.env.LIVE_RECEIPT_PATH ?? fileURLToPath(new URL("out/live-proof-memory-receipt.json", root)),
);

const liveWriteResult = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const allowExampleRefs = inputPath.endsWith("live-write-result.example.json");
const liveWriteFindings = validateLiveWriteResult(liveWriteResult, {
  allowExampleRefs,
});
if (liveWriteFindings.length > 0) {
  throw new Error(
    `Live write result failed validation:\n${liveWriteFindings
      .map((finding) => `- ${finding}`)
      .join("\n")}`,
  );
}

const receipt = JSON.parse(fs.readFileSync(baseReceiptPath, "utf8"));
const nowIso = process.env.LIVE_RECEIPT_GENERATED_AT ?? new Date().toISOString();

function replaceAttribute(entity, key, value) {
  const attribute = entity.attributes?.find((candidate) => candidate.key === key);
  if (!attribute) {
    throw new Error(`${entity.entityType} missing attribute ${key}`);
  }
  attribute.value = value;
}

function replaceQueryFilter(queryName, key, value) {
  const query = receipt.requiredQueries?.find((candidate) => candidate.name === queryName);
  const filter = query?.filters?.find((candidate) => candidate.key === key);
  if (!filter) {
    throw new Error(`Receipt must include ${queryName} ${key} filter`);
  }
  filter.value = value;
}

const workItems = (receipt.entities ?? []).filter(
  (entity) => entity.entityType === ENTITY_TYPES.WorkItem,
);
const proofPacket = receipt.entities?.find(
  (entity) => entity.entityType === ENTITY_TYPES.ProofPacketSummary,
);
const reviewEvent = receipt.entities?.find(
  (entity) => entity.entityType === ENTITY_TYPES.ReviewEvent,
);

if (workItems.length === 0 || !proofPacket || !reviewEvent) {
  throw new Error("Receipt must include work item, proof packet, and review event entities");
}

for (const workItem of workItems) {
  replaceAttribute(workItem, "proofWorkspaceKey", liveWriteResult.proofWorkspaceEntityKey);
}
replaceAttribute(proofPacket, "proofWorkspaceKey", liveWriteResult.proofWorkspaceEntityKey);
replaceAttribute(reviewEvent, "proofWorkspaceKey", liveWriteResult.proofWorkspaceEntityKey);
replaceAttribute(proofPacket, "workItemKey", liveWriteResult.workItemEntityKey);
replaceAttribute(reviewEvent, "workItemKey", liveWriteResult.workItemEntityKey);

replaceQueryFilter(
  "reviewEventsByProofWorkspace",
  "proofWorkspaceKey",
  liveWriteResult.proofWorkspaceEntityKey,
);
replaceQueryFilter(
  "reviewEventsByWorkItem",
  "workItemKey",
  liveWriteResult.workItemEntityKey,
);

receipt.generatedAt = nowIso;
receipt.status = "live_written_pending_submission";
receipt.liveConfiguredRoadmap = {
  live: [
    "public-safe receipt generation",
    "schema and redaction verification",
    "five-step ProofForge Lite app bundle",
    "Arkiv Braga entity write",
    "project-scoped Arkiv query evidence",
  ],
  configured: ["public deployment after Devinson approval"],
  roadmap: [
    "real maintainer acceptance signatures",
    "encrypted private payload grants",
    "cross-opportunity proof history import",
  ],
};
receipt.protocolRefs = {
  proofWorkspaceEntityKey: liveWriteResult.proofWorkspaceEntityKey,
  workItemEntityKey: liveWriteResult.workItemEntityKey,
  workItemEntityKeys: liveWriteResult.workItemEntityKeys,
  workItemCountWritten: liveWriteResult.workItemCountWritten,
  proofPacketEntityKey: liveWriteResult.proofPacketEntityKey,
  reviewEventEntityKey: liveWriteResult.reviewEventEntityKey,
  txHashes: liveWriteResult.txHashes,
  owner: liveWriteResult.owner,
  creator: liveWriteResult.creator,
  metadataEvidence: liveWriteResult.metadataEvidence,
  queriedAt: liveWriteResult.queriedAt,
  queryEvidence: liveWriteResult.queryEvidence,
};
receipt.verifier = {
  status: "pending",
  command: `RECEIPT_PATH=${path.relative(process.cwd(), outputPath)} npm run verify`,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`wrote ${path.relative(process.cwd(), outputPath)}`);
