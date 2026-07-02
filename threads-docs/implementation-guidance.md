# Zettlr Threads Implementation Guidance

These rules apply to every Threads release. They supplement the target
release's PRD, plan, plan review, and phase implementation specs.

## Builder Execution Contract

Every release plan must begin with a builder-agent preamble that links to this
document and makes it required reading before code changes. A bare link in
introductory prose is not sufficient. The preamble must also identify the
release PRD, plan review, applicable phase specs, and
`resources/claude/CLAUDE.md` as required reading where relevant.

Every plan phase must have an explicit status and use this lifecycle:

1. **Pending** before work begins.
2. **In progress** while implementation or correction is underway.
3. **Awaiting user approval** after checks pass and a development instance is
   available for user testing.
4. **Done** only after the user explicitly approves the phase.

The builder assigned to a phase owns implementation through user validation.
Before requesting approval, the builder must:

- satisfy the phase's **Done when** criteria;
- run the focused checks and the checks required by this document;
- launch the application with `yarn start`, or the repository's equivalent
  current development command;
- keep the development instance available and give the user the information
  needed to test it; and
- report checks not run, known limitations, and any acceptance criterion that
  still needs verification.

Automated checks do not constitute user approval. If the user reports a
problem, the builder must keep the phase open, correct the issue, rerun relevant
checks, and return the development instance for another test. The builder may
mark the phase **Done** only after explicit approval.

When a plan gains implementation constraints after one or more phases were
built, add a retrospective compliance phase before new feature work. That phase
must audit the complete earlier-phase diff, correct violations, add missing
coverage, launch a development instance, and obtain user approval before the
earlier phases or compliance phase are marked **Done**.

## Preserve Upstream Compatibility

Treat upstream Zettlr as the architectural and behavioral baseline. Every
persistent difference must be traceable to a documented Threads feature,
branding requirement, or distribution constraint.

- Reuse existing components, CodeMirror extensions, event paths, styles,
  commands, APIs, naming, dependencies, and file organization where they fit.
- Keep changes within established ownership boundaries. Avoid parallel
  abstractions, unrelated refactors, formatting sweeps, dependency upgrades,
  broad renames, and changes to unrelated upstream behavior.
- Keep the upstream numeric version unchanged. Advance only the flat
  `threads.N` suffix for each release on the same upstream version, regardless
  of whether the release contains patches or features. Never append another
  numeric component after `threads.N`; Windows versions support at most four
  numeric components.
- Preserve upstream compatibility using both the release's upstream base and
  current `upstream/develop`. Use the recorded base commit or merge base to
  identify Threads-owned changes. When network access and task authority allow,
  compare against live `upstream/develop` to detect upstream fixes,
  architectural changes, conflicts, and avoidable divergence. Reconcile those
  differences intentionally; do not treat every live upstream difference as
  either a Threads regression or an automatic change to adopt.
- Configure `origin` as the Threads repository and `upstream` as the official
  Zettlr repository. Never push fork work to upstream.
- Preserve Zettlr's architecture, attribution, history, and accurate historical
  references. Present Threads as an unofficial fork rather than mechanically
  rebranding upstream history.
- Isolate fork metadata such as product and executable names, bundle IDs,
  repository URLs, artifacts, and release configuration. Derive repeated
  values from shared metadata such as `package.json`.
- Use capability-based names for core behavior. Threaded review must not depend
  on Claude Cowork or another optional integration.
- Identify accidental drift such as temporary files, development labels,
  generated noise, downloaded-file metadata, and unrelated formatting. Remove
  or revert it only when it falls within the authorized task or the user
  explicitly approves the cleanup. Never discard unrelated working-tree
  changes.

## Make the Smallest Coherent Change

- Keep each implementation bounded by its documented phase and preserve
  unrelated work in the working tree.
- Extend an existing abstraction before introducing a new one. Add a dependency
  only when the existing stack cannot reasonably provide the behavior.
- Preserve public and internal APIs unless the release explicitly changes
  their contract.
- Include the state updates, tests, documentation, accessibility behavior, and
  cleanup required for the feature to work safely. Minimal does not mean
  incomplete.

