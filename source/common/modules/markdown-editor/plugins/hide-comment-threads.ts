import { StateField, type EditorState, type Range } from '@codemirror/state'
import { EditorView, Decoration, type DecorationSet } from '@codemirror/view'
import { parseCommentThreads } from '../comments/parser'

function hideCommentThreads (state: EditorState): DecorationSet {
  const ranges: Array<Range<Decoration>> = []
  const hidden = Decoration.replace({})
  const doc = state.doc

  for (const thread of parseCommentThreads(state.sliceDoc())) {
    const to = thread.to < doc.length && doc.sliceString(thread.to, thread.to + 1) === '\n'
      ? thread.to + 1
      : thread.to

    ranges.push(hidden.range(thread.from, to))
  }

  return Decoration.set(ranges, true)
}

export const hiddenCommentThreads = StateField.define<DecorationSet>({
  create (state) {
    return hideCommentThreads(state)
  },
  update (decorations, transaction) {
    if (transaction.docChanged) {
      return hideCommentThreads(transaction.state)
    } else {
      return decorations.map(transaction.changes)
    }
  },
  provide (field) {
    return EditorView.decorations.from(field)
  }
})
