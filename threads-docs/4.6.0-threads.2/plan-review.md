# Plan Review

This review records the decisions used to align the `4.6.0-threads.2` PRD and
development plan before phase implementation begins.

## Applied Decisions

### 1. Prototype version follows upstream

Status: APPLIED

- Target `4.6.0-threads.2`.
- Keep `4.6.0` aligned with the upstream Zettlr base.
- Increment the Threads prototype suffix rather than treating the feature as
  upstream version `4.7.0`.

### 2. Comments may include selected prose

Status: APPLIED

- Open an empty draft when no text is selected.
- When the primary selection contains non-whitespace text, trim only its
  boundary whitespace and paste it into the initial message as a Markdown
  blockquote.
- Capture the cursor or effective selection endpoint before inserting any
  marker.
- Exclude the new marker from the quoted selection.

### 3. A real Markdown marker replaces gutter placement

Status: APPLIED

- Open marker: `[💬](#zettlr-comment-<id>)`.
- Resolved marker: `[✓](#zettlr-comment-<id>)`.
- The marker supplies a durable character-level location that moves with
  ordinary text edits.
- Remove the dedicated gutter, its spacer, and line-based placement logic.

### 4. Zettlr renders markers with existing Clarity icons

Status: APPLIED

- Render open markers as Clarity `chat-bubble`.
- Render resolved markers as Clarity `check`.
- Retain portable Markdown characters in the source and ordinary exports.
- Specialize existing link rendering only for Threads marker fragments.

### 5. Marker insertion respects enclosing Markdown syntax

Status: APPLIED

- At an ordinary creation position, insert the marker at that position.
- When the position is inside a Markdown link, emphasis, or inline code span,
  insert after the outermost enclosing inline construct.
- When the position is inside a fenced or indented code block, insert
  immediately after the complete block.
- Do not move a marker across a table-cell delimiter.
- Accept that this may place the marker just beyond the literal final selected
  character in order to keep the Markdown valid.

### 6. Table structure is protected by separated storage

Status: APPLIED

- Append thread blocks at document end rather than beside the selected line.
- Allow markers in table-cell content.
- In rendered/WYSIWYG use, selection is expected not to include the structural
  pipe delimiter.
- Do not add speculative table-delimiter repair unless implementation evidence
  shows it is required.

### 7. EOF append is intentionally simple

Status: APPLIED

- Append every new thread block at the document end with safe blank-line
  separation.
- Do not maintain or reorder a managed comment footer.
- Accept that later user editing can place prose after an earlier thread block.

### 8. Creation and lifecycle pair changes are atomic

Status: APPLIED

- Insert marker and thread block in one CodeMirror transaction.
- Update marker label and thread status in one CodeMirror transaction.
- Keep the existing delete action synchronized by removing a valid marker and
  its matching thread block together.
- One Undo or Redo must operate on the complete user action.

### 9. Comment clicks are handled before generic link navigation

Status: APPLIED

- Recognize the comment fragment before the ordinary modifier-key guard.
- Use ordinary click for comment markers.
- Call the native event's `preventDefault()` and return handled status to
  CodeMirror.
- Emit the existing `comment-thread-selected` event and let the established Vue
  flow open the comments sidebar.
- Do not scroll or change editor selection.
- Leave all ordinary link behavior unchanged.

### 10. Integrity hardening and final verification share a phase

Status: APPLIED

- Keep integrity work and final structural/regression verification together.
- Cover marker-only, block-only, multiple-marker, and duplicate-ID states.
- Do not let the core implementation silently invent repair behavior.
- Require deterministic, non-destructive behavior before release completion.

### 11. No migration is required

Status: APPLIED

- There are no released user documents requiring compatibility with the first
  prototype.
- Replace the gutter/colocated-block format directly.
- Preserve the first prototype's documents as release history rather than as a
  runtime migration contract.

### 12. Claude instructions are part of the protocol contract

Status: APPLIED

- Agents must read `/home/jmarck/zettlr-threads/resources/claude/CLAUDE.md`.
- Update it when the marker and EOF-storage behavior is implemented.
- Keep application behavior, tests, release documents, and Claude instructions
  synchronized.

### 13. Built phases receive a retrospective compliance handoff

Status: APPLIED AFTER PHASES 1–2 WERE BUILT

- Require every builder to read `implementation-guidance.md` through an
  explicit plan preamble.
- Add Phase 3 to audit and correct the Phase 1 and Phase 2 implementation
  against that guidance.
- Move integrity hardening and final verification to Phase 4 without changing
  its scope.
- Require a running development instance and explicit user approval before a
  phase is marked **Done**.

## Implementation Judgment

The build agents may decide the following details while implementing their
assigned phases:

- the exact helper boundary for finding an enclosing inline syntax node;
- whether the specialized marker renderer extends `render-links.ts` directly
  or uses a narrowly scoped adjacent renderer;
- the exact state representation for marker and block offsets;
- the internal representation used to classify integrity states.

Each choice must follow `implementation-guidance.md`: reuse existing Zettlr
architecture, minimize changes, and preserve unrelated behavior.

## Review Result

The PRD and plan are aligned around four sequential build-agent handoffs:
marker protocol and atomic creation; marker UI and thread lifecycle; a
retrospective implementation-guidance compliance pass over those built phases;
and integrity with final verification. The plan itself is the implementation
handoff, and no separate phase implementation specs are expected.
