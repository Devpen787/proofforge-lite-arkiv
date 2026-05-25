import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PROJECT_ATTRIBUTE,
  REQUIRED_QUERIES,
  buildProofPacketEntity,
  buildProofWorkspaceEntity,
  buildReviewEventEntity,
  buildWorkItemEntity,
} from "../src/schema.mjs";

const root = new URL("..", import.meta.url);
const packetPath = new URL("data/public-safe-packet.json", root);
const workItemsPath = new URL("data/seed-work-items.json", root);
const outputDir = new URL("out/", root);
const outputPath = new URL("out/proof-memory-receipt.json", root);

const packet = JSON.parse(fs.readFileSync(packetPath, "utf8"));
const workItems = JSON.parse(fs.readFileSync(workItemsPath, "utf8"));
const primaryWorkItem = workItems.find(
  (workItem) => workItem.workItemId === packet.workItemId,
);

if (!primaryWorkItem) {
  throw new Error(`Missing work item for packet ${packet.packetId}`);
}

const nowMs = 1779627600000;
const proofWorkspaceKey = "arkiv_entity_key_placeholder";
const workItemKey = "arkiv_work_item_key_placeholder";
const workItemEntities = workItems.map((workItem) =>
  buildWorkItemEntity({ workItem, proofWorkspaceKey }),
);

const entities = [
  buildProofWorkspaceEntity({ nowMs, workItemCount: workItems.length }),
  ...workItemEntities,
  buildProofPacketEntity({
    packet,
    proofWorkspaceKey,
    workItemKey,
  }),
  buildReviewEventEntity({
    packet,
    proofWorkspaceKey,
    workItemKey,
    reviewedAtMs: nowMs,
  }),
];

const receipt = {
  id: "proof_memory_receipt_arkiv_ethns_submission",
  generatedAt: new Date(nowMs).toISOString(),
  status: "configured_not_submitted",
  primitive: "wallet-owned public proof memory for private agent-assisted work",
  liveConfiguredRoadmap: {
    live: [
      "local public-safe receipt generation",
      "local schema and redaction verification",
      "five-step ProofForge Lite app bundle",
    ],
    configured: [
      "Arkiv Braga entity create/query flow after wallet approval",
      "public deployment after Devinson approval",
    ],
    roadmap: [
      "real maintainer acceptance signatures",
      "encrypted private payload grants",
      "cross-opportunity proof history import",
    ],
  },
  arkiv: {
    network: "Braga",
    projectAttribute: PROJECT_ATTRIBUTE,
    sdkPackage: "@arkiv-network/sdk@0.6.8",
  },
  entities,
  requiredQueries: REQUIRED_QUERIES,
  redactionBoundary: {
    privateLocalOnly: [
      "private ProofForge opportunity notes",
      "unpublished execution transcripts",
      "payment setup metadata",
      "internal planning notes",
      "machine-specific filesystem references",
      "signing secrets",
    ],
    publicSafeOnly: [
      "work item summaries",
      "proof packet summaries",
      "artifact hashes",
      "source type",
      "review status",
      "risk and evidence counts",
      "Arkiv relationship keys after live write",
    ],
  },
  protocolRefs: {
    txHash: "pending_wallet_write_approval",
    entityKeys: ["pending_wallet_write_approval"],
  },
  verifier: {
    status: "pending",
    command: "npm run verify",
  },
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`wrote ${path.relative(process.cwd(), fileURLToPath(outputPath))}`);
