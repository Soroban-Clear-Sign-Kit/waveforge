import type { CheckResult, Report } from "../report.js";
import { score, summarizeResults } from "../report.js";
import { issueRules } from "./rules.js";

export async function lintIssueMarkdown(filePath: string, _content: string): Promise<Report> {
  const results: CheckResult[] = [];

  for (const rule of issueRules) {
    const item: CheckResult = rule.validate
      ? await rule.validate(_content)
      : {
          id: rule.id,
          title: rule.title,
          message: rule.message,
          fix: rule.fix,
          status: "pass",
        };
    results.push(item);
  }

  return {
    kind: "issue",
    target: filePath,
    score: score(results),
    results,
    summary: summarizeResults(results),
    generatedAt: new Date().toISOString(),
  };
}

export * from "./rules.js";
