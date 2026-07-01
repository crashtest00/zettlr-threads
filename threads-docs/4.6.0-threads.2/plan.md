# Development Plan

## Release

Target prototype: `4.6.0-threads.2`

This plan implements the behavior in [prd.md](prd.md). All work must follow
[../implementation-guidance.md](../implementation-guidance.md). User testing
must follow [../test-plan.md](../test-plan.md) using the local fixture at
`../tests/4.6.0-threads.2/phase-<number>/test.md`.

Each phase is a sequential build-agent handoff. A phase must leave its focused
tests passing and its behavior usable before the next phase begins.

## Builder Agent Preamble

Before changing code, every builder agent must read and follow:

1. [../implementation-guidance.md](../implementation-guidance.md) in full;
2. [../test-plan.md](../test-plan.md) in full;
3. [prd.md](prd.md), this plan, and [plan-review.md](plan-review.md);
4. [`resources/claude/CLAUDE.md`](../../resources/claude/CLAUDE.md) before
   changing comment behavior.

These documents are part of the implementation contract, not optional
background. If a phase task conflicts with the implementation guidance, stop
and surface the conflict rather than silently choosing one.

Each builder owns the complete phase handoff:

- Change the phase status from **Pending** to **In progress** when work begins.
- Implement the phase, run its focused checks and the checks required by the
  implementation guidance, and report anything not run.
- Launch a development instance (`yarn start`, or the repository's equivalent
  current command) and leave it available for the user to test.
- Change the status to **Awaiting user approval** while the development
  instance is available.
- Ask the user to test the phase against its **Done when** criteria. A phase is
  not complete merely because its code and automated tests pass.
- Execute and record user testing exactly as required by
  [the user test plan](../test-plan.md), including preserving findings in a
  numbered result document and resetting the fixture and checkboxes afterward.
- Only after the user explicitly approves the phase, change its status to
  **Done**. If the user finds a problem, keep the phase open, correct it, rerun
  the relevant checks, and present the development instance again.

## Phase 1 — Marker Protocol and Atomic Creation

**Status:** Done

**Goal:** Create a complete marker-anchored thread from an unpersisted sidebar
draft in one undoable editor operation.

### Tasks

- Retain the existing **Insert comment thread** button and command names.
- Open the comments sidebar with an unpersisted draft whether or not text is
  selected.
- When the primary selection contains non-whitespace text, trim its boundary
  whitespace and prefix every line, including blank lines, with `> ` without
  changing the selected document text.
- Preserve internal Markdown and line breaks in an optional quote; start an
  empty draft when no text is selected.
- Focus where the user can type the comment, provide an explicit **Cancel**
  action, and discard unsubmitted drafts when switching documents or selecting
  an existing thread.
- Capture the cursor position or effective endpoint of the optional primary
  selection when the draft is opened.
- Add shared helpers for formatting and parsing
  `#zettlr-comment-<thread-id>` marker fragments.
- Extend the comment data model with marker positions while preserving the
  canonical HTML thread-block message format and block offsets used for
  replacement.
- Define open (`💬`) and resolved (`✓`) source labels and join valid markers
  and thread blocks by ID.
- On submission, determine the marker position as follows:
    - inside a Markdown link, emphasis, or inline code span, insert after the
      outermost enclosing inline construct;
    - inside a fenced or indented code block, insert immediately after the
      complete code block;
    - otherwise, insert at the captured creation position.
- Do not move a marker across a table-cell delimiter.
- Insert the open marker at the safe position and append the matching canonical
  thread block at the document end with safe blank-line separation.
- Dispatch marker and block changes in one CodeMirror transaction.
- Keep malformed and duplicate relationship handling out of this phase except
  where necessary to avoid crashes.
- Add focused tests for marker parsing, optional selection quoting, draft
  cancellation, safe insertion, document-end separation, and atomic
  creation/Undo/Redo.

### Done when

