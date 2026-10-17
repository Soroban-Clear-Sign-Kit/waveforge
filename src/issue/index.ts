import type { Report } from "../report.js";
import { score, summarizeResults } from "../report.js";
import {
  lintIssueRules,
  type IssueLintOptions,
  type ParsedIssue,
  type IssueRule,
} from "./rules.js";

export async function runIssueLint(
  markdown: string,
  options?: IssueLintOptions,
): Promise<Report> {
  const { results, parsed } = lintIssueRules(markdown, options);

  const meta: Record<string, string> = {
    title: parsed.title,
    suggestedComplexity: parsed.suggestedComplexity,
  };
  if (parsed.statedComplexity) {
    meta["statedComplexity"] = parsed.statedComplexity;
  }

  return {
    kind: "issue",
    target: options?.filePath ?? (options?.title ? options.title : "issue.md"),
    score: score(results),
    results,
    summary: summarizeResults(results),
    generatedAt: new Date().toISOString(),
    meta,
  };
}

export async function lintIssueMarkdown(
  filePath: string,
  content: string,
  options?: IssueLintOptions,
): Promise<Report> {
  return runIssueLint(content, { filePath, ...options });
}

export * from "./rules.js";
export type { IssueLintOptions, ParsedIssue, IssueRule };
