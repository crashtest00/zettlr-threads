# Phase 2 Comment System Implementation Spec

This is the implementation spec for Phase 2. The PRD defines the user-facing behavior; this file defines the implementation contracts that should keep the work bounded and consistent with Zettlr's existing architecture.

## Goal

Implement local inline comment threads stored as HTML comment blocks in Markdown files. Threads are visible in the editor through a gutter marker and editable through a sidebar panel. The Markdown file remains the only durable source of truth.

## Non-Goals

- No Anthropic/API calls in Phase 2.
- No database, sidecar file, or external metadata store.
- No semantic anchoring to selected prose beyond the comment block's position in the document.
- No multi-user or conflict-resolution behavior.
- No special export behavior; standard Markdown renderers already hide HTML comments.

## Comment Data Model

Add a shared module under:

`source/common/modules/markdown-editor/comments/`

Recommended files:

- `types.ts`
- `parser.ts`
- `commands.ts`

Types:

```ts
export type CommentThreadStatus = 'open'|'resolved'
export type CommentThreadAuthor = 'user'|'claude'

export interface CommentMessage {
  author: CommentThreadAuthor
  timestamp: string
  body: string
}

export interface CommentThread {
  id: string
  status: CommentThreadStatus
  messages: CommentMessage[]
  from: number
  to: number
  line: number
}
```

`from` and `to` are CodeMirror document offsets for the entire HTML comment block. `line` is one-based and points to the block's opening line.

## Storage Format

Canonical serialized format:

```md
<!--
@thread c1
@status open

[user | 2026-06-18T14:35:00-05:00]
This feels weak. Can you suggest a rewrite?
-->
```

Rules:

- The opening marker is exactly `<!--` on its own line.
- The closing marker is exactly `-->` on its own line.
- `@thread` is required.
- `@status` is required and must be `open` or `resolved`.
- Message headers use `[author | timestamp]`.
- Phase 2 accepts `user` and `claude` authors so Phase 3 can append Claude messages without changing the parser.
- New messages created by Phase 2 use author `user`.
- New timestamps use ISO 8601 with local offset.
- Message bodies preserve internal line breaks.
- Serializer appends new messages before the closing `-->`.
- Serializer preserves the canonical field order: `@thread`, `@status`, blank line, messages.

## Parser Behavior

The parser scans the full document text and returns valid thread blocks.

Valid thread:

- Starts with `<!--` at the beginning of a line, allowing leading whitespace only if the whole block is indented consistently.
- Contains `@thread` and `@status` before the first message header.
- Ends at the next line containing only `-->`.

Invalid or non-thread comments:

- Plain HTML comments without `@thread` and `@status` are ignored.
- Blocks with missing `@thread`, missing `@status`, unknown status, or no closing marker are ignored.
- Duplicate thread IDs are tolerated by returning all valid blocks; UI actions target the clicked block by `from`/`to`, not by assuming global ID uniqueness.
- Malformed message headers are treated as body text belonging to the previous message. If no previous message exists, the block is ignored.
- A message body containing `-->` is escaped on write as `--\>` to avoid ending the HTML comment early.

Parser API:

```ts
export function parseCommentThreads (doc: string): CommentThread[]
export function serializeCommentThread (thread: Omit<CommentThread, 'from'|'to'|'line'>): string
export function replaceCommentThreadBlock (doc: string, thread: CommentThread, replacement: string): string
```

`replaceCommentThreadBlock` is primarily for unit tests and pure text manipulation. The editor implementation should mutate the CodeMirror document through transactions rather than writing files directly.

## Editor Integration

Add a CodeMirror extension under:

`source/common/modules/markdown-editor/plugins/comment-gutter.ts`

Implementation guidance:

