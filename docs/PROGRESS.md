# Progress log

## 2026-10-15 - Step 00
- **What was built**: Initialized agent rules and log files (`AGENTS.md`, `VERSIONS.md`, `docs/DECISIONS.md`, `docs/PROGRESS.md`, `docs/UPSTREAM-REQUESTS.md`). Verified git remote origin and main branch.
- **Commands run with results**:
  - `git remote -v`: `origin https://github.com/Soroban-Clear-Sign-Kit/waveforge.git` (pass)
  - `git branch --show-current`: `main` (pass)
- **Open issues**: None.

## 2026-10-15 - Step 01
- **What was built**:
  - Investigated npm and GitHub for prior art ("drips wave issue lint", "stellar wave readiness", "soroban repo checklist"); none found.
  - Determined package name `waveforge-stellar` (`waveforge` taken on npm v0.1.1; `waveforge-stellar` free) with bin `waveforge`.
  - Configured `package.json` (`"type": "module"`, `node >=20`, `pnpm@9.15.9`, version `0.0.0`, bin, exports, files, pinned dependencies and devDependencies).
  - Configured `tsconfig.json` (`strict`, `noUncheckedIndexedAccess`), `tsup.config.ts` (ESM + dts for library, ESM + shebang banner for CLI), `vitest.config.ts`, and `eslint.config.js`.
  - Added project structure: `src/report.ts`, `src/repo/` (`index.ts` + `r1.ts` through `r10.ts`), `src/issue/` (`index.ts`, `rules.ts`), `src/util/fs.ts`, `test/fixtures/repos/`, `test/fixtures/issues/`, `.gitignore`, `.nvmrc`, `LICENSE`, `README.md`.
  - Added unit tests in `test/index.test.ts`.
- **Commands run with results**:
  - `pnpm install`: succeeded (pnpm v9.15.9, 215 packages)
  - `pnpm build`: succeeded (ESM bundle + types generated in `dist/`)
  - `pnpm lint`: succeeded (0 errors, 0 warnings)
  - `pnpm typecheck`: succeeded (0 errors)
  - `pnpm test`: succeeded (4 tests passed)
- **Open issues**: None.

## 2026-10-15 - Roadmap Alignment and Documentation Expansion
- **What was built**:
  - Aligned repository documentation with the WaveForge roadmap.
  - Expanded `README.md` incrementally into a comprehensive guide:
    - Overview, badges, and project metadata.
    - Ecosystem boundaries and repository scope comparison (`waveforge` vs `waveforge-action`).
    - Multi-manager installation instructions (`pnpm`, `npm`, `yarn`, global, `npx`/`pnpm dlx`).
    - CLI Command Reference (`repo`, `issue`, `init-action`) and flags (`--offline`).
    - Programmatic TypeScript Library API usage examples.
    - Detailed reference tables for Repository Readiness Checks (R1–R10) with validation goals and fixes.
    - Detailed reference tables for Issue Linting Rules (I1–I7, S1–S3, F1) covering standard markdown, smart contract architecture, and frontmatter.
    - Full WaveForge Roadmap across milestones (`v0.1.0` Foundation, `v0.2.0` More Checks, `v0.3.0` Integrations, `v1.0.0` Stable).
    - Explicit out-of-scope declarations and contributing/maintenance guidelines.
  - Pushed all updates incrementally commit-by-commit to maintain a granular git history.
- **Commands run with results**:
  - `git commit` & `git push` for each documentation increment (all passed).
- **Open issues**: None.

## 2026-10-15 - Step 02
- **What was built**:
  - Created `.github/workflows/ci.yml` triggered on `pull_request` and `push` to `main`, matrix testing across Node 20 and 22.
  - Configured pipeline steps: `actions/checkout@v4` -> `pnpm/action-setup@v4` -> `actions/setup-node@v4` (cache pnpm) -> `pnpm install --frozen-lockfile` -> `pnpm lint` -> `pnpm typecheck` -> `pnpm build` -> `pnpm test:coverage`.
  - Parsed and validated the YAML syntax with `yaml` package and added automated unit tests in `test/ci.test.ts`.
