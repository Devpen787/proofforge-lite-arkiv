import packet from "../data/public-safe-packet.json";
import workItems from "../data/seed-work-items.json";

import {
  createArkivPublicClient,
  createBrowserWalletClient,
  publishProofMemory,
  queryProofPacketsBySourceType,
  queryProofPacketsByStatus,
  queryRecentProofPackets,
  queryReviewEventsByProofWorkspace,
  queryReviewEventsByWorkItem,
  queryWorkItemsByProject,
  queryWorkItemsByStatus,
} from "./arkiv-adapter-template.ts";
import {
  buildProofPacketEntity,
  buildProofWorkspaceEntity,
  buildReviewEventEntity,
  buildWorkItemEntity,
  PROJECT_ATTRIBUTE,
  REQUIRED_QUERIES,
} from "./schema.mjs";

const selectedWorkItem =
  workItems.find((workItem) => workItem.workItemId === packet.workItemId) ??
  workItems[0];

const proofWorkspace = buildProofWorkspaceEntity({
  nowMs: packet.createdAtMs,
  workItemCount: workItems.length,
});
const workItemEntities = workItems.map((candidate) =>
  buildWorkItemEntity({
    workItem: candidate,
    proofWorkspaceKey: "pending_wallet_write_approval",
  }),
);
const proofPacket = buildProofPacketEntity({
  packet,
  proofWorkspaceKey: "pending_wallet_write_approval",
  workItemKey: "pending_wallet_write_approval",
});
const reviewEvent = buildReviewEventEntity({
  packet,
  proofWorkspaceKey: "pending_wallet_write_approval",
  workItemKey: "pending_wallet_write_approval",
  reviewedAtMs: packet.createdAtMs + 60_000,
});

const receipt = {
  id: "proof_memory_receipt_arkiv_ethns_submission",
  status: "configured_not_submitted",
  primitive: "wallet-owned public proof memory for private agent-assisted work",
  arkiv: {
    network: "Braga",
    projectAttribute: PROJECT_ATTRIBUTE,
    sdkPackage: "@arkiv-network/sdk@0.6.8",
  },
  entities: [proofWorkspace, ...workItemEntities, proofPacket, reviewEvent],
  requiredQueries: REQUIRED_QUERIES,
  protocolRefs: {
    txHash: "pending_wallet_write_approval",
    entityKeys: ["pending_wallet_write_approval"],
  },
};

const proofRunTrace = [
  "Source page checked",
  "Requirements mapped",
  "Public boundary checked",
  "Arkiv schema verified",
  "Proof packet prepared",
];

const publicPrivateSplit = {
  publishedToArkiv: packet.publicFields,
  keptPrivate: packet.privateFieldsExcluded,
};

const schemaView = {
  projectAttribute: PROJECT_ATTRIBUTE,
  requiredEntityTypes: receipt.entities.map((entity) => entity.entityType),
  relationships: [
    "work_item.proofWorkspaceKey -> proof_workspace.$key",
    "proof_packet_summary.proofWorkspaceKey -> proof_workspace.$key",
    "proof_packet_summary.workItemKey -> work_item.$key",
    "review_event.workItemKey -> work_item.$key",
    "review_event.packetId -> proof_packet_summary.packetId",
  ],
  requiredQueries: REQUIRED_QUERIES,
};

const stepTabs = Array.from(document.querySelectorAll<HTMLButtonElement>(".step-tab"));
const stepPanels = Array.from(document.querySelectorAll<HTMLElement>(".step-panel"));
const workRows = requiredElement<HTMLDivElement>("#workRows");
const entityList = requiredElement<HTMLDivElement>("#entityList");
const receiptOutput = requiredElement<HTMLPreElement>("#receiptOutput");
const stateLabel = requiredElement<HTMLElement>("#stateLabel");
const stateDetail = requiredElement<HTMLElement>("#stateDetail");
const activeWorkTitle = requiredElement<HTMLElement>("#activeWorkTitle");
const activeWorkMeta = requiredElement<HTMLElement>("#activeWorkMeta");
const liveWrite = requiredElement<HTMLButtonElement>("#liveWrite");
const copyLiveResult = requiredElement<HTMLButtonElement>("#copyLiveResult");
const queryArkiv = requiredElement<HTMLButtonElement>("#queryArkiv");

