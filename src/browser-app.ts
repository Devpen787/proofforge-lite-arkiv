import packet from "../data/public-safe-packet.json";
import liveWriteResult from "../data/live-write-result.json";
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
  "Runner: source page checked",
  "Verifier: requirements mapped",
  "Verifier: privacy boundary checked",
  "Packager: proof packet prepared",
  "Human approval: wallet write gated",
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
const evidenceSummary = requiredElement<HTMLDivElement>("#evidenceSummary");
const proofRunTraceList = requiredElement<HTMLDivElement>("#proofRunTrace");
const stateLabel = requiredElement<HTMLElement>("#stateLabel");
const stateDetail = requiredElement<HTMLElement>("#stateDetail");
const activeWorkTitle = requiredElement<HTMLElement>("#activeWorkTitle");
const activeWorkMeta = requiredElement<HTMLElement>("#activeWorkMeta");
const connectWallet = requiredElement<HTMLButtonElement>("#connectWallet");
const liveWrite = requiredElement<HTMLButtonElement>("#liveWrite");
const copyLiveResult = requiredElement<HTMLButtonElement>("#copyLiveResult");
const queryArkiv = requiredElement<HTMLButtonElement>("#queryArkiv");
const walletDiagnostic = requiredElement<HTMLElement>("#walletDiagnostic");
const technicalEvidence = requiredElement<HTMLDetailsElement>("#technicalEvidence");
const storyMode = requiredElement<HTMLButtonElement>("#storyMode");
const evidenceMode = requiredElement<HTMLButtonElement>("#evidenceMode");
const runProofPath = requiredElement<HTMLButtonElement>("#runProofPath");

let walletClient: Awaited<ReturnType<typeof createBrowserWalletClient>> | undefined;
let latestLiveWriteResult: unknown;
let connectedAccount = "";
let currentMode: "story" | "evidence" = "story";

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

function shortAddress(address: string) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "unknown";
}

async function readWalletDiagnostic() {
  const ethereum = window.ethereum;
  if (!ethereum?.request) {
    return {
      account: "",
      chainId: "missing",
    };
  }

  const [accounts, chainId] = await Promise.all([
    ethereum.request({ method: "eth_accounts" }).catch(() => []),
    ethereum.request({ method: "eth_chainId" }).catch(() => "unknown"),
  ]);

  const account = Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : "";
  return {
    account,
    chainId: String(chainId),
  };
}

async function updateWalletUi(label = "Wallet connected") {
  const diagnostic = await readWalletDiagnostic();
  connectedAccount = diagnostic.account;
  connectWallet.textContent = connectedAccount
    ? `Connected ${shortAddress(connectedAccount)}`
    : "Wallet connected";
  connectWallet.classList.add("connected");
  walletDiagnostic.textContent = `wallet=${shortAddress(connectedAccount)} chain=${diagnostic.chainId}`;
  setState(
    label,
    connectedAccount
      ? `Ready for explicit Arkiv writes from ${shortAddress(connectedAccount)}.`
      : "Ready for explicit Arkiv writes, but no account was returned by the wallet.",
  );
}

function showStep(step: string) {
  for (const tab of stepTabs) {
    tab.classList.toggle("active", tab.dataset.step === step);
  }
  for (const panel of stepPanels) {
    panel.classList.toggle("active", panel.dataset.step === step);
  }
}

function setMode(mode: "story" | "evidence") {
  currentMode = mode;
  document.body.dataset.mode = mode;
  storyMode.classList.toggle("active", mode === "story");
  evidenceMode.classList.toggle("active", mode === "evidence");
  technicalEvidence.open = mode === "evidence";
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
      const risk = workItem.riskScore <= 20 ? "low risk" : "needs review";
      const nextAction = selected ? "Continue proof run" : "Keep queued";
      return `
        <article class="work-row ${selected ? "selected" : ""}">
          <div>
            <strong>${workItem.title}</strong>
            <span>${workItem.source} · ${workItem.acceptanceOwner}</span>
          </div>
          <b>${workItem.status.replaceAll("_", " ")}</b>
          <span>${risk} · ${workItem.evidenceCount} evidence refs</span>
          <span>${nextAction}</span>
        </article>
      `;
    })
    .join("");
}

