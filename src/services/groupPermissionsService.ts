/**
 * Group Permissions & Advanced Community Features — Wave 5
 * Extends socialService.ts with:
 * 1. Group moderator roles with permission system
 * 2. Private groups (invite-only)
 * 3. Group pinned messages system
 * 4. Comment threading with nested replies
 * 5. Friend statistics dashboard (article read tracking)
 *
 * All persistence via localStorage. Local simulation only.
 */

import { readJSON, writeJSON, createId } from './storage'

const ME = 'ich'

// ─────────────────────────────────────────────────────────────────────────────
// 1. GROUP MODERATOR ROLES & PERMISSIONS
// ─────────────────────────────────────────────────────────────────────────────

export type ModeratorRole = 'admin' | 'moderator' | 'member'

export interface Permission {
  id: string
  name: string // e.g., 'can_pin_message', 'can_delete_message', 'can_mute_user'
  description: string
}

export interface RolePermissions {
  role: ModeratorRole
  permissions: string[] // permission IDs
}

export interface GroupMember {
  userId: string
  role: ModeratorRole
  joinedAt: number
  lastActive: number
}

const DEFAULT_PERMISSIONS: Permission[] = [
  { id: 'pin_message', name: 'Pin Messages', description: 'Can pin/unpin messages in group' },
  { id: 'delete_message', name: 'Delete Messages', description: 'Can delete any message in group' },
  { id: 'mute_user', name: 'Mute Users', description: 'Can temporarily mute group members' },
  { id: 'ban_user', name: 'Ban Users', description: 'Can permanently ban users from group' },
  { id: 'edit_description', name: 'Edit Group', description: 'Can edit group description and settings' },
  { id: 'manage_members', name: 'Manage Members', description: 'Can invite/remove members' },
  { id: 'create_event', name: 'Create Events', description: 'Can create group events' },
  { id: 'post_without_review', name: 'Post Without Review', description: 'Posts appear immediately' },
]

const ROLE_PERMISSIONS_MAP: Record<ModeratorRole, string[]> = {
  admin: [
    'pin_message',
    'delete_message',
    'mute_user',
    'ban_user',
    'edit_description',
    'manage_members',
    'create_event',
    'post_without_review',
  ],
  moderator: [
    'pin_message',
    'delete_message',
    'mute_user',
    'edit_description',
    'create_event',
    'post_without_review',
  ],
  member: [],
}

export function getPermissions(): Permission[] {
  return DEFAULT_PERMISSIONS
}

export function hasPermission(userId: string, groupId: string, permissionId: string): boolean {
  const member = getGroupMember(groupId, userId)
  if (!member) return false

  const rolePerms = ROLE_PERMISSIONS_MAP[member.role] ?? []
  return rolePerms.includes(permissionId)
}

export function canUserDeleteMessage(userId: string, groupId: string): boolean {
  return hasPermission(userId, groupId, 'delete_message')
}

export function canUserPinMessage(userId: string, groupId: string): boolean {
  return hasPermission(userId, groupId, 'pin_message')
}

export function canUserMuteUser(userId: string, groupId: string): boolean {
  return hasPermission(userId, groupId, 'mute_user')
}

