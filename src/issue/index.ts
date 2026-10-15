import type { CheckItem, Report } from "../report.js";
import { createEmptyReport } from "../report.js";
import { issueRules } from "./rules.js";

export async function lintIssueMarkdown(filePath: string, _content: string): Promise<Report> {
  const report = createEmptyReport(filePath);

  for (const rule of issueRules) {
    const item: CheckItem = rule.validate
      ? await rule.validate(_content)
      : {
          id: rule.id,
          title: rule.title,
          message: rule.message,
          fix: rule.fix,
          status: "pass",
        };
    report.checks.push(item);
    report.summary.total += 1;
    report.summary[item.status] += 1;
  }

  return report;
}

export * from "./rules.js";
