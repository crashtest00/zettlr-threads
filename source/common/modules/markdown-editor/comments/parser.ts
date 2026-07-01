import type { CommentMessage, CommentThread, CommentThreadAuthor, CommentThreadStatus, SerializableCommentThread } from './types'
import { parseCommentMarkers } from './markers'

const MESSAGE_HEADER_RE = /^\[(user|claude) \| (.+?)\]$/

function isValidStatus (status: string): status is CommentThreadStatus {
  return status === 'open' || status === 'resolved'
}

function isCommentOpenLine (line: string): boolean {
  return /^(\s*)<!--$/.test(line)
}

function removeIndent (line: string, indent: string): string|null {
  if (indent.length === 0) {
    return line
  }

  if (line === '') {
    return line
  }

  return line.startsWith(indent) ? line.slice(indent.length) : null
}

function parseBlock (block: string[], from: number, to: number, lineNumber: number, indent: string): CommentThread|null {
  const lines: string[] = []
  for (const line of block.slice(1, -1)) {
    const dedented = removeIndent(line, indent)
    if (dedented === null) {
      return null
    }
    lines.push(dedented)
  }

  let id: string|undefined
  let status: CommentThreadStatus|undefined
  let index = 0

  for (; index < lines.length; index++) {
    const line = lines[index]
    if (MESSAGE_HEADER_RE.test(line)) {
      break
    }

    if (line.startsWith('@thread ')) {
      id = line.slice('@thread '.length).trim()
    } else if (line.startsWith('@status ')) {
      const candidate = line.slice('@status '.length).trim()
      if (!isValidStatus(candidate)) {
        return null
      }
      status = candidate
    } else if (line.trim() !== '') {
      return null
    }
  }

  if (id === undefined || id === '' || status === undefined) {
    return null
  }

  const messages: CommentMessage[] = []
  let current: CommentMessage|undefined

  for (; index < lines.length; index++) {
    const line = lines[index]
    const match = MESSAGE_HEADER_RE.exec(line)

    if (match !== null) {
      current = {
        author: match[1] as CommentThreadAuthor,
        timestamp: match[2],
        body: ''
      }
      messages.push(current)
      continue
    }

    if (current === undefined) {
      if (line.trim() === '') {
        continue
      }
      return null
    }

    current.body += current.body.length === 0 ? line : `\n${line}`
  }

  return {
    id,
    status,
    messages,
    markers: [],
    from,
    to,
    line: lineNumber
  }
}

export function parseCommentThreads (doc: string): CommentThread[] {
  const threads: CommentThread[] = []
  const markers = parseCommentMarkers(doc)
  const lines = doc.split('\n')
  let offset = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const openMatch = /^(\s*)<!--$/.exec(line)

    if (openMatch === null || !isCommentOpenLine(line)) {
      offset += line.length + (i < lines.length - 1 ? 1 : 0)
      continue
    }

    const indent = openMatch[1]
    const from = offset
    const block = [line]
    let blockOffset = offset + line.length + (i < lines.length - 1 ? 1 : 0)
    let closingIndex = -1

    for (let j = i + 1; j < lines.length; j++) {
      const candidate = lines[j]
      block.push(candidate)
      const dedented = removeIndent(candidate, indent)
      if (dedented === '-->') {
        closingIndex = j
        break
      }
      blockOffset += candidate.length + (j < lines.length - 1 ? 1 : 0)
    }

    if (closingIndex === -1) {
      offset += line.length + (i < lines.length - 1 ? 1 : 0)
      continue
    }

    const closingLine = lines[closingIndex]
    const to = blockOffset + closingLine.length
    const parsed = parseBlock(block, from, to, i + 1, indent)
    if (parsed !== null) {
      parsed.markers = markers.get(parsed.id) ?? []
      threads.push(parsed)
    }

    for (; i < closingIndex; i++) {
      offset += lines[i].length + (i < lines.length - 1 ? 1 : 0)
    }
    offset += lines[closingIndex].length + (closingIndex < lines.length - 1 ? 1 : 0)
  }

  return threads
}

export function serializeCommentThread (thread: SerializableCommentThread): string {
  const lines = [
    '<!--',
    `@thread ${thread.id}`,
    `@status ${thread.status}`,
    ''
  ]

  for (const [ index, message ] of thread.messages.entries()) {
    if (index > 0) {
      lines.push('')
    }
    lines.push(`[${message.author} | ${message.timestamp}]`)
    lines.push(message.body.replace(/-->/g, '--\\>'))
  }

  lines.push('-->')
  return lines.join('\n')
}

export function replaceCommentThreadBlock (doc: string, thread: CommentThread, replacement: string): string {
  return doc.slice(0, thread.from) + replacement + doc.slice(thread.to)
}
