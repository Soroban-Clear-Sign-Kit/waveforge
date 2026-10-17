# Upgrade liquidity pool storage schema

## Description
This issue updates the Soroban liquidity pool contract storage layout to support dynamic fee tiers.
The modification touches contracts/pool/src/lib.rs and restructures internal key storage buckets
for reserves and LP token balances across the protocol.

## Requirements and context
- Update reserve storage structs to include fee multiplier.
- Migrate existing pool accounts without downtime.

## Done when
- [ ] New storage types compiled in contracts/pool/src/lib.rs
- [ ] Migration script verified against testnet

## Files to touch
- contracts/pool/src/lib.rs

## Suggested execution
1. Edit storage definitions in contracts/pool/src/lib.rs.
2. Deploy migration contract.

## Guidelines with Complexity
Complexity: High
