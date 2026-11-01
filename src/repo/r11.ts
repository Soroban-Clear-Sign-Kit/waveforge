import { promises as fs } from "node:fs";
import path from "node:path";
import type { CheckResult } from "../report.js";
import { readTextFile } from "../util/fs.js";
import { r7Check } from "./r7.js";

export interface R11CheckOptions {
  sorobanCratesFound?: boolean;
}

const TTL_CALL_PATTERNS = [
  /\bextend_ttl\b/i,
  /\bextend_ttl_instance\b/i,
  /\bextend_ttl_periodic\b/i,
  /\bextend_ttl_threshold\b/i,
  /\bextend_contract_instance_ttl\b/i,
  /\bextend_contract_data_ttl\b/i,
];

async function scanRustFilesRecursively(dir: string): Promise<string[]> {
  const results: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (
          entry.name !== "target" &&
          entry.name !== "node_modules" &&
          entry.name !== ".git" &&
          entry.name !== "dist" &&
          entry.name !== "fixtures"
        ) {
          results.push(...(await scanRustFilesRecursively(path.join(dir, entry.name))));
        }
      } else if (entry.isFile() && entry.name.endsWith(".rs")) {
        results.push(path.join(dir, entry.name));
      }
    }
  } catch {
    // ignore
  }
  return results;
}

export async function r11Check(root: string, options: R11CheckOptions = {}): Promise<CheckResult> {
  let sorobanFound = options.sorobanCratesFound;
  if (sorobanFound === undefined) {
    const r7Result = await r7Check(root);
    sorobanFound = r7Result.status !== "skipped";
  }

  // If no Soroban contracts exist, skip R11
  if (!sorobanFound) {
    return {
      id: "R11",
      title: "Soroban Contract Instance TTL Extension",
      status: "skipped",
      message: "No Soroban smart contracts found.",
      fix: "Add Soroban contract TTL management if contracts are added.",
    };
  }

  const rustFiles: string[] = [];

  // Check contracts/ directory first
  const contractsDir = path.join(root, "contracts");
  rustFiles.push(...(await scanRustFilesRecursively(contractsDir)));

  // If no files under contracts/, check src/ or crate roots
  if (rustFiles.length === 0) {
    rustFiles.push(...(await scanRustFilesRecursively(root)));
  }

  const ttlEvidence: string[] = [];

  for (const filePath of rustFiles) {
    const content = await readTextFile(filePath);
    if (!content) continue;

    const relPath = path.relative(root, filePath).replace(/\\/g, "/");
    const lines = content.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      for (const pattern of TTL_CALL_PATTERNS) {
        if (pattern.test(line)) {
          ttlEvidence.push(`${relPath}:${i + 1}: ${line.trim()}`);
          break;
        }
      }
    }
  }

  if (ttlEvidence.length > 0) {
    return {
      id: "R11",
      title: "Soroban Contract Instance TTL Extension",
      status: "pass",
      message: `Detected contract storage TTL extension logic across ${ttlEvidence.length} location(s).`,
      evidence: ttlEvidence,
    };
  }

  return {
    id: "R11",
    title: "Soroban Contract Instance TTL Extension",
    status: "warn",
    message: "No contract storage TTL extension routine (extend_ttl) detected in contract code.",
    fix: "Implement periodic TTL extension (env.storage().instance().extend_ttl(...) or require_auth) to prevent contract state archival on Stellar.",
  };
}

r11Check.id = "R11";
r11Check.title = "Soroban Contract Instance TTL Extension";
r11Check.run = (root = ".", options: R11CheckOptions = {}) => r11Check(root, options);

export { r11Check as checkR11 };
