# Live Evidence Guide

Use this guide only after the project owner approves public repo, deployment,
wallet, faucet, live Arkiv writes and queries, and demo evidence collection.

## Evidence To Capture

- Public repository URL.
- Deployed demo URL.
- Demo video URL.
- Braga wallet address used for writes.
- `proof_workspace` entity key.
- selected `work_item` entity key.
- `work_item` entity keys for every public-safe Work queue row.
- `proof_packet_summary` entity key.
- `review_event` entity key.
- Three transaction hashes for the live writes:
  - proof workspace create;
  - work queue batch create;
  - proof packet + review event batch create.
- `$owner` wallet from queried Arkiv metadata.
- `$creator` wallet from queried Arkiv metadata.
- Metadata provenance showing the `reviewEventsByWorkItem` Arkiv query returned
  `$owner` and `$creator` from the linked `review_event`.
- Query evidence counts for:
  - project + all work items;
  - project + work item status;
  - project + packet status;
  - project + source type;
  - project + created-at range;
  - project + `proofWorkspaceKey`;
  - project + `workItemKey`.

## Local Commands

Run the full local package check first:

```bash
npm ci
npm run check
```

Run the local app:

```bash
npm run build:web
npm run dev
```

Open:

```text
http://127.0.0.1:4173/
```

## Browser Flow

Before this flow, prepare a public-safe Braga test wallet using
`docs/BRAGA_TEST_WALLET_SETUP.md`.

1. Connect an approved EVM wallet. If the wallet is on another network, approve
   the app's Braga switch/add prompt before writing.
2. Open `Work` and confirm the Arkiv challenge is the selected work item.
3. Open `Proof Packet` and confirm the public/private split.
4. Click `Write Arkiv entities`.
5. Click `Query Braga` after the write completes if the app has not already
   refreshed query evidence, then confirm project-scoped reads work.
6. Confirm the app creates:
   - `proof_workspace`;
   - one `work_item` per public-safe Work queue row;
   - `proof_packet_summary`;
   - `review_event`.
7. Confirm linked entities share returned relationship keys.
8. Confirm `$owner`, `$creator`, and their Arkiv metadata provenance are visible
   in the live result.
9. Click `Copy live result`.
10. Save the copied JSON as:

```text
data/live-write-result.json
```

## Validate Live Result

The real live result must pass without example placeholders:

```bash
LIVE_WRITE_RESULT_PATH=data/live-write-result.json npm run live-result:check
```

This rejects placeholder entity keys, missing Work queue entity keys,
placeholder transaction hashes, fewer than the three expected write transaction
hashes, invalid owner/creator addresses, owner/creator values that are not
backed by the linked `review_event` returned from `reviewEventsByWorkItem`,
duplicate refs, missing query counts, and private path markers.

The local write-plan test also verifies that the browser wallet path checks
`eth_chainId`, requests `wallet_switchEthereumChain` for Braga, and calls
`wallet_addEthereumChain` when the wallet does not know Braga yet.

## Finalize Receipt

Generate and verify the final receipt:

```bash
LIVE_WRITE_RESULT_PATH=data/live-write-result.json npm run finalize:receipt
RECEIPT_PATH=out/live-proof-memory-receipt.json npm run verify
```

## Freeze Evidence Packet

Save the private packet as:

```text
data/live-evidence-packet.json
```

Then validate it:

```bash
LIVE_EVIDENCE_PACKET_PATH=data/live-evidence-packet.json npm run live:evidence:packet:check
```

## README Updates Before Submission

Replace pending placeholders with:

- public repository URL;
- deployed demo URL;
- demo video URL;
- live entity keys;
- transaction hashes;
- `$owner`;
- `$creator`;
- verifier command output.

## Stop Conditions

Stop before submission if:

- `npm run live-result:check` fails;
- `LIVE_EVIDENCE_PACKET_PATH=data/live-evidence-packet.json npm run
  live:evidence:packet:check` fails;
- `RECEIPT_PATH=out/live-proof-memory-receipt.json npm run verify` fails;
- the deployed app cannot query live Arkiv data;
- README still contains pending live references;
- any private workspace, payout, wallet-secret, or machine path appears in a
  public file.
