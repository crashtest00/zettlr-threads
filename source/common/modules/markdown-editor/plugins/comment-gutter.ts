import { StateField, type EditorState, type Extension, type Range } from '@codemirror/state'
import { EditorView, gutter, GutterMarker, type BlockInfo, Decoration, type DecorationSet } from '@codemirror/view'
import { parseCommentThreads } from '../comments/parser'
import type { CommentThread } from '../comments/types'

class CommentGutterMarker extends GutterMarker {
  constructor (readonly threads: CommentThread[] = []) {
    super()
  }

  toDOM (_view: EditorView): Node {
    const container = document.createElement('span')
    container.className = 'cm-comment-thread-marker-group'

    for (const thread of this.threads.length > 0 ? this.threads : [undefined]) {
      const marker = document.createElement('cds-icon')
      marker.setAttribute('shape', 'chat-bubble')
      marker.setAttribute('solid', 'true')
      marker.setAttribute('size', 'sm')
      marker.title = 'Open comment thread'
      marker.className = thread?.status === 'resolved'
        ? 'cm-comment-thread-marker cm-comment-thread-marker-resolved'
        : 'cm-comment-thread-marker'
      if (thread !== undefined) {
        marker.dataset.threadFrom = String(thread.from)
      }
      container.appendChild(marker)
    }

    return container
  }
}

function markerLineFrom (state: EditorState, thread: CommentThread, threads: CommentThread[]): number {
  const openingLine = state.doc.lineAt(thread.from)
  if (openingLine.number === 1) {
    return openingLine.from
  }

  let candidateLineNumber = openingLine.number - 1
  while (candidateLineNumber > 1) {
    const candidateLine = state.doc.line(candidateLineNumber)
    const containingThread = threads.find(candidate => {
      return candidateLine.from >= candidate.from && candidateLine.from < candidate.to
    })

    if (containingThread === undefined) {
      return candidateLine.from
    }

    candidateLineNumber = state.doc.lineAt(containingThread.from).number - 1
  }

  return state.doc.line(candidateLineNumber).from
}

function threadsAtMarkerLine (view: EditorView, line: BlockInfo): CommentThread[] {
  const threads = parseCommentThreads(view.state.sliceDoc())
  return threads
    .filter(thread => markerLineFrom(view.state, thread, threads) === line.from)
    .sort((a, b) => {
      const aTimestamp = a.messages[0]?.timestamp ?? ''
      const bTimestamp = b.messages[0]?.timestamp ?? ''
      return aTimestamp.localeCompare(bTimestamp) || a.from - b.from
    })
}

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

const hiddenCommentThreads = StateField.define<DecorationSet>({
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

export const commentGutter: Extension[] = [
  hiddenCommentThreads,
  gutter({
    class: 'cm-comment-gutter',
    renderEmptyElements: false,
    lineMarker (view: EditorView, line: BlockInfo, _otherMarkers: readonly GutterMarker[]): GutterMarker|null {
      const threads = threadsAtMarkerLine(view, line)
      return threads.length === 0 ? null : new CommentGutterMarker(threads)
    },
    initialSpacer: () => new CommentGutterMarker(),
    domEventHandlers: {
      click (view, line, event) {
        const threads = threadsAtMarkerLine(view, line)
        const marker = (event.target as HTMLElement|null)?.closest<HTMLElement>('.cm-comment-thread-marker')
        const threadFrom = marker?.dataset.threadFrom
        const thread = threadFrom !== undefined
          ? threads.find(candidate => candidate.from === Number(threadFrom))
          : threads[0]
        if (thread === undefined) {
          return false
        }

        view.dom.dispatchEvent(new CustomEvent<CommentThread>('comment-thread-selected', {
          detail: thread,
          bubbles: true
        }))
        event.preventDefault()
        return true
      }
    }
  }),
  EditorView.baseTheme({
    '.cm-comment-gutter': {
      flexShrink: '0'
    },
    '.cm-comment-gutter .cm-gutterElement': {
      alignItems: 'center',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'center',
      minWidth: '24px',
      opacity: '0.95'
    },
    '.cm-comment-thread-marker-group': {
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: '0',
      gap: '2px',
      padding: '2px 0'
    },
    '.cm-comment-thread-marker': {
      display: 'block',
      flexShrink: '0',
      height: '14px',
      width: '14px'
    },
    '.cm-comment-thread-marker-resolved': {
      opacity: '0.45'
    }
  })
]