let walletClient: Awaited<ReturnType<typeof createBrowserWalletClient>> | undefined;
let latestLiveWriteResult: unknown;

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return element as T;
}

function setState(label: string, detail: string) {
  stateLabel.textContent = label;
  stateDetail.textContent = detail;
}

function showStep(step: string) {
  for (const tab of stepTabs) {
    tab.classList.toggle("active", tab.dataset.step === step);
  }
  for (const panel of stepPanels) {
    panel.classList.toggle("active", panel.dataset.step === step);
  }
}

function attributesByKey(entity: (typeof receipt.entities)[number]) {
  return Object.fromEntries(
    entity.attributes.map((attribute) => [attribute.key, attribute.value]),
  );
}

function renderWorkRows() {
  workRows.innerHTML = workItems
    .map((workItem) => {
      const selected = workItem.workItemId === selectedWorkItem.workItemId;
      return `
        <article class="work-row ${selected ? "selected" : ""}">
          <div>
            <strong>${workItem.title}</strong>
            <span>${workItem.source} · ${workItem.acceptanceOwner}</span>
          </div>
          <b>${workItem.status.replaceAll("_", " ")}</b>
          <span>${workItem.sourceType}</span>
          <span>${workItem.evidenceCount} evidence refs</span>
        </article>
      `;
    })
    .join("");
}

function renderEntityList() {
  entityList.innerHTML = receipt.entities
    .map((entity) => {
      const attrs = attributesByKey(entity);
      const relationship =
        entity.entityType === "proof_workspace"
          ? "root namespace"
          : entity.entityType === "work_item"
            ? "links to proof workspace"
            : entity.entityType === "proof_packet_summary"
              ? "links to workspace + work item"
              : "links to packet + work item";
      return `
        <article class="entity-card">
          <strong>${entity.entityType}</strong>
          <span>${relationship}</span>
          <small>${PROJECT_ATTRIBUTE.key}=${PROJECT_ATTRIBUTE.value}</small>
          <small>status=${String(attrs.status ?? attrs.workspaceSlug ?? "active")}</small>
        </article>
      `;
    })
    .join("");
}

function setReceiptView(value: unknown, title = "Verifier receipt") {
  requiredElement<HTMLElement>("#detailsTitle").textContent = title;
  receiptOutput.textContent = safeJsonStringify(value);
}

function safeJsonStringify(value: unknown) {
  return JSON.stringify(
    value,
    (_key, nestedValue) =>
      typeof nestedValue === "bigint" ? nestedValue.toString() : nestedValue,
    2,
  );
}

function extractResultCount(result: unknown) {
  if (result && typeof result === "object" && "entities" in result) {
    const entities = (result as { entities?: unknown }).entities;
    return Array.isArray(entities) ? entities.length : undefined;
  }

  return Array.isArray(result) ? result.length : undefined;
}

function firstEntity(result: unknown) {
  if (result && typeof result === "object" && "entities" in result) {
    const entities = (result as { entities?: unknown }).entities;
    return Array.isArray(entities) ? entities[0] : undefined;
  }

  return Array.isArray(result) ? result[0] : undefined;
}

function extractEntityKey(entity: unknown) {
  if (!entity || typeof entity !== "object") {
    return undefined;
  }

  const record = entity as Record<string, unknown>;
  for (const field of ["$key", "entityKey", "key"]) {
    const value = record[field];
    if (typeof value === "string") {
      return value;
    }
  }

  return undefined;
}

