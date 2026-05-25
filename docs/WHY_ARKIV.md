# Why Arkiv

ProofForge is a private operating workspace for agent-assisted work. It can
contain sensitive notes, drafts, payout context, approval history, local paths,
and internal execution traces. That private workspace should not become public
just because someone needs to verify that work happened.

The gap is public proof memory.

## The Workflow

1. A private ProofForge run identifies a source-backed work item.
2. The work is converted into a redacted proof packet.
3. Only public-safe facts are published to Arkiv.
4. Reviewers query the public proof trail without seeing the private workspace.

This lets a maintainer, judge, client, or downstream tool ask:

- what work item was reviewed;
- what proof packet was prepared;
- which artifacts were referenced;
- which wallet wrote the proof memory;
- who created the public record;
- how work items, packets, and review events connect.

## Why Not Just A Normal Database

A normal private database is useful for ProofForge operations, but it does not
give outside reviewers a neutral public proof layer. If the proof record lives
only in ProofForge, reviewers must trust the private app operator. If the whole
workspace is published, private material leaks.

Arkiv fits the middle ground:

- public enough for independent review;
- structured enough for typed queries;
- wallet-owned enough to show control;
- attributed enough to preserve creator metadata;
- scoped enough to separate this project from other records;
- flexible enough to model relationships between work, proof, and review.

## Why Arkiv Is Load-Bearing

The app does not use Arkiv as a badge or file dump. Arkiv is where the public
proof memory lives. The public-safe seed files in the repository are local demo
configuration and example verifier inputs; after the approved live write, every
durable public ProofForge Lite record is represented as a project-scoped Arkiv
entity.

The data model uses:

- `proof_workspace` for the wallet-owned proof namespace;
- `work_item` for every public-safe task/challenge/opportunity in the Work
  queue;
- `proof_packet_summary` for the redacted proof result;
- `review_event` for the linked decision history;
- shared relationship keys across entities;
- string attributes for equality filters;
- numeric attributes for time, risk, priority, evidence, and deadline queries;
- differentiated expiration dates for work queue items, submitted packets,
  accepted proof, and review events;
- `$owner` for wallet-controlled ownership;
- `$creator` for immutable creator attribution;
- live metadata provenance from the linked `review_event` returned by
  `reviewEventsByWorkItem`;
- a unique `PROJECT_ATTRIBUTE` on every entity and query.

Without Arkiv, this would be either a private database that outsiders cannot
verify or a public dump that exposes too much.

## What Judges Should See

The strongest evidence is not one sample proof. It is the reusable pattern:

```text
private work -> public-safe Work queue -> redacted proof packet -> Arkiv entities -> project-scoped queries -> verifier receipt
```

The older shorthand is still true:

```text
private work -> redacted proof object -> Arkiv entities -> project-scoped queries -> verifier receipt
```

This submission is the first proof object. The same pattern can later prove
public-safe bounty, grant, and open-source work without publishing the private
ProofForge workspace.

## Boundary

This repository shows the public proof layer. It intentionally excludes private
records, private drafts, payout setup details, local machine paths, and wallet
secrets.
