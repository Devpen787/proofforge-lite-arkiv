import fs from "node:fs";
import path from "node:path";
import {
  ENTITY_TYPES,
  EXPIRATION_TIERS,
  FORBIDDEN_PUBLIC_PATTERNS,
  FORBIDDEN_PUBLIC_STRINGS,
  PROJECT_ATTRIBUTE,
} from "../src/schema.mjs";

const receiptPath = process.env.RECEIPT_PATH
  ? path.resolve(process.env.RECEIPT_PATH)
  : new URL("../out/proof-memory-receipt.json", import.meta.url);
const receiptText = fs.readFileSync(receiptPath, "utf8");
const receipt = JSON.parse(receiptText);
const findings = [];
const allowedExpirationTiers = new Set(Object.keys(EXPIRATION_TIERS));
const hex32BytePattern = /^0x[0-9a-f]{64}$/i;
const evmAddressPattern = /^0x[0-9a-f]{40}$/i;

function fail(message) {
  findings.push(message);
}

function hasProjectAttribute(attributes) {
  return attributes.some(
    (attribute) =>
      attribute.key === PROJECT_ATTRIBUTE.key &&
      attribute.value === PROJECT_ATTRIBUTE.value,
  );
}

function attr(entity, key) {
  return entity?.attributes?.find((attribute) => attribute.key === key)?.value;
}

for (const entity of receipt.entities ?? []) {
  if (!hasProjectAttribute(entity.attributes ?? [])) {
    fail(`${entity.entityType} missing project attribute`);
  }

  const typeAttribute = entity.attributes?.find(
    (attribute) => attribute.key === "type",
  );
  if (!typeAttribute || typeAttribute.value !== entity.entityType) {
    fail(`${entity.entityType} missing matching type attribute`);
  }

  if (!allowedExpirationTiers.has(entity.expirationTier)) {
    fail(`${entity.entityType} has unknown expiration tier`);
  }

  for (const attribute of entity.attributes ?? []) {
    if ((attribute.key.endsWith("AtMs") || attribute.key === "deadlineMs") && typeof attribute.value !== "number") {
      fail(`${entity.entityType}.${attribute.key} must be numeric`);
    }
    if (
      ["riskScore", "evidenceCount", "workItemCount", "priority"].includes(
        attribute.key,
      ) &&
      typeof attribute.value !== "number"
    ) {
      fail(`${entity.entityType}.${attribute.key} must be numeric`);
    }
  }
}

