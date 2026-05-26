import fs from "node:fs";
import path from "node:path";

const root = new URL("..", import.meta.url);
const packageJson = JSON.parse(fs.readFileSync(new URL("package.json", root), "utf8"));
const licenseRelativePath = fs.existsSync(new URL("LICENSE-DRAFT", root))
  ? "LICENSE-DRAFT"
  : "LICENSE";
const privateOnlyDocs = [
  "docs/LOCAL_QA_REPORT.md",
  "docs/LIVE_CUTOVER_CHECKLIST.md",
  "docs/APPROVAL_PACKET.md",
  "docs/APPROVAL_1_COMMAND_PLAN.md",
  "docs/APPROVAL_1_HANDOFF_TEMPLATE.md",
  "docs/APPROVAL_1_INTAKE.md",
  "docs/APPROVAL_1_MISSING_INPUTS.md",
  "docs/APPROVAL_1_REPLY_TEMPLATE.md",
  "docs/COMPETITION_SNAPSHOT.md",
  "docs/SUBMISSION_READINESS_REPORT.md",
  "docs/FINAL_SUBMISSION_PACKET.md",
  "docs/CURRENT_STATE_AUDIT.md",
  "docs/APPROVAL_1_CUTOVER_PACKET.md",
  "docs/APPROVAL_1_FIRST_30_MINUTES.md",
  "docs/ARKIV_RUBRIC_DEPTH_AUDIT.md",
  "docs/CUTOVER_BRIEF.md",
  "docs/DEADLINE_RUNWAY_AUDIT.md",
  "docs/DEPLOYMENT_QA_AUDIT.md",
  "docs/DEMO_RECORDING_AUDIT.md",
  "docs/DEMO_REHEARSAL_AUDIT.md",
  "docs/DEVINSON_APPROVAL_REQUEST.md",
  "docs/FINAL_FORM_HANDOFF_AUDIT.md",
  "docs/HACKATHON_OS_SCORECARD.md",
  "docs/LINKED_TERMS_DUE_DILIGENCE.md",
  "docs/LIVE_EVIDENCE_PACKET_AUDIT.md",
  "docs/OBJECTIVE_COMPLETION_AUDIT.md",
  "docs/OFFICIAL_FORM_SURFACE_AUDIT.md",
  "docs/OFFICIAL_SOURCE_SNAPSHOT.md",
  "docs/ORIGINAL_WORK_AUDIT.md",
  "docs/PROOFFORGE_LITE_STORYBOARD.md",
  "docs/PUBLIC_PACKAGE_MANIFEST.json",
  "docs/PUBLIC_SUBMISSION_SURFACE_AUDIT.md",
  "docs/REAL_PROOFFORGE_UX_TAKEOVER_REVIEW.md",
  "docs/ROOT_PRIVACY_GATE_AUDIT.md",
  "docs/STATIC_DEPLOYMENT_AUDIT.md",
  "docs/WALLET_FAUCET_SAFETY_AUDIT.md",
];
const isPrivateStarter =
  packageJson.private === true ||
  packageJson.name === "proofforge-lite-arkiv-starter" ||
  packageJson.name === "proofforge-lite-arkiv-starter";