export function canUserManageMembers(userId: string, groupId: string): boolean {
  return hasPermission(userId, groupId, 'manage_members')
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PRIVATE GROUPS (INVITE-ONLY)
// ─────────────────────────────────────────────────────────────────────────────

export interface GroupSettings {
  isPrivate: boolean
  requireApproval: boolean // Requests must be approved by admin
  invitedUsers: string[] // Email/username of invited users
  mutedUsers: string[] // Users who are muted
  bannedUsers: string[] // Users who are banned
}

export interface ExtendedGroup {
  id: string
  name: string
  description: string
  tags: string[]
  memberCount: number
  createdAt: number
  creator: string
  settings: GroupSettings
  members: GroupMember[] // Full member roster with roles
}

export function getExtendedGroup(groupId: string): ExtendedGroup | null {
  const groups = readJSON<ExtendedGroup[]>('community:extendedGroups', [])
  return groups.find((g) => g.id === groupId) ?? null
}

export function getAllExtendedGroups(): ExtendedGroup[] {
  return readJSON<ExtendedGroup[]>('community:extendedGroups', [])
}

export function createExtendedGroup(
  name: string,
  description: string,
  isPrivate: boolean = false,
): ExtendedGroup {
  const group: ExtendedGroup = {
    id: createId('g'),
    name,
    description,
    tags: [],
    memberCount: 1,
    createdAt: Date.now(),
    creator: ME,
    settings: {
      isPrivate,
      requireApproval: isPrivate,
      invitedUsers: [],
      mutedUsers: [],
      bannedUsers: [],
    },
    members: [
      {
        userId: ME,
        role: 'admin',
        joinedAt: Date.now(),
        lastActive: Date.now(),
      },
    ],
  }
  const stored = readJSON<ExtendedGroup[]>('community:extendedGroups', [])
  writeJSON('community:extendedGroups', [...stored, group])
  return group
}

export function getGroupMember(groupId: string, userId: string): GroupMember | null {
  const group = getExtendedGroup(groupId)
  if (!group) return null
  return group.members.find((m) => m.userId === userId) ?? null
}

export function getAllGroupMembers(groupId: string): GroupMember[] {
  const group = getExtendedGroup(groupId)
  return group?.members ?? []
}

export function canJoinGroup(groupId: string, userId: string): boolean {
  const group = getExtendedGroup(groupId)
  if (!group) return false
  if (group.settings.bannedUsers.includes(userId)) return false
  if (!group.settings.isPrivate) return true
  return group.settings.invitedUsers.includes(userId)
}

export function joinExtendedGroup(groupId: string, userId: string = ME): boolean {
  const group = getExtendedGroup(groupId)
  if (!group) return false

  // Check if already a member
  if (group.members.some((m) => m.userId === userId)) return true

  // Check permissions
  if (!canJoinGroup(groupId, userId)) return false

  const updated: ExtendedGroup = {
    ...group,
    memberCount: group.memberCount + 1,
    members: [
      ...group.members,
      {
        userId,
        role: 'member',
        joinedAt: Date.now(),
        lastActive: Date.now(),
      },
    ],
  }

  const stored = readJSON<ExtendedGroup[]>('community:extendedGroups', [])
  writeJSON(
    'community:extendedGroups',
    stored.map((g) => (g.id === groupId ? updated : g)),
  )
  return true
}

export function inviteUserToGroup(groupId: string, invitedUsername: string): boolean {
  const group = getExtendedGroup(groupId)
  if (!group) return false
  if (!group.settings.invitedUsers.includes(invitedUsername)) {
    const updated: ExtendedGroup = {
      ...group,
      settings: {
        ...group.settings,
        invitedUsers: [...group.settings.invitedUsers, invitedUsername],
      },
    }
    const stored = readJSON<ExtendedGroup[]>('community:extendedGroups', [])
    writeJSON(
      'community:extendedGroups',
      stored.map((g) => (g.id === groupId ? updated : g)),
    )
  }
  return true
}

export function muteUserInGroup(groupId: string, userId: string): boolean {
  const group = getExtendedGroup(groupId)
  if (!group || !hasPermission(ME, groupId, 'mute_user')) return false

  if (!group.settings.mutedUsers.includes(userId)) {
    const updated: ExtendedGroup = {
      ...group,
      settings: {
        ...group.settings,
        mutedUsers: [...group.settings.mutedUsers, userId],
      },
    }
    const stored = readJSON<ExtendedGroup[]>('community:extendedGroups', [])
    writeJSON(
      'community:extendedGroups',
      stored.map((g) => (g.id === groupId ? updated : g)),
    )
  }
  return true
}

export function banUserFromGroup(groupId: string, userId: string): boolean {
  const group = getExtendedGroup(groupId)
  if (!group || !hasPermission(ME, groupId, 'ban_user')) return false

  if (!group.settings.bannedUsers.includes(userId)) {
    const updated: ExtendedGroup = {
      ...group,
      members: group.members.filter((m) => m.userId !== userId),
      memberCount: Math.max(0, group.memberCount - 1),
      settings: {
        ...group.settings,
        bannedUsers: [...group.settings.bannedUsers, userId],
        mutedUsers: group.settings.mutedUsers.filter((u) => u !== userId),
      },
    }
    const stored = readJSON<ExtendedGroup[]>('community:extendedGroups', [])
    writeJSON(
      'community:extendedGroups',
      stored.map((g) => (g.id === groupId ? updated : g)),
    )
  }
  return true
}

export function promoteUserToModerator(groupId: string, userId: string): boolean {
  const group = getExtendedGroup(groupId)
  if (!group || !hasPermission(ME, groupId, 'manage_members')) return false

  const updated: ExtendedGroup = {
    ...group,
    members: group.members.map((m) =>
      m.userId === userId ? { ...m, role: 'moderator' as ModeratorRole } : m,
    ),
  }

  const stored = readJSON<ExtendedGroup[]>('community:extendedGroups', [])
  writeJSON(
    'community:extendedGroups',
    stored.map((g) => (g.id === groupId ? updated : g)),
  )
  return true
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. GROUP PINNED MESSAGES SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export interface PinnedMessage {
  id: string
  messageId: string
  groupId: string
  author: string
  text: string
  pinnedAt: number
  pinnedBy: string
}

export function getPinnedMessages(groupId: string): PinnedMessage[] {
  const all = readJSON<PinnedMessage[]>('community:pinnedMessages', [])
  return all
    .filter((p) => p.groupId === groupId)
    .sort((a, b) => b.pinnedAt - a.pinnedAt) // Most recent first
}

export function pinMessage(
  messageId: string,
  groupId: string,
  author: string,
  text: string,
): boolean {
  const groupPin = getExtendedGroup(groupId)
  if (!groupPin || !hasPermission(ME, groupId, 'pin_message')) return false

  const existing = readJSON<PinnedMessage[]>('community:pinnedMessages', [])
  const alreadyPinned = existing.some((p) => p.messageId === messageId && p.groupId === groupId)

  if (!alreadyPinned) {
    const pin: PinnedMessage = {
      id: createId('pin'),
      messageId,
      groupId,
      author,
      text,
      pinnedAt: Date.now(),
      pinnedBy: ME,
    }
    writeJSON('community:pinnedMessages', [...existing, pin])
  }
  return true
}

export function unpinMessage(messageId: string, groupId: string): boolean {
  const group = getExtendedGroup(groupId)
  if (!group || !hasPermission(ME, groupId, 'pin_message')) return false

  const all = readJSON<PinnedMessage[]>('community:pinnedMessages', [])
  writeJSON(
    'community:pinnedMessages',
    all.filter((p) => !(p.messageId === messageId && p.groupId === groupId)),
  )
  return true
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. COMMENT THREADING WITH NESTED REPLIES
// ─────────────────────────────────────────────────────────────────────────────

export interface ThreadedComment {
  id: string
  groupId: string
  articleId: string
  parentId: string | null // null for root comments, ID for replies
  author: string
  text: string
  createdAt: number
  updatedAt: number
  score: number
  replies: ThreadedComment[] // Nested replies (populated by getCommentThread)
  depth: number // How deep in the nesting (0 = root)
}

export function createThreadedComment(
  groupId: string,
  articleId: string,
  text: string,
  parentId?: string,
): ThreadedComment {
  const comment: ThreadedComment = {
    id: createId('comment'),
    groupId,
    articleId,
    parentId: parentId ?? null,
    author: ME,
    text,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    score: 0,
    replies: [],
    depth: 0,
  }

  const all = readJSON<ThreadedComment[]>('community:threaded_comments', [])
  writeJSON('community:threaded_comments', [...all, comment])
  return comment
}

export function getCommentThread(articleId: string, groupId?: string): ThreadedComment[] {
  const all = readJSON<ThreadedComment[]>('community:threaded_comments', [])
  let filtered = all.filter((c) => c.articleId === articleId)

  if (groupId) {
    filtered = filtered.filter((c) => c.groupId === groupId)
  }

  // Build tree structure with replies nested
  const buildTree = (comments: ThreadedComment[], parentId: string | null = null, depth = 0) => {
    return comments
      .filter((c) => c.parentId === parentId)
      .map((c) => ({
        ...c,
        depth,
        replies: buildTree(comments, c.id, depth + 1),
      }))
      .sort((a, b) => b.score - a.score || b.createdAt - a.createdAt)
  }

  return buildTree(filtered)
}

export function getThreadReplies(parentCommentId: string): ThreadedComment[] {
  const all = readJSON<ThreadedComment[]>('community:threaded_comments', [])
  return all
    .filter((c) => c.parentId === parentCommentId)
    .sort((a, b) => a.createdAt - b.createdAt) // Chronological for replies
}

export function voteThreadedComment(commentId: string, voteDirection: 1 | -1): void {
  const all = readJSON<ThreadedComment[]>('community:threaded_comments', [])
  const userVotes = readJSON<Record<string, number>>('community:userCommentVotes', {})

  // Check if already voted
  if (userVotes[commentId]) return

  const updated = all.map((c) =>
    c.id === commentId ? { ...c, score: c.score + voteDirection } : c,
  )

  writeJSON('community:threaded_comments', updated)
  writeJSON('community:userCommentVotes', { ...userVotes, [commentId]: voteDirection })
}

export function deleteThreadedComment(commentId: string): boolean {
  const all = readJSON<ThreadedComment[]>('community:threaded_comments', [])
  const comment = all.find((c) => c.id === commentId)

  if (!comment || comment.author !== ME) return false

  writeJSON(
    'community:threaded_comments',
    all.filter((c) => c.id !== commentId),
  )
  return true
}

export function editThreadedComment(commentId: string, newText: string): boolean {
  const all = readJSON<ThreadedComment[]>('community:threaded_comments', [])
  const comment = all.find((c) => c.id === commentId)

  if (!comment || comment.author !== ME) return false

  const updated = all.map((c) =>
    c.id === commentId ? { ...c, text: newText, updatedAt: Date.now() } : c,
  )

  writeJSON('community:threaded_comments', updated)
  return true
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. FRIEND STATISTICS DASHBOARD (ARTICLE READ TRACKING)
// ─────────────────────────────────────────────────────────────────────────────

export interface ArticleReadEvent {
  id: string
  userId: string
  articleId: string
  readAt: number
  timeSpentSeconds: number
}

export interface FriendStats {
  userId: string
  articlesRead: number
  totalTimeSpentSeconds: number
  lastReadAt: number
  recentArticles: string[] // Article IDs read in last 30 days
  favoriteTopics: Record<string, number> // topic -> count
  readStreak: number // consecutive days with reads
}

export interface SocialStats {
  friendId: string
  username: string
  articlesPublished: number
  friendsCount: number
  followersCount: number
  reciprocalFriends: string[] // Mutual friends
  stats: FriendStats
}

export function trackArticleRead(
  userId: string,
  articleId: string,
  timeSpentSeconds: number,
): void {
  const event: ArticleReadEvent = {
    id: createId('read'),
    userId,
    articleId,
    readAt: Date.now(),
    timeSpentSeconds,
  }

  const all = readJSON<ArticleReadEvent[]>('social:articleReads', [])
  writeJSON('social:articleReads', [...all, event])
}

export function getArticleReaders(articleId: string): SocialStats[] {
  const all = readJSON<ArticleReadEvent[]>('social:articleReads', [])
  const readers = all.filter((e) => e.articleId === articleId)

  const friendsList = readJSON<string[]>('social:friends', [])
  const followers = readJSON<Record<string, string[]>>('social:followers', {})

  const stats: Record<string, SocialStats> = {}

  for (const reader of readers) {
    if (!stats[reader.userId]) {
      const reciprocal = friendsList.filter((f) => (followers[f] ?? []).includes(reader.userId))
      stats[reader.userId] = {
        friendId: reader.userId,
        username: reader.userId, // In real app, fetch from user service
        articlesPublished: 0,
        friendsCount: friendsList.length,
        followersCount: (followers[reader.userId] ?? []).length,
        reciprocalFriends: reciprocal,
        stats: {
          userId: reader.userId,
          articlesRead: 0,
          totalTimeSpentSeconds: 0,
          lastReadAt: 0,
          recentArticles: [],
          favoriteTopics: {},
          readStreak: 0,
        },
      }
    }

    const stat = stats[reader.userId].stats
    stat.articlesRead++
    stat.totalTimeSpentSeconds += reader.timeSpentSeconds
    stat.lastReadAt = Math.max(stat.lastReadAt, reader.readAt)
  }

  return Object.values(stats)
}

export function getUserReadStats(userId: string = ME): FriendStats | null {
  const all = readJSON<ArticleReadEvent[]>('social:articleReads', [])
  const userReads = all.filter((e) => e.userId === userId)

  if (userReads.length === 0) {
    return {
      userId,
      articlesRead: 0,
      totalTimeSpentSeconds: 0,
      lastReadAt: 0,
      recentArticles: [],
      favoriteTopics: {},
      readStreak: 0,
    }
  }

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const recentReads = userReads.filter((e) => e.readAt > thirtyDaysAgo)

  // Calculate read streak (simplified: days with at least one read)
  const readDates = new Set(
    userReads
      .filter((e) => e.readAt > Date.now() - 90 * 24 * 60 * 60 * 1000)
      .map((e) => new Date(e.readAt).toDateString()),
  )

  let readStreak = 0
  const currentDate = new Date()
  while (readDates.has(currentDate.toDateString())) {
    readStreak++
    currentDate.setDate(currentDate.getDate() - 1)
  }

  return {
    userId,
    articlesRead: userReads.length,
    totalTimeSpentSeconds: userReads.reduce((sum, e) => sum + e.timeSpentSeconds, 0),
    lastReadAt: Math.max(...userReads.map((e) => e.readAt)),
    recentArticles: recentReads.map((e) => e.articleId).slice(0, 20),
    favoriteTopics: {}, // Would be populated from article metadata in real app
    readStreak,
  }
}

export function getSocialStatsForFriend(friendId: string): SocialStats | null {
  const stats = getUserReadStats(friendId)
  if (!stats) return null

  const friendsList = readJSON<string[]>('social:friends', [])
  const followers = readJSON<Record<string, string[]>>('social:followers', {})
  const reciprocal = friendsList.filter((f) => (followers[f] ?? []).includes(friendId))

  return {
    friendId,
    username: friendId,
    articlesPublished: Math.floor(Math.random() * 50), // Simulated
    friendsCount: friendsList.length,
    followersCount: (followers[friendId] ?? []).length,
    reciprocalFriends: reciprocal,
    stats,
  }
}

// Helper: Add friend to friend list
export function addFriend(friendId: string): void {
  const friends = readJSON<string[]>('social:friends', [])
  if (!friends.includes(friendId)) {
    writeJSON('social:friends', [...friends, friendId])
  }
}

// Helper: Get all friends
export function getFriends(): string[] {
  return readJSON<string[]>('social:friends', [])
}

// Helper: Follow/unfollow user
export function followUser(userId: string): void {
  const followers = readJSON<Record<string, string[]>>('social:followers', {})
  const myFollowers = followers[userId] ?? []
  if (!myFollowers.includes(ME)) {
    followers[userId] = [...myFollowers, ME]
    writeJSON('social:followers', followers)
  }
}

export function unfollowUser(userId: string): void {
  const followers = readJSON<Record<string, string[]>>('social:followers', {})
  const myFollowers = followers[userId] ?? []
  followers[userId] = myFollowers.filter((f) => f !== ME)
  writeJSON('social:followers', followers)
}

export function getFollowers(userId: string): string[] {
  const followers = readJSON<Record<string, string[]>>('social:followers', {})
  return followers[userId] ?? []
}
