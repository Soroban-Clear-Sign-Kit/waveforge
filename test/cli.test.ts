import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import path from "node:path";

describe("CLI process exit codes", () => {
  const cliPath = path.resolve(process.cwd(), "dist/cli.js");

  function runCli(args: string[]) {
    return spawnSync(process.execPath, [cliPath, ...args], {
      encoding: "utf-8",
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
    const res = runCli(["init-action"]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("initialized");
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
    // Current stub repo score is 100, so min-score 101 will fail
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
    const res = runCli(["repo", "--invalid-option"]);
    expect(res.status).toBe(2);
    expect(res.stderr).toContain("Usage error");
  });

  it("exits with 2 on usage error (invalid --min-score)", () => {
    const res = runCli(["repo", ".", "--min-score=abc"]);
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
    const res = runCli(["issue", "README.md"]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("PASS");
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
});
