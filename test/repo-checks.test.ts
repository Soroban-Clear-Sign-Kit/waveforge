import { describe, it, expect } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { r1Check } from "../src/repo/r1.js";
import { r2Check } from "../src/repo/r2.js";
import { r3Check } from "../src/repo/r3.js";
import { r4Check } from "../src/repo/r4.js";
import { r5Check } from "../src/repo/r5.js";
import { r6Check } from "../src/repo/r6.js";
import { r7Check } from "../src/repo/r7.js";
import { r9Check } from "../src/repo/r9.js";
import { runRepoChecks } from "../src/repo/index.js";

import type { CheckResult } from "../src/report.js";

const FIXTURES_DIR = path.resolve(__dirname, "fixtures", "repos");

describe("R1 - License check", () => {
  const cases = [
    {
      name: "passes on good repo with Apache-2.0",
      fixture: "good",
      expectedStatus: "pass",
      expectedMessageMatch: /Recognized Apache-2\.0 license/,
    },
    {
      name: "passes on MIT license in bad-contributing",
      fixture: "bad-contributing",
      expectedStatus: "pass",
      expectedMessageMatch: /Recognized MIT license/,
    },
    {
      name: "fails when license is missing",
      fixture: "missing-everything",
      expectedStatus: "fail",
      expectedMessageMatch: /Missing LICENSE/,
    },
  ];

  for (const tc of cases) {
    it(tc.name, async () => {
      const root = path.join(FIXTURES_DIR, tc.fixture);
      const res = await r1Check(root);
      expect(res.id).toBe("R1");
      expect(res.status).toBe(tc.expectedStatus);
      expect(res.message).toMatch(tc.expectedMessageMatch);
    });
  }
});

describe("R2 - README check", () => {
  const cases = [
    {
      name: "passes on good repo with stellar mention and setup heading",
      fixture: "good",
      expectedStatus: "pass",
    },
    {
      name: "fails when README is missing",
      fixture: "missing-everything",
      expectedStatus: "fail",
      expectedMessageMatch: /README\.md does not exist/,
    },
    {
      name: "warns and lists lines on placeholders",
      fixture: "placeholders",
      expectedStatus: "warn",
      verify(res: CheckResult) {
        expect(res.evidence).toBeDefined();
        expect(res.evidence!.length).toBeGreaterThan(0);
        expect(res.evidence!.some((e: string) => e.includes("LIVE_DEMO_URL"))).toBe(true);
        expect(res.evidence!.some((e: string) => e.includes("TODO"))).toBe(true);
        expect(res.evidence!.some((e: string) => e.includes("Lorem ipsum"))).toBe(true);
      },
    },
  ];

  for (const tc of cases) {
    it(tc.name, async () => {
      const root = path.join(FIXTURES_DIR, tc.fixture);
      const res = await r2Check(root);
      expect(res.id).toBe("R2");
      expect(res.status).toBe(tc.expectedStatus);
      if (tc.expectedMessageMatch) {
        expect(res.message).toMatch(tc.expectedMessageMatch);
      }
      if (tc.verify) {
        tc.verify(res);
      }
    });
  }
});

describe("R3 - Contributing guidelines check", () => {
  const cases = [
    {
      name: "passes on good repo with setup, test, and wave mention",
      fixture: "good",
      expectedStatus: "pass",
    },
    {
      name: "fails when CONTRIBUTING.md is missing",
      fixture: "missing-everything",
      expectedStatus: "fail",
      expectedMessageMatch: /CONTRIBUTING\.md does not exist/,
    },
    {
      name: "fails and lists lines on prohibited bounty / claim keywords",
      fixture: "bad-contributing",
      expectedStatus: "fail",
      verify(res: CheckResult) {
        expect(res.evidence).toBeDefined();
        expect(res.evidence!.length).toBeGreaterThan(0);
        expect(res.evidence!.some((e: string) => e.includes("$500"))).toBe(true);
        expect(res.evidence!.some((e: string) => e.includes("/claim"))).toBe(true);
        expect(res.evidence!.some((e: string) => e.includes("paid on merge"))).toBe(true);
      },
    },
  ];

  for (const tc of cases) {
    it(tc.name, async () => {
      const root = path.join(FIXTURES_DIR, tc.fixture);
      const res = await r3Check(root);
      expect(res.id).toBe("R3");
      expect(res.status).toBe(tc.expectedStatus);
      if (tc.expectedMessageMatch) {
        expect(res.message).toMatch(tc.expectedMessageMatch);
      }
      if (tc.verify) {
        tc.verify(res);
      }
    });
  }
});

