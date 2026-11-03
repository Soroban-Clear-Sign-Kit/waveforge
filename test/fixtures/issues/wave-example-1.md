# Implement Soroban Liquidity Pool Swap Event Streamer

## Description
This issue introduces an event subscription and streaming utility for Soroban liquidity pools.
The streamer monitors decentralized exchange contract events on the Stellar network, parses raw
topics and data payloads into typed swap event objects, and emits them to registered websocket subscribers.
This service ensures downstream trading desks and indexing pipelines receive low-latency swap telemetry.

## Requirements and context
- Connect to Stellar RPC endpoint and stream Soroban event logs filtered by contract ID.
- Deserialize XDR contract events into strongly-typed `SwapExecutedEvent` representations.
- Track transaction ledger sequence numbers to resume streaming seamlessly after network reconnects.
- Guard against duplicate event processing using an in-memory sliding window cache.

## State Authorization
- Contract invocation and event emitters are verified against `require_auth` specifications.
- Administrator actions for event filter reconfigurations require authentication.

## Done when
- [ ] Event streamer implemented in `src/events/streamer.ts`
- [ ] Soroban contract events parsed and verified against mock XDR streams in `test/events.test.ts`
- [ ] Contract event fixtures tested against `contracts/pool/src/lib.rs` with `cargo test`
- [ ] Verification includes `stellar contract build` and Wasm size check passes
- [ ] Reconnection backoff logic tested with synthetic network disconnects

## Files to touch
- src/events/streamer.ts
- src/events/types.ts
- test/events.test.ts
- contracts/pool/src/lib.rs

## Suggested execution
1. Define event data types and interfaces in `src/events/types.ts`.
2. Implement RPC event polling and XDR deserialization in `src/events/streamer.ts`.
3. Add contract test fixtures in `contracts/pool/src/lib.rs` and verify with `cargo test`.
4. Run `stellar contract build` to verify contract compatibility and Wasm size.
5. Write integration tests in `test/events.test.ts` verifying event streaming and reconnection.

## Guidelines with Complexity
Complexity: High
