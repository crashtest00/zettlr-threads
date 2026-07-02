# Product Requirements Document

## Release

Target release: `4.6.0-threads.3`

This release preserves the `4.6.0-threads.2` protocol and patches promotion of
provisional draft markers.

## Requirement

- Selecting an existing thread may abandon and remove a different provisional
  draft.
- Selecting the newly created thread during draft promotion must not remove
  that thread's durable marker.
- Successful submission must leave exactly one matching marker/block pair in
  editor state, document-authority state, and saved source.
- No marker syntax, canonical format, or Claude protocol behavior changes.
