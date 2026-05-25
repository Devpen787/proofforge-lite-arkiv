# 3-Minute Screen-Share Demo Script

Public-safe draft. Record only after live Arkiv writes and queries are approved
and working.
Then add the deployed demo URL, public repo URL, and live Arkiv references before
final submission.

## Screen Setup

Use a simple screen-share layout:

- browser tab: deployed HTTPS demo;
- terminal: public repo only, already at the verifier command path;
- optional README tab if context is needed.

Do not show the private ProofForge workspace, private paths, wallet secrets,
payout setup notes, internal approval notes, or form drafts.

## 0:00-0:25 - Work

Show the first screen and the selected Arkiv challenge work item.

Say:

> This is ProofForge Lite, powered by Arkiv. It is a public-safe version of the
> ProofForge workflow: private agent work stays private, but the proof trail is
> stored on Arkiv as wallet-owned, queryable records. This Arkiv challenge
> submission is the first proof object.

## 0:25-0:55 - Preflight

Open `Preflight`.

Say:

> Before a proof packet is created, ProofForge Lite shows the source,
> acceptance owner, value path, risk, proof requirements, and blocked actions.
> The proof node can prepare evidence, but submissions, live queries, wallet
> writes, public posts, secrets, and payout actions remain approval-gated.

## 0:55-1:25 - Proof Packet

Open `Proof Packet`, then click `Build proof packet`.

Say:

> The proof packet is the redacted public object. It includes challenge
> requirements, artifact hashes, status, risk, and evidence count. It excludes
> private opportunity notes, drafts, local logs, payout setup, and wallet
> secrets.

## 1:25-2:05 - Arkiv Memory

Click `Inspect Arkiv schema`, connect the Braga wallet, and write entities.

Say:

> Arkiv is the data layer. The app writes four linked entities:
> `proof_workspace`, `work_item`, `proof_packet_summary`, and `review_event`.
> The full public-safe Work queue is stored as `work_item` entities. Every
> entity includes the project attribute, and relationships are modeled with
> shared keys like `proofWorkspaceKey` and `workItemKey`.

## 2:05-2:40 - Verify

Open `Verify`, run `Query Braga` if the write flow has not already refreshed
the query result, and show receipt/verifier output. If the terminal is visible,
run `RECEIPT_PATH=out/live-proof-memory-receipt.json npm run verify`.

Say:

> The reviewer can query the full Work queue by project, then filter by status,
> source, time range, workspace relationship, and work-item relationship. The
> query by project, status, source, time range, workspace relationship, and work
> item relationship is the reason Arkiv is load-bearing here. The receipt
> verifier checks entity types, project scoping, relationships, owner, creator,
> transaction hashes, query evidence counts, and the public/private boundary.

## 2:40-3:00 - Close

Return to the Work or Verify view.

Say:

> Without Arkiv this would be a private log or a risky public dump. With Arkiv,
> ProofForge Lite creates public proof memory that is owned, attributed,
> queryable, and reusable across future bounties, grants, and open-source work.

## Timing Guard

If live wallet confirmation takes too long, pause the recording and restart
from a clean state after the transaction completes. The submitted video should
show the successful end-to-end path, not dead air.
