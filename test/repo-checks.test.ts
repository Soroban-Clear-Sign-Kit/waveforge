import { describe, it, expect } from "vitest";
import path from "node:path";
import { r1Check } from "../src/repo/r1.js";
import { r2Check } from "../src/repo/r2.js";

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
