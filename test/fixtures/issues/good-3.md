# Build transaction status drawer component

## Description
This task creates a slide-over transaction status drawer UI component to give users real-time
feedback during multi-step contract invocation sequences. It handles wallet signature prompts,
submission states, and final confirmation receipts with error boundaries and smooth transitions.

## Requirements and context
- Component renders transaction state (Pending, Signing, Submitted, Finalized).
- Accessible via keyboard navigation (Esc to dismiss).
- Displays block explorer deep-links for confirmed transactions.

## Done when
- [ ] Status drawer implemented in src/components/Drawer.tsx
- [ ] Pull request includes screenshots and a screen recording demonstrating state transitions

## Files to touch
- src/components/Drawer.tsx
- src/components/Drawer.test.tsx

## Suggested execution
1. Create Drawer.tsx in src/components/ directory.
2. Hook into transaction dispatcher state.
3. Add interaction tests and record screen recording showing all visual states.

## Guidelines with Complexity
Complexity: Medium