- [ ] A draft opens with selected text, quotes the trimmed selection without
  changing the selected prose, and accepts a comment.
- [ ] A draft opens empty without selected text.
- [ ] Canceling or abandoning either draft leaves no marker or thread block.
- [ ] Submitting creates one valid open marker and one matching thread block at
  the document end with safe blank-line separation.
- [ ] Creation inside emphasis, a link, inline code, fenced code, and indented
  code preserves the enclosing Markdown.
- [ ] Creation in table-cell text preserves the table and does not move the
  marker across a cell delimiter.
- [ ] One Undo removes both marker and block, and one Redo restores both.
- [ ] The test iteration is recorded and reset according to
  [the user test plan](../test-plan.md).

## Phase 2 — Marker UI and Thread Lifecycle

**Status:** Done

**Goal:** Replace the comment gutter with an interactive inline marker and keep
valid marker/block pairs synchronized through ordinary comment work.

### Tasks

- Remove the dedicated comment gutter, its permanent spacer, and obsolete
  line-based marker selection and relocation behavior.
- Extend existing Markdown link rendering only for valid Threads marker
  fragments.
- Render open markers with Clarity `chat-bubble` and resolved markers with
  Clarity `check`.
- Resolve clicks from the enclosing Markdown `Link` node so the hidden URL does
  not need to be clicked directly.
- Recognize comment fragments before the existing Ctrl/Cmd modifier guard.
- On a comment-marker mousedown, call `preventDefault()`, consume the CodeMirror
  event, and emit the existing `comment-thread-selected` flow.
- Leave editor selection and scroll position unchanged and preserve ordinary
  Markdown, wiki-link, tag, and fragment behavior.
- Keep replies and message edits targeted at the matching HTML thread block.
- Resolve a thread by updating `@status` and replacing `💬` with `✓` in one
  CodeMirror transaction; keep resolved markers interactive.
- Keep the existing delete action synchronized by removing a valid thread's
  marker and matching block together.
- Reparse and synchronize the active editor's sidebar state after document
  changes, Undo/Redo, saving and reopening, and external reloads.
- Update `resources/claude/CLAUDE.md` to the implemented marker and EOF-storage
  protocol in the same implementation change.
- Add focused tests for marker rendering and selection, ordinary-link
  regression behavior, reply and edit targeting, atomic resolution and
  deletion, and document reload synchronization.

### Done when

- [ ] Clicking an open or resolved marker opens the matching sidebar thread
  without navigating, scrolling, or moving the editor selection.
- [ ] Creating, replying, editing, resolving, and deleting preserve or remove
  the matching marker/block pair as appropriate.
- [ ] Resolving atomically updates the source marker, rendered icon, and thread
  status; Undo and Redo keep them synchronized.
- [ ] Saving and reopening, external refresh, and Undo/Redo re-synchronize the
  active editor and sidebar.
- [ ] Ordinary Markdown links, fragment links, wiki links, and tags retain
  their existing behavior.
- [ ] The comment gutter, permanent spacer, and line-based marker behavior are
  absent.
- [ ] The test iteration is recorded and reset according to
  [the user test plan](../test-plan.md).

### Phase 2 handoff notes

- Local user-test result:
  `threads-docs/tests/4.6.0-threads.2/phase-2/4.6.0-threads.2.test.1.md`
- Test 1 failed and user approval remains pending. The annotated evidence is
  preserved in `first_test.md`; it was not reset because the phase directory
  does not contain the required pristine `test.md`.
- Local user-test result:
  `threads-docs/tests/4.6.0-threads.2/phase-2/4.6.0-threads.2.test.2.md`
- Test 2 failed and user approval remains pending. Confirmed issues include
  table anchoring, adjacent-code preservation, table marker interaction, and
  comment-pane focus stealing.
- Local user-test result:
  `threads-docs/tests/4.6.0-threads.2/phase-2/4.6.0-threads.2.test.3.md`
