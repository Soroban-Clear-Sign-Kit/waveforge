# WaveForge Seed Issues

This document catalogs seed issues identified from real architectural gaps and feature extensions in the `waveforge` repository. Every issue has been authored in accordance with the WaveForge issue guidelines and validated with `node dist/cli.js issue`.

## Seed Issue Summary

| # | Title | Complexity | Points | Lint Score | Labels | File |
|---|---|---|---|---|---|---|
| 01 | Add issue-rule fixtures for real Stellar Wave community issues | Trivial | 100 | 100% | `stellar-wave`, `documentation`, `good-first-issue` | [docs/seed-issues/01.md](file:///c:/Users/ADMIN/OneDrive/Documents/Drips/waveforge/docs/seed-issues/01.md) |
| 02 | Standardize diagnostic fix message copy across repository checks | Trivial | 100 | 100% | `stellar-wave`, `documentation`, `good-first-issue` | [docs/seed-issues/02.md](file:///c:/Users/ADMIN/OneDrive/Documents/Drips/waveforge/docs/seed-issues/02.md) |
| 03 | Expand README documentation with CLI exit code examples and edge cases | Trivial | 100 | 100% | `stellar-wave`, `documentation`, `good-first-issue` | [docs/seed-issues/03.md](file:///c:/Users/ADMIN/OneDrive/Documents/Drips/waveforge/docs/seed-issues/03.md) |
| 04 | Implement check R13 for automated testnet deployment scripts | Medium | 150 | 100% | `stellar-wave`, `enhancement` | [docs/seed-issues/04.md](file:///c:/Users/ADMIN/OneDrive/Documents/Drips/waveforge/docs/seed-issues/04.md) |
| 05 | Add SARIF output format support for GitHub code scanning | Medium | 150 | 100% | `stellar-wave`, `enhancement` | [docs/seed-issues/05.md](file:///c:/Users/ADMIN/OneDrive/Documents/Drips/waveforge/docs/seed-issues/05.md) |
| 06 | Spike check R12 for state-changing authorization analysis | Medium | 150 | 100% | `stellar-wave`, `spike` | [docs/seed-issues/06.md](file:///c:/Users/ADMIN/OneDrive/Documents/Drips/waveforge/docs/seed-issues/06.md) |
| 07 | Add template scaffolding with --fix mode for missing community files | Medium | 150 | 100% | `stellar-wave`, `enhancement` | [docs/seed-issues/07.md](file:///c:/Users/ADMIN/OneDrive/Documents/Drips/waveforge/docs/seed-issues/07.md) |
| 08 | Implement check R11 for Soroban contract instance TTL extension | High | 200 | 100% | `stellar-wave`, `enhancement`, `complex` | [docs/seed-issues/08.md](file:///c:/Users/ADMIN/OneDrive/Documents/Drips/waveforge/docs/seed-issues/08.md) |
| 09 | Support Go language repositories in repository CI verification | High | 200 | 100% | `stellar-wave`, `enhancement`, `complex` | [docs/seed-issues/09.md](file:///c:/Users/ADMIN/OneDrive/Documents/Drips/waveforge/docs/seed-issues/09.md) |

**Complexity Distribution**:
- Trivial: 3 (>= 3 required)
- Medium: 4 (>= 3 required)
- High: 2 (<= 3 required)
- Total: 9 issues (within 8 to 10 range)

## Issue Creation Commands

Run the following commands using the GitHub CLI (`gh`) to create these issues on the repository:

```bash
gh issue create --title "Add issue-rule fixtures for real Stellar Wave community issues" --body-file docs/seed-issues/01.md --label "stellar-wave,documentation,good-first-issue"
gh issue create --title "Standardize diagnostic fix message copy across repository checks" --body-file docs/seed-issues/02.md --label "stellar-wave,documentation,good-first-issue"
gh issue create --title "Expand README documentation with CLI exit code examples and edge cases" --body-file docs/seed-issues/03.md --label "stellar-wave,documentation,good-first-issue"
gh issue create --title "Implement check R13 for automated testnet deployment scripts" --body-file docs/seed-issues/04.md --label "stellar-wave,enhancement"
gh issue create --title "Add SARIF output format support for GitHub code scanning" --body-file docs/seed-issues/05.md --label "stellar-wave,enhancement"
gh issue create --title "Spike check R12 for state-changing authorization analysis" --body-file docs/seed-issues/06.md --label "stellar-wave,spike"
gh issue create --title "Add template scaffolding with --fix mode for missing community files" --body-file docs/seed-issues/07.md --label "stellar-wave,enhancement"
gh issue create --title "Implement check R11 for Soroban contract instance TTL extension" --body-file docs/seed-issues/08.md --label "stellar-wave,enhancement,complex"
gh issue create --title "Support Go language repositories in repository CI verification" --body-file docs/seed-issues/09.md --label "stellar-wave,enhancement,complex"
```
