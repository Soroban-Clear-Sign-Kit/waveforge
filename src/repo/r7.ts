import { promises as fs } from "node:fs";
import path from "node:path";
import { parse as parseToml } from "smol-toml";
import yaml from "yaml";
import type { CheckResult } from "../report.js";
import { dirExists, readTextFile } from "../util/fs.js";

interface SorobanCrate {
  name: string;
  cargoPath: string;
  version: string;
}

interface WorkflowStep {
  run?: unknown;
  name?: unknown;
}

interface WorkflowJob {
  steps?: unknown;
}

async function findCargoTomlFiles(dir: string): Promise<string[]> {
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
          results.push(...(await findCargoTomlFiles(path.join(dir, entry.name))));
        }
      } else if (entry.isFile() && entry.name === "Cargo.toml") {
        results.push(path.join(dir, entry.name));
      }
    }
  } catch {
    // ignore unreadable directory
  }
  return results;
}

function extractSorobanSdkVersion(depVal: unknown): string {
  if (typeof depVal === "string") {
    return depVal;
  }
  if (depVal && typeof depVal === "object") {
    const obj = depVal as Record<string, unknown>;
    if (typeof obj["version"] === "string") {
      return obj["version"];
    }
    if (obj["workspace"] === true) {
      return "workspace";
    }
    if (typeof obj["path"] === "string") {
      return `path: ${obj["path"]}`;
    }
    if (typeof obj["git"] === "string") {
      return `git: ${obj["git"]}`;
    }
  }
  return "configured";
}

function checkTableForSorobanSdk(table: unknown): string | null {
  if (!table || typeof table !== "object") {
    return null;
  }
  const obj = table as Record<string, unknown>;
  if ("soroban-sdk" in obj) {
    return extractSorobanSdkVersion(obj["soroban-sdk"]);
  }
  return null;
}

async function hasContractTests(crateDir: string): Promise<boolean> {
  async function scanDir(dir: string): Promise<boolean> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (entry.name !== "target" && entry.name !== "node_modules" && entry.name !== ".git") {
            if (await scanDir(path.join(dir, entry.name))) {
              return true;
            }
          }
        } else if (entry.isFile()) {
          if (entry.name === "test.rs" || entry.name === "tests.rs") {
            return true;
          }
          if (entry.name.endsWith(".rs")) {
            const content = await readTextFile(path.join(dir, entry.name));
            if (content && /#\[cfg\(test\)\]/i.test(content)) {
              return true;
            }
          }
        }
      }
    } catch {
      // ignore
    }
    return false;
  }

  return scanDir(crateDir);
}