describe("R4 - Security policy check", () => {
  const cases = [
    {
      name: "passes when SECURITY.md exists",
      fixture: "good",
      expectedStatus: "pass",
    },
    {
      name: "warns when SECURITY.md is missing",
      fixture: "missing-everything",
      expectedStatus: "warn",
      expectedMessageMatch: /SECURITY\.md does not exist/,
    },
  ];

  for (const tc of cases) {
    it(tc.name, async () => {
      const root = path.join(FIXTURES_DIR, tc.fixture);
      const res = await r4Check(root);
      expect(res.id).toBe("R4");
      expect(res.status).toBe(tc.expectedStatus);
      if (tc.expectedMessageMatch) {
        expect(res.message).toMatch(tc.expectedMessageMatch);
      }
    });
  }
});

describe("R5 - Issue templates check", () => {
  const cases = [
    {
      name: "passes on good repo with issue form and valid config.yml",
      fixture: "good",
      expectedStatus: "pass",
    },
    {
      name: "warns when ISSUE_TEMPLATE directory is missing",
      fixture: "missing-everything",
      expectedStatus: "warn",
      expectedMessageMatch: /ISSUE_TEMPLATE/,
    },
  ];

  for (const tc of cases) {
    it(tc.name, async () => {
      const root = path.join(FIXTURES_DIR, tc.fixture);
      const res = await r5Check(root);
      expect(res.id).toBe("R5");
      expect(res.status).toBe(tc.expectedStatus);
      if (tc.expectedMessageMatch) {
        expect(res.message).toMatch(tc.expectedMessageMatch);
      }
    });
  }
});

describe("R6 - CI workflow check", () => {
  const cases = [
    {
      name: "passes on good repo with pull_request trigger and test step",
      fixture: "good",
      expectedStatus: "pass",
    },
    {
      name: "fails when workflows directory is missing",
      fixture: "missing-everything",
      expectedStatus: "fail",
      expectedMessageMatch: /workflows/,
    },
  ];

  for (const tc of cases) {
    it(tc.name, async () => {
      const root = path.join(FIXTURES_DIR, tc.fixture);
      const res = await r6Check(root);
      expect(res.id).toBe("R6");
      expect(res.status).toBe(tc.expectedStatus);
      if (tc.expectedMessageMatch) {
        expect(res.message).toMatch(tc.expectedMessageMatch);
      }
    });
  }
});

