# Add staking pool reward distribution contract

## Description
Implements a staking pool smart contract on Soroban that tracks user stakes and distributes
proportional yield rewards across epochs. The contract must protect protocol invariants, prevent
re-entrancy, and maintain ledger footprint limits for persistent state entries across ledger bumps.

## Requirements and context
- Maintain ledger footprint and persistent storage for pool metrics.
- Support deposits, reward accrual, and principal withdrawals.
- Guard against overflow and unauthorized state manipulation.

## State Authorization
- Depositors and withdrawers must authorize their respective operations via require_auth.
- Pool administrator must authorize reward allocation changes via require_auth.

## Done when
- [ ] Contract implemented in contracts/staking/src/lib.rs
- [ ] Unit tests running under cargo test verify proportional reward math
- [ ] Build succeeds with stellar contract build and Wasm size check passes

## Files to touch
- contracts/staking/src/lib.rs
- contracts/staking/Cargo.toml

## Suggested execution
1. Initialize contract architecture in contracts/staking/.
2. Implement pool deposit, harvest, and withdraw routines with require_auth.
3. Write unit tests in contracts/staking/src/test.rs and execute cargo test.
4. Verify Wasm size using stellar contract build.

## Guidelines with Complexity
Complexity: High
