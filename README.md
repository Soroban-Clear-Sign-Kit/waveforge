# WaveForge

WaveForge is a TypeScript library and CLI tool that helps Soroban repository maintainers verify repository readiness and contributor workflows before participating in Stellar Wave reward pools. It inspects repository structure, CI workflows, and safety policies, and verifies on-chain that contract IDs documented in READMEs and docs exist on the target Stellar network.

[![npm version](https://img.shields.io/npm/v/waveforge-stellar.svg)](https://www.npmjs.com/package/waveforge-stellar)
[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![node version](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](package.json)

**Current release**: `v0.1.0` · **Network**: Stellar testnet and mainnet (read-only) · **Status**: Published on npm

---

## Quick Start

Run repository readiness checks immediately on any repository without prior installation:

```bash
npx waveforge-stellar repo .
```

You can also install WaveForge globally or as a project devDependency:

```bash
# Global install
npm install -g waveforge-stellar

# Or project dependency
pnpm add -D waveforge-stellar
# or
npm install --save-dev waveforge-stellar
```

---

## CLI Usage

The `waveforge` binary provides three primary commands: `repo`, `issue`, and `init-action`.

### 1. Repository Readiness (`waveforge repo`)

Evaluates the target Soroban/Stellar repository against all checks R1 through R10.

```bash
# Run readiness checks on the current repository
waveforge repo .

# Run on a specific repository path
waveforge repo /path/to/soroban-project

# Run offline (network checks return skipped instead of failing)
waveforge repo . --offline

# Specify target Stellar network and custom RPC endpoint
waveforge repo . --network=testnet
waveforge repo . --network=mainnet --rpc-url=https://mainnet.sorobanrpc.com

# Format output as JSON or Markdown
waveforge repo . --json
waveforge repo . --markdown

# Enforce a minimum score threshold (exits with 1 if below threshold)
waveforge repo . --min-score=90
```

### 2. Issue Markdown Linter (`waveforge issue`)

Validates an issue Markdown file or standard input stream against rules I1–I7, S1–S3, and F1 before submitting to a Wave reward pool. Computes suggested complexity and warns on divergences.

```bash
# Lint an issue draft file
waveforge issue ./docs/issues/001-soroban-token.md

# Lint an issue from standard input
cat issue.md | waveforge issue -

# Override or specify issue title
waveforge issue ./issue.md --title="Add staking contract"

# Output formatted JSON or Markdown report
waveforge issue ./issue.md --json
waveforge issue ./issue.md --markdown

# Require a minimum score threshold
waveforge issue ./issue.md --min-score=90
```

### 3. Initialize Action Workflow (`waveforge init-action`)

Sets up GitHub Actions automation by generating `.github/workflows/waveforge.yml` configured to run `waveforge-action`:

```bash
# Initialize .github/workflows/waveforge.yml with default action ref
waveforge init-action

# Overwrite an existing workflow file
waveforge init-action --force

# Use a custom action reference
waveforge init-action --force --ref=my-org/waveforge-action@v1
```

---

## Repository Readiness Checks (R1–R10)

Every check has an id, a title, a one-line message, and a fix. Network checks return `skipped` when `--offline` is set or the network is unreachable. Secrets are masked as `SXXXX...last4`.

| ID | What It Evaluates | Why It Matters for Wave Contributors |
| :--- | :--- | :--- |
| **`R1`** | **License Specification**: Standard open-source license (`LICENSE`, `LICENSE.md`, `COPYING`). | Ensures contributors and users have unambiguous open-source rights to view, fork, and build on code. |
| **`R2`** | **README Documentation**: `README.md` presence, setup instructions, Stellar/Soroban mention, and absence of placeholder text. | Equips contributors with clear onboarding instructions to build, run, and understand project deliverables. |
| **`R3`** | **Contributing Guidelines**: `CONTRIBUTING.md` with setup/testing guidance, Stellar Wave mention, and forbids dollar amounts or `/claim`. | Sets transparent expectations for task applications, review criteria, and Wave-compliant workflows without bounty haggling. |
| **`R4`** | **Security Policy**: `SECURITY.md` presence with clear vulnerability reporting instructions. | Provides security researchers a responsible, private disclosure channel to report contract or code vulnerabilities. |
| **`R5`** | **Issue Templates**: Structured YAML forms in `.github/ISSUE_TEMPLATE` and `config.yml` with `blank_issues_enabled: false`. | Guides contributors to file structured issues with actionable reproduction steps, expected behavior, and scope boundaries. |
| **`R6`** | **CI Workflow Automation**: Automated GitHub Actions workflow triggered on `pull_request` with an automated test step. | Verifies contributor PRs automatically run test suites, catching regressions before maintainer review. |
| **`R7`** | **Soroban Contracts and CI**: Detects `soroban-sdk` crates; verifies CI runs `cargo test`, `clippy`, and `stellar contract build`, and verifies contract tests exist. | Maintains high smart contract code quality, type safety, and verifiable compilation in CI pipelines. |
| **`R8`** | **On-Chain Contract Verification**: Verifies contract IDs documented in README exist on-chain via Stellar RPC (offline-safe: returns `skipped` when offline). | Validates that contract addresses documented for contributors are live on-chain, preventing stale or phantom IDs. |
| **`R9`** | **Wasm Compilation Target**: Scans docs and scripts for deprecated `wasm32-unknown-unknown` target. | Prevents broken builds and compilation mismatches by ensuring projects target current Stellar CLI standards (`wasm32v1-none`). |
| **`R10`** | **Secret Key and Environment Safety**: Scans tracked files for Stellar secret seeds (`S...`) and committed `.env` files (except `.env.example`). | Protects repositories from leaked cryptographic credentials, compromised test accounts, and accidental secret commits. |

---

## Issue Linting Rules (I1–I7, S1–S3, F1)

Before issues are submitted to a Stellar Wave reward pool, `waveforge issue` verifies markdown structure, scope limits, and technical requirements:

### Standard Issue Rules (I1–I7)

| Rule | Title | Requirement | Severity | Fix |
| :--- | :--- | :--- | :--- | :--- |
| **`I1`** | **Context and Description** | Must contain a `## Description`, `## Context`, or `## Background` section, or an opening paragraph of at least 30 words. | **Fail** | Add a context section or expand opening paragraph to >= 30 words. |
| **`I2`** | **Requirements Specification** | Must contain a list under a `## Requirements` or `## Requirements and context` heading. | **Warn** | Add a bulleted or numbered requirements list. |
| **`I3`** | **Acceptance Criteria** | Must contain a `## Done when` or `## Acceptance criteria` heading with at least 2 `- [ ]` checklist items. | **Fail** | Add a checklist with at least 2 actionable verification checkboxes. |
| **`I4`** | **Files to Touch** | Must reference file paths (containing `/` and extension, or trailing `/`) or a `## Files to touch` heading. | **Warn** | Specify affected paths (e.g. `src/` or `src/index.ts`) or add a `Files to touch` section. |
| **`I5`** | **Suggested Execution** | Must include a `## Suggested execution` section or numbered steps. | **Warn** | Add execution steps outlining implementation sequence. |
| **`I6`** | **Complexity Estimation** | Must state complexity (`Trivial`, `Medium`, `High`, or `100`/`150`/`200` points) matching suggested complexity. | **Warn** | Align stated complexity with suggested scope assessment. |
| **`I7`** | **Scope Limits** | Issue scope must remain under 15 checklist items and under 1,200 words. | **Warn** | Split large issues into smaller, focused tasks. |

### Stellar & Smart Contract Specific Rules (S1–S3)
*Active when text references `.rs`, `contracts/`, `soroban`, `require_auth`, or `"smart contract"` (otherwise `skipped`)*

| Rule | Title | Requirement | Severity | Fix |
| :--- | :--- | :--- | :--- | :--- |
| **`S1`** | **State Change Authorization** | Must specify who must authorize state changes (e.g. `require_auth`). | **Fail** | Document caller/admin authorization requirements. |
| **`S2`** | **Contract Tests** | Must require automated contract tests (e.g. `cargo test`, unit or integration tests). | **Fail** | Add automated test requirements for contract code. |
| **`S3`** | **Contract Build and Size** | Should require `stellar contract build` or a Wasm size check. | **Warn** | Add build verification or Wasm size check steps. |

### Frontend & UI Rule (F1)
*Active when text references `.tsx`, `UI`, `page`, or `component` (otherwise `skipped`)*

| Rule | Title | Requirement | Severity | Fix |
| :--- | :--- | :--- | :--- | :--- |
| **`F1`** | **UI Visual Verification** | Must request screenshots or a screen recording in the PR. | **Warn** | Require screenshots or demo recordings for visual proof. |

---

## Programmatic Library API

`waveforge-stellar` exports a minimal, deterministic TypeScript library API. See [docs/API.md](docs/API.md) for full specifications, options, and offline-safety guarantees.

```typescript
import { runRepoChecks, runIssueLint, score, formatText } from "waveforge-stellar";

// 1. Run repository readiness checks
const repoReport = await runRepoChecks(".", { network: "testnet" });
console.log(formatText(repoReport));

// 2. Lint issue markdown text
const issueReport = await runIssueLint(issueMarkdown, { title: "Issue Title" });
console.log(`Issue Score: ${issueReport.score}% (Status: ${score(issueReport.results)}%)`);
```

---

## Exit Codes

- **`0`**: Success — all checks passed, or readiness score meets `--min-score` with zero failures.
- **`1`**: Check Failure — one or more checks failed, or report score is below `--min-score`.
- **`2`**: Usage or I/O Error — missing command, invalid CLI options, or file/directory not found.

---

## Limitations

WaveForge provides automated heuristics to assist maintainers and contributors in preparing repositories and issues. Passing WaveForge checks does not guarantee acceptance, funding, or rewards; official evaluation and approval decisions remain solely with Stellar Wave organizers.

---

Related repositories: waveforge-action
