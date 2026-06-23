# Development Plan

## Overview

A phased build of an AI-assisted writing environment, forked from Zettlr. Each phase delivers a usable increment before the next phase begins.

**Stack:** Electron, Vue 3, CodeMirror 6, TypeScript

---

## Phase 1 — Dev Environment

**Goal:** A working fork of Zettlr that builds and runs locally.

### Tasks
- Fork and clone the Zettlr repository
- Configure WSL2 environment (see `wsl2-setup.md`)
- Install dependencies and confirm dev build runs (`yarn install --immutable && yarn start`)
- Explore key areas of the codebase:
  - `source/common/modules/markdown-editor/util/ipc-api.ts` — editor-side IPC access
  - `source/app/service-providers/` — main-process application services and IPC handlers
  - `source/common/modules/markdown-editor/` — CodeMirror setup
  - `CONTRIBUTING.md` — build conventions
- Make a small proof-of-concept change to confirm the edit/reload cycle works

### Done when
The dev build runs, hot reload works, and a trivial UI change is visible.

---

## Phase 2 — Comment System

**Goal:** Inline comment threads that are invisible in rendered Markdown but visible in the editor gutter.

### Tasks
- Use `docs/phase-2-comment-system-spec.md` as the implementation contract
- Add shared comment thread parser/serializer types under `source/common/modules/markdown-editor/comments/`
- Write parser unit tests for canonical, malformed, multiline, duplicate-ID, append-reply, and resolve cases
- Add a CodeMirror comment gutter extension that renders a 📜 marker at each valid thread block's opening line
- Expose editor events/methods for selecting, inserting, appending to, and resolving comment threads
- Add a comments sidebar tab and window state for the selected active-editor thread
- Add an explicit "Insert comment thread" editor command/toolbar flow, or deliberately repurpose the existing Markdown comment command
- Mutate comment blocks through CodeMirror transactions so existing document authority/save behavior persists the raw `.md` changes

### Done when
A user can view, add, reply to, and resolve comment threads in the editor; clicking a 📜 marker opens the correct sidebar thread; parser tests pass; and the raw `.md` file contains canonical HTML comment blocks.

---

## Phase 3 — Claude Cowork Review Handoff

**Goal:** Let the user mark a Markdown document ready for Claude Cowork review, using the local comment protocol in `resources/claude/CLAUDE.md`.

### Tasks
- Use `docs/phase-3-claude-cowork-handoff-spec.md` as the implementation contract
- Add a review-ready action in the comments UI for the active Markdown document
- Ensure the active document is saved before signaling review readiness
- Surface a clear ready-for-review state or message that Claude Cowork can act on
- Refresh parsed comment threads when Claude Cowork updates the Markdown file on disk
- Keep all Claude replies flowing through the existing canonical comment-thread parser/serializer

### Done when
A user can save the document, mark it ready for Claude Cowork review, and see Claude Cowork's replies appear in the existing comment panel after the Markdown file changes.

---

## Future Considerations

- Export with comments stripped
- Keyboard shortcuts for comment actions
- Optional project-level affordances that open the owning git project in external tools
