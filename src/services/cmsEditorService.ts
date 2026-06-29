/**
 * CMS Editor Service
 * Advanced text editing with cursor tracking, formatting, and collaborative features
 */

export interface EditorState {
  content: string
  cursorPosition: number
  selectionStart: number
  selectionEnd: number
  formatting: FormattingState
  history: EditorHistoryEntry[]
  historyIndex: number
}

export interface FormattingState {
  bold: boolean
  italic: boolean
  underline: boolean
  strikethrough: boolean
  heading: 'h1' | 'h2' | 'h3' | 'p'
  list: 'none' | 'ul' | 'ol'
}

export interface EditorHistoryEntry {
  content: string
  cursorPosition: number
  timestamp: number
  operation: 'insert' | 'delete' | 'format'
}

export interface CommentThread {
  id: string
  position: number
  authorId: string
  text: string
  resolved: boolean
  createdAt: number
  replies: Comment[]
}

export interface Comment {
  id: string
  authorId: string
  text: string
  createdAt: number
}

class CMSEditorService {
  private static readonly MAX_HISTORY_SIZE = 100

  /**
   * Insert text at cursor position
   */
  insertText(
    state: EditorState,
    text: string,
    position: number = state.cursorPosition
  ): EditorState {
    const newContent =
      state.content.slice(0, position) + text + state.content.slice(position)

    let newHistory = [...state.history]

    if (state.historyIndex + 1 < newHistory.length) {
      newHistory = newHistory.slice(0, state.historyIndex + 1)
    }

    newHistory = this.addToHistory(newHistory, {
      content: newContent,
      cursorPosition: position + text.length,
      timestamp: Date.now(),
      operation: 'insert',
    })

    return {
      ...state,
      content: newContent,
      cursorPosition: position + text.length,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    }
  }

  /**
   * Delete text from range
   */
  deleteText(
    state: EditorState,
    start: number,
    end: number
  ): EditorState {
    const newContent =
      state.content.slice(0, start) + state.content.slice(end)

    let newHistory = [...state.history]

    if (state.historyIndex + 1 < newHistory.length) {
      newHistory = newHistory.slice(0, state.historyIndex + 1)
    }

    newHistory = this.addToHistory(newHistory, {
      content: newContent,
      cursorPosition: start,
      timestamp: Date.now(),
      operation: 'delete',
    })

    return {
      ...state,
      content: newContent,
      cursorPosition: start,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    }
  }

  /**
   * Apply formatting to selection
   */
  applyFormatting(
    state: EditorState,
    format: keyof FormattingState,
    value?: unknown
  ): EditorState {
    const newFormatting = { ...state.formatting }

    if (typeof value === 'string') {
      newFormatting[format as 'heading' | 'list'] = value as never
    } else {
      newFormatting[format as 'bold' | 'italic' | 'underline' | 'strikethrough'] = !newFormatting[format as 'bold' | 'italic' | 'underline' | 'strikethrough']
    }

    let newHistory = [...state.history]

    if (state.historyIndex + 1 < newHistory.length) {
      newHistory = newHistory.slice(0, state.historyIndex + 1)
    }

    newHistory = this.addToHistory(newHistory, {
      content: state.content,
      cursorPosition: state.cursorPosition,
      timestamp: Date.now(),
      operation: 'format',
    })

    return {
      ...state,
      formatting: newFormatting,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    }
  }

  /**
   * Undo last action
   */
  undo(state: EditorState): EditorState {
    if (state.historyIndex < 0 || state.history.length === 0) return state

    const newIndex = state.historyIndex - 1
    if (newIndex < 0) return state

    const entry = state.history[newIndex]!

    return {
      ...state,
      content: entry.content,
      cursorPosition: entry.cursorPosition,
      historyIndex: newIndex,
    }
  }

  /**
   * Redo last undone action
   */
  redo(state: EditorState): EditorState {
    if (state.historyIndex >= state.history.length - 1) return state

    const newIndex = state.historyIndex + 1
    const entry = state.history[newIndex]!

    return {
      ...state,
      content: entry.content,
      cursorPosition: entry.cursorPosition,
      historyIndex: newIndex,
    }
  }

  /**
   * Get word count
   */
  getWordCount(content: string): number {
    return content.trim().split(/\s+/).filter(w => w.length > 0).length
  }

  /**
   * Get character count
   */
  getCharacterCount(content: string): number {
    return content.length
  }

  /**
   * Extract headings for outline
   */
  getOutline(content: string): Array<{ level: number; text: string; position: number }> {
    const headingPattern = /^(#{1,6})\s+(.+)$/gm
    const headings: Array<{ level: number; text: string; position: number }> = []
    let match

    while ((match = headingPattern.exec(content)) !== null) {
      headings.push({
        level: match[1]!.length,
        text: match[2]!,
        position: match.index,
      })
    }

    return headings
  }

  /**
   * Add comment thread at position
   */
  addCommentThread(
    threads: CommentThread[],
    position: number,
    authorId: string,
    text: string
  ): CommentThread[] {
    const thread: CommentThread = {
      id: `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position,
      authorId,
      text,
      resolved: false,
      createdAt: Date.now(),
      replies: [],
    }

    return [...threads, thread]
  }

  /**
   * Reply to comment thread
   */
  replyToThread(
    threads: CommentThread[],
    threadId: string,
    authorId: string,
    text: string
  ): CommentThread[] {
    return threads.map(thread => {
      if (thread.id === threadId) {
        return {
          ...thread,
          replies: [
            ...thread.replies,
            {
              id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              authorId,
              text,
              createdAt: Date.now(),
            },
          ],
        }
      }
      return thread
    })
  }

  /**
   * Resolve comment thread
   */
  resolveThread(threads: CommentThread[], threadId: string): CommentThread[] {
    return threads.map(thread =>
      thread.id === threadId ? { ...thread, resolved: true } : thread
    )
  }

  /**
   * Save document to backend
   */
  async saveDocument(
    documentId: string,
    content: string,
    metadata: { title: string; status: string }
  ): Promise<{ id: string; savedAt: number }> {
    const response = await fetch(`/api/cms/documents/${documentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, metadata }),
    })

    if (!response.ok) throw new Error('Failed to save document')
    return response.json()
  }

  /**
   * Get document revision history
   */
  async getRevisionHistory(documentId: string): Promise<Array<{
    id: string
    timestamp: number
    authorId: string
    summary: string
  }>> {
    const response = await fetch(`/api/cms/documents/${documentId}/revisions`)
    if (!response.ok) return []
    return response.json()
  }

  private addToHistory(
    history: EditorHistoryEntry[],
    entry: EditorHistoryEntry
  ): EditorHistoryEntry[] {
    const newHistory = [...history, entry]
    return newHistory.slice(-CMSEditorService.MAX_HISTORY_SIZE)
  }
}

export const cmsEditorService = new CMSEditorService()
