# Claude Cowork Instructions

## Create as a Claude Cowork Skill

In Claude Cowork, create a skill from these instructions:

1. Open **Skills**.
2. Choose **Add Skill**.
3. Choose **Create Skill**.
4. Paste the following values into the skill fields.

Skill name:

```text
Zettlr Threads Markdown Comments
```

Description:

```text
Review and respond to Zettlr Threads Markdown comment threads stored as HTML comment blocks with @thread and @status metadata.
```

Instructions:

```text
Use this skill when reviewing, responding to, continuing, creating, or resolving Zettlr Threads Markdown comment threads.

Zettlr Threads stores comment threads directly inside .md files as HTML comment blocks. These blocks are structured collaboration records, not ordinary prose.

Canonical thread format:

<!--
@thread c20260618143500
@status open

[user | 2026-06-18T14:35:00-05:00]
This feels weak. Can you suggest a rewrite?

[claude | 2026-06-18T14:37:00-05:00]
How about: "Every great decision starts with a single clear question."
-->

Valid thread rules:
- The opening marker must be exactly <!-- on its own line.
- The closing marker must be exactly --> on its own line.
- @thread is required.
- @status is required and must be open or resolved.
- Message headers must use [author | timestamp].
- Valid authors are user and claude.
- Timestamps must be ISO 8601 with local offset, for example 2026-06-18T14:35:00-05:00.
- Message bodies may span multiple lines.
- If a message body needs to include -->, write it as --\> so it does not close the HTML comment.
- Preserve the canonical order: @thread, @status, blank line, messages.

When asked to review, respond to, or continue comments in Markdown files:
1. Scan the target .md file for HTML comment blocks containing both @thread and @status.
2. Ignore ordinary HTML comments that do not contain both fields.
3. Prefer open threads. Resolved threads are historical unless the user explicitly asks to reopen or revisit them.
4. Append your response as a new [claude | timestamp] message before the closing -->.
5. Keep existing thread IDs, statuses, timestamps, and messages intact unless the user asks to change them.
6. Do not rewrite the surrounding prose unless the user explicitly asks you to apply an edit.

When replying to a thread, append only the new Claude message:

[claude | 2026-06-18T14:37:00-05:00]
Your reply here.

When the user asks you to leave a new inline comment:
1. Insert the thread near the relevant prose, usually after the paragraph or section being discussed.
2. Generate a unique thread ID beginning with c, such as c20260618143722.
3. Set @status open.
4. If you are recording the user's stated concern, use [user | timestamp].
5. If you are leaving your own review note or suggestion, use [claude | timestamp].

When the user asks you to resolve a thread:
- Change @status open to @status resolved.
- Preserve all messages.
- Optionally append a short [claude | timestamp] note first if the resolution needs context.
- Do not delete resolved threads unless the user explicitly asks you to remove them.

Brevity constraints:
- Default to one short paragraph or 2-4 bullets.
- Answer the specific thread; do not summarize the whole document unless asked.
- Avoid restating the user's concern unless clarification is needed.
- When suggesting prose, provide only the replacement text plus one brief rationale if useful.
- Do not include multiple alternatives unless the user asks for options.
- Prefer concrete edits over explanation.

Quick response pattern for an open thread:
1. Read the surrounding section for context.
2. Read the full thread history.
3. Append a concise [claude | timestamp] response.
4. If the response proposes text, make it easy to copy or apply.
5. Leave @status open unless the user asks to resolve it.

Chat summary after editing:
- After applying changes to the .md file, give one short aggregate summary in chat: how many threads you touched and a qualitative note on what kinds of responses you gave (e.g., "Replied to 4 open threads — mostly rewrite suggestions for clarity, plus one flagging a missing citation").
- Do not list thread IDs or quote full reply text in chat.
- The file remains the source of truth for exact wording.

Editing safety:
- Treat the Markdown file as the source of truth.
- Do not create sidecar metadata files for comments.
- Do not move a thread unless the user asks you to reposition it.
- Do not merge duplicate thread IDs. Duplicate IDs are tolerated; operate on the specific block near the relevant text.
- Do not place one protocol comment block inside another.
- Do not convert protocol comments into visible Markdown.
- Keep replies concise and directly useful; most comments should be under 100 words unless the user asks for deeper analysis.
- When suggesting replacement prose, include the replacement text in the comment. Apply it to the document only if the user asks.
```

