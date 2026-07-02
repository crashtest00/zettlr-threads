import { deepStrictEqual, equal, strictEqual } from 'assert'
import { EditorState, Transaction } from '@codemirror/state'
import { history, redo, undo } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import markdownParser from 'source/common/modules/markdown-editor/parser/markdown-parser'
import { appendUserReply, resolveThread } from 'source/common/modules/markdown-editor/comments/commands'
import { shouldCancelCommentThreadDraft } from 'source/common/modules/markdown-editor/comments/drafts'
import type { CommentThreadDraft } from 'source/common/modules/markdown-editor/comments/types'
import { parseCommentThreads, replaceCommentThreadBlock, serializeCommentThread } from 'source/common/modules/markdown-editor/comments/parser'
import {
  appendThreadBlock,
  commentThreadDeletionChanges,
  commentThreadCreationChanges,
  commentThreadResolutionChanges,
  effectiveCommentCreationPosition,
  formatCommentMarker,
  parseCommentMarkerFragment,
  parseCommentMarkers,
  provisionalCommentMarkerChange,
  provisionalCommentMarkerRemoval,
  quoteCommentSelection,
  safeCommentMarkerPosition
} from 'source/common/modules/markdown-editor/comments/markers'

const CANONICAL_THREAD = `<!--
@thread c1
@status open

[user | 2026-06-18T14:35:00-05:00]
This feels weak. Can you suggest a rewrite?
-->`

