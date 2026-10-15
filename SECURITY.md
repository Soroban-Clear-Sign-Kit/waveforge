# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| 0.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of `waveforge` seriously. If you discover a security vulnerability, please report it privately:

- **GitHub Private Vulnerability Reporting**: Please submit a vulnerability report through GitHub's Security Advisories tab for this repository.
- **Direct Contact**: If GitHub advisories are unavailable, please contact the maintainers directly through private channels before disclosing publicly.

Please include:
- A description of the vulnerability and its potential impact.
- Steps to reproduce or a minimal proof of concept.
- Any suggested mitigations or patches.

We will acknowledge receipt within 48 hours and work on a verified resolution.

## Scope and Execution Boundaries

- **Read-Only Operations**: The `waveforge` CLI is strictly read-only. It reads local repository files and queries public Stellar RPC nodes (e.g., testnet or mainnet) to verify contract deployments. It never writes to, modifies, or deletes files outside its own designated output stream.
- **Secrets Safety**: `waveforge` never logs or displays full secret keys or seeds. Any detected Stellar private keys or seeds are masked (e.g., `SXXXX...last4`) to avoid accidental credential disclosure in reports, terminal outputs, or CI logs.
- **Offline Safety**: When executed with `--offline` or when network connectivity is unavailable, all network-dependent checks gracefully return `skipped` rather than failing or fabricating results.
