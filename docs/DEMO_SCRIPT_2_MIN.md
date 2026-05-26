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

ProofForge mission:

```text
Find useful work. Prove it safely. Get accepted. Track the credit, payout,
benefit, or public proof state that follows.
```

Problem:

```text
Existing work sources, agent runs, maintainer decisions, and payout or credit
states are scattered. Raw agent logs are noisy and often private. Reviewers need
clean proof, not the whole workspace.
```

Why Arkiv:

```text
Arkiv is the public proof ledger for the redacted Proof Pack: wallet-owned
records, immutable creator attribution, typed attributes, relationships,
project-scoped queries, and expiration windows.
```

What the demo proves:

```text
source-backed work lead -> mission gate -> redacted Proof Pack ->
six Arkiv Braga records -> project-scoped queries -> verifier receipt
```

Requirements covered in the recording:

- Theme: AI + Privacy hybrid.
- Public repo and setup: linked from the README.
- Working demo: deployed app on Arkiv Braga testnet.
- Data model: six records across four entity types.
- Project scope: `project=proofforge-lite-arkiv-ethns-2026` on every entity and
  query.
- Ownership: Braga wallet writes expose `$owner` and `$creator` metadata.
- Submission admin fields: team, GitHub handle, wallet address, and contact
  fields belong in the form, not the screen-share narration.

## 0:00-0:20 - Context And Promise

Move: show the first viewport without clicking.

Say:

> ProofForge is a contribution layer for useful work across projects, people,
> and agents. The mission is simple: find useful work, prove it safely, get it
> accepted, and track the credit or value state that follows. This Lite demo
> is an AI plus Privacy submission. It shows why Arkiv matters: Arkiv becomes
> the public proof ledger, without exposing private agent logs or operator
> notes.

## 0:20-0:32 - Work

Move: leave `Work` selected and point to the active Arkiv challenge work item.

Say:

> The active work item is this Arkiv ETHNS challenge. ProofForge Lite keeps a
> public-safe work queue, so the reviewer sees where the work came from, who can
> accept it, what proof is needed, and the next action.

## 0:32-0:48 - Preflight

Move: click `Preflight`.

Say:

> Before anything public happens, the mission gate checks acceptance owner,
> required proof, privacy boundary, and approval gates. The proof node can run
> local checks, verify schema and privacy, and package evidence. Human approval
> stays in front of public writes and submissions.

## 0:48-1:05 - Proof Packet

Move: click `Proof Packet`, then click `Build proof packet`.

Say:

> This creates the redacted Proof Pack: the maintainer-safe case file. It
> includes requirements, artifact hashes, status, risk, and the
> runner-verifier-packager trace. Private notes, drafts, logs, and account
> material are excluded.

## 1:05-1:30 - Arkiv Memory

Move: click `Arkiv Memory`. If the wallet is already connected, click
`Write Arkiv entities`; otherwise point to the gated write button and click
`Query Braga`.

Say:

> Arkiv is great for ProofForge because proof has to be public, owned,
> attributed, and queryable. Here the redacted Proof Pack becomes six Braga
> records across four entity types: workspace, work items, proof packet, and
> review event. Every entity and query uses
> project equals proofforge-lite-arkiv-ethns-2026, with relationships linked by
> Arkiv keys.

## 1:30-1:50 - Verify

Move: click `Verify`, then click `Query Braga` if you have not already queried.
Show the summary cards, not raw JSON.

Say:

> Now a reviewer can query proof history by project, status, source type, time
> range, workspace relationship, and work-item relationship. The receipt checks
> entity keys, transaction hashes, owner, creator, relationships, and the
> privacy boundary. The public repo includes the setup commands and verifier.

## 1:50-2:00 - Close

Move: return to `Arkiv Memory` or `Verify` and keep the live evidence summary in
view.

Say:

> That is the ProofForge loop: useful work becomes accepted proof, and Arkiv
> makes the public proof state reusable across future bounties, grants, and
> open-source work.

## Timing Rules

- Do not record wallet waiting time. If the write takes too long, stop and
  restart after the live evidence is ready.
- If you need to save time, skip the terminal verifier and say the verifier is
  included in the public repo.
- Keep narration near 285 spoken words. Speak briskly, or skip the terminal
  verifier mention if needed.
- Do not mention earnings as completed, prizes as won, or final submission as
  done unless that has actually happened.
