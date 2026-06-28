# Community Features - Wave 5 Documentation

This document describes the 5 new community features implemented in `groupPermissionsService.ts` and their corresponding React components.

## Table of Contents
1. [Group Moderator Roles with Permissions](#1-group-moderator-roles-with-permissions)
2. [Private Groups (Invite-Only)](#2-private-groups-invite-only)
3. [Group Pinned Messages System](#3-group-pinned-messages-system)
4. [Comment Threading with Nested Replies](#4-comment-threading-with-nested-replies)
5. [Friend Statistics Dashboard](#5-friend-statistics-dashboard)

---

## 1. Group Moderator Roles with Permissions

### Overview
A comprehensive permissions system for group management with three role tiers: `admin`, `moderator`, and `member`.

### Types & Interfaces

```typescript
type ModeratorRole = 'admin' | 'moderator' | 'member'

interface Permission {
  id: string
  name: string
  description: string
}

interface RolePermissions {
  role: ModeratorRole
  permissions: string[] // permission IDs
}

interface GroupMember {
  userId: string
  role: ModeratorRole
  joinedAt: number
  lastActive: number
}
```

### Available Permissions

| ID | Name | Description | Admin | Moderator | Member |
|----|------|-------------|-------|-----------|--------|
| `pin_message` | Pin Messages | Can pin/unpin group messages | ✓ | ✓ | ✗ |
| `delete_message` | Delete Messages | Can delete any message | ✓ | ✓ | ✗ |
| `mute_user` | Mute Users | Can temporarily mute members | ✓ | ✓ | ✗ |
| `ban_user` | Ban Users | Can permanently ban users | ✓ | ✗ | ✗ |
| `edit_description` | Edit Group | Can edit group settings | ✓ | ✓ | ✗ |
| `manage_members` | Manage Members | Can invite/remove members | ✓ | ✗ | ✗ |
| `create_event` | Create Events | Can create group events | ✓ | ✓ | ✗ |
| `post_without_review` | Post Without Review | Posts appear immediately | ✓ | ✓ | ✗ |

### Usage Examples

```typescript
import {
  hasPermission,
  canUserDeleteMessage,
  canUserPinMessage,
  promoteUserToModerator,
  getGroupMember,
} from '@/services/groupPermissionsService'

// Check permissions
if (hasPermission(userId, groupId, 'pin_message')) {
  // Allow pinning
}

// Helper functions
if (canUserDeleteMessage(userId, groupId)) {
  // User can delete messages
}

// Promote member to moderator
promoteUserToModerator(groupId, userId)

// Get member info
const member = getGroupMember(groupId, userId)
// Returns: { userId, role, joinedAt, lastActive }
```

### Component Integration

```tsx
import { GroupModeration } from '@/components/GroupModeration'

export function GroupPage({ groupId }) {
  return (
    <div>
      <GroupModeration groupId={groupId} />
    </div>
  )
}
```

---

## 2. Private Groups (Invite-Only)

### Overview
Create groups that require invitation for new members, with optional approval workflows.

### Types & Interfaces

```typescript
interface GroupSettings {
  isPrivate: boolean
  requireApproval: boolean
  invitedUsers: string[] // usernames/emails
  mutedUsers: string[]
  bannedUsers: string[]
}

interface ExtendedGroup {
  id: string
  name: string
  description: string
  tags: string[]
  memberCount: number
  createdAt: number
  creator: string
  settings: GroupSettings
  members: GroupMember[]
}
```

### Access Control

```typescript
// Check if user can join private group
if (canJoinGroup(groupId, userId)) {
  joinExtendedGroup(groupId, userId)
}

// Invite user to private group
inviteUserToGroup(groupId, 'user@example.com')

// Ban user (removes access and blacklists)
banUserFromGroup(groupId, userId)

// Mute user (still member, but can't post)
muteUserInGroup(groupId, userId)
```

### Workflow

1. **Creator creates private group** → automatically becomes admin
2. **Admin invites users** → users appear in `invitedUsers`
3. **Invited users join** → automatically added as members
4. **Admin can promote/mute/ban** → manage member roles/status

### Usage Example

```typescript
import {
  createExtendedGroup,
  inviteUserToGroup,
  canJoinGroup,
  joinExtendedGroup,
} from '@/services/groupPermissionsService'

// Create private group
const group = createExtendedGroup('Elite Squad', 'Invite-only discussion', true)

// Invite users
inviteUserToGroup(group.id, 'friend1@example.com')
inviteUserToGroup(group.id, 'friend2@example.com')

// They can now join
if (canJoinGroup(group.id, 'friend1@example.com')) {
  joinExtendedGroup(group.id, 'friend1@example.com')
}
```

---

## 3. Group Pinned Messages System

### Overview
Admins and moderators can pin important messages to the top of the group feed.

### Types & Interfaces

```typescript
interface PinnedMessage {
  id: string
  messageId: string
  groupId: string
  author: string
  text: string
  pinnedAt: number
  pinnedBy: string
}
```

### API

```typescript
import {
  getPinnedMessages,
  pinMessage,
  unpinMessage,
} from '@/services/groupPermissionsService'

// Get all pinned messages in group
const pins = getPinnedMessages(groupId)
// Returns: [{ id, messageId, groupId, author, text, pinnedAt, pinnedBy }, ...]

// Pin a message (requires permission)
const success = pinMessage(
  messageId,
  groupId,
  'author-name',
  'message text content'
)

// Unpin a message
const success = unpinMessage(messageId, groupId)
```

### Component Integration

```tsx
// Display pinned messages at top of group
function GroupChat({ groupId }) {
  const pinnedMessages = getPinnedMessages(groupId)

  return (
    <div className="group-chat">
      {pinnedMessages.length > 0 && (
        <div className="pinned-section">
          <h3>📌 Pinned Messages ({pinnedMessages.length})</h3>
          {pinnedMessages.map(pin => (
            <div key={pin.id} className="pinned-message">
              <p><strong>{pin.author}:</strong> {pin.text}</p>
              <small>Pinned {timeAgo(new Date(pin.pinnedAt))}</small>
            </div>
          ))}
        </div>
      )}
      {/* Rest of chat */}
    </div>
  )
}
```

---

## 4. Comment Threading with Nested Replies

### Overview
Full comment thread support with nested replies, voting, and depth tracking.

### Types & Interfaces

```typescript
interface ThreadedComment {
  id: string
  groupId: string
  articleId: string
  parentId: string | null // null for root, ID for replies
  author: string
  text: string
  createdAt: number
  updatedAt: number
  score: number
  replies: ThreadedComment[] // Nested replies
  depth: number // 0 = root, 1 = reply to root, 2 = reply to reply, etc.
}
```

### API

```typescript
import {
  createThreadedComment,
  getCommentThread,
  getThreadReplies,
  voteThreadedComment,
  editThreadedComment,
  deleteThreadedComment,
} from '@/services/groupPermissionsService'

// Post a root comment
createThreadedComment(groupId, articleId, 'Great article!')

// Reply to a comment
createThreadedComment(groupId, articleId, 'I agree!', parentCommentId)

// Get full threaded discussion for an article
const thread = getCommentThread(articleId, groupId)
// Returns tree structure with nested replies

// Get direct replies to a comment
const replies = getThreadReplies(commentId)

// Vote on a comment
voteThreadedComment(commentId, 1) // upvote
voteThreadedComment(commentId, -1) // downvote

// Edit/delete own comments
editThreadedComment(commentId, 'Updated text')
deleteThreadedComment(commentId)
```

### Component Usage

```tsx
import { ThreadedComments } from '@/components/ThreadedComments'

export function ArticlePage({ articleId }) {
  return (
    <article>
      {/* article content */}
      <ThreadedComments articleId={articleId} groupId="general" />
    </article>
  )
}
```

### Component Features
- ✅ Nested reply trees with visual indentation
- ✅ Upvote/downvote system
- ✅ Edit and delete comments
- ✅ Reply form with inline editing
- ✅ Depth level badges (L0, L1, L2, etc.)
- ✅ Collapsible reply sections
- ✅ Edit timestamps

---

## 5. Friend Statistics Dashboard

### Overview
Track which friends read your articles and view detailed reading statistics.

### Types & Interfaces

```typescript
interface ArticleReadEvent {
  id: string
  userId: string
  articleId: string
  readAt: number
  timeSpentSeconds: number
}

interface FriendStats {
  userId: string
  articlesRead: number
  totalTimeSpentSeconds: number
  lastReadAt: number
  recentArticles: string[] // Article IDs
  favoriteTopics: Record<string, number>
  readStreak: number // consecutive days
}

interface SocialStats {
  friendId: string
  username: string
  articlesPublished: number
  friendsCount: number
  followersCount: number
  reciprocalFriends: string[]
  stats: FriendStats
}
```

### API

```typescript
import {
  trackArticleRead,
  getArticleReaders,
  getUserReadStats,
  getSocialStatsForFriend,
  getFriends,
  addFriend,
  followUser,
  unfollowUser,
} from '@/services/groupPermissionsService'

// Track when user reads an article (call after ~30 seconds of viewing)
trackArticleRead(userId, articleId, timeSpentSeconds)

// Get who read an article
const readers = getArticleReaders(articleId)
// Returns: [{ friendId, username, stats, ... }, ...]
// Sorted by most engaged first

// Get current user's reading stats
const myStats = getUserReadStats('ich')
// Returns: { articlesRead, totalTimeSpentSeconds, readStreak, ... }

// Get friend's public stats
const friendStats = getSocialStatsForFriend(friendId)

// Manage friends
addFriend(userId)
getFriends() // Returns: string[]

// Follow/unfollow users
followUser(userId)
unfollowUser(userId)
```

### Component Usage

```tsx
import { FriendStatsDashboard } from '@/components/FriendStatsDashboard'

const articles = [
  { id: 'art-1', title: 'GTA VI Leak Analysis' },
  { id: 'art-2', title: 'Vice City Map Breakdown' },
  // ...
]

export function Dashboard() {
  return (
    <FriendStatsDashboard 
      articles={articles}
      selectedArticleId="art-1"
    />
  )
}
```

### Dashboard Tabs

1. **My Reading Stats**
   - Total articles read
   - Time spent reading (hours)
   - Reading streak (days)
   - Last read date
   - Recent articles list

2. **Who Read This**
   - Select article from dropdown
   - View all readers with stats
   - Sort by: articles read, time spent, most recent
   - Follow/unfollow buttons
   - Mutual friend badges

3. **Friends Network**
   - Add friends by username/email
   - View all friends
   - Friend engagement stats
   - Mutual connections count
   - Unfollow actions

---

## Integration in Article Component

```typescript
import { useEffect } from 'react'
import { trackArticleRead } from '@/services/groupPermissionsService'

export function ArticleViewer({ articleId, userId }) {
  useEffect(() => {
    const startTime = Date.now()

    return () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000)
      if (timeSpent > 10) { // Only track if read for 10+ seconds
        trackArticleRead(userId, articleId, timeSpent)
      }
    }
  }, [articleId, userId])

  return <article>{/* content */}</article>
}
```

---

## Storage Structure

All data is stored in localStorage with prefixes:

```
gta6hub:community:extendedGroups      // Extended group definitions
gta6hub:community:pinnedMessages      // Pinned messages by group
gta6hub:community:threaded_comments   // Comment threads
gta6hub:community:userCommentVotes    // User's comment votes
gta6hub:social:articleReads          // Article read tracking
gta6hub:social:friends               // Friend list
gta6hub:social:followers             // Follower relationships
```

---

## Security & Permissions

The service enforces permissions at the function level:

```typescript
// This will only succeed if user has the 'pin_message' permission
if (pinMessage(messageId, groupId, author, text)) {
  // Message was pinned
}

// Check permission before showing UI
if (hasPermission(userId, groupId, 'manage_members')) {
  // Show member management panel
}
```

**Important**: 
- Permissions are checked server-side in real implementations
- This is a client-side simulation using localStorage
- Replace with API calls when backend is available
- Current user is hardcoded as `'ich'` in service

---

## Migration Path to Backend

When adding a real backend:

1. Replace `readJSON`/`writeJSON` with API calls
2. Move permission checks to server
3. Add real user authentication
4. Implement real group/member database
5. Add moderation audit logs
6. Implement real-time updates (WebSocket)

Example migration template:

```typescript
// Before (localStorage)
export function pinMessage(messageId, groupId, author, text) {
  if (!hasPermission('ich', groupId, 'pin_message')) return false
  // ... localStorage code
}

// After (API)
export async function pinMessage(messageId, groupId, author, text) {
  const response = await fetch(`/api/groups/${groupId}/pins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageId, author, text }),
  })
  return response.ok
}
```

---

## Testing Helpers

```typescript
import {
  createExtendedGroup,
  createThreadedComment,
  trackArticleRead,
  addFriend,
} from '@/services/groupPermissionsService'

// Create test group with members
const group = createExtendedGroup('Test Group', 'For testing', false)
const groupId = group.id

// Create test threads
createThreadedComment(groupId, 'art-1', 'Root comment')
createThreadedComment(groupId, 'art-1', 'Reply', parentId)

// Track test reads
trackArticleRead('user1', 'art-1', 300)
trackArticleRead('user2', 'art-1', 450)

// Add test friends
addFriend('TestUser1')
addFriend('TestUser2')
```