- Test 3 failed and user approval remains pending. Table placement,
  adjacent-code preservation, and editor focus were confirmed fixed; delayed
  marker visibility and incorrect table icon rendering remain.
- Local user-test result:
  `threads-docs/tests/4.6.0-threads.2/phase-2/4.6.0-threads.2.test.4.md`
- Test 4 failed and user approval remains pending. Table icon rendering was
  confirmed fixed; table selection/anchor placement and one-click marker
  interaction need follow-up.
- Local user-test result:
  `threads-docs/tests/4.6.0-threads.2/phase-2/4.6.0-threads.2.test.5.md`
- Test 5 was blocked pending the full checklist and approval. Table marker
  one-click interaction was confirmed fixed; selected-text creation still
  fails specifically inside tables and is assigned to the Phase 1 contract.
- Local user-test result:
  `threads-docs/tests/4.6.0-threads.2/phase-2/4.6.0-threads.2.test.6.md`
- Test 6 failed and user approval remains pending. Table selection was
  confirmed fixed; autolink and strikethrough safe insertion still fail.
- Local user-test result:
  `threads-docs/tests/4.6.0-threads.2/phase-2/4.6.0-threads.2.test.7.md`
- Test 7 was blocked pending window-resize reproduction, the full checklist,
  and approval. Autolink and strikethrough safe insertion were confirmed fixed.

## Phase 3 — Disable Automatic Update Checks

**Status:** Done

**Goal:** Prevent Zettlr Threads builds from querying Zettlr's upstream release
channel or prompting users to install an upstream release.

### Tasks

- Set `ZETTLR_DISABLE_UPDATE_CHECK` in the fork's release-build environment so
  the existing build-time update-disable mechanism is baked into every
  distributed platform build.
- Keep the change scoped to Zettlr Threads packaging and release configuration;
  do not alter the upstream update provider or its version-comparison behavior.
- Verify the packaged application does not perform its initial or hourly update
  checks.
- Verify the **Check for updates** menu item and the update and beta-release
  preferences are absent, and that the existing updates-disabled message is
  shown instead.
- Document that users must obtain new Zettlr Threads releases through the
  fork's GitHub release channel while automatic checks are disabled.

### Done when

- [ ] Every distributed Zettlr Threads build has update checks disabled at
  build time.
- [ ] Launching a packaged build does not contact the upstream Zettlr update
  endpoint or show an upstream update prompt.
- [ ] Update-related menu and preference controls accurately reflect that
  automatic updates are unavailable.
- [ ] Fork release documentation tells users where to obtain updates manually.

### Phase 3 handoff notes

- Local user-test result:
  `threads-docs/tests/4.6.0-threads.2/phase-3/4.6.0-threads.2.test.1.md`
- Test 1 passed and the user approved Phase 3. The reusable fixture was not
  modified during this packaging-focused test.

## Phase 4 — Retrospective Implementation-Guidance Compliance

**Status:** Done

**Goal:** Audit the already-built Phase 1 and Phase 2 changes against the
implementation guidance, correct any divergence, and return both phases to the
user as one testable, compliant workflow.

### Tasks

- Read [../implementation-guidance.md](../implementation-guidance.md) in full
  before reviewing or changing the implementation.
- Identify the complete Threads-owned Phase 1 and Phase 2 diff from the
  prototype's upstream base. Distinguish it from pre-existing or unrelated
  working-tree changes.
- Trace every changed production, test, style, localization, resource, and
  documentation file to a Phase 1 or Phase 2 requirement.
- Check that the implementation extends existing Zettlr abstractions and event
  paths, respects ownership boundaries, and contains no avoidable parallel
  abstractions, unrelated refactors, generated noise, or upstream-behavior
  changes.
- Verify editor changes use CodeMirror transactions and preserve ordinary
  links, Markdown behavior, accessibility, localization, focus, selection,
  scrolling, and theme conventions.