- Use `gutter`, `GutterMarker`, and `EditorView.baseTheme`, following `source/common/modules/markdown-editor/plugins/footnote-gutter.ts`.
- Render one marker on the opening line of each valid thread block.
- Marker text is `📜` for Phase 2.
- Clicking a marker selects the corresponding thread by its block offsets and emits an editor event to the Vue layer.
- Resolved threads still show a marker in Phase 2, but use reduced opacity.
- Add the extension to `getMarkdownExtensions` in `editor-extension-sets.ts`.

Expose these methods/events from `MarkdownEditor`:

- Event: `comment-thread-selected`, payload `CommentThread`
- Event: `comment-threads-changed`, payload `CommentThread[]`
- Method: `insertCommentThread(initialBody: string): void`
- Method: `appendCommentReply(thread: CommentThread, body: string): void`
- Method: `resolveCommentThread(thread: CommentThread): void`
- Getter: `commentThreads: CommentThread[]`

All editor mutations must dispatch CodeMirror transactions. Do not write directly to the file system from Vue or from the comment parser. Existing document authority/save behavior should persist the edited Markdown.

## Add Thread UX

Reuse the existing toolbar slot if possible, but avoid silently changing the meaning of ordinary Markdown comment insertion unless intentional.

Preferred MVP:

- Add a new editor command named `insertCommentThread`.
- Add a toolbar button titled `Insert comment thread`.
- When invoked, insert a new canonical thread block at the current cursor line.
- If text is selected, keep the selected prose untouched and insert the thread block on a new line after the selection.
- Open the comments sidebar tab with the new thread selected.
- The initial message body can be empty, but the sidebar should focus the reply input immediately.
- Thread IDs use the existing `generateId` helper or a short deterministic wrapper around it, prefixed with `c`.

If the existing `markdownComment` toolbar command is repurposed instead, update the visible title and remove or move the old plain-comment behavior deliberately.

## Sidebar Integration

Add:

`source/win-main/sidebar/CommentsTab.vue`

Update:

- `source/win-main/sidebar/MainSidebar.vue`
- `source/pinia/window-state-store.ts`
- `source/app/service-providers/config/get-config-template.ts`

Sidebar state:

```ts
selectedCommentThread: CommentThread|undefined
commentThreads: CommentThread[]
```

Behavior:

- Add a `comments` sidebar tab.
- Clicking a gutter marker selects the thread, makes the sidebar visible, and switches `window.currentSidebarTab` to `comments`.
- The comments tab shows the selected thread only for Phase 2.
- The tab displays each message author, timestamp, and body.
- The tab includes a textarea for a user reply.
- Submitting a non-empty reply appends a `[user | timestamp]` message to the selected block.
- Resolve sets `@status resolved` on the selected block and keeps the thread visible.
- If no thread is selected, show a compact empty state.

## Synchronization

- Parse comment threads after document load.
- Re-parse after CodeMirror document changes.
- Keep the sidebar state synchronized with the active editor only.
- If the selected thread's exact `from`/`to` no longer exists after editing, try to reselect by ID. If multiple matching IDs exist, clear the selection.
- Remote reloads use the existing editor reload path and should refresh comment state.

## Tests

Add mocha unit tests for parser behavior under `test/comment-threads.spec.ts`.

Required cases:

- Parses one canonical thread.
- Parses multiple threads and reports correct line numbers.
- Ignores plain HTML comments.
- Ignores malformed thread blocks.
- Preserves multiline message bodies.
- Serializes a thread to canonical format.
- Escapes `-->` in message bodies.
- Updates status from `open` to `resolved`.
- Appends a user reply without changing existing messages.
- Handles duplicate IDs without dropping either block.

Manual verification:

- `yarn test`
- `yarn lint:types`
- `yarn start`
- In the app: insert a thread, save, close/reopen, click the marker, add a reply, resolve, save, and inspect the raw Markdown.

## Done When

- A user can add a comment thread from the editor.
- A `📜` marker appears at each valid thread block.
- Clicking the marker opens the comments sidebar to the correct thread.
- A user can add a reply and resolve the thread.
- The raw Markdown file contains canonical HTML comment blocks.
- Parser unit tests pass.
- Type checking passes.