const requiredFiles = [
  "README.md",
  licenseRelativePath,
  ".gitignore",
  ".github/workflows/check.yml",
  "vercel.json",
  "package.json",
  "package-lock.json",
  "src/browser-app.ts",
  "src/schema.mjs",
  "src/arkiv-adapter-template.ts",
  "data/seed-work-items.json",
  "data/live-write-result.example.json",
  "data/live-evidence-packet.example.json",
  "scripts/live-write-result-rules.mjs",
  "scripts/validate-live-write-result.mjs",
  "scripts/validate-live-evidence-packet.mjs",
  "scripts/build-web.mjs",
  "scripts/validate-web-smoke.mjs",
  "scripts/validate-web-clickthrough.mjs",
  "scripts/build-receipt.mjs",
  "scripts/finalize-live-receipt.mjs",
  "scripts/verify-receipt.mjs",
  "scripts/test-verifier-negative-cases.mjs",
  "scripts/test-arkiv-write-plan.mjs",
  "scripts/verify-arkiv-adapter.mjs",
  "scripts/serve-web.mjs",
  "scripts/validate-challenge-requirements.mjs",
  "scripts/validate-public-privacy-boundary.mjs",
  "docs/REQUIREMENTS_MATRIX.md",
  "docs/WHY_ARKIV.md",
  "docs/LIVE_EVIDENCE_GUIDE.md",
  "docs/JUDGE_QUICKSTART.md",
  "docs/BRAGA_TEST_WALLET_SETUP.md",
  "web/index.html",
  "web/styles.css",
  "web/app.bundle.js",
  "docs/screenshots/ui-desktop-bundled.png",
  "docs/screenshots/ui-mobile-bundled.png",
  "out/proof-memory-receipt.json",
];

if (isPrivateStarter) {
  requiredFiles.push(
    "docs/PUBLIC_README_DRAFT.md",
    "docs/SUBMISSION_FORM_DRAFT.md",
    "data/approval-1-inputs.example.json",
    "data/approval-1-reply.example.txt",
    "data/approval-2-inputs.example.json",
    "data/deployment-qa.example.json",
    "data/live-evidence-packet.example.json",
    "data/submission-metadata.example.json",
    "scripts/validate-deadline-source-gate.mjs",
    "scripts/validate-web-clickthrough.mjs",
    "scripts/validate-deadline-runway.mjs",
    "scripts/validate-deployment-qa-packet.mjs",
    "scripts/validate-linked-terms-due-diligence.mjs",
    "scripts/validate-hackathon-os-scorecard.mjs",
    "scripts/validate-submission-form-draft.mjs",
    "scripts/validate-final-form-handoff.mjs",
    "scripts/validate-live-evidence-packet.mjs",
    "scripts/validate-official-form-surface.mjs",
    "scripts/validate-root-privacy-check.mjs",
    "scripts/validate-objective-completion-audit.mjs",
    "scripts/validate-original-work-audit.mjs",
    "scripts/validate-arkiv-rubric-depth.mjs",
    "scripts/validate-static-deployment.mjs",
    "scripts/validate-wallet-faucet-safety.mjs",
    "scripts/validate-public-manifest-boundary.mjs",
    "scripts/validate-public-submission-surface.mjs",
    "scripts/validate-standalone-public-copy-sync.mjs",
    "scripts/write-approval-1-cutover-packet.mjs",
    "scripts/write-approval-1-command-plan.mjs",
    "scripts/write-approval-1-reply-template.mjs",
    "scripts/write-approval-1-missing-inputs-report.mjs",
    "scripts/parse-approval-1-reply.mjs",
    "scripts/validate-cutover-tooling.mjs",
    "scripts/validate-approval-1-handoff-template.mjs",
    "scripts/validate-approval-1-cutover-packet.mjs",
    "scripts/validate-approval-1-command-plan.mjs",
    "scripts/validate-approval-1-runbook.mjs",
    "scripts/validate-approval-1-reply-template.mjs",
    "scripts/validate-approval-1-missing-inputs-report.mjs",
    "scripts/validate-approval-1-parser.mjs",
    "scripts/validate-approval-1-inputs.mjs",
    "scripts/validate-approval-2-inputs.mjs",
    "scripts/validate-approval-gates-locked.mjs",
    "scripts/validate-demo-recording-audit.mjs",
    "scripts/validate-demo-rehearsal-audit.mjs",
    "scripts/validate-demo-script.mjs",
    "scripts/write-demo-rehearsal-audit.mjs",
    "scripts/write-submission-readiness-report.mjs",
    "scripts/write-final-submission-packet.mjs",
    "scripts/final-submission-preflight.mjs",
    "scripts/package-public-preview.mjs",
    "scripts/validate-release-manifest.mjs",
    "scripts/verify-release-candidate.mjs",
    "scripts/run-local-greenline.mjs",
    "scripts/write-cutover-brief.mjs",
    "scripts/validate-cutover-brief.mjs",
    ...privateOnlyDocs,
  );
}

