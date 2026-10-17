# Add telemetry export helper

## Description
This issue introduces an opt-in telemetry exporter module to log non-sensitive performance metrics
for CLI command invocation runs. It records duration, memory usage, and command outcomes to assist
in identifying bottlenecks in local analysis steps without collecting user files or private tokens.

## Requirements and context
- Export structured performance summaries in JSON format.
- Support opt-out via environment variable.

## Next steps
- Implement telemetry logic in src/telemetry/index.ts

## Files to touch
- src/telemetry/index.ts

## Suggested execution
1. Create src/telemetry/index.ts.
2. Hook timing collector into CLI runner.

## Guidelines with Complexity
Complexity: Medium
