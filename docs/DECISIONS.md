# Decisions

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-10-15 | CLI + library here, Action in waveforge-action | The Action bundles the library; one owner per concern |
| 2026-10-15 | Network checks never fake a pass | Readiness reports must be trustworthy |
| 2026-10-15 | GitHub owner: Soroban-Clear-Sign-Kit | Verified from git remote origin URL |
| 2026-10-15 | Prior art search: no conflicting tools | Searches for 'drips wave issue lint', 'stellar wave readiness', and 'soroban repo checklist' yielded no existing linter tools on npm or GitHub |
| 2026-10-15 | Package name: waveforge-stellar | 'waveforge' is taken on npm (v0.1.1 MCP task manager); 'waveforge-stellar' is free (404); bin name remains 'waveforge' |
| 2026-10-15 | Pinned TypeScript 5.8.3 | typescript-eslint 8.71.2 requires typescript <6.1.0 |
| 2026-10-16 | R7 skips fixtures directory when scanning root | Test fixtures in test/fixtures/ are mock repositories for testing, not workspace crates of waveforge itself |
| 2026-10-16 | R10 checks root .git directory before git ls-files | Prevents child fixtures from inheriting parent git repository index |
| 2026-10-17 | Mainnet requires explicit --rpc-url | Stellar mainnet has no default public unauthenticated RPC endpoint; requests must supply --rpc-url or skip |
| 2026-10-17 | R8 candidate discovery scope | Scans README.md and immediate *.md files in docs/ for \bC[A-Z2-7]{55}\b candidates |
| 2026-10-17 | Issue rules S1-S3 and F1 conditional activation | S1-S3 return 'skipped' when text has no Soroban references; F1 returns 'skipped' when text has no UI/component references |
| 2026-10-17 | Standard input support via '-' | 'waveforge issue -' reads from process.stdin to support shell pipeline integration |
| 2026-10-17 | Complexity points mapping | Maps 100 points to Trivial, 150 points to Medium, and 200 points to High |
| 2026-10-18 | Public API exact export boundary | src/index.ts exports only runRepoChecks, runIssueLint, score, formatText, formatMarkdown, formatJson, and types Status, CheckResult, Report, RepoOptions, IssueOptions; internals remain private |
| 2026-10-18 | init-action workflow structure | Writes single .github/workflows/waveforge.yml with two distinct jobs: waveforge-repo (on pull_request/workflow_dispatch, contents: read) and waveforge-issue (on issues [opened, edited], issues: write) |
| 2026-10-18 | init-action default ref | Read from package.json waveforge.actionRef (defaults to Soroban-Clear-Sign-Kit/waveforge-action@v1) |
| 2026-10-18 | Package distribution whitelist | package.json 'files' field restricted to dist, README.md, LICENSE; confirmed with npm pack --dry-run |
| 2026-10-18 | Pre-release isolated installation verification | Verified tarball installation and CLI/API execution in isolated external temp directory prior to release tagging |
| 2026-10-18 | Seed issues catalog and complexity distribution | Authored 9 seed issues from real repo gaps with 3 Trivial (100), 4 Medium (150), and 2 High (200), all scoring 100% on issue lint |
