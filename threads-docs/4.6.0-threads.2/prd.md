# Product Requirements Document

## Release

Target prototype: `4.6.0-threads.2`

The numeric version continues to match upstream Zettlr `4.6.0`. This prototype
increments only the Threads suffix.

## Overview

The first Threads prototype stores local comment conversations in Markdown HTML
comment blocks and exposes them through a Zettlr sidebar. Its line-based gutter
marker makes a thread's location indirect, and placing a thread block beside
the prose can break structural Markdown such as tables.

This prototype gives every thread a visible Markdown marker anchored at the
creation position. The marker identifies the thread, moves naturally with text
edits, and opens the existing comments sidebar. The corresponding HTML thread
block is appended at the end of the document, away from tables and other
structural Markdown.

The Markdown file remains the only durable source of truth.

## Comment Creation

- The existing **Insert comment thread** button and command retain their current
  names.
- Invoking the command opens the comments sidebar with an unpersisted draft and
  immediately inserts a provisional open marker at the draft's safe creation
  position. No thread block is inserted until the user submits the draft.
- If the primary editor selection contains non-whitespace text, leading and
  trailing whitespace are excluded and every line, including blank lines, is
  prefixed with `> ` to seed the draft with a Markdown blockquote.
- Internal line breaks and Markdown in an optional quoted selection are
  preserved, and the selected document text is never replaced, wrapped, or
  otherwise changed.
- A draft created without selected text starts empty.
- Focus is placed where the user can type the comment.
- On submission, the optional quote and the user's comment become the first
  user message.
- When the draft opens, its provisional marker is inserted after the enclosing
  inline Markdown construct containing the creation position. For a non-empty
  selection this is its effective endpoint; otherwise it is the cursor
  position. This avoids creating an invalid nested link or splitting emphasis,
  code, or other inline syntax.
- On submission, the provisional marker becomes the durable marker and the
  matching thread block is appended at the document end.

## Comment Drafts

- A new-comment draft is not a durable comment thread. Its sidebar state is
  represented in the document only by a provisional marker.
- The draft provides an explicit **Cancel** action.
- Canceling the draft removes its provisional marker without leaving a thread
  block.
- Switching documents or selecting an existing thread discards an unsubmitted
  draft and removes its provisional marker.
- The draft retains the provisional marker's thread ID and position so it can
  remove that exact marker when canceled or abandoned.
- Resizing the sidebar may visually wrap draft text but must not alter its
  stored content or line breaks.

## Marker Format

An open thread uses visible Markdown:

```md
[💬](#zettlr-comment-c123)
```

A resolved thread uses:

```md
[✓](#zettlr-comment-c123)
```

Rules:

- The fragment contains the canonical thread ID.
- The open and resolved labels remain portable Markdown characters.
- In Zettlr's rendered editor, the open label is shown with the existing
  Clarity `chat-bubble` icon and the resolved label with the Clarity `check`
  icon.
- Resolving a thread updates both the marker label and `@status` in one editor
  transaction.
- Standard Markdown rendering may display the marker as a fragment link.

## Thread Storage

The canonical HTML thread-block format remains:

```md
<!--
@thread c123
@status open

[user | 2026-06-30T14:35:00-05:00]
> Selected prose

Please clarify this.
-->
```

- New thread blocks are appended at the end of the document with safe blank-line
  separation.
- The block and marker reference the same thread ID.
- The block's physical line is storage, not the thread's semantic location.
- Existing reply bodies, author values, timestamp rules, and escaping behavior
  remain part of the comment protocol.
- Later user edits may place prose after previously appended thread blocks.
  This prototype accepts that risk; it does not maintain a managed footer.

## Marker Interaction

- An ordinary click on a comment marker opens its thread in the existing
  comments sidebar.
- Comment-marker activation does not require Ctrl or Cmd.
- Activation prevents generic fragment-link navigation.
- Activation does not move the editor selection or change the editor scroll
  position.
- Ordinary Markdown links retain their existing modifier-key and navigation
  behavior.
- Open and resolved markers both remain interactive.

## Editing and Resolution

- Replies continue to update only the matching HTML thread block.
- Resolving a thread preserves every message and changes its marker to the
  resolved Clarity check.
- The sidebar remains a view over the Markdown source.
- Comment mutations use CodeMirror transactions and the existing document
  authority/save path.

## Structural Markdown

- Appending thread blocks at the document end must not split tables, lists,
  blockquotes, or other structures at the creation position.
- Markers may appear inside table-cell content.
- In rendered/WYSIWYG use, the creation position is expected not to be on a
  table's structural pipe delimiter.
- Marker insertion must still avoid breaking the enclosing inline Markdown
  construct.

## Protocol Integrity

The system must ultimately recognize and handle:

- a marker without a matching thread block;
- a thread block without a matching marker;
- multiple markers referencing one thread;
- duplicate thread IDs.

Integrity handling is a dedicated development phase. Core marker and storage
work must not silently invent repair behavior before that phase defines it.

## Compatibility

- There are no released user documents requiring migration from the first
  prototype.
- This prototype may replace the first prototype's gutter and colocated-block
  behavior directly.
- No automatic migration path is required.
- The Claude Cowork instructions in `resources/claude/CLAUDE.md` must be updated
  when the new protocol is implemented.

## Non-Goals

- Multi-user collaboration or conflict resolution.
- Sidecar metadata or a comments database.
- Semantic or fuzzy re-anchoring when a marker is deleted.
- A managed end-of-document comment registry.
- Automatic integrity repair during the core marker phase.
- Direct Anthropic API integration or credential management.
- App-owned git history, branching, merging, or conflict resolution.

## Acceptance Criteria

- Invoking the command opens a focused sidebar draft and immediately shows a
  provisional open marker at its safe creation position.
- Invoking the command without selected text opens an empty focused draft.
- A non-whitespace primary selection is trimmed only at its boundaries and
  converted into a blockquote without losing internal Markdown, line breaks,
  or blank lines.
- Canceling or abandoning the draft removes its provisional marker and leaves
  no thread block behind.
- Submitting the draft creates an initial message containing the user's comment
  and any optional quoted selection.
- Any originally selected prose remains unchanged.
- The initial body does not include the new marker.
- A valid marker appears at a safe inline position associated with the
  creation position.
- The matching thread block is appended at the document end.
- Undo/Redo during draft creation, cancellation, and submission does not leave
  an unintended orphaned marker or thread block.
- Comments can be created on table-cell text without breaking the table.
- Clicking a marker opens the correct sidebar thread without scrolling or
  changing selection.
- Ordinary links continue to behave as before.
- Resolving a thread atomically updates its status and rendered marker.
- The gutter-based comment marker and line-based location logic are removed.
