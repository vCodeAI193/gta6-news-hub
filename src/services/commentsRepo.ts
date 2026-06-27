import { api, isApiEnabled } from './api'
import * as local from './commentsService'
import type { Comment } from './commentsService'

/**
 * Kommentar-Zugriff: echtes Backend (mit Moderation/Spam-Filter), wenn
 * `VITE_API_URL` gesetzt ist, sonst die lokale localStorage-Variante.
 */
export async function getComments(articleId: string): Promise<Comment[]> {
  if (isApiEnabled()) {
    const { comments } = await api<{ comments: Comment[] }>(`/api/articles/${articleId}/comments`)
    return comments
  }
  return local.getComments(articleId)
}

export interface AddCommentResult {
  comment: Comment
  /** Gesetzt, wenn der Kommentar zur Moderation zurückgehalten wurde. */
  moderation: string | null
}

export async function addComment(
  articleId: string,
  author: string,
  text: string,
  parentId: string | null = null,
): Promise<AddCommentResult> {
  if (isApiEnabled()) {
    return api<AddCommentResult>(`/api/articles/${articleId}/comments`, {
      method: 'POST',
      body: { text, parentId },
    })
  }
  return { comment: local.addComment(articleId, author, text, parentId), moderation: null }
}

export async function removeComment(id: string): Promise<void> {
  if (isApiEnabled()) {
    await api(`/api/comments/${id}`, { method: 'DELETE' })
    return
  }
  local.removeComment(id)
}

/** Kommentar up-/downvoten (nur im Backend-Modus). value: 1 | -1 | 0. */
export async function voteComment(id: string, value: number): Promise<{ score: number; myVote: number }> {
  return api<{ score: number; myVote: number }>(`/api/comments/${id}/vote`, { method: 'POST', body: { value } })
}

export const commentsSupportVoting = isApiEnabled
