# Plan Review

## Decision

Status: APPLIED

Diagnostics established that the editor and document authority successfully
created and saved the canonical thread block. The marker was removed
synchronously afterward by the `comment-thread-selected` handler:

1. draft promotion inserted the durable marker and block;
2. promotion emitted `comment-thread-selected` before the caller cleared the
   global draft;
3. the handler treated the promoted thread as selection of an existing thread;
4. cancellation searched by the shared draft/thread ID and removed the newly
   durable marker.

The patch limits cancellation to a selected thread whose ID differs from the
active draft. It does not alter upstream synchronization or persistence code.
