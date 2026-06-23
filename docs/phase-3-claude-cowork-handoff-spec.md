# Phase 3 Claude Cowork Review Handoff Implementation Spec

This is the handoff spec for implementing Phase 3. The PRD defines the user-facing behavior; this file defines the implementation contracts that should keep the work bounded while Phase 2 is still in progress.

## Goal

Let the user mark a Markdown document ready for Claude Cowork review. Zettlr Threads saves and exposes canonical comment threads; Claude Cowork reads the file, follows `resources/claude/CLAUDE.md`, and appends Claude-authored replies to open threads.

## Non-Goals

- No automatic edits to the prose outside the comment thread.
- No semantic re-anchoring of comments.
- No Anthropic SDK integration, API key storage, OAuth/login flow, or direct model calls.
- No prompt management inside Zettlr Threads.
- No app-owned version history, branch management, merges, or git commits.

## Phase 2 Integration Points

Phase 3 depends on the final Phase 2 comment implementation. As of the current Phase 2 implementation, the relevant integration points are:

- Comment types: `source/common/modules/markdown-editor/comments/types.ts`
- Parser/serializer: `source/common/modules/markdown-editor/comments/parser.ts`
- Comment command helpers: `source/common/modules/markdown-editor/comments/commands.ts`
- Editor methods/events: `source/common/modules/markdown-editor/index.ts`
- Sidebar UI: `source/win-main/sidebar/CommentsTab.vue`
- Sidebar routing: `source/win-main/sidebar/MainSidebar.vue`
- Main window command bridge: `source/win-main/App.vue`
- Active editor bridge/synchronization: `source/win-main/MainEditor.vue`
- Window state: `source/pinia/window-state-store.ts`

The current Phase 2 implementation already provides:

- `CommentThread` and `CommentMessage`, including `author: 'user'|'claude'`
- `windowStateStore.selectedCommentThread`
- `windowStateStore.commentThreads`
- editor event `comment-thread-selected`
- editor event `comment-threads-changed`
- editor method `appendCommentReply(thread: CommentThread, body: string)`
- stale-thread relocation by exact `from`/`to`, then unique `id`
- CodeMirror transaction-based replacement of the comment block

Important: the current append path is user-specific. `appendCommentReply(thread, body)` calls `appendUserReply(...)`, which writes messages as `author: 'user'`. Phase 3 does not need an in-app Claude-author append command if Claude Cowork edits the Markdown file directly. Zettlr Threads only needs to re-parse the file after external changes so `[claude | <timestamp>]` messages written by Claude Cowork appear in the UI.

## Architecture

Keep Phase 3 inside the local Markdown workflow. Zettlr Threads should not introduce a provider abstraction, credential store, or direct model command.

Recommended implementation shape:

- Add a comments-panel action such as **Ready for Claude Review**.
- Ensure the active Markdown document is saved before reporting readiness.
- Show a clear ready state or message that tells the user Claude Cowork can review the saved file.
- Reuse the existing document reload/watch path so external edits made by Claude Cowork refresh `windowStateStore.commentThreads`.
- Keep the parser tolerant of `[claude | <timestamp>]` messages, as defined in Phase 2.

The handoff contract is `resources/claude/CLAUDE.md`. It is packaged as an Electron extra resource so release users can access the same instructions. Do not duplicate its detailed comment-protocol rules in app code beyond the parser/serializer rules already required by Phase 2.

## Renderer Flow

Expected flow once Phase 2 is complete:

1. `CommentsTab.vue` has a selected active thread.
2. User clicks **Ready for Claude Review**.
3. `CommentsTab.vue` emits an event such as `mark-ready-for-claude`.
4. `MainSidebar.vue` forwards it to `App.vue`.
5. `App.vue` toggles a new editor command flag, similar to the existing comment command paths.
6. `MainEditor.vue` handles that flag only for the active file and last-focused leaf.
7. `MainEditor.vue` ensures the active document has been saved through the existing document authority/save behavior.
8. The comments panel shows a saved/ready state for the active document.
9. Claude Cowork reviews the saved Markdown file outside Zettlr Threads and appends `[claude | <timestamp>]` messages to open threads.
10. When the file changes on disk, Zettlr Threads refreshes the active editor and comment state through the existing reload/synchronization path.

Do not write Markdown files directly from a new AI command or preferences UI. Claude Cowork is the reviewer and edits the Markdown file according to `resources/claude/CLAUDE.md`.

The current Phase 2 UI already routes `append-reply`, `edit-message`, `resolve`, and `delete-thread` from `CommentsTab.vue` through `MainSidebar.vue` and `App.vue` into `MainEditor.vue`. Follow that pattern for the ready-for-review action rather than introducing a separate renderer-to-editor channel.

## Error Handling

MVP behavior:

- If the active document cannot be saved, show the normal save failure path and do not mark it ready.
- If the file changes externally while the user has unsaved edits, use the existing remote-modification/reload safeguards.
- Claude Cowork unavailability is outside the scope of Zettlr Threads and must not mutate the comment thread.

## Tests

Add focused tests where possible:

- parser accepts Claude-authored messages written by Claude Cowork
- external file refresh updates `windowStateStore.commentThreads`
- ready-for-review action saves the active document before reporting readiness
- failed save does not report readiness

Manual verification after Phase 2 integration:

- Open a comment thread and click **Ready for Claude Review**.
- Confirm the document is saved before the ready state appears.
- Append a valid `[claude | <timestamp>]` message to the raw Markdown file from outside the app.
- Confirm the comments sidebar refreshes and displays the Claude message.
- Simulate a save failure and confirm the ready state is not shown.

## Done When

- A user can mark the active Markdown document ready for Claude Cowork review.
- The ready action saves the document first.
- No Anthropic SDK, API key settings, credential storage, or login flow is introduced.
- Claude-authored messages written by Claude Cowork appear in the existing comment panel after file refresh.
- The app does not create git commits, branches, merges, or version-history state.
- Type checking passes.
