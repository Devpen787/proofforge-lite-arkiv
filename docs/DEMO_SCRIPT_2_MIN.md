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

## Demo Thesis

Problem:

```text
Useful agent work is private, but useful proof needs to be public.
```

Why Arkiv:

```text
Arkiv gives the public proof layer: wallet-owned records, immutable creator
attribution, typed attributes, project-scoped queries, relationships, and
expiration windows.
```

What the demo proves:

```text
private work item -> redacted proof packet -> six Arkiv Braga records ->
project-scoped queries -> deterministic verifier receipt
```

## 0:00-0:20 - Context And Promise

Move: show the first viewport without clicking.

Say:

> Most useful AI work happens in private: notes, approvals, source checks, and
> draft decisions. But judges or clients still need proof without seeing that
> workspace. ProofForge Lite demonstrates the missing layer: Arkiv as public
> proof memory. In two minutes I’ll show one private work item becoming
> redacted, wallet-owned, queryable Arkiv records.

## 0:20-0:32 - Work

Move: leave `Work` selected and point to the active Arkiv challenge work item.

Say:

> The active work item is this Arkiv ETHNS challenge. ProofForge Lite keeps a
> public-safe work queue, so reviewers see source, status, risk, and next
> action, not private notes.

## 0:32-0:48 - Preflight

Move: click `Preflight`.

Say:

> Before anything public happens, the mission gate checks acceptance owner,
> required proof, privacy boundary, and approval gates. The proof node can run
> local checks, verify schema and privacy, and package evidence. It cannot leak
> private notes or write to Arkiv without human approval.

## 0:48-1:05 - Proof Packet

Move: click `Proof Packet`, then click `Build proof packet`.

Say:

> This creates the redacted case file. It includes challenge requirements,
> artifact hashes, status, risk, and the runner-verifier-packager trace. The
> private workspace, secrets, drafts, logs, and account material are excluded.

## 1:05-1:30 - Arkiv Memory

Move: click `Arkiv Memory`. If the wallet is already connected, click
`Write Arkiv entities`; otherwise point to the gated write button and click
`Query Braga`.

Say:

> Arkiv is great for this because it is not just storage. It gives us public,
> wallet-owned, queryable records with owner and creator metadata. ProofForge
> Lite writes six Braga records across four entity types: workspace, work
> items, proof packet, and review event. Every entity and query uses the same
> project attribute, and relationships are linked by Arkiv keys.

## 1:30-1:50 - Verify

Move: click `Verify`, then click `Query Braga` if you have not already queried.
Show the summary cards, not raw JSON.

Say:

> Reviewers can query the proof history by project, status, source type, time
> range, workspace relationship, and work-item relationship. The receipt checks
> entity keys, transaction hashes, owner, creator, relationships, and the
> public-private boundary.

## 1:50-2:00 - Close

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
- Keep narration near 285 spoken words. Speak briskly, or skip the terminal
  verifier mention if needed.
- Do not mention earnings as completed, prizes as won, or final submission as
  done unless that has actually happened.
