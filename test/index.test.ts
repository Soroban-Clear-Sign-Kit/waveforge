import { describe, it, expect } from "vitest";
import { runRepoChecks } from "../src/repo/index.js";
import { lintIssueMarkdown } from "../src/issue/index.js";
import { repoChecks } from "../src/repo/index.js";
import { issueRules } from "../src/issue/rules.js";

describe("waveforge scaffold", () => {
  it("defines R1-R10 repo checks", () => {
    expect(repoChecks).toHaveLength(10);
    const ids = repoChecks.map((c) => c.id);
    expect(ids).toEqual(["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9", "R10"]);
  });

  it("defines I1-I7, S1-S3, F1 issue rules", () => {
    expect(issueRules).toHaveLength(11);
    const ids = issueRules.map((r) => r.id);
    expect(ids).toEqual(["I1", "I2", "I3", "I4", "I5", "I6", "I7", "S1", "S2", "S3", "F1"]);
  });

  it("runs repo checks returning report", async () => {
    const report = await runRepoChecks(".");
    expect(report.kind).toBe("repo");
    expect(report.target).toBe(".");
    expect(report.results.length).toBe(10);
    expect(report.score).toBe(100);
    expect(report.summary?.pass).toBe(8);
    expect(report.summary?.warn).toBe(0);
    expect(report.summary?.skipped).toBe(2);
    expect(report.summary?.total).toBe(10);
  });

  it("lints issue markdown returning report", async () => {
    const validContent = "# Test Issue\n\n## Description\nDetailed description explaining the issue in full context.\n\n## Requirements\n- Requirement 1\n\n## Done when\n- [ ] Task 1\n- [ ] Task 2\n\n## Files to touch\n- src/test.ts\n\n## Suggested execution\n1. Do it\n\nComplexity: Medium\n";
    const report = await lintIssueMarkdown("test.md", validContent);
    expect(report.kind).toBe("issue");
    expect(report.target).toBe("test.md");
    expect(report.results.length).toBe(11);
    expect(report.score).toBe(100);
    expect(report.summary?.pass).toBe(7);
    expect(report.summary?.skipped).toBe(4);
    expect(report.summary?.total).toBe(11);
  });

  it("exports exactly the public library API contract", async () => {
    const lib = await import("../src/index.js");
    const exportsList = Object.keys(lib).sort();
    expect(exportsList).toEqual([
      "formatJson",
      "formatMarkdown",
      "formatText",
      "runIssueLint",
      "runRepoChecks",
      "score",
    ]);
  });

  it("fails if package.json has no bin.waveforge entry", async () => {
    const fs = await import("node:fs");
    const pkgPath = new URL("../package.json", import.meta.url);
    const content = fs.readFileSync(pkgPath, "utf-8");
    const pkg = JSON.parse(content) as { bin?: { waveforge?: string } };
    expect(pkg.bin).toBeDefined();
    expect(pkg.bin?.waveforge).toBe("dist/cli.js");
  });
});
