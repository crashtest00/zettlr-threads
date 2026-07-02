# Zettlr Threads Release and Integration Guidance

Read this document in addition to
[implementation-guidance.md](implementation-guidance.md) when the user requests
packaging, CI, release, upstream integration, or related troubleshooting.

These instructions do not independently authorize commits, network operations,
workflow dispatch, pushes, upstream integration, releases, or other external
state changes.

## Diagnose Failures from Threads Differences

- Read the exact local or CI failure and compare the complete fork diff with the
  equivalent successful upstream implementation, job, runner, and dependency
  versions.
- Use both sides of the fork point: identify Threads changes from the recorded
  upstream base or merge base, and separately inspect changes between that base
  and current `upstream/develop`.
- When upstream succeeds, assume Threads code or configuration caused the
  failure until concrete evidence disproves it. Do not blame upstream, GitHub
  Actions, a runner, dependency, or platform merely because the failure appears
  there.
- Trace the failing operation end to end before editing. For packaging, follow
  the product name, executable name, maker `bin`, output path, artifact name,
  and verification expectation through every tool, checking especially for
  Threads branding conflicts.
- Identify the Threads divergence that explains both the fork's failure and
  upstream's success before changing production behavior, workflows, runners,
  dependencies, or platform configuration.
- Treat a platform-isolated failure as a symptom, not proof of a platform
  cause. Make a platform-specific correction only when the evidence locates
  the cause in that platform's Threads configuration.
- Fix the producing layer after establishing the cause. Configuration for
  electron-builder, for example, does not necessarily control Electron Forge.
- Preserve strong checks. Correct the producer or exact expectation rather than
  weakening artifact verification or adding a production fallback.
- Reproduce narrowly while iterating, then run the complete relevant suite when
  shared production or test infrastructure changes.

If no Threads divergence explains the failure, stop and report the evidence.
Do not alter upstream-origin behavior as an incidental troubleshooting fix.

## Build and Release Through Existing Interfaces

- Extend upstream's successful workflow. Preserve its permissions, preflight
  checks, native jobs, artifact handling, and release structure except where
  documented fork policy requires otherwise.
- Keep packaging behavior in `package.json`, `electron-builder.yml`, and
  `forge.config.js`. CI should orchestrate existing package and release scripts,
  not duplicate them.
- Keep product, executable, maker `bin`, output, artifact, and workflow names
  consistent. Centralize shared versions and settings.
- Build Windows, macOS, and Linux targets on native runners. Enable an
  architecture only after its packaging command and runtime support work.
- Separate preflight, builds, artifact collection, checksums, and publication.
  Upload only final artifacts from build jobs.
- Keep electron-builder publishing at `--publish never`. A final job must
  verify the complete artifact set, generate and verify `SHA256SUMS.txt`, and
  create a draft GitHub Release using `GITHUB_TOKEN`.
- Begin with manual dispatch and draft releases. Add automation only after
  native builds are reliable. Reject an existing release tag and, for
  tag-triggered builds, require the tag to match `package.json`.
- Keep signing and notarization disabled unless existing conventions, secrets,
  and verification fully support them. Never imitate, bypass, or weaken signing.
- Remove unusable private, nightly, release-candidate, or branch-specific paths
  only when required upstream behavior remains intact and the requested release
  task authorizes the removal. Prefer inputs over duplicate workflows.
- Document supported platforms, installation behavior, independent releases,
  unsigned artifacts, and resulting macOS or Windows security warnings.
- Packaging fixes apply to future builds; do not alter published artifacts.

## Create a GitHub Release Candidate

Use **release** for a numbered product version such as
`4.6.0-threads.3`. Use **build** for a particular CI run or compiled artifact;
multiple builds may validate or produce the same release.

For Zettlr Threads, "build the release" means running
`.github/workflows/build.yml` for the intended release branch and commit. It
does not mean reconstructing the GitHub Actions environment in WSL or producing
an ad hoc collection of local artifacts.

- Before dispatch, confirm that the release branch contains the intended
  `4.6.0-threads.N` version in `package.json`, all release preparation is
  committed, the worktree state is understood, and the corresponding
  `v4.6.0-threads.N` tag does not already exist.
- Dispatch the manual `Build` workflow for the exact release branch only when
  the user has authorized the external operation. Record the branch, commit,
  version, workflow run, and any rerun jobs.
- Treat local work as release-readiness validation or narrow diagnosis. Tests,
  type checks, lint, and a host-compatible package can provide useful evidence,
  but they do not constitute a complete Zettlr Threads release candidate.
- Do not install Wine, private RPM toolchains, macOS cross-packaging
  workarounds, or other system dependencies merely to reproduce the complete
  release in WSL. Missing local packaging tools are not product defects.
- If a local diagnostic requires a dependency download and network access is
  restricted, request the required permission. Do not misclassify sandbox or
  authentication failures as repository failures.
- Use the workflow's native jobs as the source of truth: Windows x64 on
  `windows-latest`, macOS x64 on `macos-15-intel`, macOS arm64 on
  `macos-latest`, and Linux x64 and arm64 on Ubuntu 22.04 with the workflow's
  configured Zig toolchains.
- Require preflight, version verification, and every native build job to
  succeed. Diagnose a failed target from its exact Actions log and compare it
  with the corresponding upstream job before changing code or configuration.
- Accept the candidate only after `prepare_release` verifies all nine expected
  installers, generates and verifies `SHA256SUMS.txt`, and creates the draft
  GitHub Release. A locally generated AppImage, portable ZIP, or unpacked
  application is not a substitute for that artifact set.
- Keep the GitHub Release in draft state while reviewing artifact names,
  checksums, release notes, installation behavior, and unsigned-build warnings.
  Publishing the draft is a separate user-authorized operation.

## Git, CI, and Upstream Integration

- Perform these operations only when the user explicitly requests them.
- Keep fork metadata, feature work, and upstream integration in focused commits
  with concise conventional messages.
- Fetch both remotes before upstream integration and check whether the target is
  already an ancestor.
- Inspect Threads-owned changes from the merge base and upstream changes since
  that base before resolving integration differences.
- If an authorized integration rewrites published fork history, use
  `git push --force-with-lease`, never unrestricted force.
- Treat an upstream pull request as a separate explicit action. Pushing the
  fork or dispatching its workflow must not create one.
- Use the existing GitHub Actions workflow for the exact branch and commit.
- Before release handoff, confirm the worktree state, local/fork alignment, and
  known CI result.
- The user must perform interactive authentication when required.
