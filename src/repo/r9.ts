import { promises as fs } from "node:fs";
import path from "node:path";
import type { CheckResult } from "../report.js";
import { fileExists, readTextFile } from "../util/fs.js";

const TARGET_STRING = "wasm32-unknown-unknown";

async function collectFilesRecursively(dir: string): Promise<string[]> {
  const results: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "target" && entry.name !== "node_modules" && entry.name !== ".git" && entry.name !== "dist") {
          results.push(...(await collectFilesRecursively(fullPath)));
        }
      } else if (entry.isFile()) {
        results.push(fullPath);
      }
    }
  } catch {
    // ignore
  }
  return results;
}

async function getCandidateFiles(root: string): Promise<string[]> {
  const candidates: string[] = [];

  // 1. README files in root
  try {
    const rootEntries = await fs.readdir(root, { withFileTypes: true });
    for (const entry of rootEntries) {
      if (entry.isFile()) {
        const lower = entry.name.toLowerCase();
        if (lower.startsWith("readme")) {
          candidates.push(path.join(root, entry.name));
        }
        if (lower === "makefile" || lower.startsWith("makefile.") || lower.endsWith(".mk")) {
          candidates.push(path.join(root, entry.name));
        }
      }
    }
  } catch {
    // ignore
  }

  // 2. docs/ directory
  const docsDir = path.join(root, "docs");
  candidates.push(...(await collectFilesRecursively(docsDir)));

  // 3. scripts/ directory
  const scriptsDir = path.join(root, "scripts");
  candidates.push(...(await collectFilesRecursively(scriptsDir)));

  // 4. .github/ directory
  const githubDir = path.join(root, ".github");
  candidates.push(...(await collectFilesRecursively(githubDir)));

  return candidates;
}

export async function r9Check(root: string, _options?: unknown): Promise<CheckResult> {
  const files = await getCandidateFiles(root);
  const evidence: string[] = [];

  for (const filePath of files) {
    if (!(await fileExists(filePath))) continue;

    const content = await readTextFile(filePath);
    if (!content) continue;

    if (!content.includes(TARGET_STRING)) continue;

    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.includes(TARGET_STRING)) {
        const relPath = path.relative(root, filePath).replace(/\\/g, "/");
        evidence.push(`${relPath}:${i + 1}: ${line.trim()}`);
      }
    }
  }

  if (evidence.length > 0) {
    return {
      id: "R9",
      title: "Wasm Compilation Target",
      status: "warn",
      message: `Deprecated target '${TARGET_STRING}' found in documentation or scripts.`,
      evidence,
      fix: `Update '${TARGET_STRING}' to 'wasm32v1-none' (current Stellar CLI builds wasm32v1-none).`,
    };
  }

  return {
    id: "R9",
    title: "Wasm Compilation Target",
    status: "pass",
    message: `No references to deprecated target '${TARGET_STRING}' found.`,
  };
}

r9Check.id = "R9";
r9Check.title = "Wasm Compilation Target";
r9Check.run = (root = ".") => r9Check(root);

export { r9Check as checkR9 };
