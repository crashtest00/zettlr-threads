import generateId from '@common/util/generate-id'
import type { CommentThread, SerializableCommentThread } from './types'

export function getLocalTimestamp (date = new Date()): string {
  const pad = (value: number): string => value.toString().padStart(2, '0')
  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const absOffset = Math.abs(offsetMinutes)
  const offset = `${sign}${pad(Math.floor(absOffset / 60))}:${pad(absOffset % 60)}`

  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    'T',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
    ':',
    pad(date.getSeconds()),
    offset
  ].join('')
}

export function createCommentThread (initialBody = ''): SerializableCommentThread {
  return {
    id: `c${generateId()}`,
    status: 'open',
    messages: initialBody.trim().length > 0
      ? [{ author: 'user', timestamp: getLocalTimestamp(), body: initialBody }]
      : []
  }
}

export function appendUserReply (thread: CommentThread, body: string): SerializableCommentThread {
  return {
    id: thread.id,
    status: thread.status,
    messages: [
      ...thread.messages,
      { author: 'user', timestamp: getLocalTimestamp(), body }
    ]
  }
}

export function editCommentMessage (thread: CommentThread, messageIndex: number, body: string): SerializableCommentThread {
  return {
    id: thread.id,
    status: thread.status,
    messages: thread.messages.map((message, index) => {
      return index === messageIndex ? { ...message, body } : message
    })
  }
}

export function resolveThread (thread: CommentThread): SerializableCommentThread {
  return {
    id: thread.id,
    status: 'resolved',
    messages: thread.messages
  }
}
