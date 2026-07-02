import { syntaxTree } from '@codemirror/language'
import type { ChangeSpec, EditorState } from '@codemirror/state'
import type { SyntaxNode } from '@lezer/common'
import type { CommentMarker, CommentThreadStatus } from './types'

export const COMMENT_MARKER_PREFIX = '#zettlr-comment-'
export const OPEN_COMMENT_LABEL = '💬'
export const RESOLVED_COMMENT_LABEL = '✓'

const COMMENT_MARKER_RE = /\[(💬|✓)\]\(#zettlr-comment-([^)]+)\)/g
const COMMENT_MARKER_FRAGMENT_RE = /^#zettlr-comment-(.+)$/
const INLINE_CONSTRUCTS = new Set([
  'Link',
  'Autolink',
  'Emphasis',
  'StrongEmphasis',
  'Strikethrough',
  'InlineCode'
])
const BLOCK_CONSTRUCTS = new Set([ 'FencedCode', 'CodeBlock' ])
const TABLE_CONSTRUCTS = new Set([ 'Table', 'TableHeader', 'TableRow', 'TableCell' ])

export function formatCommentMarker (id: string, status: CommentThreadStatus = 'open'): string {
  const label = status === 'resolved' ? RESOLVED_COMMENT_LABEL : OPEN_COMMENT_LABEL
  return `[${label}](${COMMENT_MARKER_PREFIX}${id})`
}

export function parseCommentMarkerFragment (fragment: string): string|undefined {
  return COMMENT_MARKER_FRAGMENT_RE.exec(fragment)?.[1]
}

export function parseCommentMarkers (doc: string): Map<string, CommentMarker[]> {
  const markers = new Map<string, CommentMarker[]>()

  for (const match of doc.matchAll(COMMENT_MARKER_RE)) {
    if (match.index === undefined || match[2].length === 0) {
      continue
    }

    const marker: CommentMarker = {
      from: match.index,
      to: match.index + match[0].length,
      status: match[1] === RESOLVED_COMMENT_LABEL ? 'resolved' : 'open'
    }
    markers.set(match[2], [ ...(markers.get(match[2]) ?? []), marker ])
  }

  return markers
}

export function quoteCommentSelection (selection: string): string {
  const trimmed = selection.trim()
  return trimmed.length === 0
    ? ''
    : trimmed.split('\n').map(line => `> ${line}`).join('\n')
}

export function effectiveCommentCreationPosition (
  selection: { empty: boolean, head: number, to: number },
  selectedText: string
): number {
  if (selection.empty) {
    return selection.head
  }

  const trailingWhitespace = /\s*$/.exec(selectedText)?.[0].length ?? 0
  return selection.to - trailingWhitespace
}

export function appendThreadBlock (doc: string, block: string): string {
  if (doc.length === 0) {
    return block
  }

  const trailingNewlines = /\n*$/.exec(doc)?.[0].length ?? 0
  return `${'\n'.repeat(Math.max(0, 2 - trailingNewlines))}${block}`
}

export function commentThreadCreationChanges (
  state: EditorState,
  position: number,
  marker: string,
  block: string
): ChangeSpec {
  const doc = state.sliceDoc()
  const markerPosition = safeCommentMarkerPosition(state, position)
  const markerLine = state.doc.lineAt(markerPosition)
  const markerInsert = markerPosition === markerLine.from && markerLine.length === 0
    ? `${marker}\n`
    : marker

  return markerPosition === state.doc.length
    ? { from: markerPosition, insert: markerInsert + appendThreadBlock(doc + markerInsert, block) }
    : [
      { from: markerPosition, insert: markerInsert },
      { from: state.doc.length, insert: appendThreadBlock(doc, block) }
    ]
}

export function provisionalCommentMarkerChange (
  state: EditorState,
  position: number,
  marker: string
): { from: number, insert: string } {
  const markerPosition = safeCommentMarkerPosition(state, position)
  const markerLine = state.doc.lineAt(markerPosition)
  const insert = markerPosition === markerLine.from && markerLine.length === 0
    ? `${marker}\n`
    : marker

  return { from: markerPosition, insert }
}

export function provisionalCommentMarkerRemoval (
  state: EditorState,
  id: string
): { from: number, to: number, insert: string }|undefined {
  const markers = parseCommentMarkers(state.sliceDoc()).get(id)
  if (markers?.length !== 1) {
    return undefined
  }

  const marker = markers[0]
  const removeTrailingNewline = marker.from === state.doc.lineAt(marker.from).from &&
    marker.to < state.doc.length &&
    state.sliceDoc(marker.to, marker.to + 1) === '\n'

  return {
    from: marker.from,
    to: marker.to + (removeTrailingNewline ? 1 : 0),
    insert: ''
  }
}

export function commentThreadResolutionChanges (
  thread: { id: string, markers: CommentMarker[], from: number, to: number },
  block: string
): ChangeSpec|undefined {
  if (thread.markers.length !== 1) {
    return undefined
  }

  return [
    {
      from: thread.markers[0].from,
      to: thread.markers[0].to,
      insert: formatCommentMarker(thread.id, 'resolved')
    },
    { from: thread.from, to: thread.to, insert: block }
  ]
}

export function commentThreadDeletionChanges (
  state: EditorState,
  thread: { markers: CommentMarker[], from: number, to: number }
): ChangeSpec|undefined {
  if (thread.markers.length !== 1) {
    return undefined
  }

  const blockTo = thread.to < state.doc.length && state.sliceDoc(thread.to, thread.to + 1) === '\n'
    ? thread.to + 1
    : thread.to

  return [
    { from: thread.markers[0].from, to: thread.markers[0].to, insert: '' },
    { from: thread.from, to: blockTo, insert: '' }
  ]
}

export function safeCommentMarkerPosition (state: EditorState, position: number): number {
  const boundedPosition = Math.max(0, Math.min(position, state.doc.length))
  let node: SyntaxNode|null = syntaxTree(state).resolveInner(boundedPosition, -1)
  let target = boundedPosition
  let insideTable = false

  while (node !== null) {
    if (BLOCK_CONSTRUCTS.has(node.name)) {
      target = node.to < state.doc.length && state.sliceDoc(node.to, node.to + 1) === '\n'
        ? node.to + 1
        : node.to
    } else if (INLINE_CONSTRUCTS.has(node.name)) {
      target = Math.max(target, node.to)
    }
    insideTable ||= TABLE_CONSTRUCTS.has(node.name)
    node = node.parent
  }

  if (target === boundedPosition || !insideTable) {
    return target
  }

  const line = state.doc.lineAt(boundedPosition)
  const withinLineTarget = Math.min(target, line.to)
  return state.sliceDoc(boundedPosition, withinLineTarget).includes('|')
    ? boundedPosition
    : target
}