- Verify application behavior, focused tests, this release's documents, and
  `resources/claude/CLAUDE.md` describe the same implemented protocol.
- Correct every in-scope compliance issue at its producing layer and add or
  adjust focused regression coverage where needed. Do not discard unrelated
  user changes.
- Run `git diff --check`, the relevant focused tests and type checks, and the
  manual editor checks required by the implementation guidance.
- Launch a development instance and ask the user to test the combined Phase 1
  and Phase 2 workflow against both phases' **Done when** criteria.
- After explicit user approval, mark Phase 1, Phase 2, and Phase 4 **Done**.
  Without approval, leave them open and record the remaining issue.

### Done when

- [ ] Every Phase 1 and Phase 2 change is traceable to the release contract and
  complies with the implementation guidance.
- [ ] Discovered divergences are corrected with relevant regression coverage.
- [ ] Required automated and manual checks pass or are explicitly reported.
- [ ] The combined Phase 1 and Phase 2 checklists are run in the launched
  development instance.
- [ ] The user explicitly approves the combined workflow.
- [ ] The test iteration is recorded and reset according to
  [the user test plan](../test-plan.md).

### Phase 4 handoff notes

- Local user-test result:
  `threads-docs/tests/4.6.0-threads.2/phase-4/4.6.0-threads.2.test.1.md`
- Test 1 passed and the user approved the combined Phase 1 and Phase 2
  workflow. The reusable fixture was already pristine and required no reset.

## Phase 5 — Provisional Draft Marker Feedback

**Status:** Done

**Goal:** Show the comment's destination in the editor as soon as a draft
opens, while ensuring canceled or abandoned drafts leave the document clean.

### Tasks

- Insert a provisional open marker immediately when the new-comment draft
  opens, using the existing safe insertion rules for selections, inline
  constructs, code blocks, and table cells.
- Associate the provisional marker with the draft's reserved thread ID so
  draft cleanup removes only that marker.
- Keep the HTML thread block deferred until submission; submitting the draft
  promotes the provisional marker to the durable marker and appends the
  matching canonical thread block.
- Remove the provisional marker when the user explicitly cancels the draft,
  switches documents, selects an existing thread, or otherwise follows an
  existing draft-abandonment path.
- Preserve editor focus, selection, and scroll position while inserting and
  removing the provisional marker.
- Define and test Undo/Redo behavior for provisional-marker insertion,
  cancellation, and submission without leaving orphaned markers or blocks.
- Add focused regression tests for immediate marker visibility, safe placement,
  cleanup through every cancellation path, submission, and Undo/Redo.
- Launch a development instance and ask the user to test marker feedback and
  cleanup against this phase's **Done when** criteria.

### Done when

- [ ] Opening a draft immediately displays one provisional open marker at the
  safe creation position.
- [ ] No thread block exists before the draft is submitted.
- [ ] Canceling or abandoning a draft removes its provisional marker and
  leaves no thread block.
- [ ] Submitting a draft retains one marker and appends one matching canonical
  thread block.
- [ ] Marker feedback and cleanup preserve valid Markdown, including tables,
  inline constructs, and code blocks.
- [ ] Focus, selection, and scroll position remain stable.
- [ ] Undo/Redo cannot leave an unintended orphaned marker or thread block.
- [ ] The user explicitly approves the workflow.
- [ ] The test iteration is recorded and reset according to
  [the user test plan](../test-plan.md).

### Phase 5 handoff notes

- Local user-test result:
  `threads-docs/tests/4.6.0-threads.2/phase-5/4.6.0-threads.2.test.1.md`
- Test 1 passed and the user approved Phase 5. No findings were recorded; the
  reusable fixture was already pristine and required no reset.

## Release Completion

The prototype is ready when all five phases are marked **Done**, relevant checks
pass, and application behavior, tests, release documents, and Claude
instructions describe the same protocol.
