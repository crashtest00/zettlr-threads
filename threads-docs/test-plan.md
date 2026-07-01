# Zettlr Threads User Test Plan

This document defines the user-testing workflow for every Zettlr Threads
development phase. A phase is not **Done** until its user-test checklist has
been run and the user has explicitly approved the result.

## Definition of an Iteration

A test iteration is one user-testing cycle performed against one identifiable
build. It begins when testing starts on that build and ends when the findings
and approval decision are recorded. Any number of findings may belong to one
iteration, and fixes may be batched. Code changes made after testing begins are
evaluated in a subsequent iteration; an iteration does not require one commit
per finding.

## Test Artifacts

Local test artifacts use this directory structure:

```text
threads-docs/
└── tests/
    └── <feature>/
        └── phase-<number>/
            ├── test.md
            └── <feature>.test.<iteration>.md
```

Each phase directory is created when that phase's test cycle begins. It
contains `test.md`, the reusable Markdown fixture the test user opens and
annotates, and one immutable result document per test iteration. The tracked
feature `plan.md` contains the phase-specific user-test checkboxes.

For example, the first result for `4.6.0-threads.2` is
`4.6.0-threads.2.test.1.md`. Iteration numbers are positive integers and must
not be reused or overwritten within a phase.

The entire `threads-docs/tests/` tree is ignored by Git. Its fixtures and
results are disposable local working artifacts and will not be available in a
fresh clone. The tracked feature plan and this document are the durable process
definition.

## Before a Test

1. Confirm the phase implementation and relevant automated checks are ready.
2. Confirm `test.md` contains only its clean, reusable fixture content. If it
   contains artifacts from an earlier run, preserve those findings in that
   run's result document before resetting it.
3. Reset the applicable user-test checkboxes in `plan.md` to unchecked.
   Do not reset phase status, implementation tasks, or historical result files.
4. Record the build identifier or commit, platform, operating system, and
   tester in a new result document.
5. Launch the development instance and tell the user which phase checklist to
   run.

## During a Test

1. The test user works through the applicable checkboxes in `plan.md` using
   `test.md`.
2. The user checks an item only after observing the expected behavior.
3. The user records defects, ambiguity, and other findings as Zettlr Threads
   comments in `test.md`, anchored as closely as possible to the relevant
   fixture.
4. Failed or blocked checks remain unchecked. A finding should include the
   action taken, expected behavior, actual behavior, and whether it reproduces.
5. Preserve unexpected document content until the result has been recorded;
   it may be useful diagnostic evidence.

## After a Test

1. Before interpreting Threads comments, the test review agent must read
   [`resources/claude/CLAUDE.md`](../resources/claude/CLAUDE.md) in full for
   the current comment and storage protocol.
2. Review every comment left by the test user in `test.md`, including resolved
   comments.
3. Complete the iteration's result document. Summarize:
   - the phase, build, environment, and tester;
   - passed, failed, and blocked checklist items;
   - each finding recorded in `test.md`;
   - reproduction steps and relevant evidence;
   - the disposition of each finding; and
   - the user's approval decision.
4. Record the result document's local path in the tested phase's handoff notes.
   Because test artifacts are ignored by Git, do not add a durable plan link
   that will be broken in a fresh clone.
5. Reset `test.md` to its pristine fixture content. This intentionally removes
   all test-created markers, thread blocks, edits, and comments. This reset is
   destructive and is accepted as part of the process, but it must happen only
   after the findings are captured in the result document.
6. Reset the applicable user-test checkboxes in `plan.md` to unchecked so the
   plan is ready for the next iteration. The result document is the durable
   local test record.
7. Keep the phase open when a check fails, is blocked, or the user has not
   explicitly approved it. Correct the issue and begin a new numbered
   iteration.

## Result Document Template

```md
# <feature> Test <iteration>

- Phase:
- Build/commit:
- Date:
- Tester:
- Platform and OS:
- Result: Passed | Failed | Blocked
- User approval: Approved | Not approved | Pending
- Implementation guidance: `threads-docs/implementation-guidance.md` — required
  for all revisions arising from this test

## Checklist Results

- Passed:
- Failed:
- Blocked:

## Findings

### Finding 1 — <short title>

- Fixture/location:
- Steps:
- Expected:
- Actual:
- Reproduces:
- Evidence:
- Disposition: Include the planned revision or follow-up and confirm that it
  complies with `threads-docs/implementation-guidance.md`.

## Notes
```

## Process Rules

- A checkbox is a disposable execution aid, not test history.
- A result document is immutable test history. Corrections should be noted in
  a later iteration rather than rewriting an earlier result.
- Automated checks complement user testing; they do not replace it.
- Test one identifiable build per iteration. If the code changes, start a new
  iteration.
- Never reset `test.md` before its findings have been captured.
