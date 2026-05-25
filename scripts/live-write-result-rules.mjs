const hex32BytePattern = /^0x[0-9a-f]{64}$/i;
const evmAddressPattern = /^0x[0-9a-f]{40}$/i;
const exampleRefPattern = /(111111111111|222222222222|333333333333|444444444444|555555555555|666666666666|aaaaaaaa|bbbbbbbb|cccccccc)/i;

export function validateLiveWriteResult(liveWriteResult, options = {}) {
  const { allowExampleRefs = false } = options;
  const findings = [];

  function requireHex32(field) {
    const value = liveWriteResult[field];
    if (!hex32BytePattern.test(value ?? "")) {
      findings.push(`${field} must be a 32-byte hex value`);
    }
    return value;
  }

  const proofWorkspaceEntityKey = requireHex32("proofWorkspaceEntityKey");
  const workItemEntityKey = requireHex32("workItemEntityKey");
  const proofPacketEntityKey = requireHex32("proofPacketEntityKey");
  const reviewEventEntityKey = requireHex32("reviewEventEntityKey");

  const entityKeys = [
    proofWorkspaceEntityKey,
    workItemEntityKey,
    proofPacketEntityKey,
    reviewEventEntityKey,
  ].filter(Boolean);
  if (new Set(entityKeys).size !== entityKeys.length) {
    findings.push("entity keys must be distinct");
  }

  if (!Array.isArray(liveWriteResult.workItemEntityKeys)) {
    findings.push("workItemEntityKeys must list the public work queue entity keys");
  } else {
    if (liveWriteResult.workItemEntityKeys.length < 3) {
      findings.push("workItemEntityKeys must include all public-safe work queue items");
    }
    if (!liveWriteResult.workItemEntityKeys.includes(workItemEntityKey)) {
      findings.push("workItemEntityKeys must include the selected workItemEntityKey");
    }
    if (new Set(liveWriteResult.workItemEntityKeys).size !== liveWriteResult.workItemEntityKeys.length) {
      findings.push("workItemEntityKeys must be unique");
    }
    for (const [index, entityKey] of liveWriteResult.workItemEntityKeys.entries()) {
      if (!hex32BytePattern.test(entityKey ?? "")) {
        findings.push(`workItemEntityKeys[${index}] must be a 32-byte hex value`);
      }
    }
  }

  if (
    !Number.isInteger(liveWriteResult.workItemCountWritten) ||
    liveWriteResult.workItemCountWritten !== liveWriteResult.workItemEntityKeys?.length
  ) {
    findings.push("workItemCountWritten must match workItemEntityKeys.length");
  }

  if (!Array.isArray(liveWriteResult.txHashes) || liveWriteResult.txHashes.length < 3) {
    findings.push(
      "txHashes must include the workspace write, work queue batch write, and child entity batch transaction hashes",
    );
  }

  for (const [index, txHash] of (liveWriteResult.txHashes ?? []).entries()) {
    if (!hex32BytePattern.test(txHash ?? "")) {
      findings.push(`txHashes[${index}] must be a 32-byte hex value`);
    }
  }

  if (Array.isArray(liveWriteResult.txHashes)) {
    const txHashes = liveWriteResult.txHashes.filter(Boolean);
    if (new Set(txHashes).size !== txHashes.length) {
      findings.push("txHashes must be unique");
    }
  }

  for (const field of ["owner", "creator"]) {
    if (!evmAddressPattern.test(liveWriteResult[field] ?? "")) {
      findings.push(`${field} must be a valid EVM address`);
    }
  }

  const metadataEvidence = liveWriteResult.metadataEvidence ?? {};
  for (const field of ["ownerSource", "creatorSource"]) {
    const source = metadataEvidence[field];
    if (
      typeof source !== "string" ||
      !source.startsWith("arkiv_query:reviewEventsByWorkItem:") ||
      !source.includes("$")
    ) {
      findings.push(
        `metadataEvidence.${field} must prove the value came from linked Arkiv review-event metadata`,
      );
    }
  }
  for (const [field, expectedKey] of [
    ["ownerEntityKey", reviewEventEntityKey],
    ["creatorEntityKey", reviewEventEntityKey],
  ]) {
    if (metadataEvidence[field] !== expectedKey) {
      findings.push(
        `metadataEvidence.${field} must match reviewEventEntityKey from the relationship query`,
      );
    }
  }

  const queriedAtMs = Date.parse(liveWriteResult.queriedAt ?? "");
  if (!Number.isFinite(queriedAtMs)) {
    findings.push("queriedAt must be an ISO timestamp");
  }

  const queryEvidence = liveWriteResult.queryEvidence ?? {};
  if (
    !Number.isInteger(queryEvidence.workItemsByProjectCount) ||
    queryEvidence.workItemsByProjectCount < liveWriteResult.workItemCountWritten
  ) {
    findings.push(
      "queryEvidence.workItemsByProjectCount must cover the full public-safe work queue",
    );
  }

  for (const field of [
    "workItemsByStatusCount",
    "byStatusCount",
    "bySourceCount",
    "recentCount",
    "reviewEventsByWorkspaceCount",
    "reviewEventsByWorkItemCount",
  ]) {
    if (!Number.isInteger(queryEvidence[field]) || queryEvidence[field] < 1) {
      findings.push(`queryEvidence.${field} must be a positive integer`);
    }
  }

  const serialized = JSON.stringify(liveWriteResult);
  if (!allowExampleRefs && exampleRefPattern.test(serialized)) {
    findings.push("live write result still contains example entity keys or transaction hashes");
  }

  for (const forbidden of [
    "PENDING",
    "connectedAccount",
    [".", "proofforge-private"].join(""),
    ["", "Users", ""].join("/"),
  ]) {
    if (serialized.includes(forbidden)) {
      findings.push(`live write result contains forbidden private marker: ${forbidden}`);
    }
  }

  return findings;
}
