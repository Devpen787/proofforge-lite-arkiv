import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
} from "@arkiv-network/sdk";
import { braga } from "@arkiv-network/sdk/chains";
import { eq, gte } from "@arkiv-network/sdk/query";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";

import {
  buildProofPacketEntity,
  buildProofWorkspaceEntity,
  buildReviewEventEntity,
  buildWorkItemEntity,
  ENTITY_TYPES,
  EXPIRATION_TIERS,
  PROJECT_ATTRIBUTE,
} from "./schema.mjs";

const expirationByTier = {
  workQueueDays: ExpirationTime.fromDays(EXPIRATION_TIERS.workQueueDays),
  submittedPacketDays: ExpirationTime.fromDays(
    EXPIRATION_TIERS.submittedPacketDays,
  ),
  acceptedProofDays: ExpirationTime.fromDays(EXPIRATION_TIERS.acceptedProofDays),
  reviewEventDays: ExpirationTime.fromDays(EXPIRATION_TIERS.reviewEventDays),
};

export const BRAGA_CHAIN_ID_HEX = `0x${braga.id.toString(16)}`;

export function createArkivPublicClient() {
  return createPublicClient({
    chain: braga,
    transport: http(),
  });
}

export async function ensureBragaWalletChain(ethereum = window.ethereum) {
  if (!ethereum?.request) {
    throw new Error("MetaMask or another EVM wallet is required.");
  }

  const currentChainId = await ethereum.request({ method: "eth_chainId" });
  if (String(currentChainId).toLowerCase() === BRAGA_CHAIN_ID_HEX.toLowerCase()) {
    return;
  }

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BRAGA_CHAIN_ID_HEX }],
    });
  } catch (error) {
    if (error?.code !== 4902) {
      throw error;
    }

    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: BRAGA_CHAIN_ID_HEX,
          chainName: braga.name,
          nativeCurrency: braga.nativeCurrency,
          rpcUrls: braga.rpcUrls.default.http,
          blockExplorerUrls: [braga.blockExplorers.default.url],
        },
      ],
    });
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BRAGA_CHAIN_ID_HEX }],
    });
  }
}

export async function createBrowserWalletClient() {
  if (!window.ethereum) {
    throw new Error("MetaMask or another EVM wallet is required.");
  }

  await window.ethereum.request({ method: "eth_requestAccounts" });
  await ensureBragaWalletChain(window.ethereum);

  return createWalletClient({
    chain: braga,
    transport: custom(window.ethereum),
  });
}

export async function publishProofMemoryBatch(walletClient, entities) {
  return walletClient.mutateEntities({
    creates: entities.map((entity) => ({
      ...toArkivCreatePayload(entity),
    })),
  });
}

export function toArkivCreatePayload(entity) {
  return {
    payload: jsonToPayload(entity.payload),
    contentType: entity.contentType,
    attributes: entity.attributes,
    expiresIn: expirationByTier[entity.expirationTier],
  };
}

