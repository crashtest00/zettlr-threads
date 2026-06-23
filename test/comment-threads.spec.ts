import { deepStrictEqual, equal, strictEqual } from 'assert'
import { appendUserReply, resolveThread } from 'source/common/modules/markdown-editor/comments/commands'
import { parseCommentThreads, replaceCommentThreadBlock, serializeCommentThread } from 'source/common/modules/markdown-editor/comments/parser'

const CANONICAL_THREAD = `<!--
@thread c1
@status open

[user | 2026-06-18T14:35:00-05:00]
This feels weak. Can you suggest a rewrite?
-->`

describe('Comment threads', function () {
  it('parses one canonical thread', () => {
    const threads = parseCommentThreads(CANONICAL_THREAD)

    equal(threads.length, 1)
    strictEqual(threads[0].id, 'c1')
    strictEqual(threads[0].status, 'open')
    strictEqual(threads[0].line, 1)
    deepStrictEqual(threads[0].messages, [
      {
        author: 'user',
        timestamp: '2026-06-18T14:35:00-05:00',
        body: 'This feels weak. Can you suggest a rewrite?'
      }
    ])
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
