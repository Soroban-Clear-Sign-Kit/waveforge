import { describe, it, expect } from "vitest";
import path from "node:path";
import { r1Check } from "../src/repo/r1.js";
import { r2Check } from "../src/repo/r2.js";
import { r3Check } from "../src/repo/r3.js";
import { r4Check } from "../src/repo/r4.js";
import { r5Check } from "../src/repo/r5.js";
import { r6Check } from "../src/repo/r6.js";

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


