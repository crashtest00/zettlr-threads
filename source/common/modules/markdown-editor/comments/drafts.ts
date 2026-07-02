import type { CommentThread, CommentThreadDraft } from './types'

export function shouldCancelCommentThreadDraft (
  draft: CommentThreadDraft|undefined,
  selectedThread: CommentThread,
  documentPath: string
): draft is CommentThreadDraft {
  return draft !== undefined &&
    draft.documentPath === documentPath &&
    draft.id !== selectedThread.id
}
