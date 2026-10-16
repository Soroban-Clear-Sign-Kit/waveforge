import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { StrKey } from "@stellar/stellar-sdk";
import type { CheckResult } from "../report.js";
import { dirExists, fileExists } from "../util/fs.js";

const execFileAsync = promisify(execFile);
const SECRET_SEED_REGEX = /\bS[A-Z2-7]{55}\b/g;

function maskSecretSeed(seed: string): string {
  return `SXXXX...${seed.slice(-4)}`;
}

function isBinaryBuffer(buffer: Buffer): boolean {
  const checkLen = Math.min(buffer.length, 8000);
  for (let i = 0; i < checkLen; i++) {
    if (buffer[i] === 0) {
      return true;
    }
  }
  return false;
}

async function walkDirectory(dir: string): Promise<string[]> {
  const results: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (
          entry.name !== "node_modules" &&
          entry.name !== "target" &&
          entry.name !== ".git" &&
          entry.name !== "dist"
        ) {
          results.push(...(await walkDirectory(fullPath)));
        }
      } else if (entry.isFile()) {
        results.push(fullPath);
      }
    }
  } catch {
    // ignore inaccessible directories
  }
  return results;
}

async function getCandidateFiles(root: string): Promise<string[]> {
  const gitDir = path.join(root, ".git");
  const isGitRepo = (await dirExists(gitDir)) || (await fileExists(gitDir));

  if (isGitRepo) {
    try {
      const { stdout } = await execFileAsync("git", ["ls-files"], {
        cwd: root,
        maxBuffer: 10 * 1024 * 1024,
      });
      const lines = stdout
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      return lines.map((f) => path.join(root, f));
    } catch {
      // fallback to walkDirectory
    }
  }

  return walkDirectory(root);
}

export async function r10Check(root: string, _options?: unknown): Promise<CheckResult> {
  const candidateFiles = await getCandidateFiles(root);
  const evidence: string[] = [];

  for (const filePath of candidateFiles) {
    const baseName = path.basename(filePath);
    const relPath = path.relative(root, filePath).replace(/\\/g, "/");

    // Check for committed .env files other than .env.example
    if ((baseName === ".env" || baseName.startsWith(".env.")) && baseName !== ".env.example") {
      evidence.push(`${relPath}:1: committed environment file '${baseName}'`);
    }

    // Read and scan text files for Stellar secret seeds
    try {
      const buf = await fs.readFile(filePath);
      if (isBinaryBuffer(buf)) {
        continue;
      }
      const content = buf.toString("utf-8");
      if (!SECRET_SEED_REGEX.test(content)) {
        continue;
      }

      // Reset regex index and scan line by line
      SECRET_SEED_REGEX.lastIndex = 0;
      const lines = content.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        const matches = line.match(SECRET_SEED_REGEX);
        if (matches) {
          for (const candidate of matches) {
            if (StrKey.isValidEd25519SecretSeed(candidate)) {
              evidence.push(`${relPath}:${i + 1}: ${maskSecretSeed(candidate)}`);
            }
          }
        }
      }
    } catch {
      // ignore unreadable files
    }
  }

  if (evidence.length > 0) {
    return {
      id: "R10",
      title: "Secret Key and Environment Safety",
      status: "fail",
      message: "Committed secrets or unpermitted .env files detected.",
      evidence,
      fix: "Remove committed secret keys and .env files from repository history and use .env.example with placeholders only.",
    };
  }

  return {
    id: "R10",
    title: "Secret Key and Environment Safety",
    status: "pass",
    message: "No committed secret seeds or unpermitted .env files found.",
  };
}

r10Check.id = "R10";
r10Check.title = "Secret Key and Environment Safety";
r10Check.run = (root = ".") => r10Check(root);

export { r10Check as checkR10, maskSecretSeed };
