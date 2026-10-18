import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import yaml from "yaml";
import {
  initAction,
  generateWorkflowYaml,
  getDefaultActionRef,
} from "../src/init-action.js";

describe("init-action workflow generator", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "waveforge-init-action-test-"));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  it("getDefaultActionRef reads from package.json field waveforge.actionRef", () => {
    const defaultRef = getDefaultActionRef();
    expect(defaultRef).toBe("Soroban-Clear-Sign-Kit/waveforge-action@v1");
  });

  it("generateWorkflowYaml produces valid YAML with exact triggers and permissions", () => {
    const ref = "Soroban-Clear-Sign-Kit/waveforge-action@v1";
    const yamlContent = generateWorkflowYaml(ref);

    // Parses cleanly as valid YAML
    const parsed = yaml.parse(yamlContent) as {
      name: string;
      on: {
        pull_request?: unknown;
        workflow_dispatch?: unknown;
        issues?: { types: string[] };
      };
      jobs: {
        "waveforge-repo": {
          permissions: { contents: string };
          steps: Array<{ uses: string; with?: { mode?: string } }>;
        };
        "waveforge-issue": {
          permissions: { issues: string };
          steps: Array<{ uses: string; with?: { mode?: string } }>;
        };
      };
    };

    expect(parsed.name).toBe("WaveForge");
    expect(parsed.on).toBeDefined();
    expect(parsed.on.pull_request).toBeNull(); // YAML empty key is parsed as null or object
    expect(parsed.on.workflow_dispatch).toBeNull();
    expect(parsed.on.issues?.types).toEqual(["opened", "edited"]);

    // Check repo job
    const repoJob = parsed.jobs["waveforge-repo"];
    expect(repoJob).toBeDefined();
    expect(repoJob.permissions.contents).toBe("read");
    const repoStep = repoJob.steps.find((s) => s.uses === ref);
    expect(repoStep).toBeDefined();
    expect(repoStep?.with?.mode).toBe("repo");

    // Check issue job
    const issueJob = parsed.jobs["waveforge-issue"];
    expect(issueJob).toBeDefined();
    expect(issueJob.permissions.issues).toBe("write");
    const issueStep = issueJob.steps.find((s) => s.uses === ref);
    expect(issueStep).toBeDefined();
    expect(issueStep?.with?.mode).toBe("issue");
  });

  it("writes .github/workflows/waveforge.yml in the target directory", async () => {
    const result = await initAction({ cwd: tmpDir });
    expect(result.success).toBe(true);

    const targetFile = path.join(tmpDir, ".github", "workflows", "waveforge.yml");
    expect(fs.existsSync(targetFile)).toBe(true);

    const content = fs.readFileSync(targetFile, "utf-8");
    const parsed = yaml.parse(content);
    expect(parsed.name).toBe("WaveForge");
  });

  it("supports custom --ref option", async () => {
    const customRef = "my-org/custom-waveforge-action@v2";
    const result = await initAction({ cwd: tmpDir, ref: customRef });
    expect(result.success).toBe(true);

    const targetFile = path.join(tmpDir, ".github", "workflows", "waveforge.yml");
    const content = fs.readFileSync(targetFile, "utf-8");
    expect(content).toContain(`uses: ${customRef}`);
  });

  it("refuses to overwrite existing workflow file without force", async () => {
    const targetDir = path.join(tmpDir, ".github", "workflows");
    fs.mkdirSync(targetDir, { recursive: true });
    const targetFile = path.join(targetDir, "waveforge.yml");
    const initialContent = "# custom pre-existing workflow\n";
    fs.writeFileSync(targetFile, initialContent, "utf-8");

    // Run without force
    const result = await initAction({ cwd: tmpDir, force: false });
    expect(result.success).toBe(false);
    expect(result.message).toContain("already exists");
    expect(result.message).toContain("--force");

    // File content must remain unchanged
    expect(fs.readFileSync(targetFile, "utf-8")).toBe(initialContent);
  });

  it("overwrites existing workflow file when force is true", async () => {
    const targetDir = path.join(tmpDir, ".github", "workflows");
    fs.mkdirSync(targetDir, { recursive: true });
    const targetFile = path.join(targetDir, "waveforge.yml");
    fs.writeFileSync(targetFile, "# old content\n", "utf-8");

    // Run with force
    const result = await initAction({ cwd: tmpDir, force: true });
    expect(result.success).toBe(true);

    const updatedContent = fs.readFileSync(targetFile, "utf-8");
    expect(updatedContent).toContain("name: WaveForge");
  });

  it("CLI init-action executes, creates workflow, and refuses overwrite without --force", () => {
    const cliPath = path.resolve(process.cwd(), "dist/cli.js");

    // First run creates workflow
    const run1 = spawnSync(process.execPath, [cliPath, "init-action"], {
      cwd: tmpDir,
      encoding: "utf-8",
    });
    expect(run1.status).toBe(0);
    expect(run1.stdout).toContain("Created .github/workflows/waveforge.yml");

    // Second run without --force refuses overwrite and exits with 1
    const run2 = spawnSync(process.execPath, [cliPath, "init-action"], {
      cwd: tmpDir,
      encoding: "utf-8",
    });
    expect(run2.status).toBe(1);
    expect(run2.stderr).toContain("already exists");
    expect(run2.stderr).toContain("--force");

    // Third run with --force overwrites successfully
    const run3 = spawnSync(process.execPath, [cliPath, "init-action", "--force"], {
      cwd: tmpDir,
      encoding: "utf-8",
    });
    expect(run3.status).toBe(0);
    expect(run3.stdout).toContain("Created .github/workflows/waveforge.yml");

    // Fourth run with --ref sets custom ref
    const run4 = spawnSync(
      process.execPath,
      [cliPath, "init-action", "--force", "--ref=custom-org/action@v3"],
      { cwd: tmpDir, encoding: "utf-8" },
    );
    expect(run4.status).toBe(0);
    const content = fs.readFileSync(path.join(tmpDir, ".github", "workflows", "waveforge.yml"), "utf-8");
    expect(content).toContain("custom-org/action@v3");
  });
});
