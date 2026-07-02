# Zettlr Threads Documentation

This directory records the product and implementation history of the Zettlr
Threads fork. Documentation is grouped by release so that current requirements
remain clear without erasing how earlier releases were designed.

## Required Reading

Before changing Zettlr Threads:

1. Read [implementation-guidance.md](implementation-guidance.md).
2. Read [test-plan.md](test-plan.md).
3. Read the PRD, plan, and plan review for the target release.
4. Read any phase implementation spec named by that plan.
5. Read and keep
   [`resources/claude/CLAUDE.md`](../resources/claude/CLAUDE.md) synchronized
   with the implemented comment protocol.

## Versioning

The numeric version must match the upstream Zettlr version. Fork releases
increment only the flat `threads.N` suffix. Patch and feature releases share
the same sequence; their scope is described in release notes rather than by
adding another numeric component.

For example:

- `4.6.0-threads.1` is the first Threads release based on upstream `4.6.0`.
- `4.6.0-threads.2` is the second Threads release based on the same upstream
  release.
- `4.6.0-threads.3` is the next release, whether it contains a patch or a
  feature.
- Moving to a different upstream release changes the numeric version rather
  than independently advancing it as a Threads feature version; the Threads
  release counter then restarts at `threads.1`.

The package version changes when implementation of a release begins, not when
its planning documents are first drafted.

## Releases

### 4.6.0-threads.1

The first release introduced local HTML comment threads, gutter markers, a
comments sidebar, and the Claude Cowork handoff.

- [PRD](4.6.0-threads.1/prd.md)
- [Development plan](4.6.0-threads.1/plan.md)
- [Plan review](4.6.0-threads.1/plan-review.md)
- [Phase 2 comment-system implementation spec](4.6.0-threads.1/phase-2-comment-system-implementation-spec.md)
- [Phase 3 Claude Cowork implementation spec](4.6.0-threads.1/phase-3-claude-cowork-implementation-spec.md)

These documents are historical. Do not silently revise their product decisions
to describe later releases.

### 4.6.0-threads.2

The second release replaces line-based gutter placement with visible,
character-anchored Markdown markers and stores thread blocks at the end of the
document.

- [PRD](4.6.0-threads.2/prd.md)
- [Development plan](4.6.0-threads.2/plan.md)
- [Plan review](4.6.0-threads.2/plan-review.md)

### 4.6.0-threads.3

This release patches draft-abandonment cleanup so it does not delete a newly
promoted thread's durable marker.

- [PRD](4.6.0-threads.3/prd.md)
- [Development plan](4.6.0-threads.3/plan.md)
- [Plan review](4.6.0-threads.3/plan-review.md)

## General References

- [User test plan](test-plan.md)
- [WSL2 development setup](wsl2-setup.md)
- [Release and upstream-integration guidance](release-guidance.md)
