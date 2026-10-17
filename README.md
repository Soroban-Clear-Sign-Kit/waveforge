# WaveForge

> A CLI and TypeScript library that checks Soroban and Stellar repositories for Stellar Wave readiness, verifies README contract IDs on-chain, and lints issues before they enter a Wave.

[![npm version](https://img.shields.io/npm/v/waveforge-stellar.svg)](https://www.npmjs.com/package/waveforge-stellar)
[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![node version](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](package.json)

**Current release**: `v0.1.0` · **Network**: Stellar testnet and mainnet (read-only) · **Status**: Published on npm

---

## Where This Repository Fits

This repository owns every check and rule. `waveforge-action` bundles this library to run it on GitHub.

| Repository | Role | Description |
| :--- | :--- | :--- |
| **`waveforge`** | CLI, checks and library *(this repo)* | Core TypeScript engine owning checks R1–R10, issue rules I1–I7, S1–S3, F1, report formatters, and CLI. |
| **`waveforge-action`** | GitHub Action | Pre-bundled GitHub Action that runs this library in CI workflows, creating comments and job summaries. |

---

## Installation

```bash
# As project dependency (pnpm)
pnpm add -D waveforge-stellar

# As project dependency (npm)
npm install --save-dev waveforge-stellar

# Global CLI
npm install -g waveforge-stellar

# Or run directly via npx / pnpm dlx
npx waveforge-stellar repo .
```

---

## CLI Usage

The `waveforge` binary provides three primary commands: `repo`, `issue`, and `init-action`.

### 1. Repository Readiness (`waveforge repo`)

Evaluates the target Soroban/Stellar repository against all checks R1 through R10.

```bash
# Run readiness checks on the current repository
waveforge repo .

# Run on a specific path
waveforge repo /path/to/soroban-project

# Run offline (network checks return skipped instead of failing)
waveforge repo . --offline
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

Validates or sets up CI integration:

```bash
waveforge init-action
```

---

## Programmatic Library API

`waveforge-stellar` exports a full TypeScript library API for programmatic use in custom scripts, test harnesses, or CI pipelines:

```typescript
import {
  runRepoChecks,
  lintIssueMarkdown,
  repoChecks,
  issueRules,
  type Report,
} from "waveforge-stellar";

// 1. Run repository checks
const repoReport: Report = await runRepoChecks("./my-soroban-repo", {
  offline: false,
});

console.log(`Passed: ${repoReport.summary.pass}/${repoReport.summary.total}`);

// 2. Lint issue markdown
const issueReport: Report = await lintIssueMarkdown("issue.md", "# Test Issue");
console.log(`Checks total: ${issueReport.summary.total}`);
```

---

## Repository Readiness Checks (R1–R10)

Every check has an id, a title, a one-line message, and a fix. Network checks return `skipped` when `--offline` is set or the network is unreachable. Secrets are masked as `SXXXX...last4`.

| ID | Title | What It Evaluates | Suggested Fix |
| :--- | :--- | :--- | :--- |
| **`R1`** | **License Specification** | Verifies standard open-source license (`LICENSE`, `LICENSE.md`, `COPYING`). | Add an open-source license file (e.g. Apache-2.0 or MIT). |
| **`R2`** | **README Documentation** | Checks `README.md` presence, Stellar/Soroban mention, setup heading, and flags placeholders. | Add or update `README.md` with setup instructions and remove placeholders. |
| **`R3`** | **Contributing Guidelines** | Checks `CONTRIBUTING.md`, setup/testing instructions, Wave mention, and forbids dollar amounts or `/claim`. | Add `CONTRIBUTING.md` aligned with Stellar Wave contributor guidelines. |
| **`R4`** | **Security Policy** | Checks that `SECURITY.md` exists with vulnerability reporting instructions. | Add a `SECURITY.md` file in repository root. |
| **`R5`** | **Issue Templates** | Verifies YAML issue forms in `.github/ISSUE_TEMPLATE` and `config.yml` with `blank_issues_enabled: false`. | Add structured YAML issue forms in `.github/ISSUE_TEMPLATE/`. |
| **`R6`** | **CI Workflow Automation** | Verifies `.github/workflows/` contains an automated workflow triggered on `pull_request` with a test step. | Add a GitHub Actions workflow with an automated test step on PRs. |
| **`R7`** | **Soroban Contracts and CI** | Detects `Cargo.toml` with `soroban-sdk`; verifies CI runs `cargo test`, `clippy`, and `stellar contract build`, and verifies contract tests exist. | Configure Soroban contract testing, clippy, and build steps in CI workflows. |
| **`R8`** | **On-Chain Contract Verification** | Verifies contract IDs documented in README exist on-chain via Stellar RPC (offline-safe: returns `skipped` when offline). | Ensure documented contract IDs are deployed on the target Stellar network. |
| **`R9`** | **Wasm Compilation Target** | Scans docs and scripts for deprecated `wasm32-unknown-unknown` target. | Update `wasm32-unknown-unknown` to `wasm32v1-none` (current Stellar CLI target). |
| **`R10`** | **Secret Key and Environment Safety** | Scans tracked files for Stellar secret seeds (`S...`) and committed `.env` files (except `.env.example`). | Remove committed secrets from git history and use `.env.example` placeholders. |

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

## Roadmap & Milestones

### `v0.1.0` Foundation (Released)
*Target: October 2026*

Everything the README documents today:
- [x] Repo checks R1 to R10, including Soroban CI and secret-seed detection
- [x] On-chain contract ID check (R8) that never passes offline
- [x] Issue rules I1 to I7, S1 to S3 and F1 with suggested complexity
- [x] Text, Markdown and JSON reports; `init-action` command
- [x] Published to npm (`waveforge-stellar`)

### `v0.2.0` More Checks
*Target: Q4 2026*

Catch more real problems in Soroban repos:
- [ ] **R11**: TTL-extension heuristic for contract code (`High` complexity)
- [ ] **R12**: `require_auth` presence per state-changing function (spike first) (`High` complexity)
- [ ] **R13**: Testnet deploy script present (`Trivial` complexity)
- [ ] More issue-rule fixtures from real Stellar Wave issues (`Trivial` complexity)
- [ ] Translated messages (`Medium` complexity)

### `v0.3.0` Integrations
*Target: Q1 2027*

Plug into more toolchains:
- [ ] **SARIF Output**: Native SARIF output for GitHub code scanning (`Medium` complexity)
- [ ] **`--fix` Mode**: `--fix` mode for template files (`Medium` complexity)
- [ ] **Go Repository Support**: Go repository support (`go test`, `golangci-lint`) (`Medium` complexity)

### `v1.0.0` Stable
*Target: 2027*

Stable check IDs and library API:
- [ ] Frozen check IDs with a deprecation policy
- [ ] Stable library API with semver guarantees

---

## Out of Scope for This Repository

- **The GitHub Action, comments and job summaries**: Owned by [`waveforge-action`](https://github.com/Soroban-Clear-Sign-Kit/waveforge-action).
- **Hosting a web dashboard**: waveforge is a CLI and library without a hosted server or database.
- **Deciding Wave approvals**: That is the organizers' call.

---

## How to Help

- Roadmap items for the current milestone become GitHub issues with a **"Done when"** checklist and a complexity (**Trivial**, **Medium** or **High**).
- During a Stellar Wave, these issues carry the `Stellar Wave` label and you can apply for them at [drips.network/wave](https://drips.network/wave). Read [CONTRIBUTING.md](CONTRIBUTING.md) first.
- Want something that is not listed? Open a feature issue with the problem it solves. Items move between milestones based on contributor interest and maintainer review.

---

## How This Roadmap Is Maintained

- Targets are estimates, not promises.
- An item is ticked only when its PR is merged and released.
- Each release updates this file and `CHANGELOG.md` together.
- Scope changes are recorded in `docs/DECISIONS.md`.

---

[Contributing](CONTRIBUTING.md) · [Security Policy](SECURITY.md) · [License](LICENSE) · [Stellar Wave Documentation](https://docs.drips.network/wave)




