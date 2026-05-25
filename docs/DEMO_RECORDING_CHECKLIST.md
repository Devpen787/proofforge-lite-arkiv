# Demo Recording Checklist

Public-safe checklist for the 2 to 3 minute ProofForge Lite screen share.
Record only after the approved live Arkiv write/query path works.

## Screen Setup

- Browser tab: deployed ProofForge Lite demo.
- Terminal tab: public repo only, ready to run the verifier command.
- Optional tab: public README or Judge Quickstart.
- Hide private ProofForge workspace windows, private paths, payout notes,
  wallet secrets, approval notes, and form drafts.

## One-Screen Story

Use the first viewport to establish the whole narrative before clicking:

```text
ProofForge Lite
Private agent work. Public Arkiv proof trail.
Private work -> Redacted proof -> Arkiv entities -> Verifier receipt
```

The judge should understand the product before any terminal command appears.

## Required Recording Beats

1. Work: show the selected Arkiv challenge work item and the public-safe Work
   queue.
2. Preflight: show acceptance owner, value path, risk, blocked actions, and the
   approval-gated proof node.
3. Proof Packet: build the packet and show that private workspace material is
   excluded.
4. Arkiv Memory: show the four linked entity types and the live Braga write.
5. Verify: show project-scoped query evidence and the receipt verifier.

## Timing Budget

| Segment | Target |
| --- | ---: |
| Work | 0:25 |
| Preflight | 0:30 |
| Proof Packet | 0:30 |
| Arkiv Memory | 0:40 |
| Verify | 0:35 |
| Close | 0:20 |

If a wallet prompt or transaction confirmation takes too long, restart the
recording after the transaction is ready. The submitted video should show the
successful end-to-end path, not waiting time.

## Must Show

- Product name: `ProofForge Lite`.
- Arkiv role: public proof memory, not a decorative integration.
- Four entity types: `proof_workspace`, `work_item`,
  `proof_packet_summary`, `review_event`.
- Unique project attribute: `project=proofforge-lite-arkiv-ethns-2026`.
- Live entity keys and transaction hashes after write.
- `$owner` and `$creator` metadata in the live proof evidence.
- Verifier command passing on the finalized live receipt.

## Must Not Show

- Private ProofForge notes, drafts, logs, or local private paths.
- Payout setup details.
- Wallet secrets or recovery material.
- Internal approval notes.
- Official submission form before final submission approval.

## Stop Conditions

Do not record the prize-claim video if any of these are true:

- the deployed demo URL is not working;
- the wallet is not on Braga;
- live Arkiv writes or queries fail;
- the live receipt verifier fails;
- screenshots or evidence still use example entity keys;
- private workspace text appears in the public app, terminal, or README.
