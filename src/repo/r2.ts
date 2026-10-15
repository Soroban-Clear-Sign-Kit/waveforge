import path from "node:path";
import type { CheckResult } from "../report.js";
import { fileExists, readTextFile } from "../util/fs.js";

const PLACEHOLDER_REGEX = /\b(LIVE_DEMO_URL|LIVE_APP_URL|LIVE_API_URL|DEMO_VIDEO_URL|TODO|TBD)\b|lorem ipsum/i;
const SETUP_HEADING_REGEX = /^#{1,6}\s+.*(install|quickstart|getting\s+started)/im;

export async function r2Check(root: string, _options?: unknown): Promise<CheckResult> {
  const candidateFiles = ["README.md", "readme.md"];
  let readmeFile: string | null = null;
  let content: string | null = null;

  for (const candidate of candidateFiles) {
    const fullPath = path.join(root, candidate);
    if (await fileExists(fullPath)) {
      readmeFile = candidate;
      content = await readTextFile(fullPath);
      break;
    }
  }

  if (!readmeFile || content === null) {
    return {
      id: "R2",
      title: "README Documentation",
      status: "fail",
      message: "README.md does not exist in repository root.",
      fix: "Add a README.md file in the repository root.",
    };
  }

  const intro = content.slice(0, 600);
  const mentionsEcosystem = /stellar|soroban/i.test(intro);
  if (!mentionsEcosystem) {
    return {
      id: "R2",
      title: "README Documentation",
      status: "fail",
      message: "First 600 characters of README.md do not mention Stellar or Soroban.",
      fix: "Add an introductory summary mentioning Stellar or Soroban within the first 600 characters of README.md.",
    };
  }

  const lines = content.split(/\r?\n/);
  const placeholderEvidence: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const match = PLACEHOLDER_REGEX.exec(line);
    if (match) {
      placeholderEvidence.push(`Line ${i + 1}: ${match[0]}`);
    }
  }

  const hasSetupHeading = SETUP_HEADING_REGEX.test(content);

  if (placeholderEvidence.length > 0 || !hasSetupHeading) {
    let msg = "";
    if (placeholderEvidence.length > 0 && !hasSetupHeading) {
      msg = `README.md is missing a setup/quickstart heading and contains ${placeholderEvidence.length} placeholder(s).`;
    } else if (placeholderEvidence.length > 0) {
      msg = `README.md contains ${placeholderEvidence.length} unresolved placeholder token(s).`;
    } else {
      msg = "README.md is missing an installation, quickstart, or getting started heading.";
    }

    return {
      id: "R2",
      title: "README Documentation",
      status: "warn",
      message: msg,
      fix: "Add an Installation or Quickstart section and replace placeholder tokens (LIVE_*_URL, TODO, TBD, lorem ipsum).",
      evidence: placeholderEvidence.length > 0 ? placeholderEvidence : undefined,
    };
  }

  return {
    id: "R2",
    title: "README Documentation",
    status: "pass",
    message: "README.md exists and meets documentation requirements.",
  };
}

r2Check.id = "R2";
r2Check.title = "README Documentation";
r2Check.run = (root = ".") => r2Check(root);

export { r2Check as checkR2 };