## Protect Upstream During Troubleshooting

- Upstream-origin code and behavior are presumptively correct during
  troubleshooting.
- Do not modify upstream production code, workflows, dependencies, tests, or
  platform configuration merely to make a Threads failure disappear.
- First identify the Threads-owned divergence that causes the failure and
  correct that divergence at its producing layer.
- If no Threads divergence explains the failure, stop and report the evidence.
  Changing upstream behavior requires a separately authorized task with a
  documented rationale; it must not be introduced as an incidental
  troubleshooting fix.
- Feature work may make narrow, intentional changes inside upstream-origin
  files when the Threads specification requires them. Those edits must be
  traceable to the feature, preserve unrelated upstream behavior, and include
  focused regression coverage.

For packaging, CI, release, or upstream-integration troubleshooting, also read
[release-guidance.md](release-guidance.md).

## Follow Existing Editor Architecture

- Keep the Markdown document as the durable source of truth for threads.
- Perform editor mutations through CodeMirror transactions; do not write the
  active file directly from Vue components, parsers, or sidebar code.
- Keep renderer/editor concerns separate from Vue sidebar state and route
  events through the established `MarkdownEditor` and `MainEditor.vue` bridges.
- Use existing Zettlr iconography and theme behavior.
- Follow Zettlr's localization, accessibility, keyboard, focus, tooltip, and
  naming conventions. User-visible strings must use the established
  translation system rather than hard-coded English unless the surrounding
  upstream interface intentionally does otherwise.
- When specializing link or click behavior, preserve ordinary links and consume
  only Threads-specific syntax.

## Keep the Claude Protocol Synchronized

Agents must read
`/home/jmarck/zettlr-threads/resources/claude/CLAUDE.md` before changing comment
behavior. The repository-relative path is
[`resources/claude/CLAUDE.md`](../resources/claude/CLAUDE.md).

Changes to marker syntax, thread placement, canonical fields, status handling,
creation, replies, resolution, or integrity rules must update that file in the
same implementation. Application behavior, tests, release documentation, and
Claude instructions must describe the same implemented protocol. Do not update
it for behavior that exists only in a future plan.

## Verify and Hand Off

- Do not create commits, push branches, integrate upstream, dispatch workflows,
  publish releases, or otherwise change external state unless the user requests
  that action.
- Add focused regression coverage and preserve tests unless the documented
  contract changes. Account for supported environment differences, including
  browser globals that different Node versions may define differently.
- Test the running application when behavior depends on CodeMirror rendering,
  pointers, focus, selection, or scrolling.
- Run `git diff --check` plus relevant tests and type checks. Confirm packaged
  resources include any synchronized protocol file when packaging is in scope;
  report anything not run.
- Before handoff, confirm the worktree state and distinguish changes made for
  the task from pre-existing work.

### Managed Workspace Permissions

In managed Codex workspaces, the repository files may be writable while
`.git` remains explicitly read-only. Commands that create or update branches,
the index, refs, or lock files therefore require an escalated terminal call
even when the user has already authorized the Git operation. Request
`require_escalated` up front and explain that the command must write Git
metadata inside `.git`. If the permission reviewer rejects the escalation,
report an environment-policy blocker; trying an equivalent Git spelling does
not bypass the restriction.

The development command may also need escalation. Electron Forge binds its
local multi-logger to `0.0.0.0:9001`; a sandboxed launch can fail with
`listen EPERM` before the application starts. Retry the same development
command with `require_escalated` and explain that Forge needs permission to
bind its local logging port. Treat a rejected escalation as an environment
blocker, not an application defect. In environments where `yarn` is not on
`PATH`, use `corepack yarn start` and the corresponding `corepack yarn`
variants for checks.

## Documentation Discipline

- Keep historical release documents intact except for link repairs,
  clarification banners, or naming normalization.
- Put new requirements in the target release directory, following this
  sequence: PRD, plan, plan review, then any needed phase implementation specs.
- Record deferred behavior explicitly instead of partially implementing it.
