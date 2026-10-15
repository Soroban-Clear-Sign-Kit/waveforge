export type Status = "pass" | "warn" | "fail" | "skipped";

export interface CheckResult {
  id: string;
  title: string;
  status: Status;
  message: string;
  fix?: string;
  evidence?: string[];
}

export interface Report {
  kind: "repo" | "issue";
  target: string;
  score: number;
  results: CheckResult[];
  generatedAt: string;
  meta?: Record<string, string>;
}

// Backward-compatibility aliases
export type CheckItem = CheckResult;
export type CheckStatus = Status;

export function score(results: CheckResult[]): number {
  const scorable = results.filter((r) => r.status !== "skipped");
  if (scorable.length === 0) {
    return 0;
  }

  let total = 0;
  for (const r of scorable) {
    if (r.status === "pass") {
      total += 1;
    } else if (r.status === "warn") {
      total += 0.5;
    }
  }

  return Math.round((total / scorable.length) * 100);
}

function statusToWord(status: Status): string {
  switch (status) {
    case "pass":
      return "PASS";
    case "warn":
      return "WARN";
    case "fail":
      return "FAIL";
    case "skipped":
      return "SKIP";
  }
}

export function formatText(report: Report): string {
  const lines: string[] = [];
  lines.push(`WaveForge ${report.kind.toUpperCase()} Report - ${report.target}`);
  lines.push(`Score: ${report.score}% | Generated: ${report.generatedAt}`);
  lines.push("");

  const maxIdLen = report.results.reduce((max, r) => Math.max(max, r.id.length), 0);

  for (const r of report.results) {
    const statusWord = statusToWord(r.status);
    const id = r.id.padEnd(maxIdLen);
    lines.push(`${statusWord}  ${id}  ${r.title} - ${r.message}`);
  }

  const fixes = report.results.filter((r) => r.status !== "pass" && r.fix);
  if (fixes.length > 0) {
    lines.push("");
    lines.push("Fix hints:");
    for (const f of fixes) {
      lines.push(`  ${f.id}: ${f.fix}`);
    }
  }

  return lines.join("\n");
}

export function formatMarkdown(report: Report): string {
  const lines: string[] = [];
  lines.push(`## WaveForge ${report.kind === "repo" ? "Repository" : "Issue"} Report`);
  lines.push("");
  lines.push(`- **Target**: \`${report.target}\``);
  lines.push(`- **Score**: **${report.score}%**`);
  lines.push(`- **Generated At**: ${report.generatedAt}`);
  lines.push("");

  const nonPass = report.results.filter((r) => r.status !== "pass");
  if (nonPass.length === 0) {
    lines.push("All checks passed successfully!");
  } else {
    lines.push("| Status | ID | Title | Message | Fix |");
    lines.push("| :--- | :--- | :--- | :--- | :--- |");
    for (const r of nonPass) {
      const statusWord = statusToWord(r.status);
      const fix = r.fix ?? "-";
      lines.push(`| ${statusWord} | ${r.id} | ${r.title} | ${r.message} | ${fix} |`);
    }
  }

  return lines.join("\n");
}

export function formatJson(report: Report): string {
  return JSON.stringify(report, null, 2);
}