describe('Comment threads', function () {
  it('does not cancel the durable marker when selecting a promoted draft', () => {
    const draft: CommentThreadDraft = {
      id: 'c1',
      body: 'New comment',
      position: 4,
      documentPath: '/workspace/note.md'
    }
    const selectedThread = parseCommentThreads(
      `${formatCommentMarker('c1')}\n\n${CANONICAL_THREAD}`
    )[0]

    strictEqual(shouldCancelCommentThreadDraft(draft, selectedThread, '/workspace/note.md'), false)
    strictEqual(
      shouldCancelCommentThreadDraft(
        { ...draft, id: 'different-draft' },
        selectedThread,
        '/workspace/note.md'
      ),
      true
    )
    strictEqual(shouldCancelCommentThreadDraft(draft, selectedThread, '/workspace/other.md'), false)
  })

  it('formats and parses open and resolved markers', () => {
    const doc = `${formatCommentMarker('c1')} ${formatCommentMarker('c2', 'resolved')}`
    const markers = parseCommentMarkers(doc)

    strictEqual(markers.get('c1')?.[0].status, 'open')
    strictEqual(markers.get('c2')?.[0].status, 'resolved')
    strictEqual(markers.get('c2')?.[0].from, formatCommentMarker('c1').length + 1)
  })

  it('recognizes only complete comment-marker fragments', () => {
    strictEqual(parseCommentMarkerFragment('#zettlr-comment-c1'), 'c1')
    strictEqual(parseCommentMarkerFragment('https://example.com/#zettlr-comment-c1'), undefined)
    strictEqual(parseCommentMarkerFragment('#ordinary-fragment'), undefined)
  })

  it('quotes a trimmed selection while preserving internal blank lines', () => {
    strictEqual(
      quoteCommentSelection('  **First**\n\nSecond  '),
      '> **First**\n> \n> Second'
    )
    strictEqual(quoteCommentSelection(' \n '), '')
  })

  it('anchors selected text at its trimmed endpoint regardless of selection direction', () => {
    strictEqual(
      effectiveCommentCreationPosition({ empty: false, head: 10, to: 20 }, 'cell text  '),
      18
    )
    strictEqual(
      effectiveCommentCreationPosition({ empty: false, head: 4, to: 20 }, 'cell text  '),
      18
    )
    strictEqual(
      effectiveCommentCreationPosition({ empty: true, head: 7, to: 7 }, ''),
      7
    )
  })

  it('adds safe document-end separation before a thread block', () => {
    strictEqual(appendThreadBlock('', CANONICAL_THREAD), CANONICAL_THREAD)
    strictEqual(appendThreadBlock('Text', CANONICAL_THREAD), `\n\n${CANONICAL_THREAD}`)
    strictEqual(appendThreadBlock('Text\n', CANONICAL_THREAD), `\n${CANONICAL_THREAD}`)
    strictEqual(appendThreadBlock('Text\n\n', CANONICAL_THREAD), CANONICAL_THREAD)
  })

  it('moves marker insertion beyond enclosing inline and block constructs', () => {
    const linkDoc = 'A [linked phrase](https://example.com) here'
    const linkState = EditorState.create({ doc: linkDoc, extensions: [ markdown() ] })
    strictEqual(
      safeCommentMarkerPosition(linkState, linkDoc.indexOf('phrase')),
      linkDoc.indexOf(')') + 1
    )

    const emphasisDoc = 'A **bold phrase** here'
    const emphasisState = EditorState.create({ doc: emphasisDoc, extensions: [ markdown() ] })
    strictEqual(
      safeCommentMarkerPosition(emphasisState, emphasisDoc.indexOf('phrase')),
      emphasisDoc.lastIndexOf('**') + 2
    )

    const inlineCodeDoc = 'A `code phrase` here'
    const inlineCodeState = EditorState.create({ doc: inlineCodeDoc, extensions: [ markdown() ] })
    strictEqual(
      safeCommentMarkerPosition(inlineCodeState, inlineCodeDoc.indexOf('phrase')),
      inlineCodeDoc.lastIndexOf('`') + 1
    )

    const autolinkDoc = 'A <https://example.com/path> here'
    const autolinkState = EditorState.create({ doc: autolinkDoc, extensions: [ markdown() ] })
    strictEqual(
      safeCommentMarkerPosition(autolinkState, autolinkDoc.indexOf('example')),
      autolinkDoc.indexOf('>') + 1
    )

    const strikethroughDoc = 'A ~~struck phrase~~ here'
    const strikethroughState = EditorState.create({
      doc: strikethroughDoc,
      extensions: [ markdownParser() ]
    })
    strictEqual(
      safeCommentMarkerPosition(strikethroughState, strikethroughDoc.indexOf('phrase')),
      strikethroughDoc.lastIndexOf('~~') + 2
    )

    const codeDoc = 'Before\n\n```ts\nconst value = 1\n```\n\nAfter'
    const codeState = EditorState.create({ doc: codeDoc, extensions: [ markdown() ] })
    strictEqual(
      safeCommentMarkerPosition(codeState, codeDoc.indexOf('value')),
      codeDoc.indexOf('\n\nAfter') + 1
    )

    const indentedCodeDoc = 'Before\n\n    const value = 1\n\nAfter'
    const indentedCodeState = EditorState.create({ doc: indentedCodeDoc, extensions: [ markdown() ] })
    strictEqual(
      safeCommentMarkerPosition(indentedCodeState, indentedCodeDoc.indexOf('value')),
      indentedCodeDoc.indexOf('\n\nAfter') + 1
    )
  })

  it('keeps ordinary table-cell cursor positions inside the selected cell', () => {
    const tableDoc = [
      '| Name | Description | Status |',
      '| --- | --- | --- |',
      '| Alpha | Comment on ordinary cell text | Open |'
    ].join('\n')
    const position = tableDoc.indexOf('ordinary') + 1
    const state = EditorState.create({ doc: tableDoc, extensions: [ markdown() ] })

    strictEqual(safeCommentMarkerPosition(state, position), position)
  })

  it('creates and undoes or redoes a marker and EOF block atomically', () => {
    let state = EditorState.create({
      doc: 'Text',
      extensions: [ markdown(), history() ]
    })
    const marker = formatCommentMarker('c1')
    state = state.update({
      changes: commentThreadCreationChanges(state, 2, marker, CANONICAL_THREAD)
    }).state

    strictEqual(state.sliceDoc(), `Te${marker}xt\n\n${CANONICAL_THREAD}`)
    strictEqual(undo({ state, dispatch: transaction => { state = transaction.state } }), true)
    strictEqual(state.sliceDoc(), 'Text')
    strictEqual(redo({ state, dispatch: transaction => { state = transaction.state } }), true)
    strictEqual(state.sliceDoc(), `Te${marker}xt\n\n${CANONICAL_THREAD}`)
  })

  it('inserts and removes only the reserved provisional marker', () => {
    const existing = formatCommentMarker('existing')
    const marker = formatCommentMarker('draft')
    let state = EditorState.create({
      doc: `Text ${existing}`,
      extensions: [ markdown() ]
    })

    state = state.update({
      changes: provisionalCommentMarkerChange(state, 2, marker)
    }).state
    strictEqual(state.sliceDoc(), `Te${marker}xt ${existing}`)

    const removal = provisionalCommentMarkerRemoval(state, 'draft')
    strictEqual(removal !== undefined, true)
    state = state.update({ changes: removal }).state
    strictEqual(state.sliceDoc(), `Text ${existing}`)
  })

  it('keeps provisional changes out of history and submits an atomic durable pair', () => {
    let state = EditorState.create({
      doc: 'Text',
      extensions: [ markdown(), history() ]
    })
    const marker = formatCommentMarker('draft')
    state = state.update({
      changes: provisionalCommentMarkerChange(state, 2, marker),
      annotations: Transaction.addToHistory.of(false)
    }).state
    strictEqual(state.sliceDoc(), `Te${marker}xt`)

    const removal = provisionalCommentMarkerRemoval(state, 'draft')
    strictEqual(removal !== undefined, true)
    state = state.update({
      changes: removal,
      annotations: Transaction.addToHistory.of(false)
    }).state
    state = state.update({
      changes: commentThreadCreationChanges(state, removal!.from, marker, CANONICAL_THREAD)
    }).state

    strictEqual(undo({ state, dispatch: transaction => { state = transaction.state } }), true)
    strictEqual(state.sliceDoc(), 'Text')
    strictEqual(redo({ state, dispatch: transaction => { state = transaction.state } }), true)
    strictEqual(state.sliceDoc(), `Te${marker}xt\n\n${CANONICAL_THREAD}`)
  })

  it('places provisional markers with the same safe-placement rules as submission', () => {
    const doc = 'A **bold phrase** here'
    const state = EditorState.create({ doc, extensions: [ markdown() ] })
    const marker = formatCommentMarker('draft')
    const change = provisionalCommentMarkerChange(state, doc.indexOf('phrase'), marker)

    strictEqual(change.from, doc.lastIndexOf('**') + 2)
    strictEqual(state.update({ changes: change }).state.sliceDoc(), 'A **bold phrase**[💬](#zettlr-comment-draft) here')
  })

  it('preserves a blank line between a block marker and following indented code', () => {
    const doc = '```ts\nconst value = 1\n```\n\n    const next = 2'
    const state = EditorState.create({ doc, extensions: [ markdown() ] })
    const marker = formatCommentMarker('c1')
    const changes = commentThreadCreationChanges(
      state,
      doc.indexOf('value'),
      marker,
      CANONICAL_THREAD
    )
    const updated = state.update({ changes }).state.sliceDoc()

    strictEqual(updated.includes(`\`\`\`\n${marker}\n\n    const next = 2`), true)
  })

  it('resolves the marker and matching block atomically', () => {
    const marker = formatCommentMarker('c1')
    let state = EditorState.create({
      doc: `${marker}\n\n${CANONICAL_THREAD}`,
      extensions: [ markdown(), history() ]
    })
    const thread = parseCommentThreads(state.sliceDoc())[0]
    const resolvedBlock = serializeCommentThread(resolveThread(thread))
    const changes = commentThreadResolutionChanges(thread, resolvedBlock)
    strictEqual(changes !== undefined, true)

    state = state.update({ changes }).state
    strictEqual(state.sliceDoc().includes(formatCommentMarker('c1', 'resolved')), true)
    strictEqual(state.sliceDoc().includes('@status resolved'), true)
    strictEqual(undo({ state, dispatch: transaction => { state = transaction.state } }), true)
    strictEqual(state.sliceDoc(), `${marker}\n\n${CANONICAL_THREAD}`)
  })

  it('deletes the marker and matching block atomically', () => {
    const marker = formatCommentMarker('c1')
    const original = `Text ${marker}\n\n${CANONICAL_THREAD}`
    let state = EditorState.create({
      doc: original,
      extensions: [ markdown(), history() ]
    })
    const thread = parseCommentThreads(state.sliceDoc())[0]
    const changes = commentThreadDeletionChanges(state, thread)
    strictEqual(changes !== undefined, true)

    state = state.update({ changes }).state
    strictEqual(state.sliceDoc(), 'Text \n\n')
    strictEqual(undo({ state, dispatch: transaction => { state = transaction.state } }), true)
    strictEqual(state.sliceDoc(), original)
  })

  it('parses one canonical thread', () => {
    const threads = parseCommentThreads(CANONICAL_THREAD)

    equal(threads.length, 1)
    strictEqual(threads[0].id, 'c1')
    strictEqual(threads[0].status, 'open')
    strictEqual(threads[0].line, 1)
    deepStrictEqual(threads[0].markers, [])
    deepStrictEqual(threads[0].messages, [
      {
        author: 'user',
        timestamp: '2026-06-18T14:35:00-05:00',
        body: 'This feels weak. Can you suggest a rewrite?'
      }
    ])
  })

  it('joins matching markers to canonical thread blocks by ID', () => {
    const marker = formatCommentMarker('c1')
    const thread = parseCommentThreads(`${marker}\n\n${CANONICAL_THREAD}`)[0]

    equal(thread.markers.length, 1)
    strictEqual(thread.markers[0].from, 0)
    strictEqual(thread.markers[0].to, marker.length)
  })

  it('parses multiple threads and reports correct line numbers', () => {
    const doc = `Intro

${CANONICAL_THREAD}

Middle

<!--
@thread c2
@status resolved

[claude | 2026-06-18T14:36:00-05:00]
Resolved.
-->`
    const threads = parseCommentThreads(doc)

    equal(threads.length, 2)
    strictEqual(threads[0].line, 3)
    strictEqual(threads[1].line, 13)
    strictEqual(threads[1].status, 'resolved')
  })

  it('ignores plain HTML comments', () => {
    deepStrictEqual(parseCommentThreads('<!--\nA normal comment\n-->'), [])
  })

  it('ignores malformed thread blocks', () => {
    const doc = `<!--
@thread c1
@status unknown

[user | 2026-06-18T14:35:00-05:00]
Nope
-->

<!--
@status open

[user | 2026-06-18T14:35:00-05:00]
Missing id
-->`

    deepStrictEqual(parseCommentThreads(doc), [])
  })

  it('preserves multiline message bodies', () => {
    const thread = parseCommentThreads(`<!--
@thread c1
@status open

[user | 2026-06-18T14:35:00-05:00]
Line one
Line two
Line three
-->`)[0]

    strictEqual(thread.messages[0].body, 'Line one\nLine two\nLine three')
  })

  it('serializes a thread to canonical format', () => {
    strictEqual(serializeCommentThread({
      id: 'c1',
      status: 'open',
      messages: [
        {
          author: 'user',
          timestamp: '2026-06-18T14:35:00-05:00',
          body: 'This feels weak. Can you suggest a rewrite?'
        }
      ]
    }), CANONICAL_THREAD)
  })

  it('separates serialized messages with a canonical blank line', () => {
    const serialized = serializeCommentThread({
      id: 'c1',
      status: 'open',
      messages: [
        {
          author: 'user',
          timestamp: '2026-06-18T14:35:00-05:00',
          body: 'First thought.'
        },
        {
          author: 'user',
          timestamp: '2026-06-18T14:36:00-05:00',
          body: 'Second thought.'
        }
      ]
    })

    strictEqual(serialized.includes('First thought.\n\n[user | 2026-06-18T14:36:00-05:00]'), true)
    strictEqual(serialized.includes('&#10;'), false)
  })

  it('escapes closing comments in message bodies', () => {
    const serialized = serializeCommentThread({
      id: 'c1',
      status: 'open',
      messages: [
        {
          author: 'user',
          timestamp: '2026-06-18T14:35:00-05:00',
          body: 'Do not close --> here'
        }
      ]
    })

    strictEqual(serialized.includes('Do not close --\\> here'), true)
  })

  it('updates status from open to resolved', () => {
    const thread = parseCommentThreads(CANONICAL_THREAD)[0]
    const replacement = serializeCommentThread(resolveThread(thread))

    strictEqual(replacement.includes('@status resolved'), true)
  })

  it('appends a user reply without changing existing messages', () => {
    const thread = parseCommentThreads(CANONICAL_THREAD)[0]
    const updated = appendUserReply(thread, 'Second thought.')

    equal(updated.messages.length, 2)
    deepStrictEqual(updated.messages[0], thread.messages[0])
    strictEqual(updated.messages[1].author, 'user')
    strictEqual(updated.messages[1].body, 'Second thought.')
  })

  it('handles duplicate IDs without dropping either block', () => {
    const doc = `${CANONICAL_THREAD}\n\n${CANONICAL_THREAD}`

    equal(parseCommentThreads(doc).length, 2)
  })

  it('replaces a thread block by offsets', () => {
    const doc = `Before\n${CANONICAL_THREAD}\nAfter`
    const thread = parseCommentThreads(doc)[0]

    strictEqual(replaceCommentThreadBlock(doc, thread, '<!-- replaced -->'), 'Before\n<!-- replaced -->\nAfter')
  })
})