function renderEntityList() {
  entityList.innerHTML = receipt.entities
    .map((entity, index) => {
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
          <em>${index + 1}</em>
          <strong>${entity.entityType}</strong>
          <span>${relationship}</span>
          <small>${String(attrs.status ?? attrs.workspaceSlug ?? "active")}</small>
          <code class="technical-only">${PROJECT_ATTRIBUTE.key}=${PROJECT_ATTRIBUTE.value}</code>
        </article>
      `;
    })
    .join("");
}

function renderProofRunTrace() {
  proofRunTraceList.innerHTML = proofRunTrace
    .map(
      (event, index) => `
        <span>
          <small>${index + 1}</small>
          ${event}
        </span>
      `,
    )
    .join("");
}

function setReceiptView(value: unknown, title = "Verifier receipt") {
  requiredElement<HTMLElement>("#detailsTitle").textContent = title;
  receiptOutput.textContent = safeJsonStringify(value);
  renderEvidenceSummary(value, title);
}

function summaryCard(label: string, value: string, tone = "") {
  return `
    <article class="summary-card ${tone}">
      <small>${label}</small>
      <strong>${value}</strong>
    </article>
  `;
}

function compactRef(value: unknown) {
  if (typeof value !== "string") {
    return "not available";
  }
  return value.startsWith("0x") && value.length > 18
    ? `${value.slice(0, 10)}...${value.slice(-6)}`
    : value;
}

function renderEvidenceSummary(value: unknown, title: string) {
  if (title === "Proof packet") {
    evidenceSummary.innerHTML = [
      summaryCard("Work item", selectedWorkItem.title),
      summaryCard("Public proof", "requirements + hashes + status"),
      summaryCard("Private boundary", `${packet.privateFieldsExcluded.length} fields excluded`, "quiet"),
      summaryCard("Ops trace", "runner -> verifier -> packager", "quiet"),
      summaryCard("Next action", "write linked Arkiv entities", "accent"),
    ].join("");
    return;
  }

  if (title === "Arkiv schema") {
    evidenceSummary.innerHTML = [
      summaryCard("Project scope", PROJECT_ATTRIBUTE.value),
      summaryCard("Entity model", "workspace, work, packet, review"),
      summaryCard("Relationships", "workspace + work item keys"),
      summaryCard("Queries", `${REQUIRED_QUERIES.length} required paths`, "accent"),
    ].join("");
    return;
  }

  if (title === "Live Arkiv write receipt" && value && typeof value === "object") {
    const protocolRefs = (value as { protocolRefs?: Record<string, unknown> }).protocolRefs ?? {};
    const txHashes = Array.isArray(protocolRefs.txHashes) ? protocolRefs.txHashes : [];
    const queryEvidence =
      protocolRefs.queryEvidence && typeof protocolRefs.queryEvidence === "object"
        ? protocolRefs.queryEvidence
        : {};
    const queryCount = Object.values(queryEvidence).filter((count) => Number(count) > 0).length;
    const relationshipCount =
      Number((queryEvidence as Record<string, unknown>).reviewEventsByWorkspaceCount ?? 0) +
      Number((queryEvidence as Record<string, unknown>).reviewEventsByWorkItemCount ?? 0);
    evidenceSummary.innerHTML = [
      summaryCard("Arkiv state", "write complete", "accent"),
      summaryCard("Workspace entity", compactRef(protocolRefs.proofWorkspaceEntityKey)),
      summaryCard("Proof packet entity", compactRef(protocolRefs.proofPacketEntityKey)),
      summaryCard("Transactions", `${txHashes.length} Braga writes`),
      summaryCard("Owner", compactRef(protocolRefs.owner)),
      summaryCard("Creator", compactRef(protocolRefs.creator)),
      summaryCard("Linked review events", `${relationshipCount} relationship reads`),
      summaryCard("Queries verified", `${queryCount} paths returned evidence`, "accent"),
    ].join("");
    return;
  }

  if (title === "Arkiv query result" && value && typeof value === "object") {
    const result = value as Record<string, unknown>;
    evidenceSummary.innerHTML = [
      summaryCard("Work queue", `${Number(result.workItemsByProjectCount ?? 0)} records`),
      summaryCard("Ready work", `${Number(result.workItemsByStatusCount ?? 0)} record`),
      summaryCard("Packet status", `${Number(result.byStatusCount ?? 0)} record`),
      summaryCard("Source type", `${Number(result.bySourceCount ?? 0)} record`),
      summaryCard("Time range", `${Number(result.recentCount ?? 0)} record`),
      summaryCard(
        "Workspace relation",
        `${Number(result.reviewEventsByWorkspaceCount ?? 0)} record`,
      ),
      summaryCard(
        "Work-item relation",
        `${Number(result.reviewEventsByWorkItemCount ?? 0)} record`,
      ),
      summaryCard("Reviewer view", "project-scoped public proof", "accent"),
    ].join("");
    return;
  }

  evidenceSummary.innerHTML = [
    summaryCard("Mission", selectedWorkItem.title),
    summaryCard("Protocol state", "configured · write gated · query public", "accent"),
  ].join("");
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

connectWallet.addEventListener("click", async () => {
  try {
    setState("Wallet approval required", "Approve the Braga account connection in your wallet.");
    walletDiagnostic.textContent = "wallet=approval_requested chain=checking";
    walletClient = await createBrowserWalletClient();
    await updateWalletUi();
    liveWrite.disabled = false;
    showStep("memory");
  } catch (error) {
    setState("Wallet not connected", error instanceof Error ? error.message : String(error));
  }
});

runProofPath.addEventListener("click", () => {
  setState("Proof path active", "Start with preflight, then build the public-safe proof packet.");
  showStep("preflight");
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
    liveWrite.textContent = "Waiting for wallet";
    setState("Writing to Braga", "If MetaMask is open, approve the transaction prompt there.");
    walletClient ??= await createBrowserWalletClient();
    await updateWalletUi("Wallet checked");
    setState(
      "Writing to Braga",
      "Approving creates one workspace entity, one work queue batch, then one proof packet/review batch.",
    );
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
    const message = error instanceof Error ? error.message : String(error);
    setState("Arkiv write failed", message);
    walletDiagnostic.textContent = `write_error=${message.slice(0, 120)}`;
  } finally {
    liveWrite.textContent = "Write Arkiv entities";
    liveWrite.disabled = false;
  }
});

queryArkiv.addEventListener("click", async () => {
  try {
    setState("Querying public Braga", "Reading public Arkiv entities with project-scoped filters. Wallet is not required for reads.");
    const publicClient = createArkivPublicClient();
    const liveRefs = liveWriteResult as {
      proofWorkspaceEntityKey?: string;
      workItemEntityKey?: string;
    };
    const [
      workByProject,
      workByStatus,
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
        liveRefs.proofWorkspaceEntityKey ?? "",
      ),
      queryReviewEventsByWorkItem(publicClient, liveRefs.workItemEntityKey ?? ""),
    ]);
    setState("Arkiv query complete", "Public query results include the project attribute on every path.");
    setReceiptView(
      {
        workItemsByProjectCount: extractResultCount(workByProject),
        workItemsByStatusCount: extractResultCount(workByStatus),
        byStatusCount: extractResultCount(byStatus),
        bySourceCount: extractResultCount(bySource),
        recentCount: extractResultCount(recent),
        reviewEventsByWorkspaceCount: extractResultCount(reviewEventsByWorkspace),
        reviewEventsByWorkItemCount: extractResultCount(reviewEventsByWorkItem),
        workByProject,
        workByStatus,
        byStatus,
        bySource,
        recent,
        reviewEventsByWorkspace,
        reviewEventsByWorkItem,
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

storyMode.addEventListener("click", () => setMode("story"));
evidenceMode.addEventListener("click", () => setMode("evidence"));

activeWorkTitle.textContent = selectedWorkItem.title;
activeWorkMeta.textContent = `${selectedWorkItem.source} · ${selectedWorkItem.status.replaceAll("_", " ")}`;
renderWorkRows();
renderEntityList();
renderProofRunTrace();
setReceiptView(receipt);
setMode(currentMode);
showStep("work");
