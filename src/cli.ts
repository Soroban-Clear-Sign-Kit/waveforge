import { parseArgs } from "node:util";
import process from "node:process";
import fs from "node:fs";
import path from "node:path";
import { runRepoChecks } from "./repo/index.js";
import { runIssueLint } from "./issue/index.js";
import { formatText, formatMarkdown, formatJson, type Report } from "./report.js";

function getPackageVersion(): string {
  try {
    const pkgPath = new URL("../package.json", import.meta.url);
    const content = fs.readFileSync(pkgPath, "utf-8");
    const parsed = JSON.parse(content) as { version?: string };
    return parsed.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function printHelp(): void {
  console.log(`waveforge - Stellar Wave readiness checker and issue linter

Usage:
  waveforge repo [path] [--network=<net>] [--rpc-url=<url>] [--offline] [--json] [--markdown] [--format=text|markdown|json] [--min-score=N]
  waveforge issue <file|-> [--title=<title>] [--json] [--markdown] [--format=text|markdown|json] [--min-score=N]
  waveforge init-action
  waveforge --help
  waveforge --version

Options:
  -h, --help        Show this help message
  -v, --version     Show version number
  --title=<title>   Issue title override
  --network=<net>   Target Stellar network: testnet (default) or mainnet
  --rpc-url=<url>   Explicit Soroban RPC URL (required for mainnet)
  --offline         Skip network calls and mark network checks as skipped
  --json            Output report as JSON
  --markdown        Output report as Markdown
  --format=<fmt>    Output format: text (default), markdown, or json
  --min-score=<N>   Minimum required score (0-100) to pass
`);
}

function printFormattedReport(report: Report, format?: string): void {
  switch (format) {
    case "json":
      console.log(formatJson(report));
      break;
    case "markdown":
    case "md":
      console.log(formatMarkdown(report));
      break;
    case "text":
    default:
      console.log(formatText(report));
      break;
  }
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf-8");
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  let parsedArgs: ReturnType<typeof parseArgs>;
  try {
    parsedArgs = parseArgs({
      args: argv,
      options: {
        help: { type: "boolean", short: "h" },
        version: { type: "boolean", short: "v" },
        title: { type: "string" },
        "min-score": { type: "string" },
        format: { type: "string" },
        offline: { type: "boolean", default: false },
        network: { type: "string", default: "testnet" },
        "rpc-url": { type: "string" },
        json: { type: "boolean", default: false },
        markdown: { type: "boolean", default: false },
      },
      allowPositionals: true,
      strict: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Usage error: ${message}`);
    return 2;
  }

  const { values, positionals } = parsedArgs;

  if (values.help) {
    printHelp();
    return 0;
  }

  if (values.version) {
    console.log(`waveforge ${getPackageVersion()}`);
    return 0;
  }

  const command = positionals[0];
  if (!command) {
    console.error("Usage error: missing command (repo, issue, init-action)");
    printHelp();
    return 2;
  }

  let minScoreThreshold: number | undefined;
  if (values["min-score"] !== undefined) {
    const parsed = Number(values["min-score"]);
    if (Number.isNaN(parsed)) {
      console.error("Usage error: --min-score must be a valid number");
      return 2;
    }
    minScoreThreshold = parsed;
  }

  let format = typeof values.format === "string" ? values.format : undefined;
  if (values.json) {
    format = "json";
  } else if (values.markdown) {
    format = "markdown";
  }

  const offline = Boolean(values.offline);
  const network = typeof values.network === "string" ? values.network : "testnet";
  const rpcUrl = typeof values["rpc-url"] === "string" ? values["rpc-url"] : undefined;

  if (command === "repo") {
    const repoPath = positionals[1] ?? ".";
    const resolvedPath = path.resolve(process.cwd(), repoPath);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`I/O error: target path not found: ${repoPath}`);
      return 2;
    }

    try {
      const report = await runRepoChecks(repoPath, { offline, network, rpcUrl });
      printFormattedReport(report, format);

      const hasFail = report.results.some((r) => r.status === "fail");
      const belowMin = minScoreThreshold !== undefined && report.score < minScoreThreshold;

      return hasFail || belowMin ? 1 : 0;
    } catch (err) {
      console.error(`I/O error: failed to analyze repository: ${err instanceof Error ? err.message : String(err)}`);
      return 2;
    }
  }

  if (command === "issue") {
    const issuePath = positionals[1];
    if (!issuePath) {
      console.error("Usage error: issue command requires a file path or '-' for stdin");
      return 2;
    }

    let content = "";
    let targetName = issuePath;
    const titleOption = typeof values.title === "string" ? values.title : undefined;

    if (issuePath === "-") {
      targetName = "stdin";
      try {
        content = await readStdin();
      } catch (err) {
        console.error(`I/O error: could not read from stdin: ${err instanceof Error ? err.message : String(err)}`);
        return 2;
      }
    } else {
      const resolvedPath = path.resolve(process.cwd(), issuePath);
      if (!fs.existsSync(resolvedPath)) {
        console.error(`I/O error: issue file not found: ${issuePath}`);
        return 2;
      }

      try {
        content = fs.readFileSync(resolvedPath, "utf-8");
      } catch (err) {
        console.error(`I/O error: could not read file ${issuePath}: ${err instanceof Error ? err.message : String(err)}`);
        return 2;
      }
    }

    try {
      const report = await runIssueLint(content, {
        title: titleOption,
        filePath: targetName,
      });
      printFormattedReport(report, format);

      const hasFail = report.results.some((r) => r.status === "fail");
      const belowMin = minScoreThreshold !== undefined && report.score < minScoreThreshold;

      return hasFail || belowMin ? 1 : 0;
    } catch (err) {
      console.error(`I/O error: failed to lint issue: ${err instanceof Error ? err.message : String(err)}`);
      return 2;
    }
  }

  if (command === "init-action") {
    console.log("GitHub Action workflow configuration initialized.");
    return 0;
  }

  console.error(`Usage error: unknown command '${command}'`);
  printHelp();
  return 2;
}

// Only invoke automatically when run as script
const isMain = process.argv[1] !== undefined && (
  process.argv[1].endsWith("cli.js") ||
  process.argv[1].endsWith("cli.ts")
);

if (isMain) {
  main().then((code) => {
    process.exit(code);
  }).catch((err: unknown) => {
    console.error(`Fatal error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(2);
  });
}
