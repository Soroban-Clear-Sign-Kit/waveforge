# Contributing to waveforge

Thank you for your interest in contributing to `waveforge`! Please review the guidelines below before submitting changes.

## 1. What waveforge Does

waveforge is a TypeScript library and CLI that checks Soroban/Stellar repositories for Stellar Wave readiness, verifies README contract IDs on-chain, and lints issue Markdown. It delivers deterministic, offline-safe reporting to ensure smart contract repositories and issues meet community quality standards before entering a Wave.

## 2. Development Setup

Make sure your local environment meets the following prerequisites:
- **Node.js**: Node >= 20 (`.nvmrc` is pinned to 20)
- **pnpm**: pnpm 9 (`packageManager` pinned in `package.json`)

To install dependencies, build the distribution bundles, and run the test suite:

```bash
# Install dependencies
pnpm install

# Build library and CLI
pnpm build

# Run linting
pnpm lint

# Run type checking
pnpm typecheck

# Run test suite
pnpm test

# Run tests with code coverage
pnpm test:coverage
```

## 3. How to Add a Check

When implementing a new repository readiness check:
1. **Create one check file**: Add a single TypeScript file under `src/repo/` named after the check ID (for example, `src/repo/r11.ts`) and export it in `src/repo/index.ts`.
2. **Assign an ID**: Ensure the check has a unique ID, a clear title, a one-line diagnostic message, and a concrete fix.
3. **Add a fixture repo**: Add a minimal sample repository under `test/fixtures/repos/` illustrating passing and failing conditions.
4. **Write a table-driven test**: Add a table-driven unit test verifying the check across fixture inputs.
5. **Update documentation**: Add a row for the new check in the `README.md` readiness checks table.

## 4. Scope Boundaries

This repository owns all check logic, issue linting rules, report formatters, the CLI binary, and the programmatic library API. 

All GitHub Action implementations, action bundles, pull request comments, issue comments, and job summaries belong to [`waveforge-action`](https://github.com/Soroban-Clear-Sign-Kit/waveforge-action). Never add `@actions/*` packages or workflow action definitions here.

## 5. Branching and Pull Request Workflow

- **Branch naming**: Name feature branches as `issue-<number>-<short-name>` (for example, `issue-42-r11-ttl-check`).
- **One issue per PR**: Keep pull requests focused on a single issue or deliverable.
- **Closing keyword**: Include `Closes #n` in the pull request description so the related issue closes automatically upon merge.

## 6. Stellar Wave

This repository takes part in the Stellar Wave program on Drips.

- **Issue Creation & Tagging**: Maintainers add issues in the Drips Wave app, and the Drips Wave bot automatically labels them `Stellar Wave`.
- **Applying to Issues**: During an active Wave (usually one week each month), contributors sign in at [drips.network/wave](https://drips.network/wave) with GitHub and apply to an issue. The maintainer reviews applications and assigns one applicant per issue.
- **Point System**: Merged work earns points based on assigned complexity:
  - **Trivial**: 100 points
  - **Medium**: 150 points
  - **High**: 200 points
- **Reward Distribution**: Rewards are shared proportionally by points after the Wave concludes.
- **Documentation**: For more details on the program rules, visit the [Drips Wave Documentation](https://docs.drips.network/wave).

## 7. Check Rules

All checks and rules implemented in `waveforge` must adhere to the core principles from `AGENTS.md`:
- **Complete metadata**: Every check and rule has an id, a title, a one-line message, and a fix.
- **Deterministic and offline-safe**: Network checks must return `"skipped"` (never fake a `"pass"`) when `--offline` is set or when network queries fail.
- **Secrets safety**: Never print or disclose a full secret; mask any secret key as `SXXXX...last4`.
