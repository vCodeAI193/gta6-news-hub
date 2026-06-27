import type { CategoryId } from '../types'
import { readJSON, writeJSON } from './storage'

/**
 * Nutzerbezogene Listen & Markierungen: Favoriten/Lesezeichen, „Später lesen",
 * gelesen-Status, Themen-Abos. Alles lokal pro Browser.
 */

function listKey(name: string) {
  return `userdata:${name}`
}

function getSet(name: string): Set<string> {
  return new Set(readJSON<string[]>(listKey(name), []))
}

function saveSet(name: string, set: Set<string>): void {
  writeJSON(listKey(name), [...set])
}

function toggleIn(name: string, id: string): boolean {
  const set = getSet(name)
  const has = set.has(id)
  if (has) set.delete(id)
  else set.add(id)
  saveSet(name, set)
  return !has
}

// --- Favoriten / Lesezeichen ---
export const getFavorites = () => getSet('favorites')
export const isFavorite = (id: string) => getSet('favorites').has(id)
export const toggleFavorite = (id: string) => toggleIn('favorites', id)

// --- Später lesen ---
export const getReadLater = () => getSet('readlater')
export const isReadLater = (id: string) => getSet('readlater').has(id)
export const toggleReadLater = (id: string) => toggleIn('readlater', id)

// --- Gelesen-Markierung ---
export const getRead = () => getSet('read')
export const isRead = (id: string) => getSet('read').has(id)
export function markRead(id: string): void {
  const set = getSet('read')
  if (!set.has(id)) {
    set.add(id)
    saveSet('read', set)
  }
}
export const toggleRead = (id: string) => toggleIn('read', id)

// --- Themen-Abos (Kategorien) ---
export function getSubscriptions(): CategoryId[] {
  return readJSON<CategoryId[]>(listKey('subscriptions'), [])
}
export function isSubscribed(cat: CategoryId): boolean {
  return getSubscriptions().includes(cat)
}
export function toggleSubscription(cat: CategoryId): boolean {
  return toggleIn('subscriptions', cat)
}
