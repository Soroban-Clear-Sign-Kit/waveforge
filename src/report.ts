export type Status = "pass" | "warn" | "fail" | "skipped";

export interface CheckResult {
  id: string;
  title: string;
  status: Status;
  message: string;
  fix?: string;
  evidence?: string[];
}

export interface ReportSummary {
  pass: number;
  warn: number;
  fail: number;
  skipped: number;
  total: number;
}

export interface Report {
  kind: "repo" | "issue";
  target: string;
  score: number;
  results: CheckResult[];
  generatedAt: string;
  summary?: ReportSummary;
  meta?: Record<string, string>;
}

export function summarizeResults(results: CheckResult[]): ReportSummary {
  let pass = 0;
  let warn = 0;
  let fail = 0;
  let skipped = 0;
  for (const r of results) {
    if (r.status === "pass") pass++;
    else if (r.status === "warn") warn++;
    else if (r.status === "fail") fail++;
    else if (r.status === "skipped") skipped++;
  }
  return { pass, warn, fail, skipped, total: results.length };
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

export interface SarifRule {
  id: string;
  name: string;
  shortDescription: { text: string };
  fullDescription?: { text: string };
  help?: { text: string };
}

export interface SarifResult {
  ruleId: string;
  level: "error" | "warning" | "note" | "none";
  message: { text: string };
  locations?: {
    physicalLocation: {
      artifactLocation: { uri: string };
    };
  }[];
}

export interface SarifLog {
  $schema: string;
  version: string;
  runs: {
    tool: {
      driver: {
        name: string;
        informationUri?: string;
        rules: SarifRule[];
      };
    };
    results: SarifResult[];
  }[];
}

export function formatSarif(report: Report): string {
  const sarifRules: SarifRule[] = report.results.map((r) => ({
    id: r.id,
    name: r.title.replace(/\s+/g, ""),
    shortDescription: { text: r.title },
    fullDescription: { text: r.title },
    help: r.fix ? { text: r.fix } : undefined,
  }));

  const sarifResults: SarifResult[] = [];

  for (const r of report.results) {
    if (r.status === "pass" || r.status === "skipped") {
      continue;
    }

    const level = r.status === "fail" ? "error" : "warning";
    const resultItem: SarifResult = {
      ruleId: r.id,
      level,
      message: {
        text: r.fix ? r.message + " Fix: " + r.fix : r.message,
      },
      locations: [
        {
          physicalLocation: {
            artifactLocation: {
              uri: report.target === "." ? "README.md" : report.target,
            },
          },
        },
      ],
    };
    sarifResults.push(resultItem);
  }

  const sarif: SarifLog = {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "waveforge",
            informationUri: "https://github.com/Soroban-Clear-Sign-Kit/waveforge",
            rules: sarifRules,
          },
        },
        results: sarifResults,
      },
    ],
  };

  return JSON.stringify(sarif, null, 2);
}
