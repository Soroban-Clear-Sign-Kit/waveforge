import path from "node:path";
import type { CheckResult } from "../report.js";
import { fileExists, readTextFile } from "../util/fs.js";

const BANNED_PATTERNS = [
  { name: "dollar amount", regex: /\$\s?\d/ },
  { name: "/claim", regex: /\/claim\b/i },
  { name: "paid on merge", regex: /paid on merge/i },
];

const SETUP_HEADING_REGEX = /^#{1,6}\s+.*(setup|installation|getting\s+started)/im;
const TEST_HEADING_REGEX = /^#{1,6}\s+.*(test|testing)/im;
const STELLAR_WAVE_REGEX = /stellar\s+wave/i;

export async function r3Check(root: string): Promise<CheckResult> {
  const candidateFiles = ["CONTRIBUTING.md", "contributing.md"];
  let foundFile: string | null = null;
  let content: string | null = null;

  for (const candidate of candidateFiles) {
    const fullPath = path.join(root, candidate);
    if (await fileExists(fullPath)) {
      foundFile = candidate;
      content = await readTextFile(fullPath);
      break;
    }
  }

  if (!foundFile || content === null) {
    return {
      id: "R3",
      title: "Contributing Guidelines",
      status: "fail",
      message: "CONTRIBUTING.md does not exist in repository root.",
      fix: "Add a CONTRIBUTING.md file in the repository root.",
    };
  }

  const lines = content.split(/\r?\n/);
  const bannedEvidence: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    for (const { name, regex } of BANNED_PATTERNS) {
      const match = regex.exec(line);
      if (match) {
        bannedEvidence.push(`Line ${i + 1} (${name}): ${line.trim()}`);
      }
    }
  }

  if (bannedEvidence.length > 0) {
    return {
      id: "R3",
      title: "Contributing Guidelines",
      status: "fail",
      message: `CONTRIBUTING.md contains prohibited bounty or payment claims on ${bannedEvidence.length} line(s).`,
      fix: "Remove dollar amounts, /claim commands, and 'paid on merge' references from CONTRIBUTING.md.",
      evidence: bannedEvidence,
    };
  }

  const hasSetup = SETUP_HEADING_REGEX.test(content);
  const hasTest = TEST_HEADING_REGEX.test(content);
  const mentionsWave = STELLAR_WAVE_REGEX.test(content);

  const missingWarnings: string[] = [];
  if (!hasSetup) {
    missingWarnings.push("setup section");
  }
  if (!hasTest) {
    missingWarnings.push("test section");
  }
  if (!mentionsWave) {
    missingWarnings.push("Stellar Wave mention");
  }

  if (missingWarnings.length > 0) {
    return {
      id: "R3",
      title: "Contributing Guidelines",
      status: "warn",
      message: `CONTRIBUTING.md is missing: ${missingWarnings.join(", ")}.`,
      fix: "Add setup and test instructions and describe participation in the Stellar Wave program.",
    };
  }

  return {
    id: "R3",
    title: "Contributing Guidelines",
    status: "pass",
    message: "CONTRIBUTING.md exists with setup and test guidelines and mentions Stellar Wave.",
  };
}

r3Check.id = "R3";
r3Check.title = "Contributing Guidelines";
r3Check.run = (root = ".") => r3Check(root);

export { r3Check as checkR3 };