const forbiddenPublicClaims = [
  `we ${"submitted"}`,
  `${"submitted"} to arkiv`,
  "winner",
  "won ",
  `earned ${"payout"}`,
  `prize ${"received"}`,
  "transaction hash:",
];

const failures = [];

for (const relativePath of requiredFiles) {
  const absolutePath = new URL(relativePath, root);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`missing ${relativePath}`);
  }
}

if (isPrivateStarter) {
  const missingPrivateDocs = privateOnlyDocs.filter(
    (relativePath) => !fs.existsSync(new URL(relativePath, root)),
  );
  for (const relativePath of missingPrivateDocs) {
    failures.push(`private starter missing required private file ${relativePath}`);
  }
}

const publicDraftFiles = [
  "docs/PUBLIC_README_DRAFT.md",
  "docs/SUBMISSION_FORM_DRAFT.md",
  "docs/LIVE_CUTOVER_CHECKLIST.md",
  "docs/APPROVAL_PACKET.md",
  "docs/SUBMISSION_READINESS_REPORT.md",
  "docs/FINAL_SUBMISSION_PACKET.md",
  "docs/CURRENT_STATE_AUDIT.md",
  "docs/CUTOVER_BRIEF.md",
  "docs/APPROVAL_1_FIRST_30_MINUTES.md",
  "docs/ARKIV_RUBRIC_DEPTH_AUDIT.md",
  "docs/DEMO_RECORDING_AUDIT.md",
  "docs/DEPLOYMENT_QA_AUDIT.md",
  "docs/ORIGINAL_WORK_AUDIT.md",
  "docs/LINKED_TERMS_DUE_DILIGENCE.md",
  "docs/LIVE_EVIDENCE_PACKET_AUDIT.md",
  "docs/PUBLIC_SUBMISSION_SURFACE_AUDIT.md",
  "docs/STATIC_DEPLOYMENT_AUDIT.md",
  "docs/DEVINSON_APPROVAL_REQUEST.md",
  "docs/OFFICIAL_FORM_SURFACE_AUDIT.md",
  "docs/ROOT_PRIVACY_GATE_AUDIT.md",
  "web/index.html",
  "src/browser-app.ts",
  "web/app.bundle.js",
  "web/styles.css",
];

for (const relativePath of publicDraftFiles) {
  const absolutePath = new URL(relativePath, root);
  if (!fs.existsSync(absolutePath)) {
    continue;
  }

  const text = fs.readFileSync(absolutePath, "utf8").toLowerCase();
  for (const claim of forbiddenPublicClaims) {
    if (text.includes(claim)) {
      failures.push(`${relativePath} contains forbidden premature claim: ${claim}`);
    }
  }

  if (/\/Users\/[A-Za-z0-9._-]+/.test(text)) {
    failures.push(`${relativePath} contains local filesystem path`);
  }
}

const manifestPath = new URL("docs/PUBLIC_PACKAGE_MANIFEST.json", root);
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (!Array.isArray(manifest.publicCopyFiles) || manifest.publicCopyFiles.length === 0) {
    failures.push("PUBLIC_PACKAGE_MANIFEST.json must list publicCopyFiles");
  }
  for (const relativePath of manifest.publicCopyFiles ?? []) {
    const sourcePath = new URL(relativePath, root);
    if (!fs.existsSync(sourcePath)) {
      failures.push(`manifest references missing file ${relativePath}`);
    }
  }
}

if (packageJson.dependencies?.["@arkiv-network/sdk"] !== "0.6.8") {
  failures.push("package.json must pin @arkiv-network/sdk to 0.6.8");
}

