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

[Contributing](CONTRIBUTING.md) · [Security Policy](SECURITY.md) · [License](LICENSE) · [Stellar Wave Documentation](https://docs.drips.network/wave)

