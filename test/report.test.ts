import { describe, it, expect } from "vitest";
import {
  score,
  formatText,
  formatMarkdown,
  formatJson,
  type Report,
  type CheckResult,
} from "../src/report.js";

describe("score calculation", () => {
  it("returns 0 for empty results", () => {
    expect(score([])).toBe(0);
  });

  it("returns 0 if all results are skipped", () => {
    const results: CheckResult[] = [
      { id: "R1", title: "T1", status: "skipped", message: "M1" },
      { id: "R2", title: "T2", status: "skipped", message: "M2" },
    ];
    expect(score(results)).toBe(0);
  });

  it("calculates 100% when all non-skipped pass", () => {
    const results: CheckResult[] = [
      { id: "R1", title: "T1", status: "pass", message: "M1" },
      { id: "R2", title: "T2", status: "skipped", message: "M2" },
    ];
    expect(score(results)).toBe(100);
  });

  it("calculates 50% for 1 pass and 1 fail", () => {
    const results: CheckResult[] = [
      { id: "R1", title: "T1", status: "pass", message: "M1" },
      { id: "R2", title: "T2", status: "fail", message: "M2" },
    ];
    expect(score(results)).toBe(50);
  });

  it("calculates 75% for 1 pass and 1 warn", () => {
    const results: CheckResult[] = [
      { id: "R1", title: "T1", status: "pass", message: "M1" },
      { id: "R2", title: "T2", status: "warn", message: "M2" },
    ];
    expect(score(results)).toBe(75);
  });

  it("rounds percentage properly", () => {
    // 2 pass + 1 fail: (2/3)*100 = 66.666... -> 67
    const results: CheckResult[] = [
      { id: "R1", title: "T1", status: "pass", message: "M1" },
      { id: "R2", title: "T2", status: "pass", message: "M2" },
      { id: "R3", title: "T3", status: "fail", message: "M3" },
    ];
    expect(score(results)).toBe(67);
  });
});

describe("report formatters", () => {
  const sampleReport: Report = {
    kind: "repo",
    target: "/mock/repo",
    score: 63,
    generatedAt: "2026-10-15T12:00:00.000Z",
    results: [
      { id: "R1", title: "Cargo Configuration", status: "pass", message: "Cargo.toml exists" },
      { id: "R2", title: "Contract ID", status: "warn", message: "Only testnet ID found", fix: "Add mainnet ID" },
      { id: "R3", title: "Secrets Safety", status: "fail", message: "Raw secret key exposed", fix: "Remove secret key" },
      { id: "R4", title: "On-Chain Verification", status: "skipped", message: "Offline mode active" },
    ],
  };

  it("formats text report with aligned PASS/WARN/FAIL/SKIP and fix hints", () => {
    const text = formatText(sampleReport);
    expect(text).toContain("PASS  R1  Cargo Configuration - Cargo.toml exists");
    expect(text).toContain("WARN  R2  Contract ID - Only testnet ID found");
    expect(text).toContain("FAIL  R3  Secrets Safety - Raw secret key exposed");
    expect(text).toContain("SKIP  R4  On-Chain Verification - Offline mode active");
    expect(text).toContain("Fix hints:");
    expect(text).toContain("R2: Add mainnet ID");
    expect(text).toContain("R3: Remove secret key");
    // No emoji
    expect(text).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u);
    expect(text).toMatchSnapshot();
  });

  it("formats markdown report with heading, score, and non-pass table", () => {
    const md = formatMarkdown(sampleReport);
    expect(md).toContain("## WaveForge Repository Report");
    expect(md).toContain("**Score**: **63%**");
    expect(md).toContain("| Status | ID | Title | Message | Fix |");
    expect(md).toContain("| WARN | R2 | Contract ID | Only testnet ID found | Add mainnet ID |");
    expect(md).toContain("| FAIL | R3 | Secrets Safety | Raw secret key exposed | Remove secret key |");
    expect(md).toContain("| SKIP | R4 | On-Chain Verification | Offline mode active | - |");
    // R1 is pass, so not in the non-pass table
    expect(md).not.toContain("| PASS | R1 |");
    expect(md).toMatchSnapshot();
  });

  it("formats json report", () => {
    const json = formatJson(sampleReport);
    const parsed = JSON.parse(json);
    expect(parsed.kind).toBe("repo");
    expect(parsed.score).toBe(63);
    expect(parsed.results).toHaveLength(4);
    expect(json).toMatchSnapshot();
  });
});
