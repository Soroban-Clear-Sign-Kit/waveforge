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

