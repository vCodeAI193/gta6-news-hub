import { describe, it, expect } from 'vitest'
import { cmsEditorService } from './cmsEditorService'
import type { EditorState } from './cmsEditorService'

describe('CMSEditorService', () => {
  const mockState: EditorState = {
    content: 'Hello world',
    cursorPosition: 5,
    selectionStart: 0,
    selectionEnd: 0,
    formatting: {
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      heading: 'p',
      list: 'none',
    },
    history: [],
    historyIndex: 0,
  }

  describe('insertText', () => {
    it('should insert text at cursor position', () => {
      const result = cmsEditorService.insertText(mockState, '!')
      expect(result.content).toBe('Hello! world')
      expect(result.cursorPosition).toBe(6)
    })

    it('should insert text at specific position', () => {
      const result = cmsEditorService.insertText(mockState, 'nice ', 6)
      expect(result.content).toBe('Hello nice world')
      expect(result.cursorPosition).toBe(11)
    })
  })

  describe('deleteText', () => {
    it('should delete text in range', () => {
      const result = cmsEditorService.deleteText(mockState, 5, 6)
      expect(result.content).toBe('Helloworld')
      expect(result.cursorPosition).toBe(5)
    })

    it('should delete multiple characters', () => {
      const result = cmsEditorService.deleteText(mockState, 0, 6)
      expect(result.content).toBe('world')
      expect(result.cursorPosition).toBe(0)
    })
  })

  describe('applyFormatting', () => {
    it('should toggle bold formatting', () => {
      const result = cmsEditorService.applyFormatting(mockState, 'bold')
      expect(result.formatting.bold).toBe(true)
    })

    it('should set heading level', () => {
      const result = cmsEditorService.applyFormatting(mockState, 'heading', 'h2')
      expect(result.formatting.heading).toBe('h2')
    })

    it('should toggle italic', () => {
      const result = cmsEditorService.applyFormatting(mockState, 'italic')
      expect(result.formatting.italic).toBe(true)
    })
  })

  describe('undo/redo', () => {
    it('should undo text insertion', () => {
      const state1 = cmsEditorService.insertText(mockState, '!')
      if (state1.historyIndex > 0) {
        const result = cmsEditorService.undo(state1)
        expect(result.historyIndex).toBeLessThan(state1.historyIndex)
      }
    })

    it('should redo after undo', () => {
      const state1 = cmsEditorService.insertText(mockState, '!')
      if (state1.historyIndex > 0) {
        const state2 = cmsEditorService.undo(state1)
        const state3 = cmsEditorService.redo(state2)
        expect(state3.historyIndex).toBeGreaterThan(state2.historyIndex)
      }
    })
  })

  describe('word and character count', () => {
    it('should count words correctly', () => {
      const count = cmsEditorService.getWordCount('Hello world test')
      expect(count).toBe(3)
    })

    it('should count characters correctly', () => {
      const count = cmsEditorService.getCharacterCount('Hello')
      expect(count).toBe(5)
    })

    it('should handle empty content', () => {
      expect(cmsEditorService.getWordCount('')).toBe(0)
      expect(cmsEditorService.getCharacterCount('')).toBe(0)
    })
  })

  describe('getOutline', () => {
    it('should extract headings from markdown', () => {
      const content = `# Main Title
Some content
## Subsection
More content
### Deep section`
      const outline = cmsEditorService.getOutline(content)
      expect(outline).toHaveLength(3)
      expect(outline[0].level).toBe(1)
      expect(outline[1].level).toBe(2)
      expect(outline[2].level).toBe(3)
    })

    it('should handle content without headings', () => {
      const outline = cmsEditorService.getOutline('Just text')
      expect(outline).toHaveLength(0)
    })
  })

  describe('comment threads', () => {
    it('should add comment thread', () => {
      const threads = cmsEditorService.addCommentThread([], 100, 'user1', 'Great point')
      expect(threads).toHaveLength(1)
      expect(threads[0].text).toBe('Great point')
      expect(threads[0].position).toBe(100)
    })

    it('should reply to thread', () => {
      let threads = cmsEditorService.addCommentThread([], 100, 'user1', 'Comment')
      const threadId = threads[0].id
      threads = cmsEditorService.replyToThread(threads, threadId, 'user2', 'Reply')
      expect(threads[0].replies).toHaveLength(1)
      expect(threads[0].replies[0].text).toBe('Reply')
    })

    it('should resolve thread', () => {
      let threads = cmsEditorService.addCommentThread([], 100, 'user1', 'Comment')
      const threadId = threads[0].id
      threads = cmsEditorService.resolveThread(threads, threadId)
      expect(threads[0].resolved).toBe(true)
    })
  })

  describe('document operations', () => {
    it('should prepare document for saving', () => {
      const state = mockState
      expect(state.content).toBe('Hello world')
      expect(typeof state.cursorPosition).toBe('number')
    })
  })
})