- **Commands run with results**:
  - YAML parse script: succeeded (valid syntax and schema)
  - `pnpm lint`: succeeded (0 errors, 0 warnings)
  - `pnpm typecheck`: succeeded (0 errors)
  - `pnpm test`: succeeded (5 tests passed across 2 suites)
  - `pnpm test:coverage`: succeeded (100% statements, 100% funcs, 100% lines)
- **Open issues**: None.

## 2026-10-15 - Step 03
- **What was built**:
  - Updated `LICENSE` to Apache-2.0 with copyright "Copyright 2026 John Imeobong Abasiediedu", and updated `package.json` license field to `"Apache-2.0"`.
  - Created `SECURITY.md` detailing private vulnerability reporting, scope boundaries (read-only queries and Stellar RPC calls, never writes outside output), secret masking (`SXXXX...last4`), and offline safety.
  - Created `CONTRIBUTING.md` containing all required sections in order:
    a. Two-sentence summary of what waveforge does.
    b. Setup instructions (Node 20, pnpm 9, install, build, test).
    c. How to add a check (one file under `src/repo/`, id, fixture under `test/fixtures/repos/`, table-driven test, README row).
    d. Scope boundary (`waveforge-action` ownership for GitHub Actions).
    e. Branch and PR conventions (`issue-<number>-<short-name>`, one issue per PR, `Closes #n`).
    f. Stellar Wave program guidelines (Drips Wave app, "Stellar Wave" label, applicant assignment, point complexity: Trivial 100, Medium 150, High 200, rewards shared after Wave, link https://docs.drips.network/wave without dollar amounts, wallets, or /claim commands).
    g. Check rules restated from AGENTS.md.
  - Updated `README.md` to stub "# WaveForge", one line description, and documentation links.
  - Verified build, lint, typecheck, and tests, then committed and pushed each document one after the other.
- **Commands run with results**:
  - `pnpm build`: succeeded
  - `pnpm lint`: succeeded (0 errors, 0 warnings)
  - `pnpm typecheck`: succeeded (0 errors)
  - `pnpm test`: succeeded (5 tests passed across 2 suites)
- **Open issues**: None.

## 2026-10-15 - Step 04
- **What was built**:
  - Created `.github/ISSUE_TEMPLATE/config.yml` with `blank_issues_enabled: false`.
  - Created `.github/ISSUE_TEMPLATE/bug.yml` with valid GitHub issue-form schema (what happened, expected behaviour, steps to reproduce, version; label `bug`).
  - Created `.github/ISSUE_TEMPLATE/feature.yml` with valid GitHub issue-form schema (problem, proposed solution, required "Done when" checklist, files to touch; label `enhancement`).
  - Created `.github/ISSUE_TEMPLATE/spike.yml` with valid GitHub issue-form schema (question to answer, what to investigate, expected output; label `spike`).
  - Created `.github/ISSUE_TEMPLATE/new-check.yml` with valid GitHub issue-form schema (check id proposal, what it detects, why it matters for Wave contributors, passing and failing examples, "Done when" checklist; label `new-check`).
  - Created `.github/pull_request_template.md` with "Closes #", summary, test evidence, and checklist (tests added, lint clean, typecheck clean, docs updated).
  - Added automated unit tests in `test/templates.test.ts` parsing every YAML issue form and verifying structure.
  - Committed and pushed each template and test file incrementally one after the other.
- **Commands run with results**:
  - YAML parse checks: all templates parsed cleanly
  - `pnpm lint`: passed (0 errors, 0 warnings)
  - `pnpm typecheck`: passed (0 errors)
  - `pnpm test`: passed (11 tests passed across 3 suites)
  - Incremental `git commit` and `git push` runs: all succeeded
- **Open issues**: None.

## 2026-10-15 - Step 05
- **What was built**:
  - Defined report model and types in `src/report.ts` (`Status`, `CheckResult`, `Report`).
  - Implemented `score(results)` calculating percentage (pass: 1, warn: 0.5, fail: 0, skipped: excluded, rounded percentage, empty/all-skipped: 0).
  - Implemented formatters: `formatText` (aligned lines with PASS/WARN/FAIL/SKIP words, no emoji, fix hints), `formatMarkdown` (heading, score, table of non-pass results with fixes), and `formatJson`.
  - Updated `src/repo/index.ts` and `src/issue/index.ts` to construct and return the new `Report` shape.
  - Implemented CLI shell in `src/cli.ts` using `node:util` `parseArgs` (`repo`, `issue`, `init-action`, `--help`, `--version`, `--format`, `--min-score`, `--offline`) with exit codes: 0 (no fail and score >= min-score), 1 (any fail or below min-score), 2 (usage error or I/O error).
  - Added unit and snapshot tests in `test/report.test.ts` for scoring and formatters.
  - Added integration tests in `test/cli.test.ts` spawning `node dist/cli.js` across all commands and exit codes.
  - Committed and pushed all changes incrementally one after the other.
- **Commands run with results**:
  - `pnpm build`: passed (compiled `dist/index.js`, `dist/cli.js`, `dist/index.d.ts`)
  - `pnpm lint`: passed (0 errors, 0 warnings)
  - `pnpm typecheck`: passed (0 errors)
  - `pnpm test`: passed (36 tests passed across 5 test suites)
  - Incremental `git commit` and `git push` runs: all succeeded
- **Open issues**: None.

## 2026-10-15: Step 06 - Repo checks R1 to R6
- **What was built**:
  - Implemented pure async repository readiness checks under `src/repo/`:
    - `R1` (license): recognizes Apache-2.0, MIT, BSD-2/3, MPL-2.0, GPL-3.0, LGPL in `LICENSE`, `LICENSE.md`, or `COPYING`. Fails if missing, warns if unrecognized.
    - `R2` (readme): checks `README.md` presence (fail if missing), first 600 characters mention Stellar or Soroban (fail if missing), install/quickstart/getting started heading (warn if missing), placeholders `LIVE_DEMO_URL`, `LIVE_APP_URL`, `LIVE_API_URL`, `DEMO_VIDEO_URL`, `TODO`, `TBD`, and `lorem ipsum` (warn and list lines).
    - `R3` (contributing): checks `CONTRIBUTING.md` presence (fail if missing), setup and test sections (warn if missing), mentions "Stellar Wave" (warn if missing), bans dollar amounts, `/claim`, or `paid on merge` (fail and list lines in evidence).
    - `R4` (security): checks `SECURITY.md` exists (warn if missing).
    - `R5` (templates): checks at least one YAML issue form in `.github/ISSUE_TEMPLATE` (warn if missing) and `config.yml` with `blank_issues_enabled: false` (warn if missing), parsed with `yaml`.
    - `R6` (ci): checks `.github/workflows/*.yml` triggered on `pull_request` with a run step containing `test` (fail if none found).
  - Created test fixtures under `test/fixtures/repos/`: `good`, `missing-everything`, `bad-contributing`, and `placeholders`.
  - Added table-driven tests for R1-R6 in `test/repo-checks.test.ts` plus integration tests across fixtures.
  - Wired R1-R6 into `runRepoChecks` in `src/repo/index.ts`.
- **Commands run with results**:
  - `pnpm build`: passed (TSUP built `dist/index.js`, `dist/cli.js`, and TypeScript declaration files)
  - `pnpm lint`: passed (ESLint clean across repository)
  - `pnpm typecheck`: passed (`tsc --noEmit` clean)
  - `pnpm test`: passed (53 tests passed across 6 test suites)
  - `pnpm test:coverage`: passed with 88.61% lines coverage
  - Incremental `git commit` and `git push`: all commits pushed one after the other
- **Open issues**: None.

## 2026-10-16 - Step 07: Soroban checks R7, R9, R10
- **What was built**:
  - Implemented `R7` (soroban):
    - Recursively discovers `Cargo.toml` files (skipping `target`, `node_modules`, `.git`, `dist`, `fixtures`).
    - Parses with `smol-toml` and detects `soroban-sdk` across dependency tables (`dependencies`, `dev-dependencies`, `build-dependencies`, `workspace.dependencies`, `target.*.dependencies`).
    - Returns `skipped` ("No Soroban crates found.") if no Soroban crates detected.
    - If detected, evidence lists crates and versions; fails if no CI workflow runs `cargo test`; warns if none runs `clippy`; warns if none runs `stellar contract build` / `soroban contract build`; warns if no contract crate has `#[cfg(test)]` or a `test.rs`.
  - Implemented `R9` (wasm-target):
    - Scans `README`, `docs/`, `scripts/`, `.github/`, and `Makefiles` for deprecated `wasm32-unknown-unknown` target.
    - Warns with `file:line` evidence and fix hint pointing to `wasm32v1-none` (current Stellar CLI target).
  - Implemented `R10` (secrets):
    - Scans tracked files (`git ls-files` when root is a git repository, else directory walk skipping `node_modules`, `target`, `.git`, `dist`).
    - Validates potential secret keys with `StrKey.isValidEd25519SecretSeed` from `@stellar/stellar-sdk`.
    - Detects committed `.env` files other than `.env.example`.
    - Masks all detected secret seeds as `SXXXX...last4` and guarantees full raw seeds never appear in output or formatters.
  - Added test fixtures under `test/fixtures/repos/`:
    - `soroban-good`: contract crate with `Cargo.toml`, `#[cfg(test)]`, and CI running `cargo test`, `clippy`, `stellar contract build`.
    - `soroban-no-ci`: contract crate with `Cargo.toml` but no CI workflow.
    - `old-target`: files containing `wasm32-unknown-unknown` in `README.md`, `Makefile`, `scripts/build.sh`, and `docs/build.md`.
    - `leaked-seed`: dynamically generates random seeds at test setup with `Keypair.random()` without committing real secrets.
  - Added unit, integration, and regression test suites in `test/repo-checks.test.ts` (65 tests total passing).
  - Incremental commits pushed commit-by-commit to origin `main`.
- **Commands run with results**:
  - `pnpm build`: passed (TSUP compiled `dist/index.js`, `dist/cli.js`, and `dist/index.d.ts`)
  - `pnpm lint`: passed (0 errors, 0 warnings across codebase)
  - `pnpm typecheck`: passed (`tsc --noEmit` clean)
  - `pnpm test`: passed (65 tests passed across 6 test suites)
  - `pnpm test:coverage`: passed (89.23% lines, 86.72% statements)
  - Incremental `git commit` & `git push` runs: all succeeded
- **Open issues**: None.

## 2026-10-17 - Step 08: On-chain check R8 and the repo command
- **What was built**:
  - Implemented `R8` (contract-ids):
    - Discovers contract ID candidates matching `\bC[A-Z2-7]{55}\b` across `README.md` and `docs/*.md`.
    - Validates candidates with `StrKey.isValidContract`; invalid StrKey candidates produce `warn`.
    - Supports `--network` (`testnet` default, using `https://soroban-testnet.stellar.org`; `mainnet` requiring explicit `--rpc-url`).
    - Builds contract instance ledger key (`xdr.LedgerKey.contractData` with `xdr.LedgerKeyContractData`, `contract`, `xdr.ScVal.scvLedgerKeyContractInstance()`, and `xdr.ContractDataDurability.persistent`).
    - Calls `getLedgerEntries` in a single batch with a 10s timeout.
    - Evaluates each contract ID: live exists (evidence: Wasm hash hex or "Stellar Asset Contract"), not found (`fail`), archived (`warn`).
    - Offline-safe: `--offline` or RPC failure returns `skipped` with reason.
    - No IDs: returns `warn` when R7 detects Soroban crates, otherwise `skipped`.
    - Accepts an injected RPC-like object (`rpc?: RpcClientLike`) for deterministic unit testing.
  - Wired R1-R10 and new options into `runRepoChecks(root, options)` and CLI command `waveforge repo [path] [--network] [--rpc-url] [--offline] [--json] [--markdown] [--min-score]`.
  - Added unit test suite in `test/r8.test.ts` with a fake RPC built from real XDR using SDK structures (`xdr.ScContractInstance`, `xdr.ContractExecutable`, `xdr.ContractDataEntry`, `xdr.LedgerEntryData`, `xdr.LedgerKey`).
  - Added one integration test skipped unless `RUN_INTEGRATION=1` checking `TESTNET_CONTRACT_ID` from environment.
  - Added CLI test cases covering `--network`, `--offline`, `--json`, and `--markdown`.
- **Commands run with results**:
  - `pnpm build`: passed (TSUP built `dist/index.js`, `dist/cli.js`, and `dist/index.d.ts`)
  - `pnpm lint`: passed (0 errors, 0 warnings across codebase)
  - `pnpm typecheck`: passed (`tsc --noEmit` clean with 0 errors)
  - `pnpm test`: passed (79 tests passed, 1 skipped across 7 test suites)
  - `pnpm test:coverage`: passed (89.08% lines, 86.78% statements)
- **Open issues**: None.

## 2026-10-17 - Step 09: Issue linter
- **What was built**:
  - Implemented issue rules I1–I7, Soroban rules S1–S3, and frontend rule F1 in `src/issue/rules.ts`:
    - `I1` (context): fails if missing Description, Context or Background section, or opening paragraph is under 30 words.
    - `I2` (requirements): warns if missing bulleted/numbered list under Requirements or "Requirements and context".
    - `I3` (acceptance): fails if missing "Done when" or "Acceptance criteria" heading with at least 2 `- [ ]` checklist items.
    - `I4` (files): warns if no file path (with `/` and extension or trailing `/`) and no "Files to touch" heading.
    - `I5` (execution): warns if missing "Suggested execution" section or numbered steps.
    - `I6` (complexity): warns if missing stated complexity or if stated complexity differs from suggested complexity.
    - `I7` (scope): warns if >= 15 checklist items or >= 1,200 words.
    - `S1-S3` (Soroban rules): conditional when text mentions `.rs`, `contracts/`, `soroban`, `require_auth` or `"smart contract"`:
      - `S1`: fails if it does not specify who must authorize state changes (e.g. `require_auth`).
      - `S2`: fails if contract tests are not required.
      - `S3`: warns if `stellar contract build` or Wasm size check is missing.
      - Skipped when non-Soroban.
    - `F1` (Frontend rule): conditional when text mentions `.tsx`, `UI`, `page`, or `component`:
      - `F1`: warns if screenshots or a screen recording are not requested.
      - Skipped when non-UI.
    - Calculated `suggestedComplexity` (High if > 8 items or mentions integration, architecture, refactor, contract storage; Trivial if <= 3 items and mentions typo, docs, copy, readme; else Medium), stored in `report.meta.suggestedComplexity`.
  - Implemented `runIssueLint(markdown, options)` and `lintIssueMarkdown(filePath, content, options)` in `src/issue/index.ts`.
  - Updated CLI command `waveforge issue <file|-> [--title] [--json] [--markdown] [--min-score]` with stdin (`-`) support and `--title` override in `src/cli.ts`.
  - Added fixtures under `test/fixtures/issues/`: 3 good issues (`good-1.md`, `good-2.md`, `good-3.md`) and 5 bad issues (`bad-1` to `bad-5`).
  - Added test suite `test/issue.test.ts` (31 tests) and updated `test/cli.test.ts` and `test/index.test.ts` (113 passed tests across 8 test files).
- **Commands run with results**:
  - `pnpm build`: passed (TSUP compiled `dist/index.js`, `dist/cli.js`, and `dist/index.d.ts`)
  - `pnpm lint`: passed (0 errors, 0 warnings across codebase)
  - `pnpm typecheck`: passed (`tsc --noEmit` clean with 0 errors)
  - `pnpm test`: passed (113 passed, 1 skipped across 8 test suites)
  - `pnpm test:coverage`: passed (90.15% lines, 87.97% statements, 95.03% lines in `src/issue`)
- **Open issues**: None.








