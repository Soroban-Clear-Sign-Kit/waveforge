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
