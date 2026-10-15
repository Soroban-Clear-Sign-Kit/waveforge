# waveforge

> A CLI and TypeScript library that checks Soroban and Stellar repositories for Stellar Wave readiness, verifies README contract IDs on-chain, and lints issues before they enter a Wave.

[![npm version](https://img.shields.io/npm/v/waveforge-stellar.svg)](https://www.npmjs.com/package/waveforge-stellar)
[![license](https://img.shields.io/github/license/Soroban-Clear-Sign-Kit/waveforge.svg)](LICENSE)
[![node version](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](package.json)

**Current release**: `v0.1.0` · **Network**: Stellar testnet & mainnet (read-only RPC) · **Status**: Published on npm

---

## Table of Contents

- [Overview](#overview)
- [Where This Repository Fits](#where-this-repository-fits)
- [Key Features](#key-features)
- [Installation](#installation)
- [CLI Usage](#cli-usage)
- [Programmatic Library API](#programmatic-library-api)
- [Repository Readiness Checks (R1–R10)](#repository-readiness-checks-r1r10)
- [Issue Linting Rules (I1–I7, S1–S3, F1)](#issue-linting-rules-i1i7-s1s3-f1)
- [Roadmap & Milestones](#roadmap--milestones)
- [Contributing & Maintenance](#contributing--maintenance)

---

## Overview

**waveforge** provides automated readiness assessment and issue linting for projects building on Soroban (Stellar smart contracts). Whether preparing a repository for grant rounds, hackathons, or participation in a **Stellar Wave** on [Drips](https://drips.network/wave), waveforge delivers fast, deterministic feedback to ensure repositories and issues meet quality and security standards.

The tool operates with strict guardrails:
- **Deterministic and offline-safe**: Network checks gracefully return `skipped` (never fake a `pass`) when offline or unreachable.
- **Secrets safety**: Never prints full secret keys (masks secret keys as `SXXXX...last4`).
- **Read-only by design**: Scans repositories and issue files without altering user code or directories.

---

## Where This Repository Fits

This repository owns all check algorithms, issue linting rules, the report data model, formatters, the CLI binary, and the programmatic library API.

| Repository | Role | Scope |
| :--- | :--- | :--- |
| **`waveforge`** *(this repo)* | Core Engine, CLI & Library | Owns checks R1–R10, issue rules I1–I7, S1–S3, F1, report formatters, and public TypeScript API. |
| **`waveforge-action`** | GitHub Action | Bundles this library to execute in GitHub workflows, generating PR/issue comments and job summaries. |

---

## Key Features

- **Repository Readiness Engine (Checks R1–R10)**: Analyzes Soroban workspace setup, Cargo manifest configurations, build targets, license presence, and CI workflows.
- **On-Chain Contract ID Verification**: Validates contract addresses found in project documentation against Stellar testnet and mainnet ledger state.
- **Issue Markdown Linter (Rules I1–I7, S1–S3, F1)**: Enforces comprehensive issue descriptions, acceptance criteria, scope boundaries, and Stellar-specific smart contract considerations before issues go live.
- **Multi-Format Reporting**: Produces human-readable CLI text, structured Markdown, or machine-readable JSON for pipeline integrations.
- **Zero-Config Workflow Initializer**: Run `waveforge init-action` to quickly bootstrap CI integration.

---

## Installation

### As a Project Dependency (Recommended for CI & Scripts)

```bash
# Using pnpm
pnpm add -D waveforge-stellar

# Using npm
npm install --save-dev waveforge-stellar

# Using yarn
yarn add --dev waveforge-stellar
```

### Global Installation

To use `waveforge` anywhere across your terminal:

```bash
npm install -g waveforge-stellar
```

### Direct Execution with `npx` or `pnpm dlx`

Run immediately without a global install:

```bash
npx waveforge-stellar repo .
# or
pnpm dlx waveforge-stellar repo .
```

---

## CLI Usage

The `waveforge` CLI provides three primary commands: `repo`, `issue`, and `init-action`.

### 1. Repository Readiness (`waveforge repo`)

Evaluates the target Soroban/Stellar repository against all checks R1 through R10.

```bash
# Check current directory
waveforge repo .

# Check specific path
waveforge repo /path/to/soroban-project

# Run in offline mode (network verification skipped gracefully)
waveforge repo . --offline
```

**Options**:
- `[path]` *(optional)*: Path to the root of the Soroban project (defaults to current directory `.`).
- `--offline` *(optional)*: Skips network calls (e.g., RPC queries for on-chain contract verification) and flags them as `skipped` instead of failing.

### 2. Issue Markdown Linter (`waveforge issue`)

Lints an issue description in Markdown format before posting to GitHub or applying to a Stellar Wave on Drips.

```bash
# Lint an issue draft
waveforge issue ./docs/issues/001-soroban-token.md
```

**Validation includes**:
- Title formatting and clarity (I1)
- Explicit problem statement and proposed solution (I2, I3)
- Verifiable acceptance criteria checklist (I4)
- Clear in-scope / out-of-scope boundaries (I5)
- Testing strategy and dependency declarations (I6, I7)
- Stellar/Soroban alignment and smart contract authorization considerations (S1–S3)
- Frontmatter metadata validation (F1)

### 3. Bootstrap CI Workflow (`waveforge init-action`)

Prepares or verifies the GitHub Action configuration for your repository:

```bash
waveforge init-action
```

---

## Programmatic Library API

`waveforge-stellar` exports a full TypeScript library API for programmatic use in custom scripts, test harnesses, or CI pipelines.

```typescript
import {
  runRepoChecks,
  lintIssueMarkdown,
  repoChecks,
  issueRules,
  type Report,
  type CheckItem,
} from "waveforge-stellar";

// 1. Run repository checks
const repoReport: Report = await runRepoChecks("./my-soroban-repo", {
  offline: false,
});

console.log(`Passed: ${repoReport.summary.pass}/${repoReport.summary.total}`);
if (repoReport.summary.fail > 0) {
  console.error("Repository readiness checks failed!");
}

// 2. Lint an issue description
const markdownContent = `
# Add Soroban Token Contract
## Problem Statement
We need a standard NEP-style or SEP token.
## Acceptance Criteria
- [ ] Implement token interface
- [ ] Unit tests passing
`;

const issueReport: Report = await lintIssueMarkdown("issue.md", markdownContent);
for (const check of issueReport.checks) {
  console.log(`[${check.status.toUpperCase()}] ${check.id} - ${check.title}`);
}
```

---

## Repository Readiness Checks (R1–R10)

Every readiness check enforces deterministic, offline-safe evaluation of the repository:

| ID | Title | What It Evaluates | Suggested Fix / Remediation |
| :--- | :--- | :--- | :--- |
| **`R1`** | **Cargo.toml Soroban Configuration** | Verifies root or crate `Cargo.toml` exists and declares Soroban SDK dependencies with correct features. | Add or update `Cargo.toml` with `soroban-sdk` and required feature flags. |
| **`R2`** | **Stellar Contract ID Verification** | Parses contract addresses documented in `README.md` or configs and validates format and checksum. | Correct any malformed contract IDs in documentation. |
| **`R3`** | **Build and Test Automation** | Ensures automated build scripts, `Makefile`, or test workflows (`cargo test`) are configured. | Add scripts or GitHub Action steps to test contracts automatically. |
| **`R4`** | **License Specification** | Verifies an open-source `LICENSE` file is present in the repository root. | Add a valid open-source license file (e.g., Apache-2.0, MIT). |
| **`R5`** | **README Documentation** | Checks that `README.md` exists with clear project overview, architecture, and setup instructions. | Expand `README.md` to document contract interfaces and usage. |
| **`R6`** | **Git Configuration & Hygiene** | Verifies `.gitignore` exists and excludes secrets, build artifacts (`target/`), and environment variables. | Update `.gitignore` with `target/`, `.env*`, and credential patterns. |
| **`R7`** | **Soroban SDK Version Alignment** | Verifies that all workspace crates depend on aligned, supported versions of `soroban-sdk`. | Harmonize `soroban-sdk` versions across all workspace members. |
| **`R8`** | **On-Chain Contract ID Check** | Queries Stellar testnet and mainnet RPC nodes to verify deployed contract code existence (returns `skipped` when `--offline`). | Ensure contract IDs point to live, deployed contract instances on the network. |
| **`R9`** | **Environment and Secrets Safety** | Scans repository files for committed secret keys (e.g., `S...` private keys) and verifies masking. | Remove exposed keys, revoke compromised credentials, and use `.env.example`. |
| **`R10`** | **Stellar Wave Readiness Score** | Aggregates checks R1 through R9 into a unified readiness status for Wave qualification. | Resolve all failing prerequisite checks to achieve full Wave readiness. |

---

## Issue Linting Rules (I1–I7, S1–S3, F1)

Before issues are submitted to a Stellar Wave reward pool, `waveforge issue` verifies markdown structure and technical depth:

### Standard Issue Rules (I1–I7)

| Rule | Title | Requirement | Fix |
| :--- | :--- | :--- | :--- |
| **`I1`** | **Issue Title Format** | Title must clearly describe the deliverable and follow standard prefixes (`feat:`, `fix:`, `docs:`, etc.). | Prefix title with an informative type and concise description. |
| **`I2`** | **Problem Statement** | Issue must contain a `## Problem Statement` section detailing motivation and context. | Add a section explaining the problem or opportunity. |
| **`I3`** | **Proposed Solution** | Issue must include a `## Proposed Solution` section outlining technical approach. | Detail architectural changes or functions to implement. |
| **`I4`** | **Acceptance Criteria** | Issue must specify a Markdown checklist (`- [ ]`) under `## Acceptance Criteria`. | Add actionable, verifiable verification checklist items. |
| **`I5`** | **Scope and Boundaries** | Issue must explicitly outline in-scope deliverables and out-of-scope non-goals. | Add `## Scope` declaring clear boundaries. |
| **`I6`** | **Testing Plan** | Issue must explain how the change will be tested (unit tests, integration tests, fuzzing). | Add `## Testing Plan` with verification steps. |
| **`I7`** | **Dependencies and Blockers** | Issue must identify upstream PRs, crates, or contracts required (or state `None`). | Add `## Dependencies` section. |

### Stellar & Smart Contract Specific Rules (S1–S3)

| Rule | Title | Requirement | Fix |
| :--- | :--- | :--- | :--- |
| **`S1`** | **Stellar Ecosystem Alignment** | Issue must identify specific relevance to Soroban, Stellar protocols, or Wave tracks. | Detail how this work furthers Stellar ecosystem goals. |
| **`S2`** | **Smart Contract Architecture** | Contract alterations must specify interfaces, storage entry types (`Instance`, `Persistent`, `Temporary`), and auth requirements. | Document auth checks (`require_auth`) and ledger storage strategy. |
| **`S3`** | **Security and Audit Impact** | Identifies potential security implications, reentrancy considerations, or audit needs. | Include a security impact summary or state why risk is minimal. |

### Formatting Rule (F1)

| Rule | Title | Requirement | Fix |
| :--- | :--- | :--- | :--- |
| **`F1`** | **Frontmatter Validity** | If YAML frontmatter (`---`) is included, it must parse cleanly without syntax errors. | Correct frontmatter YAML formatting and indentation. |

---

## Roadmap & Milestones

The WaveForge roadmap outlines planned enhancements to catch more real problems in Soroban repositories and integrate cleanly across developer pipelines.

### `v0.1.0` Foundation (Released)
*Target: October 2026*

Core foundation for repository and issue readiness.
- [x] Repo checks R1 to R10, including Soroban CI and secret-seed detection
- [x] On-chain contract ID check (R8) that never passes offline
- [x] Issue rules I1 to I7, S1 to S3 and F1 with suggested complexity
- [x] Text, Markdown and JSON reports; `init-action` command
- [x] Published to npm (`waveforge-stellar`)

### `v0.2.0` More Checks
*Target: Q4 2026*

Catch deeper, real-world edge cases in Soroban contract development.
- [ ] **R11**: TTL-extension heuristic for contract code and persistent state (`High` complexity)
- [ ] **R12**: `require_auth` presence check per state-changing function (spike first) (`High` complexity)
- [ ] **R13**: Testnet deploy script presence verification (`Trivial` complexity)
- [ ] Expanded issue-rule test fixtures derived from real Stellar Wave submissions (`Trivial` complexity)
- [ ] Multi-language translated diagnostic messages (`Medium` complexity)

### `v0.3.0` Integrations
*Target: Q1 2027*

Seamless integration with broader developer toolchains and CI systems.
- [ ] **SARIF Output**: Native SARIF report generation for GitHub Code Scanning integration (`Medium` complexity)
- [ ] **`--fix` Mode**: Automated remediation for missing template files and configuration stubs (`Medium` complexity)
- [ ] **Go Repository Support**: Extend readiness checks for Go services interacting with Soroban (`go test`, `golangci-lint`) (`Medium` complexity)

### `v1.0.0` Stable
*Target: 2027*

Long-term stability and ecosystem standard.
- [ ] Frozen check IDs with a formalized deprecation policy
- [ ] Stable library API with strict SemVer guarantees

---

## Out of Scope for This Repository

To keep `waveforge` focused and lightweight, the following concerns are explicitly out of scope:
- **GitHub Action Execution & Comments**: Running in GitHub Actions and posting PR comments or job summaries belongs to [`waveforge-action`](https://github.com/Soroban-Clear-Sign-Kit/waveforge-action).
- **Web Dashboard Hosting**: No server, no database, no hosted web dashboards.
- **Grant & Wave Approvals**: Deciding Wave approvals or distributing funds is exclusively the responsibility of Drips and Stellar Wave organizers.

---

## Contributing & Maintenance

### How to Help
- Roadmap items for the active milestone become GitHub issues tagged with a **"Done when"** checklist and an estimated complexity rating (`Trivial`, `Medium`, or `High`).
- During an active **Stellar Wave**, issues carry the `Stellar Wave` label and can be applied for directly at [drips.network/wave](https://drips.network/wave).
- Have a feature or check idea not listed on the roadmap? Please open an issue outlining the problem it solves and how it benefits Soroban developers.

### How This Roadmap Is Maintained
- **Targets are estimates, not promises**: Milestones shift dynamically based on ecosystem priorities and contributor bandwidth.
- **Ticked upon release**: Roadmap checklist items are marked complete (`[x]`) only after their PR is merged and tagged in an official release.
- **Synchronized updates**: Each release updates this roadmap and `CHANGELOG.md` in tandem.
- **Architectural decisions**: Any scope or API modifications are logged in `docs/DECISIONS.md`.

---

## License

This project is licensed under the [MIT License](LICENSE).


