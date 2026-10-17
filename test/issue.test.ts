import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { runIssueLint, lintIssueMarkdown, parseIssueMarkdown } from "../src/issue/index.js";

const FIXTURES_DIR = path.resolve(__dirname, "fixtures", "issues");

function readFixture(name: string): string {
  return fs.readFileSync(path.join(FIXTURES_DIR, name), "utf-8");
}

describe("Issue Linter Rules (I1-I7, S1-S3, F1)", () => {
  it("I1 passes when Description heading is present", async () => {
    const md = "# Title\n\n## Description\nShort desc.\n\n## Done when\n- [ ] A\n- [ ] B";
    const report = await runIssueLint(md);
    const i1 = report.results.find((r) => r.id === "I1");
    expect(i1?.status).toBe("pass");
  });

  it("I1 passes when first paragraph has at least 30 words without Description heading", async () => {
    const md = "# Title\n\n" +
      "This is a very detailed opening paragraph that explains the full context of the bug in great detail so that anyone reading it understands exactly what went wrong and how we plan to fix it properly without any ambiguity whatsoever.\n\n" +
      "## Done when\n- [ ] A\n- [ ] B";
    const report = await runIssueLint(md);
    const i1 = report.results.find((r) => r.id === "I1");
    expect(i1?.status).toBe("pass");
  });

  it("I1 fails when no Description/Context heading and opening paragraph < 30 words", async () => {
    const md = "# Title\n\nShort intro only.\n\n## Done when\n- [ ] A\n- [ ] B";
    const report = await runIssueLint(md);
    const i1 = report.results.find((r) => r.id === "I1");
    expect(i1?.status).toBe("fail");
  });

  it("I2 passes with bulleted list under Requirements or Requirements and context", async () => {
    const md = "# Title\n\n## Description\nContext\n\n## Requirements\n- Requirement 1\n- Requirement 2\n\n## Done when\n- [ ] A\n- [ ] B";
    const report = await runIssueLint(md);
    const i2 = report.results.find((r) => r.id === "I2");
    expect(i2?.status).toBe("pass");
  });

  it("I2 warns when Requirements heading is missing or has no list", async () => {
    const md = "# Title\n\n## Description\nContext\n\n## Requirements\nJust some plain paragraph text with no list items.\n\n## Done when\n- [ ] A\n- [ ] B";
    const report = await runIssueLint(md);
    const i2 = report.results.find((r) => r.id === "I2");
    expect(i2?.status).toBe("warn");
  });

  it("I3 passes when 'Done when' or 'Acceptance criteria' has >= 2 checklist items", async () => {
    const md = "# Title\n\n## Acceptance criteria\n- [ ] Task item one\n- [ ] Task item two";
    const report = await runIssueLint(md);
    const i3 = report.results.find((r) => r.id === "I3");
    expect(i3?.status).toBe("pass");
  });

  it("I3 fails when acceptance criteria heading is missing or has fewer than 2 checklist items", async () => {
    const md = "# Title\n\n## Done when\n- [ ] Only one single item";
    const report = await runIssueLint(md);
    const i3 = report.results.find((r) => r.id === "I3");
    expect(i3?.status).toBe("fail");
  });

  it("I4 passes when file paths or 'Files to touch' heading is present", async () => {
    const md = "# Title\n\nSee src/utils/helper.ts for details.\n\n## Done when\n- [ ] A\n- [ ] B";
    const report = await runIssueLint(md);
    const i4 = report.results.find((r) => r.id === "I4");
    expect(i4?.status).toBe("pass");
  });

  it("I4 warns when no file path and no 'Files to touch' heading", async () => {
    const md = "# Title\n\n## Description\nPlain text without any file paths.\n\n## Done when\n- [ ] A\n- [ ] B";
    const report = await runIssueLint(md);
    const i4 = report.results.find((r) => r.id === "I4");
    expect(i4?.status).toBe("warn");
  });

  it("I5 passes when 'Suggested execution' or numbered steps are present", async () => {
    const md = "# Title\n\n1. First step\n2. Second step\n\n## Done when\n- [ ] A\n- [ ] B";
    const report = await runIssueLint(md);
    const i5 = report.results.find((r) => r.id === "I5");
    expect(i5?.status).toBe("pass");
  });

  it("I5 warns when 'Suggested execution' and numbered steps are absent", async () => {
    const md = "# Title\n\n## Description\nNo numbered steps here.\n\n## Done when\n- [ ] A\n- [ ] B";
    const report = await runIssueLint(md);
    const i5 = report.results.find((r) => r.id === "I5");
    expect(i5?.status).toBe("warn");
  });

  it("I6 calculates suggested complexity and passes when stated matches", async () => {
    const md = "# Fix typo in docs\n\n## Description\nFix minor copy typo in readme.\n\nComplexity: Trivial\n\n## Done when\n- [ ] Fix typo\n- [ ] Verify build";
    const report = await runIssueLint(md);
    const i6 = report.results.find((r) => r.id === "I6");
    expect(report.meta?.["suggestedComplexity"]).toBe("Trivial");
    expect(i6?.status).toBe("pass");
  });

  it("I6 warns when stated complexity differs from suggested complexity", async () => {
    const md = "# Refactor contract architecture\n\n## Description\nMajor architecture refactor of contract storage.\n\nComplexity: Trivial\n\n## Done when\n- [ ] A\n- [ ] B";
    const report = await runIssueLint(md);
    const i6 = report.results.find((r) => r.id === "I6");
    expect(report.meta?.["suggestedComplexity"]).toBe("High");
    expect(i6?.status).toBe("warn");
    expect(i6?.message).toContain("differs from suggested complexity");
  });

  it("I6 warns when complexity estimate is missing", async () => {
    const md = "# Some task\n\n## Description\nNo complexity given.\n\n## Done when\n- [ ] A\n- [ ] B";
    const report = await runIssueLint(md);
    const i6 = report.results.find((r) => r.id === "I6");
    expect(i6?.status).toBe("warn");
    expect(i6?.message).toContain("Missing complexity estimate");
  });

  it("I7 passes when checklist items < 15 and words < 1200", async () => {
    const md = "# Title\n\n## Description\nShort issue.\n\n## Done when\n- [ ] Item 1\n- [ ] Item 2";
    const report = await runIssueLint(md);
    const i7 = report.results.find((r) => r.id === "I7");
    expect(i7?.status).toBe("pass");
  });

  it("I7 warns when checklist items >= 15", async () => {
    const items = Array.from({ length: 16 }, (_, i) => `- [ ] Item ${i + 1}`).join("\n");
    const md = `# Large Issue\n\n## Description\nLots of items.\n\n## Done when\n${items}`;
    const report = await runIssueLint(md);
    const i7 = report.results.find((r) => r.id === "I7");
    expect(i7?.status).toBe("warn");
  });

  it("S1, S2, S3 are skipped for non-Soroban issues", async () => {
    const md = "# Web utility\n\n## Description\nPure typescript module.\n\n## Done when\n- [ ] A\n- [ ] B";
    const report = await runIssueLint(md);
    expect(report.results.find((r) => r.id === "S1")?.status).toBe("skipped");
    expect(report.results.find((r) => r.id === "S2")?.status).toBe("skipped");
    expect(report.results.find((r) => r.id === "S3")?.status).toBe("skipped");
  });

  it("S1, S2, S3 trigger when Soroban keywords (.rs, contracts/, soroban, require_auth, smart contract) are present", async () => {
    const md = "# Soroban Contract\n\n" +
      "Touching contracts/vault/src/lib.rs smart contract with require_auth.\n" +
      "Must run cargo test and stellar contract build.\n\n" +
      "## Done when\n- [ ] A\n- [ ] B";
    const report = await runIssueLint(md);
    expect(report.results.find((r) => r.id === "S1")?.status).toBe("pass");
    expect(report.results.find((r) => r.id === "S2")?.status).toBe("pass");
    expect(report.results.find((r) => r.id === "S3")?.status).toBe("pass");
  });

  it("S1 and S2 fail when Soroban issue lacks authorization and test requirements", async () => {
    const md = "# Soroban Contract\n\n" +
      "Modifying contracts/token/src/lib.rs for dynamic balances.\n\n" +
      "## Done when\n- [ ] Compile token contract\n- [ ] Deploy to testnet";
    const report = await runIssueLint(md);
    expect(report.results.find((r) => r.id === "S1")?.status).toBe("fail");
    expect(report.results.find((r) => r.id === "S2")?.status).toBe("fail");
    expect(report.results.find((r) => r.id === "S3")?.status).toBe("warn");
  });

  it("F1 is skipped for non-UI issues", async () => {
    const md = "# Backend worker\n\n## Description\nNode.js queue worker.\n\n## Done when\n- [ ] A\n- [ ] B";
    const report = await runIssueLint(md);
    expect(report.results.find((r) => r.id === "F1")?.status).toBe("skipped");
  });

  it("F1 passes when UI issue asks for screenshots or recording", async () => {
    const md = "# Modal UI component\n\n" +
      "Creating Modal.tsx component for the settings page.\n" +
      "Please include screenshots and a screen recording.\n\n" +
      "## Done when\n- [ ] A\n- [ ] B";
    const report = await runIssueLint(md);
    expect(report.results.find((r) => r.id === "F1")?.status).toBe("pass");
  });

  it("F1 warns when UI issue mentions component/.tsx but does not request screenshots or recording", async () => {
    const md = "# Modal UI component\n\n" +
      "Creating Modal.tsx component for the settings page.\n\n" +
      "## Done when\n- [ ] A\n- [ ] B";
    const report = await runIssueLint(md);
    expect(report.results.find((r) => r.id === "F1")?.status).toBe("warn");
  });

  it("extracts title from first '# ' heading or options.title", async () => {
    const md = "# Header Title\n\n## Description\nDesc";
    const parsed = parseIssueMarkdown(md);
    expect(parsed.title).toBe("Header Title");

    const report = await runIssueLint(md, { title: "Custom Title Overridden" });
    expect(report.meta?.["title"]).toBe("Custom Title Overridden");
  });
});

