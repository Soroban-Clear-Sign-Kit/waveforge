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
| **`R1`** | **Cargo.toml Soroban Configuration** | Verifies root or crate `Cargo.toml` exists and configures Soroban SDK dependencies. | Add or update `Cargo.toml` with `soroban-sdk` dependencies. |
| **`R2`** | **Stellar Contract ID Verification** | Validates format and checksum of contract addresses documented in `README.md` or configs. | Correct any malformed contract IDs in documentation. |
| **`R3`** | **Build and Test Automation** | Ensures automated build scripts or test workflows (`cargo test`) are configured. | Add scripts or GitHub Action steps to test contracts automatically. |
| **`R4`** | **License Specification** | Verifies an open-source `LICENSE` file is present in the repository root. | Add a valid open-source license file (e.g., Apache-2.0). |
| **`R5`** | **README Documentation** | Checks that `README.md` exists with clear project overview, setup, and instructions. | Expand `README.md` to document contract interfaces and usage. |
| **`R6`** | **Git Configuration & Hygiene** | Verifies `.gitignore` exists and excludes secrets, build artifacts (`target/`), and `.env*`. | Update `.gitignore` with `target/`, `.env*`, and credential patterns. |
| **`R7`** | **Soroban SDK Version Alignment** | Verifies that all workspace crates depend on aligned, supported versions of `soroban-sdk`. | Harmonize `soroban-sdk` versions across all workspace members. |
| **`R8`** | **On-Chain Contract ID Check** | Queries Stellar testnet and mainnet RPC nodes to verify deployed contract code existence (returns `skipped` when offline). | Ensure contract IDs point to live, deployed contract instances on the network. |
| **`R9`** | **Environment and Secrets Safety** | Scans repository files for committed secret keys (e.g., `S...` private keys) and verifies masking. | Remove exposed keys, revoke compromised credentials, and use `.env.example`. |
| **`R10`** | **Stellar Wave Readiness Score** | Aggregates checks R1 through R9 into a unified readiness status for Wave qualification. | Resolve all failing prerequisite checks to achieve full Wave readiness. |

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

[Contributing](CONTRIBUTING.md) · [Security Policy](SECURITY.md) · [License](LICENSE) · [Stellar Wave Documentation](https://docs.drips.network/wave)



