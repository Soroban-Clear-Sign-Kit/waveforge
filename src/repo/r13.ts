import { promises as fs } from "node:fs";
import path from "node:path";
import type { CheckResult } from "../report.js";
import { fileExists, readTextFile } from "../util/fs.js";

const DEPLOY_SCRIPT_NAME_PATTERNS = [
  /^deploy.*\.sh$/i,
  /^deploy.*\.bash$/i,
  /^deploy.*\.ts$/i,
  /^deploy.*\.js$/i,
  /^deploy.*\.py$/i,
];

export async function r13Check(root: string, _options?: unknown): Promise<CheckResult> {
  const evidence: string[] = [];

  // 1. Inspect scripts/ directory
  const scriptsDir = path.join(root, "scripts");
  try {
    const entries = await fs.readdir(scriptsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        const isDeployScript = DEPLOY_SCRIPT_NAME_PATTERNS.some((pat) => pat.test(entry.name));
        if (isDeployScript) {
          evidence.push(`scripts/${entry.name}`);
        }
      }
    }
  } catch {
    // scripts directory missing or unreadable
  }

  // 2. Inspect root level deployment scripts (e.g. deploy.sh)
  try {
    const rootEntries = await fs.readdir(root, { withFileTypes: true });
    for (const entry of rootEntries) {
      if (entry.isFile()) {
        const isDeployScript = DEPLOY_SCRIPT_NAME_PATTERNS.some((pat) => pat.test(entry.name));
        if (isDeployScript) {
          evidence.push(entry.name);
        }
      }
    }
  } catch {
    // root unreadable
  }

  // 3. Inspect package.json for deployment npm scripts
  const packageJsonPath = path.join(root, "package.json");
  if (await fileExists(packageJsonPath)) {
    const pkgContent = await readTextFile(packageJsonPath);
    if (pkgContent) {
      try {
        const parsed = JSON.parse(pkgContent) as { scripts?: Record<string, string> };
        if (parsed.scripts && typeof parsed.scripts === "object") {
          for (const [scriptName, scriptCmd] of Object.entries(parsed.scripts)) {
            if (/deploy/i.test(scriptName) || /deploy/i.test(scriptCmd)) {
              evidence.push(`package.json scripts["${scriptName}"]: "${scriptCmd}"`);
            }
          }
        }
      } catch {
        // malformed package.json
      }
    }
  }

  // 4. Inspect Makefile for deploy targets
  const makefilePath = path.join(root, "Makefile");
  if (await fileExists(makefilePath)) {
    const makeContent = await readTextFile(makefilePath);
    if (makeContent && /^deploy(-[a-z0-9]+)?:\s*/im.test(makeContent)) {
      evidence.push("Makefile target: deploy");
    }
  }

  if (evidence.length > 0) {
    return {
      id: "R13",
      title: "Testnet Deployment Scripts",
      status: "pass",
      message: `Found automated deployment script(s): ${evidence.slice(0, 3).join(", ")}.`,
      evidence,
    };
  }

  return {
    id: "R13",
    title: "Testnet Deployment Scripts",
    status: "warn",
    message: "No automated testnet deployment script found in scripts/ or package.json.",
    fix: "Add an automated deployment script (e.g. scripts/deploy.sh or npm run deploy:testnet) to streamline testnet verification.",
  };
}

r13Check.id = "R13";
r13Check.title = "Testnet Deployment Scripts";
r13Check.run = (root = ".") => r13Check(root);

export { r13Check as checkR13 };