describe("Issue Linter Fixtures", () => {
  it("good-1.md passes all rules with 100% score", async () => {
    const content = readFixture("good-1.md");
    const report = await lintIssueMarkdown("test/fixtures/issues/good-1.md", content);
    expect(report.kind).toBe("issue");
    expect(report.score).toBe(100);
    expect(report.results.every((r) => r.status === "pass" || r.status === "skipped")).toBe(true);
  });

  it("good-2.md (Soroban contract) passes all rules with 100% score", async () => {
    const content = readFixture("good-2.md");
    const report = await runIssueLint(content, { filePath: "test/fixtures/issues/good-2.md" });
    expect(report.score).toBe(100);
    expect(report.results.every((r) => r.status === "pass" || r.status === "skipped")).toBe(true);
    expect(report.meta?.["suggestedComplexity"]).toBe("High");
  });

  it("good-3.md (Frontend UI) passes all rules with 100% score", async () => {
    const content = readFixture("good-3.md");
    const report = await runIssueLint(content, { filePath: "test/fixtures/issues/good-3.md" });
    expect(report.score).toBe(100);
    expect(report.results.every((r) => r.status === "pass" || r.status === "skipped")).toBe(true);
  });

  it("bad-1-missing-context.md fails I1", async () => {
    const content = readFixture("bad-1-missing-context.md");
    const report = await runIssueLint(content);
    const i1 = report.results.find((r) => r.id === "I1");
    expect(i1?.status).toBe("fail");
  });

  it("bad-2-missing-acceptance.md fails I3", async () => {
    const content = readFixture("bad-2-missing-acceptance.md");
    const report = await runIssueLint(content);
    const i3 = report.results.find((r) => r.id === "I3");
    expect(i3?.status).toBe("fail");
  });

  it("bad-3-scope-exceeded.md warns on I7", async () => {
    const content = readFixture("bad-3-scope-exceeded.md");
    const report = await runIssueLint(content);
    const i7 = report.results.find((r) => r.id === "I7");
    expect(i7?.status).toBe("warn");
  });

  it("bad-4-soroban-missing-auth-and-tests.md fails S1 and S2", async () => {
    const content = readFixture("bad-4-soroban-missing-auth-and-tests.md");
    const report = await runIssueLint(content);
    const s1 = report.results.find((r) => r.id === "S1");
    const s2 = report.results.find((r) => r.id === "S2");
    expect(s1?.status).toBe("fail");
    expect(s2?.status).toBe("fail");
  });

  it("bad-5-ui-missing-screenshots-and-files.md warns on F1 and I4", async () => {
    const content = readFixture("bad-5-ui-missing-screenshots-and-files.md");
    const report = await runIssueLint(content);
    const f1 = report.results.find((r) => r.id === "F1");
    const i4 = report.results.find((r) => r.id === "I4");
    expect(f1?.status).toBe("warn");
    expect(i4?.status).toBe("warn");
  });
});