function extractMetadataAddressEvidence(
  result: unknown,
  field: "owner" | "creator",
  queryName: string,
) {
  const entity = firstEntity(result);
  if (!entity || typeof entity !== "object") {
    return undefined;
  }

  const record = entity as Record<string, unknown>;
  const entityKey = extractEntityKey(entity);
  const metadataField = `$${field}`;
  const directCandidates = [
    [metadataField, record[metadataField]],
    [field, record[field]],
  ];
  for (const [sourceField, value] of directCandidates) {
    if (typeof value === "string") {
      return {
        address: value,
        source: `arkiv_query:${queryName}:${metadataField}`,
        sourceEntityKey: entityKey,
      };
    }
  }

  const metadata = (entity as { metadata?: Record<string, unknown> }).metadata;
  const metadataCandidates = [
    [`metadata.${metadataField}`, metadata?.[metadataField]],
    [`metadata.${field}`, metadata?.[field]],
  ];
  for (const [sourceField, value] of metadataCandidates) {
    if (typeof value === "string") {
      return {
        address: value,
        source: `arkiv_query:${queryName}:${metadataField}`,
        sourceEntityKey: entityKey,
      };
    }
  }

  return undefined;
}

async function buildLiveWriteResult(writeResult: {
  proofWorkspaceEntityKey: string;
  workItemEntityKey: string;
  proofPacketEntityKey: string;
  reviewEventEntityKey: string;
  txHashes: string[];
}) {
  const publicClient = createArkivPublicClient();
  const [
    workItemsByProject,
    workItemsByStatus,
    byStatus,
    bySource,
    recent,
    reviewEventsByWorkspace,
    reviewEventsByWorkItem,
  ] = await Promise.all([
    queryWorkItemsByProject(publicClient),
    queryWorkItemsByStatus(publicClient, selectedWorkItem.status),
    queryProofPacketsByStatus(publicClient, packet.status),
    queryProofPacketsBySourceType(publicClient, packet.sourceType),
    queryRecentProofPackets(publicClient, packet.createdAtMs - 1),
    queryReviewEventsByProofWorkspace(
      publicClient,
      writeResult.proofWorkspaceEntityKey,
    ),
    queryReviewEventsByWorkItem(publicClient, writeResult.workItemEntityKey),
  ]);
  const ownerEvidence =
    extractMetadataAddressEvidence(
      reviewEventsByWorkItem,
      "owner",
      "reviewEventsByWorkItem",
    );
  const creatorEvidence =
    extractMetadataAddressEvidence(
      reviewEventsByWorkItem,
      "creator",
      "reviewEventsByWorkItem",
    );

  return {
    ...writeResult,
    owner: ownerEvidence?.address,
    creator: creatorEvidence?.address,
    metadataEvidence: {
      ownerSource: ownerEvidence?.source,
      ownerEntityKey: ownerEvidence?.sourceEntityKey,
      creatorSource: creatorEvidence?.source,
      creatorEntityKey: creatorEvidence?.sourceEntityKey,
    },
    queriedAt: new Date().toISOString(),
    queryEvidence: {
      workItemsByProjectCount: extractResultCount(workItemsByProject) ?? 0,
      workItemsByStatusCount: extractResultCount(workItemsByStatus) ?? 0,
      byStatusCount: extractResultCount(byStatus) ?? 0,
      bySourceCount: extractResultCount(bySource) ?? 0,
      recentCount: extractResultCount(recent) ?? 0,
      reviewEventsByWorkspaceCount:
        extractResultCount(reviewEventsByWorkspace) ?? 0,
      reviewEventsByWorkItemCount: extractResultCount(reviewEventsByWorkItem) ?? 0,
    },
  };
}

requiredElement<HTMLButtonElement>("#connectWallet").addEventListener("click", async () => {
  try {
    setState("Wallet approval required", "Approve the Braga account connection in your wallet.");
    walletClient = await createBrowserWalletClient();
    setState("Wallet connected", "Ready for an explicit Arkiv write action.");
    queryArkiv.disabled = false;
    liveWrite.disabled = false;
    showStep("memory");
  } catch (error) {
    setState("Wallet not connected", error instanceof Error ? error.message : String(error));
  }
});

requiredElement<HTMLButtonElement>("#buildPacket").addEventListener("click", () => {
  setState("Proof packet ready", "Public-safe packet is prepared. Arkiv write remains approval-gated.");
  setReceiptView(
    {
      projectAttribute: PROJECT_ATTRIBUTE,
      arkivEntityPlan: {
        durablePublicData:
          "After approval, every durable public ProofForge Lite record is written as a project-scoped Arkiv entity.",
        entityTypes: [
          "proof_workspace",
          "work_item",
          "proof_packet_summary",
          "review_event",
        ],
        selectedWorkItemRelationship:
          "proof_packet_summary.workItemKey -> work_item.$key",
      },
      selectedWorkItem,
      packet,
      publicPrivateSplit,
    },
    "Proof packet",
  );
  showStep("packet");
});

