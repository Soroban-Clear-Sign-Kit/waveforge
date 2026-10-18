# WaveForge Public Library API

This document defines the public TypeScript API contract for `waveforge-stellar`.
The GitHub Action (`waveforge-action`) and other consumer tooling build directly against this contract.

Any breaking change to exported signatures or return types requires a major version bump and a CHANGELOG entry.

---

## Offline Guarantee

> **Deterministic and Offline-Safe Guarantee:**
> Network checks **never** return `pass` when running in offline mode (`options.offline: true`) or when network/RPC connections fail or timeout.
> In offline mode or when network endpoints are unreachable, network-dependent checks (such as `R8`) return `status: "skipped"` with an explanatory message. Skipped checks are excluded from readiness score calculations.

---

## Function Exports

### 1. `runRepoChecks(repoPath?: string, options?: RepoOptions): Promise<Report>`

Executes repository readiness checks `R1` through `R10` on the specified folder path.

#### Signature
```typescript
function runRepoChecks(
  repoPath?: string,
  options?: RepoOptions
): Promise<Report>;
```

#### Parameters
- `repoPath` *(optional, string, default: `"."`)*: Absolute or relative directory path of the repository to inspect.
- `options` *(optional, `RepoOptions`)*:
  - `offline` *(boolean)*: If `true`, skips network RPC calls and marks network checks as `skipped`.
  - `network` *(string, `"testnet"` | `"mainnet"`, default: `"testnet"`)*: Target Stellar network.
  - `rpcUrl` *(string)*: Explicit Soroban RPC URL. Required when targeting `"mainnet"`.
  - `rpc` *(RpcClientLike)*: Custom or mock RPC client satisfying `getLedgerEntries` for testing.
  - `sorobanCratesFound` *(boolean)*: Optional pre-computed flag indicating whether Soroban crates were detected.

#### Example
```typescript
import { runRepoChecks, formatText, type Report } from "waveforge-stellar";

const report: Report = await runRepoChecks(".", {
  offline: false,
  network: "testnet",
});

console.log(formatText(report));
console.log(`Readiness Score: ${report.score}%`);
```

---

### 2. `runIssueLint(markdown: string, options?: IssueOptions): Promise<Report>`

Lints issue Markdown text against standard issue rules (`I1`–`I7`), Soroban rules (`S1`–`S3`), and UI rules (`F1`).

#### Signature
```typescript
function runIssueLint(
  markdown: string,
  options?: IssueOptions
): Promise<Report>;
```

#### Parameters
- `markdown` *(string)*: The issue description and body in GitHub-flavored Markdown.
- `options` *(optional, `IssueOptions`)*:
  - `title` *(string)*: Optional title override. If omitted, the title is extracted from the first `# ` header line.
  - `filePath` *(string)*: Path to the issue file (used for report target labeling and diagnostics).

#### Example
```typescript
import { runIssueLint, type Report } from "waveforge-stellar";

const issueMarkdown = `
# Add multi-sig authorization handler

## Description
This issue introduces multi-signature verification routines for batch contract invocations.
It coordinates threshold signatures across multiple signer addresses before executing transactions.

## Requirements and context
- Verify threshold weight against signer list.
- Support ed25519 signatures.

## Done when
- [ ] Handler implemented in contracts/multisig/src/lib.rs
- [ ] Unit tests pass under cargo test

## Files to touch
- contracts/multisig/src/lib.rs

## Suggested execution
1. Define signer storage struct.
2. Implement auth verification with require_auth.

Complexity: High
`;

const report: Report = await runIssueLint(issueMarkdown, {
  title: "Multi-sig handler",
});

console.log(`Issue Score: ${report.score}%`);
console.log(`Suggested Complexity: ${report.meta?.suggestedComplexity}`);
```

---

### 3. `score(results: CheckResult[]): number`

Calculates a readiness score between 0 and 100 from an array of check results.

#### Signature
```typescript
function score(results: CheckResult[]): number;
```

#### Description
- `pass`: 1.0 point
- `warn`: 0.5 points
- `fail`: 0.0 points
- `skipped`: Excluded from the denominator

Returns `Math.round((totalPoints / scorableCount) * 100)`. If all checks are `skipped`, returns `0`.

#### Example
```typescript
import { score, type CheckResult } from "waveforge-stellar";

const results: CheckResult[] = [
  { id: "R1", title: "License", status: "pass", message: "OK" },
  { id: "R2", title: "README", status: "warn", message: "Missing setup" },
  { id: "R8", title: "Contract IDs", status: "skipped", message: "Offline" },
];

const totalScore = score(results); // (1.0 + 0.5) / 2 = 75%
```

---

### 4. `formatText(report: Report): string`

Formats a `Report` object into terminal-friendly human-readable plain text with ANSI color hints and fix suggestions.

#### Signature
```typescript
function formatText(report: Report): string;
```

#### Example
```typescript
import { formatText } from "waveforge-stellar";

process.stdout.write(formatText(report));
```

---

### 5. `formatMarkdown(report: Report): string`

Formats a `Report` object into GitHub-flavored Markdown suitable for CI job summaries or issue comments.

#### Signature
```typescript
function formatMarkdown(report: Report): string;
```

#### Example
```typescript
import { formatMarkdown } from "waveforge-stellar";

const md = formatMarkdown(report);
```

---

### 6. `formatJson(report: Report): string`

Formats a `Report` object into formatted JSON string (`JSON.stringify(report, null, 2)`).

#### Signature
```typescript
function formatJson(report: Report): string;
```

#### Example
```typescript
import { formatJson } from "waveforge-stellar";

const jsonString = formatJson(report);
```

---

## Type Exports

### `Status`
```typescript
type Status = "pass" | "warn" | "fail" | "skipped";
```

### `CheckResult`
```typescript
interface CheckResult {
  id: string;
  title: string;
  status: Status;
  message: string;
  fix?: string;
  evidence?: string[];
}
```

### `Report`
```typescript
interface Report {
  kind: "repo" | "issue";
  target: string;
  score: number;
  results: CheckResult[];
  generatedAt: string;
  summary?: {
    pass: number;
    warn: number;
    fail: number;
    skipped: number;
    total: number;
  };
  meta?: Record<string, string>;
}
```

### `RepoOptions`
```typescript
interface RepoOptions {
  offline?: boolean;
  network?: string;
  rpcUrl?: string;
  rpc?: import("./r8.js").RpcClientLike;
  sorobanCratesFound?: boolean;
}
```

### `IssueOptions`
```typescript
interface IssueOptions {
  title?: string;
  filePath?: string;
}
```
