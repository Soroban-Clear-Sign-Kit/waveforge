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

Validates an issue Markdown file against rules I1–I7, S1–S3, and F1 before submitting to a Wave.

```bash
# Lint an issue draft
waveforge issue ./docs/issues/001-soroban-token.md
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

Before issues are submitted to a Stellar Wave reward pool, `waveforge issue` verifies markdown structure and technical depth:

### Standard Issue Rules (I1–I7)

| Rule | Title | Requirement | Fix |
| :--- | :--- | :--- | :--- |
| **`I1`** | **Issue Title Format** | Title must clearly describe the deliverable with standard prefixes (`feat:`, `fix:`, etc.). | Prefix title with an informative type and concise description. |
| **`I2`** | **Problem Statement** | Issue must contain a `## Problem Statement` section detailing motivation and context. | Add a section explaining the problem or opportunity. |
| **`I3`** | **Proposed Solution** | Issue must include a `## Proposed Solution` section outlining technical approach. | Detail architectural changes or functions to implement. |
| **`I4`** | **Acceptance Criteria** | Issue must specify a Markdown checklist (`- [ ]`) under `## Acceptance Criteria`. | Add actionable, verifiable verification checklist items. |
| **`I5`** | **Scope and Boundaries** | Issue must explicitly outline in-scope deliverables and out-of-scope non-goals. | Add `## Scope` declaring clear boundaries. |
| **`I6`** | **Testing Plan** | Issue must explain how the change will be tested (unit tests, integration tests). | Add `## Testing Plan` with verification steps. |
| **`I7`** | **Dependencies and Blockers** | Issue must identify upstream PRs, crates, or contracts required (or state `None`). | Add `## Dependencies` section. |

### Stellar & Smart Contract Specific Rules (S1–S3)

| Rule | Title | Requirement | Fix |
| :--- | :--- | :--- | :--- |
| **`S1`** | **Stellar Ecosystem Alignment** | Issue must identify specific relevance to Soroban, Stellar protocols, or Wave tracks. | Detail how this work furthers Stellar ecosystem goals. |
| **`S2`** | **Smart Contract Architecture** | Contract alterations must specify interfaces, storage entry types, and auth requirements. | Document auth checks (`require_auth`) and ledger storage strategy. |
| **`S3`** | **Security and Audit Impact** | Identifies potential security implications or audit needs. | Include a security impact summary or state why risk is minimal. |

### Formatting Rule (F1)

| Rule | Title | Requirement | Fix |
| :--- | :--- | :--- | :--- |
| **`F1`** | **Frontmatter Validity** | If YAML frontmatter (`---`) is included, it must parse cleanly without syntax errors. | Correct frontmatter YAML formatting and indentation. |

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




