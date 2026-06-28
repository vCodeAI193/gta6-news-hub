import { readJSON, writeJSON } from './storage';

export interface ModerationEntry {
  id: string;
  type: 'comment' | 'article' | 'user';
  contentId: string;
  reason: string;
  status: 'pending' | 'approved' | 'removed';
  createdAt: number;
  resolvedAt?: number;
}

export interface UserWarning {
  id: string;
  userId: string;
  reason: string;
  level: 1 | 2 | 3;
  createdAt: number;
}

export interface TrustScore {
  score: number;
  factors: string[];
}

export function getModerationQueue(): ModerationEntry[] {
  return readJSON<ModerationEntry[]>('moderation_queue', []);
}

export function addToQueue(entry: Omit<ModerationEntry, 'id' | 'createdAt'>): ModerationEntry {
  const queue = getModerationQueue();
  const newEntry: ModerationEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  writeJSON('moderation_queue', [...queue, newEntry]);
  return newEntry;
}

export function resolveEntry(id: string, status: 'approved' | 'removed'): ModerationEntry {
  const queue = getModerationQueue();
  const updated = queue.map(e =>
    e.id === id ? { ...e, status, resolvedAt: Date.now() } : e
  );
  writeJSON('moderation_queue', updated);
  const entry = updated.find(e => e.id === id)!;
  logAudit('resolve_moderation', 'system', `Entry ${id} marked as ${status}`);
  return entry;
}

export function getTransparencyLog(): ModerationEntry[] {
  return getModerationQueue().filter(e => e.status !== 'pending');
}

export function warnUser(userId: string, reason: string): UserWarning {
  const warnings = getUserWarnings(userId);
  const level = Math.min(warnings.length + 1, 3) as 1 | 2 | 3;
  const warning: UserWarning = {
    id: crypto.randomUUID(),
    userId,
    reason,
    level,
    createdAt: Date.now(),
  };
  const all = readJSON<UserWarning[]>('user_warnings', []);
  writeJSON('user_warnings', [...all, warning]);
  logAudit('warn_user', userId, `Level ${level}: ${reason}`);
  return warning;
}

export function getUserWarnings(userId: string): UserWarning[] {
  return readJSON<UserWarning[]>('user_warnings', []).filter(w => w.userId === userId);
}

export function getShadowBanned(): string[] {
  return readJSON<string[]>('shadow_banned', []);
}

export function shadowBan(userId: string): void {
  const banned = getShadowBanned();
  if (!banned.includes(userId)) {
    writeJSON('shadow_banned', [...banned, userId]);
    logAudit('shadow_ban', userId, 'User shadow banned');
  }
}

export function unban(userId: string): void {
  const banned = getShadowBanned();
  writeJSON('shadow_banned', banned.filter(id => id !== userId));
  logAudit('unban', userId, 'User unbanned');
}

export function computeTrustScore(
  userId: string,
  stats: { commentsCount: number; reportsReceived: number; age: number }
): TrustScore {
  const factors: string[] = [];
  let score = 50;

  if (stats.commentsCount > 10) { score += 10; factors.push('Aktiver Kommentator'); }
  if (stats.commentsCount > 50) { score += 10; factors.push('Sehr aktiver Kommentator'); }
  if (stats.reportsReceived === 0) { score += 20; factors.push('Keine Meldungen'); }
  if (stats.reportsReceived > 3) { score -= 20; factors.push('Mehrere Meldungen'); }
  if (stats.reportsReceived > 10) { score -= 30; factors.push('Viele Meldungen'); }
  if (stats.age > 30) { score += 10; factors.push('Altmitglied (>30 Tage)'); }

  const warnings = getUserWarnings(userId);
  if (warnings.length > 0) { score -= warnings.length * 10; factors.push(`${warnings.length} Verwarnungen`); }
  if (getShadowBanned().includes(userId)) { score = 0; factors.push('Shadow-gebannt'); }

  return { score: Math.max(0, Math.min(100, score)), factors };
}

export function getSourceBlacklist(): string[] {
  return readJSON<string[]>('source_blacklist', []);
}

export function addToBlacklist(source: string): void {
  const list = getSourceBlacklist();
  if (!list.includes(source)) writeJSON('source_blacklist', [...list, source]);
}

export function getSourceWhitelist(): string[] {
  return readJSON<string[]>('source_whitelist', []);
}

export function addToWhitelist(source: string): void {
  const list = getSourceWhitelist();
  if (!list.includes(source)) writeJSON('source_whitelist', [...list, source]);
}

export function flagSpoiler(text: string): boolean {
  return /spoiler(\s+alert)?/i.test(text);
}

export function isSpam(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  // Repeated chars
  if (/(.)\1{5,}/.test(text)) return true;
  // Excessive caps (>70% uppercase in longer texts)
  if (text.length > 10) {
    const caps = (text.match(/[A-Z]/g) || []).length;
    if (caps / text.length > 0.7) return true;
  }
  // Known spam patterns
  const spamPatterns = [
    /buy\s+now/i, /click\s+here/i, /free\s+money/i, /casino/i,
    /http[s]?:\/\/\S+\s+http[s]?:\/\/\S+/i, // multiple URLs
    /\bviagra\b/i, /\bpills\b.*\bcheap\b/i,
  ];
  return spamPatterns.some(p => p.test(text));
}

export function getCommentQualityScore(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  let score = 0;

  // Length score (up to 40 points)
  const len = text.trim().length;
  score += Math.min(40, Math.floor(len / 5));

  // Punctuation (up to 20 points)
  const punctuation = (text.match(/[.!?,;:]/g) || []).length;
  score += Math.min(20, punctuation * 5);

  // Not spam (30 points)
  if (!isSpam(text)) score += 30;

  // No excessive caps (10 points)
  const caps = (text.match(/[A-Z]/g) || []).length;
  if (text.length > 0 && caps / text.length < 0.3) score += 10;

  return Math.min(100, score);
}

export interface AuditEntry {
  action: string;
  userId: string;
  timestamp: number;
  details: string;
}

export function getAuditLog(): AuditEntry[] {
  return readJSON<AuditEntry[]>('audit_log', []);
}

export function logAudit(action: string, userId: string, details: string): void {
  const log = getAuditLog();
  writeJSON('audit_log', [...log, { action, userId, timestamp: Date.now(), details }]);
}

export function exportUserData(userId: string): object {
  return {
    userId,
    warnings: getUserWarnings(userId),
    shadowBanned: getShadowBanned().includes(userId),
    exportedAt: new Date().toISOString(),
  };
}

export function deleteUserData(userId: string): void {
  const warnings = readJSON<UserWarning[]>('user_warnings', []);
  writeJSON('user_warnings', warnings.filter(w => w.userId !== userId));
  const banned = getShadowBanned();
  writeJSON('shadow_banned', banned.filter(id => id !== userId));
  logAudit('gdpr_delete', userId, 'User data deleted per GDPR request');
}
