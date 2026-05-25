import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ENTITY_TYPES, PROJECT_ATTRIBUTE } from "../src/schema.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "proof-memory-negative-"));

function runNode(args, env = {}) {
  return spawnSync(process.execPath, args, {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
}

function mustPass(label, args, env = {}) {
  const result = runNode(args, env);
  if (result.status !== 0) {
    throw new Error(
      `${label} failed unexpectedly:\n${result.stdout}\n${result.stderr}`,
    );
  }
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeTempReceipt(name, receipt) {
  const target = path.join(tempDir, `${name}.json`);
  fs.writeFileSync(target, `${JSON.stringify(receipt, null, 2)}\n`);
  return target;
}

function expectVerifierFailure(name, receipt, expectedText) {
  const receiptPath = writeTempReceipt(name, receipt);
  const result = runNode(["scripts/verify-receipt.mjs"], {
    RECEIPT_PATH: receiptPath,
  });
  const output = `${result.stdout}\n${result.stderr}`;
  if (result.status === 0) {
    throw new Error(`${name} passed but should have failed`);
  }
  if (!output.includes(expectedText)) {
    throw new Error(
      `${name} failed for the wrong reason. Expected "${expectedText}".\n${output}`,
    );
  }
}

function removeProjectAttribute(attributes) {
  return attributes.filter(
    (attribute) =>
      !(
        attribute.key === PROJECT_ATTRIBUTE.key &&
        attribute.value === PROJECT_ATTRIBUTE.value
      ),
  );
}

function replaceAttribute(entity, key, value) {
  const attribute = entity.attributes.find((candidate) => candidate.key === key);
  if (!attribute) {
    throw new Error(`${entity.entityType} missing ${key}`);
  }
  attribute.value = value;
}

mustPass("build configured receipt", ["scripts/build-receipt.mjs"]);
mustPass("finalize example live receipt", ["scripts/finalize-live-receipt.mjs"]);

const configuredReceipt = readJson("out/proof-memory-receipt.json");
const liveReceipt = readJson("out/live-proof-memory-receipt.json");

{
  const receipt = structuredClone(configuredReceipt);
  receipt.entities[0].attributes = removeProjectAttribute(
    receipt.entities[0].attributes,
  );
  expectVerifierFailure(
    "missing-entity-project-scope",
    receipt,
    "missing project attribute",
  );
}

{
  const receipt = structuredClone(configuredReceipt);
  receipt.requiredQueries[0].filters = removeProjectAttribute(
    receipt.requiredQueries[0].filters,
  );
  expectVerifierFailure(
    "missing-query-project-scope",
    receipt,
    "query workItemsByProject missing project attribute",
  );
}

{
  const receipt = structuredClone(liveReceipt);
  const proofPacket = receipt.entities.find(
    (entity) => entity.entityType === ENTITY_TYPES.ProofPacketSummary,
  );
  replaceAttribute(
    proofPacket,
    "workItemKey",
    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
  );
  expectVerifierFailure(
    "bad-live-work-item-relationship",
    receipt,
    "workItemKey relationships must match workItemEntityKey",
  );
}

{
  const receipt = structuredClone(liveReceipt);
  receipt.protocolRefs.txHashes = [
    "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  ];
  expectVerifierFailure(
    "missing-live-write-transactions",
    receipt,
    "workspace, work queue batch, and child entity batch txHashes",
  );
}

{
  const receipt = structuredClone(liveReceipt);
  delete receipt.protocolRefs.metadataEvidence.ownerSource;
  expectVerifierFailure(
    "missing-live-owner-metadata-evidence",
    receipt,
    "metadataEvidence.ownerSource must prove linked Arkiv review-event metadata source",
  );
}

{
  const receipt = structuredClone(liveReceipt);
  receipt.protocolRefs.metadataEvidence.ownerEntityKey =
    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
  expectVerifierFailure(
    "wrong-live-owner-metadata-entity",
    receipt,
    "metadataEvidence.ownerEntityKey must match reviewEventEntityKey",
  );
}

{
  const receipt = structuredClone(configuredReceipt);
  receipt.entities[0].payload.privateLeak = [".", "proofforge-private"].join("");
  expectVerifierFailure(
    "private-workspace-leak",
    receipt,
    "forbidden private phrase",
  );
}

console.log("Verifier negative-case tests passed");
