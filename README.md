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

[Contributing](CONTRIBUTING.md) · [Security Policy](SECURITY.md) · [License](LICENSE) · [Stellar Wave Documentation](https://docs.drips.network/wave)
