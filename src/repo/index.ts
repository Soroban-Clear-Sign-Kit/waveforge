import type { CheckItem, Report } from "../report.js";
import { createEmptyReport } from "../report.js";
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

export async function runRepoChecks(repoPath: string, _options: CheckOptions = {}): Promise<Report> {
  const report = createEmptyReport(repoPath);

  for (const check of repoChecks) {
    const result: CheckItem = await check.run();
    report.checks.push(result);
    report.summary.total += 1;
    report.summary[result.status] += 1;
  }

  return report;
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
