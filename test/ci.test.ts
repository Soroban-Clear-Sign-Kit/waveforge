import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";

describe("CI workflow", () => {
  it("parses .github/workflows/ci.yml without errors", () => {
    const ciPath = path.resolve(process.cwd(), ".github/workflows/ci.yml");
    expect(fs.existsSync(ciPath)).toBe(true);

    const content = fs.readFileSync(ciPath, "utf-8");
    const parsed = yaml.parse(content);

    expect(parsed.name).toBe("CI");
    expect(parsed.on.push.branches).toContain("main");
    expect(parsed.on.pull_request.branches).toContain("main");

    const job = parsed.jobs.ci;
    expect(job).toBeDefined();
    expect(job.strategy.matrix["node-version"]).toEqual([20, 22]);

    const stepUses = job.steps.map((s: { uses?: string }) => s.uses).filter(Boolean);
    expect(stepUses).toContain("actions/checkout@v4");
    expect(stepUses).toContain("pnpm/action-setup@v4");
    expect(stepUses).toContain("actions/setup-node@v4");

    const stepRuns = job.steps.map((s: { run?: string }) => s.run).filter(Boolean);
    expect(stepRuns).toContain("pnpm install --frozen-lockfile");
    expect(stepRuns).toContain("pnpm lint");
    expect(stepRuns).toContain("pnpm typecheck");
    expect(stepRuns).toContain("pnpm build");
    expect(stepRuns).toContain("pnpm test:coverage");
  });
});
