import { readJSON, writeJSON } from './storage'
import type { Article } from '../types'

const HIDDEN_TAGS_KEY = 'hiddenTags'
const HIDDEN_SOURCES_KEY = 'hiddenSources'

export function getHiddenTags(): string[] {
  return readJSON<string[]>(HIDDEN_TAGS_KEY, [])
}

export function getHiddenSources(): string[] {
  return readJSON<string[]>(HIDDEN_SOURCES_KEY, [])
}

export function hideTag(tag: string): void {
  const tags = getHiddenTags()
  if (!tags.includes(tag)) {
    writeJSON(HIDDEN_TAGS_KEY, [...tags, tag])
  }
}

export function hideSource(source: string): void {
  const sources = getHiddenSources()
  if (!sources.includes(source)) {
    writeJSON(HIDDEN_SOURCES_KEY, [...sources, source])
  }
}

export function unhide(item: string): void {
  writeJSON(HIDDEN_TAGS_KEY, getHiddenTags().filter((t) => t !== item))
  writeJSON(HIDDEN_SOURCES_KEY, getHiddenSources().filter((s) => s !== item))
}

export function isHidden(article: Article): boolean {
  const hiddenTags = getHiddenTags()
  const hiddenSources = getHiddenSources()
  if (hiddenSources.includes(article.source)) return true
  if (article.tags?.some((t) => hiddenTags.includes(t))) return true
  return false
}
