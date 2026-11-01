---
title: Update Stellar Network Configuration Docs and RPC Endpoints
complexity: Trivial
category: documentation
points: 100
---

# Update Stellar Network Configuration Docs and RPC Endpoints

## Description
This task updates the developer documentation and configuration guides to include the latest
Public RPC endpoint URLs and Friendbot faucets for Stellar Testnet and Futurenet networks.
Ensuring accurate connection endpoints prevents developer onboarding friction and eliminates failed RPC queries.

## Requirements
- Update RPC endpoint URLs in documentation tables for Testnet and Futurenet.
- Provide example curl commands demonstrating successful `getHealth` RPC calls.
- Verify that deprecated Horizon URLs are replaced with current RPC specifications.

## Done when
- [ ] Updated network RPC endpoints and table in `docs/networks.md`
- [ ] Added valid `getHealth` JSON-RPC curl command snippets to docs
- [ ] Readme reference links verified and tested against active endpoints

## Files to touch
- docs/networks.md
- README.md

## Suggested execution
1. Verify active RPC URLs for Stellar Testnet and Futurenet.
2. Update configuration table and JSON examples in `docs/networks.md`.
3. Review `README.md` for broken or deprecated endpoint references.

## Complexity
Complexity: Trivial
