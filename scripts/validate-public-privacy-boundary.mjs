import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const starterRoot = new URL("..", import.meta.url);
const packageJson = JSON.parse(
  fs.readFileSync(new URL("package.json", starterRoot), "utf8"),
);
const candidateRoot =
  packageJson.private === true || packageJson.name === "proofforge-lite-arkiv-starter"
    ? new URL("../public-repo-preview/", starterRoot)
    : starterRoot;

const rootPath = fileURLToPath(candidateRoot);
const failures = [];

const privateWorkspaceDir = `.${"proofforge"}-private`;
const forbiddenPaths = [
  privateWorkspaceDir,
  "docs/APPROVAL_1_CUTOVER_PACKET.md",
  "docs/APPROVAL_1_FIRST_30_MINUTES.md",
  "docs/APPROVAL_1_HANDOFF_TEMPLATE.md",
  "docs/APPROVAL_1_INTAKE.md",
  "docs/APPROVAL_PACKET.md",
  "docs/CUTOVER_BRIEF.md",
  "docs/DEVINSON_APPROVAL_REQUEST.md",
  "docs/FINAL_SUBMISSION_PACKET.md",
  "docs/HACKATHON_OS_SCORECARD.md",
  "docs/LOCAL_QA_REPORT.md",
  "docs/OFFICIAL_SOURCE_SNAPSHOT.md",
  "docs/PROOFFORGE_LITE_STORYBOARD.md",
  "docs/PUBLIC_PACKAGE_MANIFEST.json",
  "docs/SUBMISSION_FORM_DRAFT.md",
  "docs/SUBMISSION_READINESS_REPORT.md",
  "data/approval-1-inputs.example.json",
  "data/approval-2-inputs.example.json",
  "data/submission-metadata.example.json",
  "scripts/final-submission-preflight.mjs",
  "scripts/run-local-greenline.mjs",
  "scripts/validate-approval-1-inputs.mjs",
  "scripts/validate-approval-2-inputs.mjs",
  "scripts/validate-root-privacy-check.mjs",
  "scripts/write-final-submission-packet.mjs",
];

const forbiddenTextPatterns = [
  { pattern: /\/Users\/[A-Za-z0-9._-]+/i, label: "local filesystem path", kind: "path" },
  {
    pattern: new RegExp(`\\.${"proofforge"}-private`, "i"),
    label: "private workspace path",
    kind: "path",
  },
  { pattern: new RegExp("\\bmnemonic\\b", "i"), label: "mnemonic reference", kind: "secret" },
  {
    pattern: new RegExp(`\\bseed ${"phrase"}\\b`, "i"),
    label: "seed-phrase reference",
    kind: "secret",
  },
  {
    pattern: new RegExp(`\\bprivate ${"key"}\\b`, "i"),
    label: "private-key reference",
    kind: "secret",
  },
  {
    pattern: new RegExp(`\\bwallet ${"password"}\\b`, "i"),
    label: "wallet-password reference",
    kind: "secret",
  },
  {
    pattern: new RegExp(`\\bwe ${"submitted"}\\b`, "i"),
    label: "premature submission claim",
    kind: "claim",
  },
  {
    pattern: new RegExp(`\\b${"submitted"} to arkiv\\b`, "i"),
    label: "premature Arkiv submission claim",
    kind: "claim",
  },
  {
    pattern: new RegExp(`\\bprize ${"received"}\\b`, "i"),
    label: "premature prize claim",
    kind: "claim",
  },
  {
    pattern: new RegExp(`\\bearned ${"payout"}\\b`, "i"),
    label: "premature payout claim",
    kind: "claim",
  },
];

const allowedSecretContextFiles = new Set([
  "README.md",
  "docs/DEMO_SCRIPT_2_MIN.md",
  "docs/DEMO_SCRIPT_3_MIN.md",
  "docs/REQUIREMENTS_MATRIX.md",
  "scripts/validate-public-privacy-boundary.mjs",
  "web/app.bundle.js",
]);

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === "out") {
      return [];
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listFiles(fullPath);
    }

    return [fullPath];
  });
}

function isTextFile(filePath) {
  return [
    ".css",
    ".html",
    ".js",
    ".json",
    ".md",
    ".mjs",
    ".ts",
    "",
  ].includes(path.extname(filePath));
}

if (!fs.existsSync(candidateRoot)) {
  failures.push(`public boundary root does not exist: ${rootPath}`);
} else {
  for (const forbiddenPath of forbiddenPaths) {
    if (fs.existsSync(new URL(forbiddenPath, candidateRoot))) {
      failures.push(`public package includes private-only path: ${forbiddenPath}`);
    }
  }

  for (const filePath of listFiles(rootPath)) {
    if (!isTextFile(filePath)) {
      continue;
    }

    const relativePath = path.relative(rootPath, filePath);
    const text = fs.readFileSync(filePath, "utf8");
    for (const { pattern, label, kind } of forbiddenTextPatterns) {
      if (!pattern.test(text)) {
        continue;
      }

      const isAllowedSecretContext =
        allowedSecretContextFiles.has(relativePath) && kind === "secret";
      if (!isAllowedSecretContext) {
        failures.push(`${relativePath} contains ${label}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error("Public privacy boundary validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Public privacy boundary validation passed for ${rootPath}`);