export async function publishProofMemory(
  walletClient,
  { packet, workItem, workItems = [workItem], nowMs = Date.now() },
) {
  if (!workItem || workItem.workItemId !== packet.workItemId) {
    throw new Error(`Missing matching work item for packet ${packet.packetId}`);
  }

  const selectedWorkItemIndex = workItems.findIndex(
    (candidate) => candidate.workItemId === packet.workItemId,
  );
  if (selectedWorkItemIndex < 0) {
    throw new Error(`Work queue is missing selected item ${packet.workItemId}`);
  }

  const proofWorkspace = buildProofWorkspaceEntity({
    nowMs,
    workItemCount: workItems.length,
  });
  const proofWorkspaceWrite = await walletClient.createEntity(
    toArkivCreatePayload(proofWorkspace),
  );

  const workItemEntities = workItems.map((candidate) =>
    buildWorkItemEntity({
      workItem: candidate,
      proofWorkspaceKey: proofWorkspaceWrite.entityKey,
    }),
  );
  const workItemWrites = await walletClient.mutateEntities({
    creates: workItemEntities.map(toArkivCreatePayload),
  });
  const workItemEntityKeys = workItemWrites.createdEntities ?? [];
  const selectedWorkItemEntityKey = workItemEntityKeys[selectedWorkItemIndex];
  if (!selectedWorkItemEntityKey) {
    throw new Error("Arkiv write did not return the selected work item key");
  }

  const proofPacket = buildProofPacketEntity({
    packet,
    proofWorkspaceKey: proofWorkspaceWrite.entityKey,
    workItemKey: selectedWorkItemEntityKey,
  });
  const reviewEvent = buildReviewEventEntity({
    packet,
    proofWorkspaceKey: proofWorkspaceWrite.entityKey,
    workItemKey: selectedWorkItemEntityKey,
    reviewedAtMs: nowMs,
  });

  const childWrites = await walletClient.mutateEntities({
    creates: [proofPacket, reviewEvent].map(toArkivCreatePayload),
  });

  return {
    proofWorkspaceEntityKey: proofWorkspaceWrite.entityKey,
    workItemEntityKey: selectedWorkItemEntityKey,
    workItemEntityKeys,
    workItemCountWritten: workItemEntityKeys.length,
    proofPacketEntityKey: childWrites.createdEntities[0],
    reviewEventEntityKey: childWrites.createdEntities[1],
    txHashes: [
      proofWorkspaceWrite.txHash,
      workItemWrites.txHash,
      childWrites.txHash,
    ],
  };
}

export async function queryWorkItemsByStatus(publicClient, status) {
  return publicClient
    .buildQuery()
    .where(eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value))
    .where(eq("type", ENTITY_TYPES.WorkItem))
    .where(eq("status", status))
    .withPayload(true)
    .withAttributes(true)
    .withMetadata(true)
    .limit(20)
    .fetch();
}

export async function queryWorkItemsByProject(publicClient) {
  return publicClient
    .buildQuery()
    .where(eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value))
    .where(eq("type", ENTITY_TYPES.WorkItem))
    .withPayload(true)
    .withAttributes(true)
    .withMetadata(true)
    .limit(20)
    .fetch();
}

export async function queryProofPacketsByStatus(publicClient, status) {
  return publicClient
    .buildQuery()
    .where(eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value))
    .where(eq("type", ENTITY_TYPES.ProofPacketSummary))
    .where(eq("status", status))
    .withPayload(true)
    .withAttributes(true)
    .withMetadata(true)
    .limit(20)
    .fetch();
}

export async function queryProofPacketsBySourceType(publicClient, sourceType) {
  return publicClient
    .buildQuery()
    .where(eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value))
    .where(eq("type", ENTITY_TYPES.ProofPacketSummary))
    .where(eq("sourceType", sourceType))
    .withPayload(true)
    .withAttributes(true)
    .withMetadata(true)
    .limit(20)
    .fetch();
}

export async function queryRecentProofPackets(publicClient, minCreatedAtMs) {
  return publicClient
    .buildQuery()
    .where(eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value))
    .where(eq("type", ENTITY_TYPES.ProofPacketSummary))
    .where(gte("createdAtMs", minCreatedAtMs))
    .withPayload(true)
    .withAttributes(true)
    .withMetadata(true)
    .limit(20)
    .fetch();
}

export async function queryReviewEventsByProofWorkspace(
  publicClient,
  proofWorkspaceKey,
) {
  return publicClient
    .buildQuery()
    .where(eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value))
    .where(eq("type", ENTITY_TYPES.ReviewEvent))
    .where(eq("proofWorkspaceKey", proofWorkspaceKey))
    .withPayload(true)
    .withAttributes(true)
    .withMetadata(true)
    .limit(20)
    .fetch();
}

export async function queryReviewEventsByWorkItem(publicClient, workItemKey) {
  return publicClient
    .buildQuery()
    .where(eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value))
    .where(eq("type", ENTITY_TYPES.ReviewEvent))
    .where(eq("workItemKey", workItemKey))
    .withPayload(true)
    .withAttributes(true)
    .withMetadata(true)
    .limit(20)
    .fetch();
}
