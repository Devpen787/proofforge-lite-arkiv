export const PROJECT_ATTRIBUTE = {
  key: "project",
  value: "proofforge-lite-arkiv-ethns-2026",
};

export const ENTITY_TYPES = {
  ProofWorkspace: "proof_workspace",
  WorkItem: "work_item",
  ProofPacketSummary: "proof_packet_summary",
  ReviewEvent: "review_event",
};

export const EXPIRATION_TIERS = {
  workQueueDays: 14,
  submittedPacketDays: 30,
  acceptedProofDays: 90,
  reviewEventDays: 45,
};

export function buildProofWorkspaceEntity({ nowMs, workItemCount = 3 }) {
  return {
    entityType: ENTITY_TYPES.ProofWorkspace,
    payload: {
      name: "ProofForge Lite",
      tagline: "Powered by Arkiv",
      purpose: "Wallet-owned public proof memory for private agent-assisted work.",
      privacyBoundary:
        "Private ProofForge notes, drafts, payout context, local paths, and approval history stay outside Arkiv.",
    },
    contentType: "application/json",
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: "type", value: ENTITY_TYPES.ProofWorkspace },
      { key: "workspaceSlug", value: "proofforge-lite-arkiv" },
      { key: "ownerLabel", value: "bounded-proof-node-operator" },
      { key: "createdAtMs", value: nowMs },
      { key: "workItemCount", value: workItemCount },
    ],
    expirationTier: "acceptedProofDays",
  };
}

export function buildWorkItemEntity({ workItem, proofWorkspaceKey }) {
  return {
    entityType: ENTITY_TYPES.WorkItem,
    payload: {
      workItemId: workItem.workItemId,
      title: workItem.title,
      source: workItem.source,
      sourceUrl: workItem.sourceUrl,
      acceptanceOwner: workItem.acceptanceOwner,
      valuePath: workItem.valuePath,
      proofNeeded: workItem.proofNeeded,
      publicBoundary: workItem.publicBoundary,
    },
    contentType: "application/json",
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: "type", value: ENTITY_TYPES.WorkItem },
      { key: "proofWorkspaceKey", value: proofWorkspaceKey },
      { key: "workItemId", value: workItem.workItemId },
      { key: "status", value: workItem.status },
      { key: "sourceType", value: workItem.sourceType },
      { key: "priority", value: workItem.priority },
      { key: "riskScore", value: workItem.riskScore },
      { key: "evidenceCount", value: workItem.evidenceCount },
      { key: "createdAtMs", value: workItem.createdAtMs },
      { key: "deadlineMs", value: workItem.deadlineMs },
    ],
    expirationTier: "workQueueDays",
  };
}

export function buildProofPacketEntity({
  packet,
  proofWorkspaceKey,
  workItemKey,
}) {
  return {
    entityType: ENTITY_TYPES.ProofPacketSummary,
    payload: packet,
    contentType: "application/json",
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: "type", value: ENTITY_TYPES.ProofPacketSummary },
      { key: "proofWorkspaceKey", value: proofWorkspaceKey },
      { key: "workItemKey", value: workItemKey },
      { key: "workItemId", value: packet.workItemId },
      { key: "packetId", value: packet.packetId },
      { key: "status", value: packet.status },
      { key: "sourceType", value: packet.sourceType },
      { key: "riskScore", value: packet.riskScore },
      { key: "evidenceCount", value: packet.evidenceCount },
      { key: "createdAtMs", value: packet.createdAtMs },
      { key: "acceptedAtMs", value: packet.acceptedAtMs },
    ],
    expirationTier:
      packet.status === "accepted" ? "acceptedProofDays" : "submittedPacketDays",
  };
}

export function buildReviewEventEntity({
  packet,
  proofWorkspaceKey,
  workItemKey,
  reviewedAtMs,
}) {
  return {
    entityType: ENTITY_TYPES.ReviewEvent,
    payload: {
      packetId: packet.packetId,
      workItemId: packet.workItemId,
      decision: packet.reviewDecision,
      reviewSummary:
        "Ready for public challenge review. Prize acceptance and official submission remain external approval-gated actions.",
    },
    contentType: "application/json",
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: "type", value: ENTITY_TYPES.ReviewEvent },
      { key: "proofWorkspaceKey", value: proofWorkspaceKey },
      { key: "workItemKey", value: workItemKey },
      { key: "workItemId", value: packet.workItemId },
      { key: "packetId", value: packet.packetId },
      { key: "decision", value: packet.reviewDecision },
      { key: "reviewedAtMs", value: reviewedAtMs },
    ],
    expirationTier: "reviewEventDays",
  };
}

export const REQUIRED_QUERIES = [
  {
    name: "workItemsByProject",
    filters: [
      PROJECT_ATTRIBUTE,
      { key: "type", value: ENTITY_TYPES.WorkItem },
    ],
  },
  {
    name: "workItemsByStatus",
    filters: [
      PROJECT_ATTRIBUTE,
      { key: "type", value: ENTITY_TYPES.WorkItem },
      { key: "status", value: "ready_for_submission" },
    ],
  },
  {
    name: "packetsByStatus",
    filters: [
      PROJECT_ATTRIBUTE,
      { key: "type", value: ENTITY_TYPES.ProofPacketSummary },
      { key: "status", value: "ready_for_submission" },
    ],
  },
  {
    name: "packetsBySourceType",
    filters: [
      PROJECT_ATTRIBUTE,
      { key: "type", value: ENTITY_TYPES.ProofPacketSummary },
      { key: "sourceType", value: "hackathon_challenge" },
    ],
  },
  {
    name: "packetsByCreatedAtRange",
    filters: [
      PROJECT_ATTRIBUTE,
      { key: "type", value: ENTITY_TYPES.ProofPacketSummary },
      { key: "createdAtMs", op: "gte", value: 1779540600000 },
    ],
  },
  {
    name: "reviewEventsByProofWorkspace",
    filters: [
      PROJECT_ATTRIBUTE,
      { key: "type", value: ENTITY_TYPES.ReviewEvent },
      { key: "proofWorkspaceKey", value: "arkiv_entity_key_placeholder" },
    ],
  },
  {
    name: "reviewEventsByWorkItem",
    filters: [
      PROJECT_ATTRIBUTE,
      { key: "type", value: ENTITY_TYPES.ReviewEvent },
      { key: "workItemKey", value: "arkiv_entity_key_placeholder" },
    ],
  },
];

export const FORBIDDEN_PUBLIC_STRINGS = [
  `.${"proofforge-private"}`,
  `payout ${"account"}`,
  `raw ${"log"}`,
  `private ${"key"}`,
  `seed ${"phrase"}`,
  `income ${"strategy"}`,
  `wallet ${"balance"}`,
  "approval packet",
];

export const FORBIDDEN_PUBLIC_PATTERNS = [
  {
    label: "local macOS user path",
    pattern: String.raw`/Users/[A-Za-z0-9._-]+`,
  },
  {
    label: "local home directory shorthand",
    pattern: String.raw`~/`,
  },
];
