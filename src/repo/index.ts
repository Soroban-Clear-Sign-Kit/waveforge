import type { CheckResult, Report } from "../report.js";
import { score, summarizeResults } from "../report.js";
import { r1Check } from "./r1.js";
import { r2Check } from "./r2.js";
import { r3Check } from "./r3.js";
import { r4Check } from "./r4.js";
import { r5Check } from "./r5.js";
import { r6Check } from "./r6.js";
import { r7Check } from "./r7.js";
import { r8Check } from "./r8.js";
import { r9Check } from "./r9.js";
import { r10Check } from "./r10.js";

export type RepoCheck =
  | ((root: string, options?: CheckOptions) => Promise<CheckResult>)
  | {
      id: string;
      title: string;
      run: (root?: string, options?: CheckOptions) => Promise<CheckResult>;
    };

export const repoChecks = [
  r1Check,
  r2Check,
  r3Check,
  r4Check,
  r5Check,
  r6Check,
  r7Check,
  r8Check,
  r9Check,
  r10Check,
];

export interface CheckOptions {
  offline?: boolean;
}

export async function runRepoChecks(repoPath: string, options: CheckOptions = {}): Promise<Report> {
  const results: CheckResult[] = [];

  for (const check of repoChecks) {
    const result: CheckResult =
      typeof check === "function" ? await check(repoPath, options) : await check.run(repoPath, options);
    results.push(result);
  }

  return {
    kind: "repo",
    target: repoPath,
    score: score(results),
    results,
    summary: summarizeResults(results),
    generatedAt: new Date().toISOString(),
  };
}

export {
  r1Check,
  r2Check,
  r3Check,
  r4Check,
  r5Check,
  r6Check,
  r7Check,
  r8Check,
  r9Check,
  r10Check,
};
