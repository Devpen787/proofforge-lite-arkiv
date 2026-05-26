# Arkiv ETHNS Requirements Matrix

This is the public-safe requirements map for the ProofForge Lite: Powered by
Arkiv submission draft.

## Official Requirements

| Requirement | Status | Evidence | Remaining work |
| --- | --- | --- | --- |
| Build a web3-native app where data lives on Arkiv | Live on Braga | Five-step app in `web/`; schema/adapter in `src/`; `data/live-write-result.json`; write path persisted the full public-safe Work queue as Arkiv `work_item` entities | None before final review |
| Users own their data | Live on Braga | Browser wallet write path enforces Braga and verifies `$owner`, `$creator`, and queried Arkiv metadata provenance in the live receipt | None before final review |
| Use official `@arkiv-network/sdk` | Verified locally | `package.json`, `package-lock.json`, `npm run verify:adapter`, bundled `web/app.bundle.js` | None before final review |
| Braga testnet | Live on Braga | adapter imports `braga`; browser app writes and queries on Braga; receipt names Braga; write-plan test verifies Braga chain switch/add handling | None before final review |
| Unique `PROJECT_ATTRIBUTE` on every entity | Verified with live refs | `npm run check`; live receipt entities include `project=proofforge-lite-arkiv-ethns-2026`; real refs in `data/live-write-result.json` | None before final review |
| Unique `PROJECT_ATTRIBUTE` on every query | Verified with live refs | `npm run check`; browser app query helpers are project-scoped; live query counts are nonzero for all required paths | None before final review |
| At least 2 entity types | Live on Braga | `proof_workspace`, `work_item`, `proof_packet_summary`, `review_event` | None before final review |
| Shared-attribute relationships | Live on Braga | `proofWorkspaceKey` links every public-safe work item to the workspace; `workItemKey` links the selected packet/review to the selected work item | None before final review |
| Numeric attributes for ranges | Verified with live query | `createdAtMs`, `deadlineMs`, `riskScore`, `evidenceCount`, `priority`, `reviewedAtMs`; live recent query count is nonzero | None before final review |
| String attributes for eq filters | Verified with live query | `type`, `status`, `sourceType`, `workItemId`, `packetId`, relationship keys | None before final review |
| Differentiated expiration dates | Live on Braga | expiration tiers in `src/schema.mjs`; SDK template uses `ExpirationTime`; live writes returned entity keys | None before final review |
| Final verifiable live receipt | Verified with live refs | `LIVE_WRITE_RESULT_PATH=data/live-write-result.json npm run live-result:check`; `LIVE_WRITE_RESULT_PATH=data/live-write-result.json npm run finalize:receipt`; `RECEIPT_PATH=out/live-proof-memory-receipt.json npm run verify` | None before final review |
| Public GitHub repo | Created | https://github.com/Devpen787/proofforge-lite-arkiv | Keep synced with approved live evidence updates |
| Open-source license | Published | `LICENSE` in the public repo | None before live evidence |
| Working deployed demo | Deployed and live-tested | https://proofforge-lite-arkiv.vercel.app loads, connects the approved Braga wallet, writes Arkiv entities, and queries them back | None before final review |
| README with setup/stack/team/theme/approach | Published with live refs | `README.md` in the public repo | None before final review |
| Official submission form | Pending approval | `SUBMISSION_FORM_DRAFT.md` | Needs final review and explicit submit approval |
| Network School task page submission | Pending approval | exact task page requirements noted | Needs final review and explicit submit approval |
| Demo video link | Pending | `DEMO_SCRIPT_3_MIN.md` | Optional at submission on task page, required for prize claim; still required by local stop-loss before Approval 2 |
| EVM wallet address | Approved for Approval 1 | `0xdEA670F17DA2Ea7b1a9Fb037DCf14231DB37534e` | Use only for approved Braga cutover; do not publish secrets |

## Arkiv Data Claim

The challenge asks for a web3-native app where data lives on Arkiv. For this
submission, that means the deployed live demo must use Arkiv Braga as the
source of truth for every durable public app record:

- the proof workspace;
- every public-safe Work queue item;
- the selected redacted proof packet;
- the linked review event;
- owner, creator, entity key, transaction hash, relationship, and query-count
  evidence.

The repository's JSON files are seed configuration, public-safe example
evidence shapes, and verifier fixtures. They are allowed to make a fresh clone
reviewable, but they are not the submitted public database. The final
submission uses real Braga writes and project-scoped queries captured in
`data/live-write-result.json`.

## Claim Separation

Live now:

- local receipt generation;
- schema and redaction verification;
- bundled browser app build;
- Arkiv SDK write/query adapter;
- Braga wallet connect/write flow in the browser bundle;
- public deployment path;
- live Braga write/query evidence.

Pending approval:

- demo recording;
- final form submission.

Roadmap / not claimed:

- real maintainer acceptance signatures;
- encrypted access grants;
- production ProofForge migration.
