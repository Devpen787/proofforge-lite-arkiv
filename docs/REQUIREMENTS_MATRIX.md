# Arkiv ETHNS Requirements Matrix

This is the public-safe requirements map for the ProofForge Lite: Powered by
Arkiv submission draft.

## Official Requirements

| Requirement | Status | Evidence | Remaining work |
| --- | --- | --- | --- |
| Build a web3-native app where data lives on Arkiv | Configured, not live | Five-step app in `web/`; schema/adapter in `src/`; receipt in `out/`; write path persists the full public-safe Work queue as Arkiv `work_item` entities | Requires approved wallet/faucet and live Braga writes |
| Users own their data | Configured | Browser wallet write path enforces Braga and verifies `$owner`, `$creator`, and queried Arkiv metadata provenance in the live receipt | Requires approved wallet action |
| Use official `@arkiv-network/sdk` | Verified locally | `package.json`, `package-lock.json`, `npm run verify:adapter`, bundled `web/app.bundle.js` | Requires dependency install in public repo after approval |
| Braga testnet | Configured | adapter imports `braga`; browser app exposes Braga query/write controls; receipt names Braga; write-plan test verifies Braga chain switch/add handling | Requires live wallet/network check |
| Unique `PROJECT_ATTRIBUTE` on every entity | Verified locally | `npm run check`; receipt entities include `project=proofforge-lite-arkiv-ethns-2026` | Replace placeholder entity keys after live write |
| Unique `PROJECT_ATTRIBUTE` on every query | Verified locally | `npm run check`; `requiredQueries` all include project filter; browser app query helpers are project-scoped, including full Work queue query | Live query proof required after write |
| At least 2 entity types | Verified locally | `proof_workspace`, `work_item`, `proof_packet_summary`, `review_event` | Live write required |
| Shared-attribute relationships | Configured | `proofWorkspaceKey` links every public-safe work item to the workspace; `workItemKey` links the selected packet/review to the selected work item | Replace placeholder keys after live write |
| Numeric attributes for ranges | Verified locally | `createdAtMs`, `deadlineMs`, `riskScore`, `evidenceCount`, `priority`, `reviewedAtMs` | Live range query required |
| String attributes for eq filters | Verified locally | `type`, `status`, `sourceType`, `workItemId`, `packetId`, relationship keys | Live query required |
| Differentiated expiration dates | Configured | expiration tiers in `src/schema.mjs`; SDK template uses `ExpirationTime` | Live write required |
| Final verifiable live receipt | Dry-run verified | `npm run live-result:check:example`; `npm run verify:live-example`; `scripts/finalize-live-receipt.mjs` | Replace example write result with real Arkiv output after approval |
| Public GitHub repo | Pending approval | public-safe repo draft exists privately | Needs Devinson approval and public repo creation |
| Open-source license | Drafted | `LICENSE` in the public copy | Needs final repo copy |
| Working deployed demo | Pending approval | bundled local browser app exists, builds, and passes `npm run test:demo-path` click-through locally | Needs live app deploy approval |
| README with setup/stack/team/theme/approach | Drafted | `README.md` | Needs final public repo URLs and live proof refs |
| Official submission form | Pending approval | `SUBMISSION_FORM_DRAFT.md` | Needs final review and explicit submit approval |
| Network School task page submission | Pending approval | exact task page requirements noted | Needs final review and explicit submit approval |
| Demo video link | Pending | `DEMO_SCRIPT_3_MIN.md` | Optional at submission on task page, required for prize claim; still required by local stop-loss before Approval 2 |
| EVM wallet address | Pending Devinson | form draft marks required field | Needs Devinson-provided address |

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
submission remains blocked until real Braga writes and project-scoped queries
replace example evidence.

## Claim Separation

Live now:

- local receipt generation;
- schema and redaction verification;
- bundled browser app build;
- local five-step product surface.

Configured, not live:

- Arkiv SDK write/query adapter;
- Braga wallet connect/write flow in the browser bundle;
- public deployment path.

Pending approval:

- dependency install in public submission repo;
- wallet/faucet use;
- Arkiv entity writes;
- public repo;
- deploy;
- demo recording;
- final form submission.

Roadmap / not claimed:

- real maintainer acceptance signatures;
- encrypted access grants;
- production ProofForge migration.
