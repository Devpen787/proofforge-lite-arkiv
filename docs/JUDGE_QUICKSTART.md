# Judge Quickstart

This guide is public-safe. It is written for fast challenge review after the
public repo and deployed demo exist.

## 2-Minute Review Path

Start with the deployed demo. The important claim is that Arkiv is the public
proof memory database for private ProofForge work, not a standalone toy store.

1. Open the deployed HTTPS demo.
2. Review the selected work item: `Arkiv ETHNS Web3 Database Builder Challenge`.
3. Open `Preflight` to see requirements, privacy boundary, approval gates, and
   blocked actions.
4. Open `Proof Packet` to see the redacted public/private split.
5. Connect a Braga-compatible EVM wallet and approve the Braga chain prompt if
   the wallet is on another network.
6. Click `Write Arkiv entities`.
7. Click `Query Braga` after the write completes if the app has not already
   refreshed query evidence.
8. Click `Copy live result`.
9. Run the verifier locally:

```bash
npm ci
npm run check
npm run smoke:web
npm run test:demo-path
npm run test:verifier
```

`npm run test:demo-path` opens the bundled app in a real browser, clicks the
five-step demo path on desktop and mobile, and confirms approval-gated
live-query/live-write actions are still locked.

`npm run test:verifier` intentionally mutates receipts and confirms the verifier
fails on missing project scope, bad live relationships, incomplete write
transaction evidence, and private workspace leakage.

For real live evidence, save the copied output as `data/live-write-result.json`
and run:

```bash
LIVE_WRITE_RESULT_PATH=data/live-write-result.json npm run live-result:check
LIVE_WRITE_RESULT_PATH=data/live-write-result.json npm run finalize:receipt
RECEIPT_PATH=out/live-proof-memory-receipt.json npm run verify
```

## What To Look For

Arkiv is the primary data layer. The app models public-safe proof memory as
separate linked entities instead of one opaque blob:

- `proof_workspace`;
- `work_item`;
- `proof_packet_summary`;
- `review_event`.

Every entity and query is scoped by:

```ts
{ key: "project", value: "proofforge-lite-arkiv-ethns-2026" }
```

The live result should show:

- entity keys for all four entity types;
- a `workItemEntityKeys` list covering every public-safe Work queue row;
- three transaction hashes from the write flow: proof workspace create, Work
  queue batch create, and child entity batch create;
- matching relationship keys across child entities;
- `$owner` and `$creator` metadata from the linked `review_event` returned by
  the `reviewEventsByWorkItem` Arkiv query;
- query counts for the full Work queue, work status, packet status, source
  type, time range, workspace relationship, and work-item relationship.

## Rubric Map

| Arkiv rubric area | Evidence in this repo |
| --- | --- |
| Entity schema design | `src/schema.mjs` defines typed workspace, work-item, packet, and review-event entities. |
| Query usage | Required query specs cover project, status, source, time range, and relationship filters. |
| Ownership model | Browser write flow requires wallet ownership, enforces Braga before writes, and live receipt verifies `$owner`, `$creator`, and their Arkiv metadata provenance. |
| Entity relationships | Work item, packet, and review event share workspace/work-item relationship keys. |
| Expiration dates | Entity builders use different expiration tiers for work queue items, packets, and review events. |
| Advanced features | The adapter uses linked writes, typed attributes, live metadata, and deterministic receipt verification. |

## Claim Boundary

Live in a fresh clone:

- receipt generation;
- schema verification;
- redaction checks;
- web bundle build;
- Arkiv SDK adapter import/bundle verification.
- Braga wallet chain guard verification.

Live only after the deployed Braga write path is run:

- real entity keys;
- transaction hashes;
- `$owner` and `$creator` metadata;
- live query counts;
- final live receipt.

Not claimed:

- private ProofForge workspace data on Arkiv;
- payout, prize, or acceptance;
- production ProofForge account integration.
