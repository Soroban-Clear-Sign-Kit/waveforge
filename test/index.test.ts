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
    expect(report.summary?.pass).toBe(10);
    expect(report.summary?.total).toBe(10);
  });

  it("lints issue markdown returning report", async () => {
    const report = await lintIssueMarkdown("test.md", "# Test Issue");
    expect(report.kind).toBe("issue");
    expect(report.target).toBe("test.md");
    expect(report.results.length).toBe(11);
    expect(report.score).toBe(100);
    expect(report.summary?.pass).toBe(11);
    expect(report.summary?.total).toBe(11);
  });
});
