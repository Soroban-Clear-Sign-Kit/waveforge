import process from "node:process";
import { runRepoChecks } from "./repo/index.js";
import { lintIssueMarkdown } from "./issue/index.js";
import { readTextFile } from "./util/fs.js";

const args = process.argv.slice(2);
const command = args[0];

function printHelp(): void {
  console.log(`waveforge - Stellar Wave readiness checker and issue linter

Usage:
  waveforge repo [path] [--offline]
  waveforge issue <path>
  waveforge init-action
  waveforge --help
`);
}

async function main(): Promise<void> {
  if (!command || command === "--help" || command === "-h") {
    printHelp();
    process.exit(0);
  }

  if (command === "repo") {
    const repoPath = args[1] ?? ".";
    const offline = args.includes("--offline");
    const report = await runRepoChecks(repoPath, { offline });
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.summary.fail > 0 ? 1 : 0);
  }

  if (command === "issue") {
    const issuePath = args[1];
    if (!issuePath) {
      console.error("Error: issue command requires a file path");
      process.exit(1);
    }
    const content = (await readTextFile(issuePath)) ?? "";
    const report = await lintIssueMarkdown(issuePath, content);
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.summary.fail > 0 ? 1 : 0);
  }

  if (command === "init-action") {
    console.log("init-action command ready");
    process.exit(0);
  }

  console.error(`Unknown command: ${command}`);
  printHelp();
  process.exit(1);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
