# Development Plan

## Release

Target patch: `4.6.0-threads.2.1`

## Builder Agent Preamble

Before changing code, every builder must read and follow:

1. [../implementation-guidance.md](../implementation-guidance.md);
2. [../test-plan.md](../test-plan.md);
3. [prd.md](prd.md), this plan, and [plan-review.md](plan-review.md);
4. [the 4.6.0-threads.2 PRD](../4.6.0-threads.2/prd.md);
5. [the 4.6.0-threads.2 plan](../4.6.0-threads.2/plan.md);
6. [the 4.6.0-threads.2 plan review](../4.6.0-threads.2/plan-review.md); and
7. [`resources/claude/CLAUDE.md`](../../resources/claude/CLAUDE.md).

The builder owns implementation through focused checks, a running development
instance, recorded user testing, and explicit user approval.

## Phase 1 — Preserve the Promoted Marker

**Status:** Done

### Tasks

- Distinguish selection of the promoted draft from selection of another
  existing thread.
- Skip provisional-marker cleanup when the selected thread has the draft's ID.
- Add focused regression coverage for matching ID, different ID, and different
  document cases.
- Run focused tests, type checking, linting, and `git diff --check`.
- Launch the development instance for user verification.

### Done when

- [ ] **Create thread** leaves one matching marker/block pair in raw source.
- [ ] Ctrl+S persists the complete pair with autosave disabled.
- [ ] Selecting a different existing thread still abandons the draft.
- [ ] Required automated checks pass.
- [ ] The user explicitly approves the running workflow.

### Handoff notes

- Automated checks passed: 404 tests and `vue-tsc --noEmit`.
- Focused lint completed with no errors; only pre-existing warnings were
  reported.
- User test result:
  `threads-docs/tests/4.6.0-threads.2.1/phase-1/4.6.0-threads.2.1.test.1.md`
  (local ignored artifact).
- The user approved the running workflow on 2026-07-01.
