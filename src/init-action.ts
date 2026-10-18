import fs from "node:fs";
import path from "node:path";

export interface InitActionOptions {
  force?: boolean;
  ref?: string;
  cwd?: string;
}

export function getDefaultActionRef(cwd: string = process.cwd()): string {
  try {
    const pkgPath = new URL("../package.json", import.meta.url);
    if (fs.existsSync(pkgPath)) {
      const content = fs.readFileSync(pkgPath, "utf-8");
      const parsed = JSON.parse(content) as { waveforge?: { actionRef?: string } };
      if (parsed.waveforge?.actionRef) {
        return parsed.waveforge.actionRef;
      }
    }
  } catch {
    // ignore
  }

  try {
    const localPkg = path.resolve(cwd, "package.json");
    if (fs.existsSync(localPkg)) {
      const content = fs.readFileSync(localPkg, "utf-8");
      const parsed = JSON.parse(content) as { waveforge?: { actionRef?: string } };
      if (parsed.waveforge?.actionRef) {
        return parsed.waveforge.actionRef;
      }
    }
  } catch {
    // ignore
  }

  return "Soroban-Clear-Sign-Kit/waveforge-action@v1";
}

export function generateWorkflowYaml(ref: string): string {
  return `name: WaveForge

on:
  pull_request:
  workflow_dispatch:
  issues:
    types: [opened, edited]

jobs:
  waveforge-repo:
    if: github.event_name == 'pull_request' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      - name: Run WaveForge repo check
        uses: ${ref}
        with:
          mode: repo

  waveforge-issue:
    if: github.event_name == 'issues'
    runs-on: ubuntu-latest
    permissions:
      issues: write
    steps:
      - name: Run WaveForge issue check
        uses: ${ref}
        with:
          mode: issue
`;
}

export async function initAction(
  options: InitActionOptions = {},
): Promise<{ success: boolean; message: string; filePath: string }> {
  const cwd = options.cwd ?? process.cwd();
  const ref = options.ref ?? getDefaultActionRef(cwd);
  const workflowsDir = path.resolve(cwd, ".github", "workflows");
  const targetFile = path.join(workflowsDir, "waveforge.yml");

  if (fs.existsSync(targetFile) && !options.force) {
    return {
      success: false,
      message: "Error: .github/workflows/waveforge.yml already exists. Use --force to overwrite.",
      filePath: targetFile,
    };
  }

  fs.mkdirSync(workflowsDir, { recursive: true });
  const yamlContent = generateWorkflowYaml(ref);
  fs.writeFileSync(targetFile, yamlContent, "utf-8");

  return {
    success: true,
    message: `Created ${path.relative(cwd, targetFile).replace(/\\/g, "/")}`,
    filePath: targetFile,
  };
}