export async function r7Check(root: string, _options?: unknown): Promise<CheckResult> {
  const cargoFiles = await findCargoTomlFiles(root);
  const detectedCrates: SorobanCrate[] = [];

  for (const cargoPath of cargoFiles) {
    const content = await readTextFile(cargoPath);
    if (!content) continue;

    try {
      const parsed = parseToml(content) as Record<string, unknown>;
      let versionFound: string | null = null;

      versionFound =
        checkTableForSorobanSdk(parsed["dependencies"]) ??
        checkTableForSorobanSdk(parsed["dev-dependencies"]) ??
        checkTableForSorobanSdk(parsed["build-dependencies"]);

      if (!versionFound && parsed["workspace"] && typeof parsed["workspace"] === "object") {
        const ws = parsed["workspace"] as Record<string, unknown>;
        versionFound = checkTableForSorobanSdk(ws["dependencies"]);
      }

      if (!versionFound && parsed["target"] && typeof parsed["target"] === "object") {
        const targets = parsed["target"] as Record<string, Record<string, unknown>>;
        for (const targetConfig of Object.values(targets)) {
          if (targetConfig && typeof targetConfig === "object") {
            versionFound =
              checkTableForSorobanSdk(targetConfig["dependencies"]) ??
              checkTableForSorobanSdk(targetConfig["dev-dependencies"]) ??
              checkTableForSorobanSdk(targetConfig["build-dependencies"]);
            if (versionFound) break;
          }
        }
      }

      if (versionFound) {
        const pkg = parsed["package"] as Record<string, unknown> | undefined;
        const crateName = (typeof pkg?.["name"] === "string" ? pkg["name"] : null) ?? path.basename(path.dirname(cargoPath));
        detectedCrates.push({
          name: crateName,
          cargoPath,
          version: versionFound,
        });
      }
    } catch {
      // ignore malformed TOML
    }
  }

  if (detectedCrates.length === 0) {
    return {
      id: "R7",
      title: "Soroban Contracts and CI",
      status: "skipped",
      message: "No Soroban crates found.",
      fix: "Add a Soroban contract crate with soroban-sdk in Cargo.toml if this repository contains smart contracts.",
    };
  }

  const evidence: string[] = detectedCrates.map(
    (c) => `${c.name} (${path.relative(root, c.cargoPath).replace(/\\/g, "/")}): soroban-sdk = ${c.version}`,
  );

  // Check CI workflows for cargo test, clippy, stellar contract build
  const workflowsDir = path.join(root, ".github", "workflows");
  let hasCargoTest = false;
  let hasClippy = false;
  let hasContractBuild = false;

  if (await dirExists(workflowsDir)) {
    try {
      const entries = await fs.readdir(workflowsDir);
      const workflowFiles = entries.filter((e) => /\.(ya?ml)$/i.test(e));

      for (const wfFile of workflowFiles) {
        const wfContent = await readTextFile(path.join(workflowsDir, wfFile));
        if (!wfContent) continue;

        try {
          const parsedWf = yaml.parse(wfContent) as Record<string, unknown> | null;
          if (!parsedWf || typeof parsedWf !== "object") continue;

          const jobs = parsedWf["jobs"] as Record<string, WorkflowJob> | undefined;
          if (jobs && typeof jobs === "object") {
            for (const job of Object.values(jobs)) {
              if (job && Array.isArray(job.steps)) {
                for (const step of job.steps as WorkflowStep[]) {
                  if (step && typeof step.run === "string") {
                    const runCmd = step.run;
                    if (/\bcargo\s+test\b/i.test(runCmd)) {
                      hasCargoTest = true;
                    }
                    if (/\bclippy\b/i.test(runCmd)) {
                      hasClippy = true;
                    }
                    if (/\b(stellar|soroban)\s+contract\s+build\b/i.test(runCmd)) {
                      hasContractBuild = true;
                    }
                  }
                }
              }
            }
          }
        } catch {
          // ignore workflow parse error
        }
      }
    } catch {
      // ignore workflow directory read error
    }
  }

  // Check contract crate tests
  let anyCrateHasTests = false;
  for (const crate of detectedCrates) {
    const crateDir = path.dirname(crate.cargoPath);
    if (await hasContractTests(crateDir)) {
      anyCrateHasTests = true;
      break;
    }
  }

  if (!hasCargoTest) {
    evidence.push("Missing CI workflow running 'cargo test'");
    return {
      id: "R7",
      title: "Soroban Contracts and CI",
      status: "fail",
      message: "No CI workflow runs 'cargo test'.",
      evidence,
      fix: "Add a GitHub Actions workflow step in .github/workflows/ running 'cargo test'.",
    };
  }

  if (!hasClippy) {
    evidence.push("Missing CI workflow running clippy");
    return {
      id: "R7",
      title: "Soroban Contracts and CI",
      status: "warn",
      message: "No CI workflow runs clippy.",
      evidence,
      fix: "Add a CI workflow step running 'cargo clippy' in .github/workflows/.",
    };
  }

  if (!hasContractBuild) {
    evidence.push("Missing CI workflow running 'stellar contract build'");
    return {
      id: "R7",
      title: "Soroban Contracts and CI",
      status: "warn",
      message: "No CI workflow runs 'stellar contract build'.",
      evidence,
      fix: "Add a CI workflow step running 'stellar contract build' in .github/workflows/.",
    };
  }

  if (!anyCrateHasTests) {
    evidence.push("No contract crate contains #[cfg(test)] or a test.rs file");
    return {
      id: "R7",
      title: "Soroban Contracts and CI",
      status: "warn",
      message: "No contract crate has #[cfg(test)] or a test.rs file.",
      evidence,
      fix: "Add unit tests to contract crates using #[cfg(test)] modules or test.rs files.",
    };
  }

  return {
    id: "R7",
    title: "Soroban Contracts and CI",
    status: "pass",
    message: "Soroban crates verified with cargo test, clippy, stellar contract build, and contract tests.",
    evidence,
  };
}

r7Check.id = "R7";
r7Check.title = "Soroban Contracts and CI";
r7Check.run = (root = ".") => r7Check(root);

export { r7Check as checkR7 };
