import { createId, readJSON, writeJSON } from './storage'

export interface Comment {
  id: string
  articleId: string
  author: string
  text: string
  createdAt: string // ISO
  parentId: string | null
}

const KEY = 'comments'

function all(): Comment[] {
  return readJSON<Comment[]>(KEY, [])
}

export function getComments(articleId: string): Comment[] {
  return all()
    .filter((c) => c.articleId === articleId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function addComment(
  articleId: string,
  author: string,
  text: string,
  parentId: string | null = null,
  now: Date = new Date(),
): Comment {
  const comment: Comment = {
    id: createId('c'),
    articleId,
    author: author.trim() || 'Anonym',
    text: text.trim(),
    createdAt: now.toISOString(),
    parentId,
  }
  writeJSON(KEY, [...all(), comment])
  return comment
}

export function removeComment(id: string): void {
  // Entfernt Kommentar und direkte Antworten.
  writeJSON(
    KEY,
    all().filter((c) => c.id !== id && c.parentId !== id),
  )
}

export function countComments(articleId: string): number {
  return all().filter((c) => c.articleId === articleId).length
}

/** Abgeleitetes Leaderboard: aktivste Kommentator:innen. */
export function commentLeaderboard(limit = 5): Array<{ author: string; count: number }> {
  const counts = new Map<string, number>()
  for (const c of all()) counts.set(c.author, (counts.get(c.author) ?? 0) + 1)
  return [...counts.entries()]
    .map(([author, count]) => ({ author, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}