describe("R7 - Soroban check", () => {
  it("passes on soroban-good with cargo test, clippy, stellar contract build, and contract tests", async () => {
    const root = path.join(FIXTURES_DIR, "soroban-good");
    const res = await r7Check(root);
    expect(res.id).toBe("R7");
    expect(res.status).toBe("pass");
    expect(res.evidence).toBeDefined();
    expect(res.evidence!.some((e) => e.includes("token-contract") && e.includes("22.0.0"))).toBe(true);
  });

  it("fails on soroban-no-ci when no CI workflow runs cargo test", async () => {
    const root = path.join(FIXTURES_DIR, "soroban-no-ci");
    const res = await r7Check(root);
    expect(res.id).toBe("R7");
    expect(res.status).toBe("fail");
    expect(res.message).toMatch(/no CI workflow runs 'cargo test'/i);
  });

  it("skips on good repo when no Soroban crates exist", async () => {
    const root = path.join(FIXTURES_DIR, "good");
    const res = await r7Check(root);
    expect(res.id).toBe("R7");
    expect(res.status).toBe("skipped");
    expect(res.message).toMatch(/no Soroban crates/i);
  });

  it("warns when cargo test runs but clippy is missing in CI", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "waveforge-r7-clippy-"));
    try {
      await fs.writeFile(path.join(tmp, "Cargo.toml"), '[dependencies]\nsoroban-sdk = "22.0.0"\n');
      const wfDir = path.join(tmp, ".github", "workflows");
      await fs.mkdir(wfDir, { recursive: true });
      await fs.writeFile(path.join(wfDir, "ci.yml"), "jobs:\n  t:\n    steps:\n      - run: cargo test\n");
      const res = await r7Check(tmp);
      expect(res.status).toBe("warn");
      expect(res.message).toMatch(/no CI workflow runs clippy/i);
    } finally {
      await fs.rm(tmp, { recursive: true, force: true });
    }
  });

  it("warns when cargo test and clippy run but stellar contract build is missing", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "waveforge-r7-build-"));
    try {
      await fs.writeFile(path.join(tmp, "Cargo.toml"), '[dependencies]\nsoroban-sdk = "22.0.0"\n');
      const wfDir = path.join(tmp, ".github", "workflows");
      await fs.mkdir(wfDir, { recursive: true });
      await fs.writeFile(path.join(wfDir, "ci.yml"), "jobs:\n  t:\n    steps:\n      - run: cargo test\n      - run: cargo clippy\n");
      const res = await r7Check(tmp);
      expect(res.status).toBe("warn");
      expect(res.message).toMatch(/no CI workflow runs 'stellar contract build'/i);
    } finally {
      await fs.rm(tmp, { recursive: true, force: true });
    }
  });

  it("warns when all CI steps exist but contract crate has no tests", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "waveforge-r7-notests-"));
    try {
      await fs.writeFile(path.join(tmp, "Cargo.toml"), '[dependencies]\nsoroban-sdk = "22.0.0"\n');
      const wfDir = path.join(tmp, ".github", "workflows");
      await fs.mkdir(wfDir, { recursive: true });
      await fs.writeFile(path.join(wfDir, "ci.yml"), "jobs:\n  t:\n    steps:\n      - run: cargo test\n      - run: cargo clippy\n      - run: stellar contract build\n");
      const res = await r7Check(tmp);
      expect(res.status).toBe("warn");
      expect(res.message).toMatch(/no contract crate has #\[cfg\(test\)\]/i);
    } finally {
      await fs.rm(tmp, { recursive: true, force: true });
    }
  });
});

describe("R9 - Wasm target check", () => {
  it("warns on old-target fixture with file:line evidence and hint", async () => {
    const root = path.join(FIXTURES_DIR, "old-target");
    const res = await r9Check(root);
    expect(res.id).toBe("R9");
    expect(res.status).toBe("warn");
    expect(res.message).toMatch(/deprecated target 'wasm32-unknown-unknown'/i);
    expect(res.fix).toMatch(/wasm32v1-none/);
    expect(res.evidence).toBeDefined();
    expect(res.evidence!.length).toBeGreaterThanOrEqual(4);
    expect(res.evidence!.some((e) => e.startsWith("README.md:") && e.includes("wasm32-unknown-unknown"))).toBe(true);
    expect(res.evidence!.some((e) => e.startsWith("Makefile:") && e.includes("wasm32-unknown-unknown"))).toBe(true);
    expect(res.evidence!.some((e) => e.startsWith("scripts/build.sh:") && e.includes("wasm32-unknown-unknown"))).toBe(true);
    expect(res.evidence!.some((e) => e.startsWith("docs/build.md:") && e.includes("wasm32-unknown-unknown"))).toBe(true);
  });

  it("passes on good fixture without deprecated target", async () => {
    const root = path.join(FIXTURES_DIR, "good");
    const res = await r9Check(root);
    expect(res.id).toBe("R9");
    expect(res.status).toBe("pass");
    expect(res.message).toMatch(/no references to deprecated target/i);
  });
});

describe("runRepoChecks across fixtures", () => {
  it("runs on good fixture with passing R1 to R6 checks", async () => {
    const report = await runRepoChecks(path.join(FIXTURES_DIR, "good"));
    expect(report.kind).toBe("repo");
    const r1ToR6 = report.results.slice(0, 6);
    expect(r1ToR6.every((r) => r.status === "pass")).toBe(true);
    expect(report.score).toBe(100);
  });

  it("runs on missing-everything fixture with expected failures and warnings", async () => {
    const report = await runRepoChecks(path.join(FIXTURES_DIR, "missing-everything"));
    expect(report.kind).toBe("repo");
    const statuses = Object.fromEntries(report.results.map((r) => [r.id, r.status]));
    expect(statuses["R1"]).toBe("fail");
    expect(statuses["R2"]).toBe("fail");
    expect(statuses["R3"]).toBe("fail");
    expect(statuses["R4"]).toBe("warn");
    expect(statuses["R5"]).toBe("warn");
    expect(statuses["R6"]).toBe("fail");
  });
});



