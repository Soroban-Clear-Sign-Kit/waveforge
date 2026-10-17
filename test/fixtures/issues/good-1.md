# Implement token streaming utility

## Description
This issue introduces a token streaming utility for handling continuous flow payment streams.
The utility will process time-based distributions and allow callers to calculate vested amounts
without requiring frequent on-chain transactions or blocking calculations in the consumer process.

## Requirements and context
- Parse token stream configuration from configuration file.
- Calculate vested allocations linearly based on start timestamp and duration.
- Support cancellation and claim events.

## Done when
- [ ] Token stream calculator passes all test cases in test/stream.test.ts
- [ ] Benchmarks verify zero allocations during active stream iterations
- [ ] Error handling covers negative durations and zero rate limits
- [ ] Documentation for stream calculation added to docs/stream.md

## Files to touch
- src/stream/index.ts
- test/stream.test.ts

## Suggested execution
1. Define interfaces and types in src/stream/index.ts.
2. Implement linear vesting calculations.
3. Add unit test coverage.

## Guidelines with Complexity
Complexity: Medium
