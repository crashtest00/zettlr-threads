export type CommentThreadStatus = 'open'|'resolved'
export type CommentThreadAuthor = 'user'|'claude'

export interface CommentMessage {
  author: CommentThreadAuthor
  timestamp: string
  body: string
}

export interface CommentThread {
  id: string
  status: CommentThreadStatus
  messages: CommentMessage[]
  from: number
  to: number
  line: number
}

export type SerializableCommentThread = Omit<CommentThread, 'from'|'to'|'line'>
