import { api, isApiEnabled } from './api'
import { readJSON, writeJSON, createId } from './storage'

/** Stabile, anonyme Client-ID für die A/B-Varianten-Zuweisung. */
export function getClientId(): string {
  let id = readJSON<string | null>('ab:clientId', null)
  if (!id) {
    id = createId('cid')
    writeJSON('ab:clientId', id)
  }
  return id
}

export async function getAssignments(): Promise<Record<string, string>> {
  if (!isApiEnabled()) return {}
  const { assignments } = await api<{ assignments: Record<string, string> }>(
    `/api/experiments?clientId=${encodeURIComponent(getClientId())}`,
    { auth: false },
  )
  return assignments
}

export function trackAb(experiment: string, variant: string, type: 'view' | 'convert'): void {
  if (!isApiEnabled()) return
  api('/api/ab/track', { method: 'POST', body: { experiment, variant, type, clientId: getClientId() }, auth: false }).catch(() => {})
}
