# Product Requirements Document

## Overview

A local-first writing environment for long-form Markdown documents. Forked from Zettlr. Designed for a single user working through an iterative draft-review-revise workflow.

All documents are plain `.md` files. Comments are managed inside the Markdown file. Review is handed off to Claude Cowork through the local comment protocol described in `resources/claude/CLAUDE.md`; Zettlr Threads does not call an AI API directly. Versioning is handled by the git-controlled project that owns the Markdown file.

---

## Phase 1 — Dev Environment

No user-facing features. Internal milestone only.

---

## Phase 2 — Comment System

### Comment Format

Comments are stored as HTML comment blocks inside the `.md` file. They are invisible in all standard Markdown renderers but readable in any text editor.

```
<!--
@thread c1
@status open

[user | 2026-06-18T14:35:00-05:00]
This feels weak. Can you suggest a rewrite?

[claude | 2026-06-18T14:37:00-05:00]
How about: "Every great decision starts with a single clear question."
Want me to apply it?

[user | 2026-06-18T14:40:00-05:00]
Yes, but tighten it further.
-->
```

**Fields:**
- `@thread` — unique ID for the thread
- `@status` — `open` or `resolved`
- Message timestamps use ISO 8601 with local offset

Implementation details and parser edge cases are defined in `docs/phase-2-comment-system-spec.md`.

### Marker Indicator

- A single 📜 marker appears at the comment block's line position
- The marker is rendered at the comment block's location, not as a highlight or underline over surrounding text
- Clicking the marker opens the comment panel for that thread

### Comment Panel

- Displayed as a sidebar
- Shows the full thread for the selected comment
- Displays author and timestamp for each reply
- Includes a text input for the user to add a new reply
- Includes a **Resolve** button that sets `@status` to `resolved`

### Adding Comments

- A user can insert a new comment thread from the editor
- The new thread is inserted as an HTML comment block at the current cursor location, or after the selected text if text is selected
- Inserting a thread opens the comments sidebar with the new thread selected

### Constraints
- Comments are local only — not intended for multi-user collaboration
- The `.md` file is the source of truth; the panel is a view over it
- The comment block's position is the anchor; edits around it may change which nearby text the comment visually sits beside

---

## Phase 3 — Claude Cowork Review Handoff

### Cowork Integration

- Assumes Claude Cowork is available in the same project workspace
- Uses the Markdown comment protocol in `resources/claude/CLAUDE.md` as the integration contract
- Does not configure an API key, call Anthropic directly, or implement a Claude login/OAuth flow
- Does not manage prompts inside Zettlr Threads; Claude Cowork follows the repository-level instructions

### Review Handoff Flow

1. User opens a comment thread in the panel
2. User marks the document ready for Claude review
3. Zettlr Threads ensures the Markdown file is saved with canonical comment blocks
4. Zettlr Threads signals, or gives the user a clear way to signal, that the document is ready for Claude Cowork to review
5. Claude Cowork reads the Markdown file, follows `resources/claude/CLAUDE.md`, and appends `[claude | <timestamp>]` messages to open threads
6. Zettlr Threads refreshes its parsed comments when the Markdown file changes on disk
7. Claude Cowork failures or unavailability do not mutate the selected comment thread

---

## Non-Goals

- Multi-user collaboration
- Cloud sync
- Support for non-Markdown file types
- Anthropic API integration, credential storage, or prompt management inside Zettlr Threads
- Version history, alternate versions, branching, merging, or git conflict resolution inside Zettlr Threads
