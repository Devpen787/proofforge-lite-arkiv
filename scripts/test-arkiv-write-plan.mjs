import packet from "../data/public-safe-packet.json" with { type: "json" };
import workItems from "../data/seed-work-items.json" with { type: "json" };

import {
  BRAGA_CHAIN_ID_HEX,
  ensureBragaWalletChain,
  publishProofMemory,
} from "../src/arkiv-adapter-template.ts";
import {
  ENTITY_TYPES,
  PROJECT_ATTRIBUTE,
} from "../src/schema.mjs";

const failures = [];

function fail(message) {
  failures.push(message);
}

function hasAttribute(createPayload, key, value) {
  return createPayload.attributes?.some(
    (attribute) => attribute.key === key && attribute.value === value,
  );
}

function attributeValue(createPayload, key) {
  return createPayload.attributes?.find((attribute) => attribute.key === key)?.value;
}

function typeOfCreate(createPayload) {
  return attributeValue(createPayload, "type");
}

function fakeEthereum({ initialChainId, unknownChain = false }) {
  const requests = [];
  return {
    requests,
    async request(payload) {
      requests.push(payload);
      if (payload.method === "eth_chainId") {
        return initialChainId;
      }
      if (payload.method === "wallet_switchEthereumChain" && unknownChain) {
        unknownChain = false;
        const error = new Error("Unrecognized chain");
        error.code = 4902;
        throw error;
      }
      return null;
    },
  };
}

const selectedWorkItem = workItems.find(
  (workItem) => workItem.workItemId === packet.workItemId,
);
const calls = [];
const workspaceKey = "0x1111111111111111111111111111111111111111111111111111111111111111";
const workItemKeys = [
  "0x2222222222222222222222222222222222222222222222222222222222222222",
  "0x5555555555555555555555555555555555555555555555555555555555555555",
  "0x6666666666666666666666666666666666666666666666666666666666666666",
];
const proofPacketKey = "0x3333333333333333333333333333333333333333333333333333333333333333";
const reviewEventKey = "0x4444444444444444444444444444444444444444444444444444444444444444";

const fakeWalletClient = {
  async createEntity(createPayload) {
    calls.push({ kind: "createEntity", createPayload });
    return {
      entityKey: workspaceKey,
      txHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    };
  },
  async mutateEntities(batch) {
    calls.push({ kind: "mutateEntities", batch });
    const createTypes = batch.creates.map(typeOfCreate);
    if (createTypes.every((type) => type === ENTITY_TYPES.WorkItem)) {
      return {
        createdEntities: workItemKeys,
        txHash: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      };
    }

    return {
      createdEntities: [proofPacketKey, reviewEventKey],
      txHash: "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
    };
  },
};

const result = await publishProofMemory(fakeWalletClient, {
  packet,
  workItem: selectedWorkItem,
  workItems,
  nowMs: packet.createdAtMs,
});

const alreadyOnBraga = fakeEthereum({ initialChainId: BRAGA_CHAIN_ID_HEX });
await ensureBragaWalletChain(alreadyOnBraga);
if (
  alreadyOnBraga.requests.some(
    (request) => request.method === "wallet_switchEthereumChain",
  )
) {
  fail("Braga chain guard should not switch when wallet is already on Braga");
}

const wrongChain = fakeEthereum({ initialChainId: "0x1" });
await ensureBragaWalletChain(wrongChain);
if (
  !wrongChain.requests.some(
    (request) =>
      request.method === "wallet_switchEthereumChain" &&
      request.params?.[0]?.chainId === BRAGA_CHAIN_ID_HEX,
  )
) {
  fail("Braga chain guard must request wallet_switchEthereumChain");
}

const missingChain = fakeEthereum({ initialChainId: "0x1", unknownChain: true });
await ensureBragaWalletChain(missingChain);
if (
  !missingChain.requests.some(
    (request) =>
      request.method === "wallet_addEthereumChain" &&
      request.params?.[0]?.chainId === BRAGA_CHAIN_ID_HEX,
  )
) {
  fail("Braga chain guard must add Braga when the wallet does not know it");
}

if (calls.length !== 3) {
  fail(`expected 3 Arkiv write calls, saw ${calls.length}`);
}

const [workspaceCall, workQueueCall, childCall] = calls;
if (workspaceCall?.kind !== "createEntity") {
  fail("first write must create the proof workspace");
}

if (workQueueCall?.kind !== "mutateEntities") {
  fail("second write must batch-create the public-safe Work queue");
}

if (childCall?.kind !== "mutateEntities") {
  fail("third write must batch-create proof packet and review event");
}

const workspacePayload = workspaceCall?.createPayload;
if (typeOfCreate(workspacePayload) !== ENTITY_TYPES.ProofWorkspace) {
  fail("workspace create must be proof_workspace type");
}

if (attributeValue(workspacePayload, "workItemCount") !== workItems.length) {
  fail("proof workspace must record public-safe work item count");
}

for (const createPayload of [
  workspacePayload,
  ...(workQueueCall?.batch?.creates ?? []),
  ...(childCall?.batch?.creates ?? []),
]) {
  if (!hasAttribute(createPayload, PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value)) {
    fail(`create payload ${typeOfCreate(createPayload)} missing PROJECT_ATTRIBUTE`);
  }
}

const workQueueCreates = workQueueCall?.batch?.creates ?? [];
if (workQueueCreates.length !== workItems.length) {
  fail("work queue batch must include every public-safe work item");
}

for (const [index, createPayload] of workQueueCreates.entries()) {
  if (typeOfCreate(createPayload) !== ENTITY_TYPES.WorkItem) {
    fail(`work queue create ${index} must be work_item type`);
  }
  if (attributeValue(createPayload, "proofWorkspaceKey") !== workspaceKey) {
    fail(`work queue create ${index} must link to proof workspace`);
  }
}

const childCreates = childCall?.batch?.creates ?? [];
const childTypes = childCreates.map(typeOfCreate);
if (
  childCreates.length !== 2 ||
  !childTypes.includes(ENTITY_TYPES.ProofPacketSummary) ||
  !childTypes.includes(ENTITY_TYPES.ReviewEvent)
) {
  fail("child batch must include proof_packet_summary and review_event");
}

for (const createPayload of childCreates) {
  if (attributeValue(createPayload, "proofWorkspaceKey") !== workspaceKey) {
    fail(`${typeOfCreate(createPayload)} must link to proof workspace`);
  }
  if (attributeValue(createPayload, "workItemKey") !== workItemKeys[0]) {
    fail(`${typeOfCreate(createPayload)} must link to selected work item`);
  }
}

if (result.proofWorkspaceEntityKey !== workspaceKey) {
  fail("write result must include proof workspace entity key");
}

if (result.workItemEntityKey !== workItemKeys[0]) {
  fail("write result must identify selected work item entity key");
}

if (result.workItemCountWritten !== workItems.length) {
  fail("write result must include full Work queue write count");
}

if (JSON.stringify(result.workItemEntityKeys) !== JSON.stringify(workItemKeys)) {
  fail("write result must include all Work queue entity keys");
}

if (
  result.proofPacketEntityKey !== proofPacketKey ||
  result.reviewEventEntityKey !== reviewEventKey
) {
  fail("write result must include child entity keys");
}

if (!Array.isArray(result.txHashes) || result.txHashes.length !== 3) {
  fail("write result must include the three write transaction hashes");
}

if (failures.length > 0) {
  console.error("Arkiv write-plan test failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Arkiv write-plan test passed");