if (!packageJson.scripts?.["verify:adapter"]) {
  failures.push("package.json must include verify:adapter script");
}

if (!packageJson.scripts?.dev) {
  failures.push("package.json must include dev script for local demo");
}

if (!packageJson.scripts?.["build:web"]) {
  failures.push("package.json must include build:web script");
}

if (!packageJson.scripts?.["smoke:web"]) {
  failures.push("package.json must include smoke:web script");
}

if (!packageJson.scripts?.["finalize:receipt"]) {
  failures.push("package.json must include finalize:receipt script");
}

if (!packageJson.scripts?.["verify:live-example"]) {
  failures.push("package.json must include verify:live-example script");
}

if (!packageJson.scripts?.["test:verifier"]) {
  failures.push("package.json must include test:verifier script");
}

if (!packageJson.scripts?.["test:write-plan"]) {
  failures.push("package.json must include test:write-plan script");
}

if (!packageJson.scripts?.["requirements:check"]) {
  failures.push("package.json must include requirements:check script");
}

if (!packageJson.scripts?.["live-result:check"]) {
  failures.push("package.json must include live-result:check script");
}

if (!packageJson.scripts?.["live-result:check:example"]) {
  failures.push("package.json must include live-result:check:example script");
}

if (!packageJson.scripts?.["live:evidence:packet:check"]) {
  failures.push("package.json must include live:evidence:packet:check script");
}

if (packageJson.private === false && !packageJson.scripts?.["privacy:check"]) {
  failures.push("public package.json must include privacy:check script");
}