## Thread Comment Protocol

This repository uses local Markdown comment threads as the bridge between the user, Zettlr Threads, and Claude Cowork. Treat these comment blocks as structured collaboration records, not ordinary prose.

Comment threads are stored directly inside `.md` files as HTML comment blocks. Standard Markdown renderers hide them, but they remain editable in any text editor.

Canonical format:

```md
<!--
@thread c20260618143500
@status open

[user | 2026-06-18T14:35:00-05:00]
This feels weak. Can you suggest a rewrite?

[claude | 2026-06-18T14:37:00-05:00]
How about: "Every great decision starts with a single clear question."
-->
```

## Valid Thread Rules

- The opening marker must be exactly `<!--` on its own line.
- The closing marker must be exactly `-->` on its own line.
- `@thread` is required.
- `@status` is required and must be `open` or `resolved`.
- Message headers must use `[author | timestamp]`.
- Valid authors are `user` and `claude`.
- Timestamps must be ISO 8601 with local offset, for example `2026-06-18T14:35:00-05:00`.
- Message bodies may span multiple lines.
- If a message body needs to include `-->`, write it as `--\>` so it does not close the HTML comment.
- Preserve the canonical order: `@thread`, `@status`, blank line, messages.

## How To Work With Threads

When asked to review, respond to, or continue comments in Markdown files:

1. Scan the target `.md` file for HTML comment blocks containing both `@thread` and `@status`.
2. Ignore ordinary HTML comments that do not contain both fields.
3. Prefer open threads. Resolved threads are historical unless the user explicitly asks to reopen or revisit them.
4. Append your response as a new `[claude | timestamp]` message before the closing `-->`.
5. Keep existing thread IDs, statuses, timestamps, and messages intact unless the user asks to change them.
6. Do not rewrite the surrounding prose unless the user explicitly asks you to apply an edit.

When replying to a thread, append only the new Claude message:

```md
[claude | 2026-06-18T14:37:00-05:00]
Your reply here.
```

## Creating New Threads

When the user asks you to leave a new inline comment:

1. Insert the thread near the relevant prose, usually after the paragraph or section being discussed.
2. Generate a unique thread ID beginning with `c`, such as `c20260618143722`.
3. Set `@status open`.
4. If you are recording the user's stated concern, use `[user | timestamp]`.
5. If you are leaving your own review note or suggestion, use `[claude | timestamp]`.

Example:

```md
<!--
@thread c20260618143722
@status open

[claude | 2026-06-18T14:37:22-05:00]
This paragraph makes the right point, but the causal link could be clearer. Consider adding one sentence that explains why the prior claim leads to this conclusion.
-->
```

## Resolving Threads

When the user asks you to resolve a thread:

- Change `@status open` to `@status resolved`.
- Preserve all messages.
- Optionally append a short `[claude | timestamp]` note first if the resolution needs context.

Do not delete resolved threads unless the user explicitly asks you to remove them.

## Editing Safety

- Treat the Markdown file as the source of truth.
- Do not create sidecar metadata files for comments.
- Do not move a thread unless the user asks you to reposition it.
- Do not merge duplicate thread IDs. Duplicate IDs are tolerated; operate on the specific block near the relevant text.
- Do not place one protocol comment block inside another.
- Do not convert protocol comments into visible Markdown.
- Keep replies concise and directly useful; most comments should be under 100 words unless the user asks for deeper analysis.
- When suggesting replacement prose, include the replacement text in the comment. Apply it to the document only if the user asks.

## Brevity Constraints

- Default to one short paragraph or 2-4 bullets.
- Answer the specific thread; do not summarize the whole document unless asked.
- Avoid restating the user's concern unless clarification is needed.
- When suggesting prose, provide only the replacement text plus one brief rationale if useful.
- Do not include multiple alternatives unless the user asks for options.
- Prefer concrete edits over explanation.
- If a comment can be resolved with a direct rewrite, keep the response under 100 words.

## Quick Response Pattern

For an open thread asking for help:

1. Read the surrounding section for context.
2. Read the full thread history.
3. Append a concise `[claude | timestamp]` response.
4. If the response proposes text, make it easy to copy or apply.
5. Leave `@status open` unless the user asks to resolve it.
