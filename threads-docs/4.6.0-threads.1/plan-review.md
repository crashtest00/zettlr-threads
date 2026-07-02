# Plan Review

This file captures feedback on the current PRD and development plan so it can be updated iteratively outside chat.

## Main Gaps

### 0. Phase 2 shovel-readiness update applied

The Phase 2 implementation gaps are now captured in a dedicated implementation
spec.

Status: APPLIED

- Added `phase-2-comment-system-implementation-spec.md`.
- Defined parser, serializer, storage, malformed-block, duplicate-ID, and escaping behavior.
- Defined CodeMirror gutter, editor event/method, sidebar state, add-thread UX, synchronization, and test expectations.
- Updated the development plan to point Phase 2 agents at the spec.
- Updated the PRD with ISO timestamps and add-comment behavior.

### 1. Comment anchoring update applied

The PRD now uses the comment block's position as the anchor.

Status: APPLIED

- Remove `@anchor` from the comment format.
- Define the 📜 marker as the sole visual indicator.
- Document that edits around a comment may change which nearby text it appears beside.

### 2. Alternate version merge strategy superseded

The earlier alternate-version merge strategy is no longer part of the Zettlr Threads product scope. The owning git-controlled project handles versioning, branching, merging, and conflicts.

Status: SUPERSEDED

- Removed app-managed alternate versions from the PRD and plan.
- Removed in-app branch and merge UI expectations.
- Kept git conflict handling out of scope.

### 3. Environment setup update applied

The setup guide now points at a pinned Node version and the repo's Yarn 4.11.0 toolchain.

Status: APPLIED

- Keep `.nvmrc` in sync with the supported Node version.
- Use Corepack for Yarn 4.11.0.
- Call out the exact build command that should work on a clean machine.

### 4. AI failure behavior update superseded

The earlier direct Anthropic failure model is superseded by the Claude Cowork handoff model.

Status: SUPERSEDED

- Zettlr Threads does not call Anthropic directly.
- Zettlr Threads handles only local save/readiness failures and external file refresh behavior.
- Claude Cowork availability or model/API failures are outside the scope of Zettlr Threads.

### 5. Phase 3 shovel-readiness update superseded

The original Phase 3 direct-API implementation spec has been superseded by a Claude Cowork handoff model.

Status: SUPERSEDED

- `resources/claude/CLAUDE.md` is the review protocol contract.
- Zettlr Threads no longer needs Anthropic SDK integration, API key storage, credential UI, prompt management, or direct model calls.
- Zettlr Threads only needs to save the Markdown document, mark it ready for Claude Cowork review, and refresh comments after Claude Cowork edits the file.
- Claude-authored replies are expected to be written into the Markdown file by Claude Cowork.

### 6. Versioning scope update applied

Versioning is now explicitly owned by the git-controlled project that contains the Markdown under review.

Status: APPLIED

- Removed app-managed version history from the PRD and development plan.
- Removed alternate-version branch/merge work from the PRD and development plan.
- Kept git conflict handling out of scope for Zettlr Threads.

## Suggested Acceptance Criteria Additions

### Comment System

- The 📜 marker appears at the comment block's position in the file. Approved
- Clicking the marker opens the correct thread in the sidebar. Approved
- A comment remains attached to its block location rather than re-anchoring to nearby text. Approved

### AI Integration

- The user can mark the active Markdown file ready for Claude Cowork review.
- The ready action saves the file first.
- Claude Cowork can append `[claude | <timestamp>]` messages by following `resources/claude/CLAUDE.md`.
- Zettlr Threads refreshes the comment panel after Claude Cowork changes the file.

### Version History

- Project-level git handles version history outside Zettlr Threads.

### Alternate Versions

- Alternate versions, branches, merges, and git conflict resolution are out of scope for Zettlr Threads.

## Open Questions

Phase 3 has no product-level open questions. The main implementation dependency is deciding how the ready-for-review signal should be represented in the UI and, if needed, in local state.

## Priority Recommendation

If you want to tighten scope before implementation, I would update the PRD first, then align the development plan to it, and finally make the setup guide match the actual toolchain requirements.
