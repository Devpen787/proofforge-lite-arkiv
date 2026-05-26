# 2-Minute Screen-Share Demo Script

Public-safe script for the Arkiv challenge video. Record only with the deployed
demo and public repo visible. Do not show private ProofForge workspaces, private
paths, wallet recovery material, internal approval notes, payout setup, or form
drafts.

## Setup Before Recording

- Open the deployed demo: `https://proofforge-lite-arkiv.vercel.app`.
- Keep the browser on the first screen at normal zoom.
- Keep MetaMask on Braga and connected only if you are going to show the live
  write path.
- Keep a terminal ready in the public repo only if you will show the verifier.
- Use `Story` mode for the product walkthrough. Use `Evidence` mode only for a
  brief receipt close-up if there is time.

## 0:00-0:12 - First View

Move: show the first viewport without clicking.

Say:

> This is ProofForge Lite, powered by Arkiv. It turns private agent-assisted
> work into wallet-owned public proof memory. The private workspace stays
> private; Arkiv stores the public proof trail reviewers can query.

## 0:12-0:25 - Work

Move: leave `Work` selected and point to the active Arkiv challenge work item.

Say:

> The active work item is this Arkiv ETHNS challenge. ProofForge Lite keeps a
> public-safe work queue, so the reviewer sees source, status, risk, and next
> action without seeing private opportunity notes.

## 0:25-0:42 - Preflight

Move: click `Preflight`.

Say:

> Before anything public happens, the mission gate checks acceptance owner,
> required proof, privacy boundary, and approval gates. The proof node can run
> local checks, verify schema and privacy, and package evidence. It cannot
> submit, leak private notes, or write to Arkiv without human approval.

## 0:42-1:00 - Proof Packet

Move: click `Proof Packet`, then click `Build proof packet`.

Say:

> This creates the redacted case file. It includes challenge requirements,
> artifact hashes, status, risk, and the runner-verifier-packager trace. It
> excludes private notes, secrets, drafts, logs, and account material.

## 1:00-1:25 - Arkiv Memory

Move: click `Arkiv Memory`. If the wallet is already connected, click
`Write Arkiv entities`; otherwise point to the gated write button and click
`Query Braga`.

Say:

> Arkiv is load-bearing here. ProofForge Lite writes six records across four
> entity types: workspace, work items, proof packet, and review event. Every
> entity and every query uses the same project attribute, and relationships are
> linked by shared Arkiv keys.

## 1:25-1:45 - Verify

Move: click `Verify`, then click `Query Braga` if you have not already queried.
Show the summary cards, not raw JSON.

Say:

> Reviewers can query the proof history by project, status, source type, time
> range, workspace relationship, and work-item relationship. The receipt checks
> entity keys, transaction hashes, owner, creator, relationships, and the
> public-private boundary.

## 1:45-2:00 - Close

Move: return to `Arkiv Memory` or `Verify` and keep the live evidence summary in
view.

Say:

> Without Arkiv, this would be either a private log or an unsafe public dump.
> With Arkiv, it becomes owned, attributed, queryable proof memory for future
> bounties, grants, and open-source work.

## Timing Rules

- Do not record wallet waiting time. If the write takes too long, stop and
  restart after the live evidence is ready.
- If you need to save time, skip the terminal verifier and say the verifier is
  included in the public repo.
- Keep narration under 260 spoken words.
- Do not mention earnings as completed, prizes as won, or final submission as
  done unless that has actually happened.
