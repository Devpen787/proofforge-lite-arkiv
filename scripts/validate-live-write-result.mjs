import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateLiveWriteResult } from "./live-write-result-rules.mjs";

const root = new URL("..", import.meta.url);
const inputPath = path.resolve(
  process.env.LIVE_WRITE_RESULT_PATH ??
    fileURLToPath(new URL("data/live-write-result.example.json", root)),
);
const allowExampleRefs = process.env.ALLOW_EXAMPLE_LIVE_RESULT === "1";
const liveWriteResult = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const findings = validateLiveWriteResult(liveWriteResult, { allowExampleRefs });

if (findings.length > 0) {
  console.error("Live write result validation failed:");
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log(
  `Live write result validation passed (${allowExampleRefs ? "example refs allowed" : "real refs required"})`,
);
