import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

describe("CLI process exit codes", () => {
  const cliPath = path.resolve(process.cwd(), "dist/cli.js");

  function runCli(
    args: string[],
    inputOrOptions?: string | { input?: string; cwd?: string },
  ) {
    const input = typeof inputOrOptions === "string" ? inputOrOptions : inputOrOptions?.input;
    const cwd = typeof inputOrOptions === "object" ? inputOrOptions.cwd : undefined;
    return spawnSync(process.execPath, [cliPath, ...args], {
      encoding: "utf-8",
      input,
      cwd,
    });
  }

  it("exits with 0 on --help", () => {
    const res = runCli(["--help"]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("waveforge - Stellar Wave readiness checker");
  });

  it("exits with 0 on -h", () => {
    const res = runCli(["-h"]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("waveforge - Stellar Wave readiness checker");
  });

  it("exits with 0 on --version", () => {
    const res = runCli(["--version"]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("waveforge");
  });

  it("exits with 0 on init-action", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "waveforge-cli-init-"));
    try {
      const res = runCli(["init-action"], { cwd: tmp });
      expect(res.status).toBe(0);
      expect(res.stdout).toContain("Created .github/workflows/waveforge.yml");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("exits with 0 on valid repo command without failures", () => {
    const res = runCli(["repo", "."]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("PASS");
  });

  it("exits with 0 when score meets --min-score", () => {
    const res = runCli(["repo", ".", "--min-score=50"]);
    expect(res.status).toBe(0);
  });

  it("exits with 1 when score is below --min-score", () => {
    const res = runCli(["repo", ".", "--min-score=101"]);
    expect(res.status).toBe(1);
  });

  it("exits with 2 on usage error (missing command)", () => {
    const res = runCli([]);
    expect(res.status).toBe(2);
    expect(res.stderr).toContain("Usage error");
  });

  it("exits with 2 on usage error (unknown command)", () => {
    const res = runCli(["unknown-command"]);
    expect(res.status).toBe(2);
    expect(res.stderr).toContain("Usage error");
  });

  it("exits with 2 on usage error (unknown option)", () => {
    const res = runCli(["repo", "--invalid-flag"]);
    expect(res.status).toBe(2);
    expect(res.stderr).toContain("Usage error");
  });

  it("exits with 2 on usage error (invalid --min-score)", () => {
    const res = runCli(["repo", ".", "--min-score=not-a-number"]);
    expect(res.status).toBe(2);
    expect(res.stderr).toContain("Usage error");
  });

  it("exits with 2 on I/O error (repo path does not exist)", () => {
    const res = runCli(["repo", "./nonexistent-directory-xyz"]);
    expect(res.status).toBe(2);
    expect(res.stderr).toContain("I/O error");
  });

  it("exits with 2 on usage error (issue command without path)", () => {
    const res = runCli(["issue"]);
    expect(res.status).toBe(2);
    expect(res.stderr).toContain("Usage error");
  });

  it("exits with 2 on I/O error (issue file does not exist)", () => {
    const res = runCli(["issue", "./nonexistent-issue-xyz.md"]);
    expect(res.status).toBe(2);
    expect(res.stderr).toContain("I/O error");
  });

  it("exits with 0 on valid issue file", () => {
    const res = runCli(["issue", "test/fixtures/issues/good-1.md"]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("PASS");
  });

  it("exits with 1 on issue with rule failures", () => {
    const res = runCli(["issue", "test/fixtures/issues/bad-1-missing-context.md"]);
    expect(res.status).toBe(1);
    expect(res.stdout).toContain("FAIL");
  });

  it("supports issue reading from stdin with -", () => {
    const validIssue = "# Stdin Issue\n\n## Description\nDetailed description of task.\n\n## Requirements\n- Step\n\n## Done when\n- [ ] Task A\n- [ ] Task B\n\n## Files to touch\n- src/test.ts\n\n## Suggested execution\n1. Do it\n\nComplexity: Medium\n";
    const res = runCli(["issue", "-"], validIssue);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("WaveForge ISSUE Report");
  });

  it("supports issue --title option", () => {
    const res = runCli(["issue", "test/fixtures/issues/good-1.md", "--title=Override Title"]);
    expect(res.status).toBe(0);
  });

  it("supports --format=json and --format=markdown", () => {
    const jsonRes = runCli(["repo", ".", "--format=json"]);
    expect(jsonRes.status).toBe(0);
    const parsed = JSON.parse(jsonRes.stdout);
    expect(parsed.kind).toBe("repo");

    const mdRes = runCli(["repo", ".", "--format=markdown"]);
    expect(mdRes.status).toBe(0);
    expect(mdRes.stdout).toContain("## WaveForge Repository Report");
  });

  it("supports --json and --markdown boolean flags", () => {
    const jsonRes = runCli(["repo", ".", "--json"]);
    expect(jsonRes.status).toBe(0);
    const parsed = JSON.parse(jsonRes.stdout);
    expect(parsed.kind).toBe("repo");

    const mdRes = runCli(["repo", ".", "--markdown"]);
    expect(mdRes.status).toBe(0);
    expect(mdRes.stdout).toContain("## WaveForge Repository Report");
  });

  it("supports --network and --offline flags", () => {
    const res = runCli(["repo", ".", "--network=testnet", "--offline"]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("PASS");
  });
});