requiredElement<HTMLButtonElement>("#inspectSchema").addEventListener("click", () => {
  setReceiptView(schemaView, "Arkiv schema");
  showStep("memory");
});

liveWrite.addEventListener("click", async () => {
  try {
    liveWrite.disabled = true;
    setState("Writing to Braga", "Confirm the wallet transaction to create linked Arkiv entities.");
    walletClient ??= await createBrowserWalletClient();
    const writeResult = await publishProofMemory(walletClient, {
      packet,
      workItem: selectedWorkItem,
      workItems,
      nowMs: Date.now(),
    });
    setState("Querying new entities", "Collecting owner, creator, and relationship evidence from Braga.");
    latestLiveWriteResult = await buildLiveWriteResult(writeResult);
    copyLiveResult.disabled = false;
    setState("Arkiv write complete", "Copy the live write result JSON for receipt finalization.");
    setReceiptView(
      {
        ...receipt,
        status: "live_written_pending_submission",
        protocolRefs: latestLiveWriteResult,
      },
      "Live Arkiv write receipt",
    );
    showStep("verify");
  } catch (error) {
    setState("Arkiv write failed", error instanceof Error ? error.message : String(error));
  } finally {
    liveWrite.disabled = false;
  }
});

queryArkiv.addEventListener("click", async () => {
  if (!walletClient) {
    setState(
      "Wallet approval required",
      "Connect the approved Braga wallet before running live Arkiv queries.",
    );
    return;
  }

  try {
    setState("Querying Braga", "Reading public Arkiv entities with project-scoped filters.");
    const publicClient = createArkivPublicClient();
    const [workByProject, workByStatus, byStatus, bySource, recent] = await Promise.all([
      queryWorkItemsByProject(publicClient),
      queryWorkItemsByStatus(publicClient, selectedWorkItem.status),
      queryProofPacketsByStatus(publicClient, packet.status),
      queryProofPacketsBySourceType(publicClient, packet.sourceType),
      queryRecentProofPackets(publicClient, packet.createdAtMs - 1),
    ]);
    setState("Arkiv query complete", "Query results include the project attribute on every path.");
    setReceiptView(
      {
        workItemsByProjectCount: extractResultCount(workByProject),
        workItemsByStatusCount: extractResultCount(workByStatus),
        byStatusCount: extractResultCount(byStatus),
        bySourceCount: extractResultCount(bySource),
        recentCount: extractResultCount(recent),
        workByProject,
        workByStatus,
        byStatus,
        bySource,
        recent,
      },
      "Arkiv query result",
    );
    showStep("verify");
  } catch (error) {
    setState("Arkiv query failed", error instanceof Error ? error.message : String(error));
  }
});

copyLiveResult.addEventListener("click", async () => {
  if (!latestLiveWriteResult) {
    setState("No live result yet", "Run the approved Arkiv write before copying finalizer input.");
    return;
  }

  await navigator.clipboard.writeText(safeJsonStringify(latestLiveWriteResult));
  setState(
    "Live result copied",
    "Save it as data/live-write-result.json, then run finalize:receipt and verify.",
  );
});

requiredElement<HTMLButtonElement>("#copyReceipt").addEventListener("click", async () => {
  await navigator.clipboard.writeText(receiptOutput.textContent);
  setState("Receipt copied", "Use this only as a draft until live Arkiv entity keys exist.");
});

for (const tab of stepTabs) {
  tab.addEventListener("click", () => showStep(tab.dataset.step ?? "work"));
}

activeWorkTitle.textContent = selectedWorkItem.title;
activeWorkMeta.textContent = `${selectedWorkItem.source} · ${selectedWorkItem.status.replaceAll("_", " ")}`;
renderWorkRows();
renderEntityList();
setReceiptView(receipt);
showStep("work");