const entityTypes = new Set(receipt.entities?.map((entity) => entity.entityType));
for (const requiredType of [
  ENTITY_TYPES.ProofWorkspace,
  ENTITY_TYPES.WorkItem,
  ENTITY_TYPES.ProofPacketSummary,
  ENTITY_TYPES.ReviewEvent,
]) {
  if (!entityTypes.has(requiredType)) {
    fail(`missing entity type ${requiredType}`);
  }
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
const workItem = workItems.find(
  (entity) => attr(entity, "workItemId") === attr(proofPacket, "workItemId"),
);

if (workItems.length < 3) {
  fail("receipt must include the full public-safe work queue as work_item entities");
}

for (const linkedEntity of [...workItems, proofPacket, reviewEvent]) {
  if (!linkedEntity) {
    continue;
  }

  const proofWorkspaceKey = attr(linkedEntity, "proofWorkspaceKey");
  if (!proofWorkspaceKey) {
    fail(`${linkedEntity.entityType} missing proofWorkspaceKey relationship`);
  }
}

for (const linkedEntity of [proofPacket, reviewEvent]) {
  if (!linkedEntity) {
    continue;
  }

  const workItemKey = attr(linkedEntity, "workItemKey");
  if (!workItemKey) {
    fail(`${linkedEntity.entityType} missing workItemKey relationship`);
  }
}

if (workItem && proofPacket) {
  const workItemId = attr(workItem, "workItemId");
  const packetWorkItemId = attr(proofPacket, "workItemId");
  if (!workItemId || workItemId !== packetWorkItemId) {
    fail("proof_packet_summary workItemId must match work_item workItemId");
  }
} else if (proofPacket) {
  fail("proof_packet_summary must match one public-safe work_item");
}

if (proofPacket && reviewEvent) {
  const packetId = attr(proofPacket, "packetId");
  const reviewPacketId = attr(reviewEvent, "packetId");
  if (!packetId || packetId !== reviewPacketId) {
    fail("review_event packetId must match proof_packet_summary packetId");
  }
}

for (const query of receipt.requiredQueries ?? []) {
  if (!hasProjectAttribute(query.filters ?? [])) {
    fail(`query ${query.name} missing project attribute`);
  }

  if ((query.filters ?? []).length < 2) {
    fail(`query ${query.name} must include a project filter and a purpose filter`);
  }
}

const queryNames = new Set((receipt.requiredQueries ?? []).map((query) => query.name));
for (const requiredQuery of [
  "workItemsByProject",
  "workItemsByStatus",
  "packetsByStatus",
  "packetsBySourceType",
  "packetsByCreatedAtRange",
  "reviewEventsByProofWorkspace",
  "reviewEventsByWorkItem",
]) {
  if (!queryNames.has(requiredQuery)) {
    fail(`missing required query ${requiredQuery}`);
  }
}

for (const forbidden of FORBIDDEN_PUBLIC_STRINGS) {
  if (receiptText.toLowerCase().includes(forbidden.toLowerCase())) {
    fail(`receipt includes forbidden private phrase: ${forbidden}`);
  }
}

for (const forbidden of FORBIDDEN_PUBLIC_PATTERNS) {
  if (new RegExp(forbidden.pattern, "i").test(receiptText)) {
    fail(`receipt includes forbidden private pattern: ${forbidden.label}`);
  }
}

if (receipt.status === "configured_not_submitted") {
  if (receipt.protocolRefs?.txHash !== "pending_wallet_write_approval") {
    fail("configured receipt claims a tx hash before approved Arkiv write");
  }
}

if (receipt.status === "live_written_pending_submission") {
  for (const field of [
    "proofWorkspaceEntityKey",
    "workItemEntityKey",
    "proofPacketEntityKey",
    "reviewEventEntityKey",
  ]) {
    if (!hex32BytePattern.test(receipt.protocolRefs?.[field] ?? "")) {
      fail(`live receipt missing valid ${field}`);
    }
  }

  if (!Array.isArray(receipt.protocolRefs?.txHashes) || receipt.protocolRefs.txHashes.length < 3) {
    fail(
      "live receipt must include workspace, work queue batch, and child entity batch txHashes",
    );
  }

  for (const txHash of receipt.protocolRefs?.txHashes ?? []) {
    if (!hex32BytePattern.test(txHash)) {
      fail(`live receipt has invalid tx hash ${txHash}`);
    }
  }

  for (const field of ["owner", "creator"]) {
    if (!evmAddressPattern.test(receipt.protocolRefs?.[field] ?? "")) {
      fail(`live receipt missing valid ${field}`);
    }
  }

  const metadataEvidence = receipt.protocolRefs?.metadataEvidence ?? {};
  for (const field of ["ownerSource", "creatorSource"]) {
    const source = metadataEvidence[field];
    if (
      typeof source !== "string" ||
      !source.startsWith("arkiv_query:reviewEventsByWorkItem:") ||
      !source.includes("$")
    ) {
      fail(
        `live receipt metadataEvidence.${field} must prove linked Arkiv review-event metadata source`,
      );
    }
  }
  for (const [field, expectedKey] of [
    ["ownerEntityKey", receipt.protocolRefs?.reviewEventEntityKey],
    ["creatorEntityKey", receipt.protocolRefs?.reviewEventEntityKey],
  ]) {
    if (metadataEvidence[field] !== expectedKey) {
      fail(`live receipt metadataEvidence.${field} must match reviewEventEntityKey`);
    }
  }

  const expectedWorkspaceKey = receipt.protocolRefs?.proofWorkspaceEntityKey;
  const expectedWorkItemKey = receipt.protocolRefs?.workItemEntityKey;
  const workItemEntityKeys = receipt.protocolRefs?.workItemEntityKeys ?? [];

  if (!Array.isArray(workItemEntityKeys) || workItemEntityKeys.length < workItems.length) {
    fail("live receipt must include entity keys for every public-safe work item");
  }

  if (!workItemEntityKeys.includes(expectedWorkItemKey)) {
    fail("live receipt workItemEntityKeys must include selected workItemEntityKey");
  }

  if (receipt.protocolRefs?.workItemCountWritten !== workItems.length) {
    fail("live receipt workItemCountWritten must match public-safe work item count");
  }

  for (const [index, entityKey] of workItemEntityKeys.entries()) {
    if (!hex32BytePattern.test(entityKey)) {
      fail(`live receipt workItemEntityKeys[${index}] is invalid`);
    }
  }

  const workItemsMatchWorkspace = workItems.every(
    (candidate) => attr(candidate, "proofWorkspaceKey") === expectedWorkspaceKey,
  );
  if (
    !workItemsMatchWorkspace ||
    attr(proofPacket, "proofWorkspaceKey") !== expectedWorkspaceKey ||
    attr(reviewEvent, "proofWorkspaceKey") !== expectedWorkspaceKey
  ) {
    fail("live receipt proofWorkspaceKey relationships must match proofWorkspaceEntityKey");
  }

  if (
    attr(proofPacket, "workItemKey") !== expectedWorkItemKey ||
    attr(reviewEvent, "workItemKey") !== expectedWorkItemKey
  ) {
    fail("live receipt workItemKey relationships must match workItemEntityKey");
  }

  const reviewEventsWorkspaceQuery = receipt.requiredQueries?.find(
    (query) => query.name === "reviewEventsByProofWorkspace",
  );
  const queryWorkspaceKey = reviewEventsWorkspaceQuery?.filters?.find(
    (filter) => filter.key === "proofWorkspaceKey",
  )?.value;
  if (queryWorkspaceKey !== expectedWorkspaceKey) {
    fail("live receipt reviewEventsByProofWorkspace query must use proofWorkspaceEntityKey");
  }

  const reviewEventsWorkItemQuery = receipt.requiredQueries?.find(
    (query) => query.name === "reviewEventsByWorkItem",
  );
  const queryWorkItemKey = reviewEventsWorkItemQuery?.filters?.find(
    (filter) => filter.key === "workItemKey",
  )?.value;
  if (queryWorkItemKey !== expectedWorkItemKey) {
    fail("live receipt reviewEventsByWorkItem query must use workItemEntityKey");
  }

  const queryEvidence = receipt.protocolRefs?.queryEvidence ?? {};
  if (
    typeof queryEvidence.workItemsByProjectCount !== "number" ||
    queryEvidence.workItemsByProjectCount < workItems.length
  ) {
    fail("live receipt queryEvidence.workItemsByProjectCount must cover the public-safe work queue");
  }

  for (const field of [
    "workItemsByStatusCount",
    "byStatusCount",
    "bySourceCount",
    "recentCount",
    "reviewEventsByWorkspaceCount",
    "reviewEventsByWorkItemCount",
  ]) {
    if (typeof queryEvidence[field] !== "number" || queryEvidence[field] < 1) {
      fail(`live receipt queryEvidence.${field} must be a positive count`);
    }
  }
}

if (!["configured_not_submitted", "live_written_pending_submission"].includes(receipt.status)) {
  fail(`unknown receipt status ${receipt.status}`);
}

if (!receipt.liveConfiguredRoadmap?.live?.length) {
  fail("receipt must separate live claims");
}

if (!receipt.liveConfiguredRoadmap?.configured?.length) {
  fail("receipt must separate configured claims");
}

if (!receipt.liveConfiguredRoadmap?.roadmap?.length) {
  fail("receipt must separate roadmap claims");
}

if (findings.length > 0) {
  console.error("Proof memory receipt verification failed:");
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

receipt.verifier.status = "passed";
fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
console.log("Proof memory receipt verification passed");