if (isPrivateStarter && !packageJson.scripts?.["privacy:public:check"]) {
  failures.push("package.json must include privacy:public:check script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["live:evidence:packet:check"]) {
  failures.push("package.json must include live:evidence:packet:check script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["readiness:report"]) {
  failures.push("package.json must include readiness:report script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["submission:packet"]) {
  failures.push("package.json must include submission:packet script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["form:draft:check"]) {
  failures.push("package.json must include form:draft:check script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["form:handoff:check"]) {
  failures.push("package.json must include form:handoff:check script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["form:surface:check"]) {
  failures.push("package.json must include form:surface:check script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["privacy:root:check"]) {
  failures.push("package.json must include privacy:root:check script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["originality:check"]) {
  failures.push("package.json must include originality:check script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["rubric:depth:check"]) {
  failures.push("package.json must include rubric:depth:check script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["deploy:static:check"]) {
  failures.push("package.json must include deploy:static:check script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["deploy:qa:check"]) {
  failures.push("package.json must include deploy:qa:check script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["demo:script:check"]) {
  failures.push("package.json must include demo:script:check script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["demo:rehearsal"]) {
  failures.push("package.json must include demo:rehearsal script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["demo:rehearsal:check"]) {
  failures.push("package.json must include demo:rehearsal:check script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["demo:recording:check"]) {
  failures.push("package.json must include demo:recording:check script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["manifest:check"]) {
  failures.push("package.json must include manifest:check script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["surface:public:check"]) {
  failures.push("package.json must include surface:public:check script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["standalone:sync:check"]) {
  failures.push("package.json must include standalone:sync:check script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["pack:public"]) {
  failures.push("package.json must include pack:public script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["verify:rc"]) {
  failures.push("package.json must include verify:rc script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["verify:rc-manifest"]) {
  failures.push("package.json must include verify:rc-manifest script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["preflight:submit"]) {
  failures.push("package.json must include preflight:submit script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["greenline:local"]) {
  failures.push("package.json must include greenline:local script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["cutover:brief"]) {
  failures.push("package.json must include cutover:brief script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["cutover:brief:check"]) {
  failures.push("package.json must include cutover:brief:check script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["approval1:packet"]) {
  failures.push("package.json must include approval1:packet script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["approval1:packet:check"]) {
  failures.push("package.json must include approval1:packet:check script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["approval1:handoff:check"]) {
  failures.push("package.json must include approval1:handoff:check script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["scorecard:check"]) {
  failures.push("package.json must include scorecard:check script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["objective:audit:check"]) {
  failures.push("package.json must include objective:audit:check script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["deadline:check"]) {
  failures.push("package.json must include deadline:check script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["deadline:runway:check"]) {
  failures.push("package.json must include deadline:runway:check script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["terms:linked:check"]) {
  failures.push("package.json must include terms:linked:check script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["wallet:faucet:check"]) {
  failures.push("package.json must include wallet:faucet:check script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["approval1:check"]) {
  failures.push("package.json must include approval1:check script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["approval2:check"]) {
  failures.push("package.json must include approval2:check script in private starter");
}

if (isPrivateStarter && !packageJson.scripts?.["approval:gates:locked"]) {
  failures.push("package.json must include approval:gates:locked script in private starter");
}

const html = fs.readFileSync(new URL("web/index.html", root), "utf8");
const vercelConfig = JSON.parse(fs.readFileSync(new URL("vercel.json", root), "utf8"));
const githubCheckWorkflow = fs.readFileSync(
  new URL(".github/workflows/check.yml", root),
  "utf8",
);
if (!html.includes("app.bundle.js")) {
  failures.push("web/index.html must load the bundled browser app");
}

if (vercelConfig.buildCommand !== "npm run build:web") {
  failures.push("vercel.json must use npm run build:web");
}

if (vercelConfig.outputDirectory !== "web") {
  failures.push("vercel.json must deploy the web output directory");
}

if (vercelConfig.installCommand !== "npm ci") {
  failures.push("vercel.json must install with npm ci");
}

for (const expected of ["actions/setup-node@v4", 'node-version: "24"', "npm ci", "npm run check"]) {
  if (!githubCheckWorkflow.includes(expected)) {
    failures.push(`GitHub check workflow missing phrase: ${expected}`);
  }
}

if (!html.includes("copyLiveResult")) {
  failures.push("web/index.html must include the live-result copy control");
}

for (const expected of [
  "Work",
  "Preflight",
  "Proof Node",
  "Arkiv Memory",
  "Verify",
  "Public proof memory",
  "Private agent work. Public Arkiv proof.",
  "Write Arkiv entities",
  "Copy live result",
]) {
  if (!html.includes(expected)) {
    failures.push(`web/index.html missing screen-share proof-path phrase: ${expected}`);
  }
}

const browserApp = fs.readFileSync(new URL("src/browser-app.ts", root), "utf8");
for (const expected of [
  "queryWorkItemsByProject",
  "queryWorkItemsByStatus",
  "queryReviewEventsByProofWorkspace",
  "queryReviewEventsByWorkItem",
  "buildLiveWriteResult",
  "latestLiveWriteResult",
]) {
  if (!browserApp.includes(expected)) {
    failures.push(`src/browser-app.ts missing ${expected}`);
  }
}

const readmePath = fs.existsSync(new URL("docs/PUBLIC_README_DRAFT.md", root))
  ? new URL("docs/PUBLIC_README_DRAFT.md", root)
  : new URL("README.md", root);
const readmeText = fs.readFileSync(readmePath, "utf8");
const normalizedReadmeText = readmeText.replace(/\s+/g, " ");
for (const expected of [
  "## Team",
  "Devinson Pena: builder and maintainer.",
  "## Challenge Theme",
  "## Tech Stack",
  "## Setup Notes",
  "## Arkiv Integration",
  "Official deadline: May 27, 2026 23:59 UTC.",
  "This README separates live, configured, and roadmap claims.",
  "Live Braga evidence captured: May 26, 2026.",
  "data/live-write-result.json",
  "deployed Braga write as the source of truth",
  "they are not the submitted public database",
  "## Live / Configured / Roadmap",
  "npm run live-result:check",
  "docs/LIVE_EVIDENCE_GUIDE.md",
  "docs/WHY_ARKIV.md",
  "docs/JUDGE_QUICKSTART.md",
  "docs/BRAGA_TEST_WALLET_SETUP.md",
  "Demo video: https://youtu.be/g33aPHGaw_4",
  "docs/screenshots/ui-desktop-bundled.png",
  "docs/screenshots/ui-mobile-bundled.png",
  "docs/screenshots/live-query-complete.png",
]) {
  if (!normalizedReadmeText.includes(expected)) {
    failures.push(`public README draft missing live evidence phrase: ${expected}`);
  }
}

const licenseText = fs.readFileSync(new URL(licenseRelativePath, root), "utf8");
for (const expected of [
  "MIT License",
  "Copyright (c) 2026 Devinson Pena",
  "Permission is hereby granted, free of charge",
]) {
  if (!licenseText.includes(expected)) {
    failures.push(`${licenseRelativePath} missing MIT license phrase: ${expected}`);
  }
}

const liveEvidenceGuide = fs.readFileSync(
  new URL("docs/LIVE_EVIDENCE_GUIDE.md", root),
  "utf8",
);
for (const expected of [
  "LIVE_WRITE_RESULT_PATH=data/live-write-result.json npm run live-result:check",
  "LIVE_EVIDENCE_PACKET_PATH=data/live-evidence-packet.json npm run live:evidence:packet:check",
  "RECEIPT_PATH=out/live-proof-memory-receipt.json npm run verify",
  "docs/BRAGA_TEST_WALLET_SETUP.md",
  "Stop before submission if:",
]) {
  if (!liveEvidenceGuide.includes(expected)) {
    failures.push(`LIVE_EVIDENCE_GUIDE.md missing phrase: ${expected}`);
  }
}

const whyArkiv = fs.readFileSync(new URL("docs/WHY_ARKIV.md", root), "utf8");
for (const expected of [
  "# Why Arkiv",
  "private ProofForge run",
  "public proof memory",
  "Why Not Just A Normal Database",
  "Why Arkiv Is Load-Bearing",
  "private work -> redacted proof object -> Arkiv entities -> project-scoped queries -> verifier receipt",
]) {
  if (!whyArkiv.includes(expected)) {
    failures.push(`WHY_ARKIV.md missing phrase: ${expected}`);
  }
}

const judgeQuickstart = fs.readFileSync(
  new URL("docs/JUDGE_QUICKSTART.md", root),
  "utf8",
);
for (const expected of [
  "# Judge Quickstart",
  "## 2-Minute Review Path",
  "## Rubric Map",
  "Entity schema design",
  "Query usage",
  "Ownership model",
  "LIVE_WRITE_RESULT_PATH=data/live-write-result.json npm run live-result:check",
]) {
  if (!judgeQuickstart.includes(expected)) {
    failures.push(`JUDGE_QUICKSTART.md missing phrase: ${expected}`);
  }
}

const walletSetup = fs.readFileSync(
  new URL("docs/BRAGA_TEST_WALLET_SETUP.md", root),
  "utf8",
);
for (const expected of [
  "# Braga Test Wallet Setup",
  "The project owner should control this wallet.",
  "Copy only the public `0x...` address into the Approval 1 reply block.",
  "Chain ID: 60138453102",
  "Chain ID hex: 0xe0087f86e",
  "https://braga.hoodi.arkiv.network/rpc",
  "https://braga.hoodi.arkiv.network/faucet/",
  "Approval 1 does not authorize final Network School or Arkiv form submission.",
]) {
  if (!walletSetup.includes(expected)) {
    failures.push(`BRAGA_TEST_WALLET_SETUP.md missing phrase: ${expected}`);
  }
}

if (failures.length > 0) {
  console.error("Submission package validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Submission package validation passed (${requiredFiles.length} files checked)`,
);
