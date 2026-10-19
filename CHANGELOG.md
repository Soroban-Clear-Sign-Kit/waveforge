# Changelog

All notable changes to `waveforge-stellar` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2026-10-19

### Fixed
- Fixed: the waveforge command was missing from the published package.

## [0.1.0] - 2026-10-18

### Added
- **Repository Readiness Checks (R1–R10)**:
  - `R1`: License specification (detects standard open-source licenses: Apache-2.0, MIT, etc.).
  - `R2`: README documentation (validates Stellar/Soroban references, setup heading, flags placeholders).
  - `R3`: Contributing guidelines (`CONTRIBUTING.md` with test/setup instructions, Stellar Wave alignment, no dollar amounts).
  - `R4`: Security policy (`SECURITY.md` vulnerability reporting instructions).
  - `R5`: Issue template configuration (YAML issue forms in `.github/ISSUE_TEMPLATE/` with blank issues disabled).
  - `R6`: CI workflow automation (validates automated test execution triggered on `pull_request`).
  - `R7`: Soroban contracts & CI (detects `soroban-sdk` crates, verifies `cargo test`, `clippy`, and `stellar contract build`).
  - `R8`: On-chain contract verification (extracts contract IDs from README/docs and checks live ledger existence via RPC; offline-safe).
  - `R9`: Wasm compilation target check (flags deprecated `wasm32-unknown-unknown` references in favor of `wasm32v1-none`).
  - `R10`: Secret key and environment safety (detects committed Stellar secret seeds `S...` with masking, and committed `.env` files).
- **Issue Markdown Linter (I1–I7, S1–S3, F1)**:
  - `I1`: Context and description section or opening paragraph >= 30 words.
  - `I2`: Requirements specification list under Requirements section.
  - `I3`: Acceptance criteria with at least 2 `- [ ]` checklist items.
  - `I4`: Affected file paths or "Files to touch" heading.
  - `I5`: Suggested execution section or numbered steps.
  - `I6`: Complexity estimation (Trivial, Medium, High) with heuristic suggestion.
  - `I7`: Scope limits (< 15 checklist items and < 1,200 words).
  - `S1`: Soroban state change authorization (`require_auth`).
  - `S2`: Soroban contract test requirements.
  - `S3`: Soroban `stellar contract build` or Wasm size check.
  - `F1`: Frontend visual verification (requires screenshots or screen recording).
- **Public Library API**:
  - `runRepoChecks`: Analyzes target repository readiness.
  - `runIssueLint`: Lints issue markdown text.
  - `score`: Computes 0–100 score excluding skipped checks.
  - `formatText`, `formatMarkdown`, `formatJson`: Report formatters.
  - Full TypeScript types: `Status`, `CheckResult`, `Report`, `RepoOptions`, `IssueOptions`.
- **Command Line Interface (`waveforge`)**:
  - `waveforge repo [path] [--network] [--rpc-url] [--offline] [--json] [--markdown] [--min-score]`: Repository readiness evaluation.
  - `waveforge issue <file|-> [--title] [--json] [--markdown] [--min-score]`: Issue markdown linter with stdin pipeline support.
  - `waveforge init-action [--force] [--ref]`: Generates GitHub Actions workflow `.github/workflows/waveforge.yml`.
