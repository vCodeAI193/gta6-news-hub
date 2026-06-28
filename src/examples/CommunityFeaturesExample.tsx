/**
 * Community Features Integration Example
 * Demonstrates how to use all 5 new community features in your application
 */

import React, { useState } from 'react'
import {
  // Feature 1: Group Moderator Roles & Permissions
  createExtendedGroup,
  hasPermission,
  canUserDeleteMessage,
  canUserPinMessage,
  canUserManageMembers,
  promoteUserToModerator,
  getAllGroupMembers,
  getExtendedGroup,

  // Feature 2: Private Groups
  inviteUserToGroup,
  joinExtendedGroup,
  canJoinGroup,
  muteUserInGroup,
  banUserFromGroup,

  // Feature 3: Group Pinned Messages
  getPinnedMessages,
  pinMessage,
  unpinMessage,

  // Feature 4: Comment Threading
  createThreadedComment,
  getCommentThread,
  voteThreadedComment,
  deleteThreadedComment,
  editThreadedComment,

  // Feature 5: Friend Statistics
  trackArticleRead,
  getArticleReaders,
  getUserReadStats,
  getSocialStatsForFriend,
  getFriends,
  addFriend,
  followUser,
  unfollowUser,
} from '../services/groupPermissionsService'

// Component imports
import { GroupModeration } from '../components/GroupModeration'
import { ThreadedComments } from '../components/ThreadedComments'
import { FriendStatsDashboard } from '../components/FriendStatsDashboard'

// ─────────────────────────────────────────────────────────────────────────────
// Example 1: Group Moderator Roles with Permissions
// ─────────────────────────────────────────────────────────────────────────────

export function GroupModerationExample() {
  const handleSetupGroup = () => {
    // Create a new group
    const group = createExtendedGroup('Gaming Discussions', 'Share your gaming thoughts', false)
    console.log('Created group:', group)

    // Check if current user can pin messages
    if (hasPermission('ich', group.id, 'pin_message')) {
      console.log('Current user can pin messages')
    }

    // Check specific permissions
    const canDelete = canUserDeleteMessage('ich', group.id)
    const canPin = canUserPinMessage('ich', group.id)
    const canManage = canUserManageMembers('ich', group.id)

    console.log({ canDelete, canPin, canManage })

    // Promote a member to moderator
    const members = getAllGroupMembers(group.id)
    if (members.length > 1) {
      const memberToPromote = members[1]
      promoteUserToModerator(group.id, memberToPromote.userId)
      console.log(`Promoted ${memberToPromote.userId} to moderator`)
    }

    return group
  }

  return (
    <div className="example-section">
      <h2>Example 1: Group Moderator Roles</h2>
      <button onClick={handleSetupGroup}>Setup Group with Moderators</button>

      {/* Use the actual component */}
      <GroupModeration groupId="g-example-1" />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Example 2: Private Groups (Invite-Only)
// ─────────────────────────────────────────────────────────────────────────────

export function PrivateGroupsExample() {
  const [groupId, setGroupId] = useState<string>('')

  const handleCreatePrivateGroup = () => {
    // Create a private, invite-only group
    const group = createExtendedGroup('Elite GTA Fans', 'Exclusive discussions', true)
    setGroupId(group.id)

    console.log('Created private group:', group)
    console.log('Group settings:', group.settings)
    // { isPrivate: true, requireApproval: true, invitedUsers: [], ... }
  }

  const handleInviteUser = () => {
    if (!groupId) return

    // Invite specific users
    inviteUserToGroup(groupId, 'john@example.com')
    inviteUserToGroup(groupId, 'jane@example.com')

    console.log('Invitations sent')
  }

  const handleJoinAsInvitedUser = () => {
    if (!groupId) return

    // Check if invited user can join
    const canJoin = canJoinGroup(groupId, 'john@example.com')
    if (canJoin) {
      joinExtendedGroup(groupId, 'john@example.com')
      console.log('john@example.com joined the private group')
    }
  }

  const handleManageMembers = () => {
    if (!groupId) return

    // Mute a user
    muteUserInGroup(groupId, 'spam_bot')

    // Ban a user
    banUserFromGroup(groupId, 'toxic_user')

    console.log('Member management applied')
  }

  return (
    <div className="example-section">
      <h2>Example 2: Private Groups (Invite-Only)</h2>
      <div className="button-group">
        <button onClick={handleCreatePrivateGroup}>Create Private Group</button>
        <button onClick={handleInviteUser} disabled={!groupId}>
          Send Invitations
        </button>
        <button onClick={handleJoinAsInvitedUser} disabled={!groupId}>
          Join as Invited User
        </button>
        <button onClick={handleManageMembers} disabled={!groupId}>
          Manage Members (Mute/Ban)
        </button>
      </div>
      {groupId && <p>Private Group ID: {groupId}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Example 3: Group Pinned Messages
// ─────────────────────────────────────────────────────────────────────────────

export function PinnedMessagesExample() {
  const [groupId] = useState('g-example-3')

  const handlePinMessage = () => {
    // Create a message first, then pin it
    const messageId = 'msg-' + Date.now()
    const success = pinMessage(
      messageId,
      groupId,
      'ModeratorUser',
      'This is an important announcement about the group rules!',
    )

    if (success) {
      console.log('Message pinned successfully')
    }
  }

  const handleViewPinned = () => {
    const pinned = getPinnedMessages(groupId)
    console.log('Pinned messages in group:', pinned)
    // Returns: [{ id, messageId, groupId, author, text, pinnedAt, pinnedBy }, ...]

    // Display in UI
    pinned.forEach((pin) => {
      console.log(`[PINNED] ${pin.author}: ${pin.text}`)
    })
  }

  const handleUnpinMessage = () => {
    // Unpin the most recent pinned message
    const pinned = getPinnedMessages(groupId)
    if (pinned.length > 0) {
      const success = unpinMessage(pinned[0].messageId, groupId)
      if (success) {
        console.log('Message unpinned')
      }
    }
  }

  return (
    <div className="example-section">
      <h2>Example 3: Pinned Messages</h2>
      <div className="button-group">
        <button onClick={handlePinMessage}>Pin a Message</button>
        <button onClick={handleViewPinned}>View Pinned Messages</button>
        <button onClick={handleUnpinMessage}>Unpin Message</button>
      </div>

      {/* Display pinned section */}
      <PinnedMessagesDisplay groupId={groupId} />
    </div>
  )
}

function PinnedMessagesDisplay({ groupId }: { groupId: string }) {
  const [pinned, setPinned] = React.useState(() => getPinnedMessages(groupId))

  return (
    <div className="pinned-display">
      {pinned.length === 0 ? (
        <p>No pinned messages</p>
      ) : (
        <div>
          <h4>📌 Pinned in Group ({pinned.length})</h4>
          {pinned.map((pin) => (
            <div key={pin.id} className="pinned-item">
              <strong>{pin.author}:</strong> {pin.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Example 4: Comment Threading with Nested Replies
// ─────────────────────────────────────────────────────────────────────────────

export function CommentThreadingExample({ articleId = 'article-1' }) {
  const handleCreateThread = () => {
    // Post a root comment
    const comment = createThreadedComment(
      'g-example-4',
      articleId,
      'This is a great breakdown of the new trailer!',
    )

    console.log('Root comment created:', comment)
    return comment.id
  }

  const handleCreateReply = (parentCommentId: string) => {
    // Reply to a comment
    const reply = createThreadedComment(
      'g-example-4',
      articleId,
      'I totally agree! Did you notice the easter egg at 2:45?',
      parentCommentId,
    )

    console.log('Reply created:', reply)
  }

  const handleViewThread = () => {
    // Get the full threaded discussion
    const thread = getCommentThread(articleId, 'g-example-4')

    console.log('Full comment thread:', thread)
    // Prints tree structure with nested replies:
    // [
    //   { id, author, text, score, depth: 0, replies: [
    //     { id, author, text, score, depth: 1, replies: [] },
    //     { id, author, text, score, depth: 1, replies: [] }
    //   ]},
    //   ...
    // ]

    printThread(thread)
  }

  const handleVoteOnComment = (commentId: string) => {
    // Upvote a comment
    voteThreadedComment(commentId, 1)
    console.log('Comment upvoted')

    // Downvote
    // voteThreadedComment(commentId, -1)
  }

  const handleEditComment = (commentId: string) => {
    const success = editThreadedComment(commentId, 'Updated: This is my revised opinion.')
    if (success) {
      console.log('Comment edited')
    }
  }

  const handleDeleteComment = (commentId: string) => {
    const success = deleteThreadedComment(commentId)
    if (success) {
      console.log('Comment deleted')
    }
  }

  return (
    <div className="example-section">
      <h2>Example 4: Comment Threading</h2>

      {/* Use the actual component */}
      <ThreadedComments articleId={articleId} groupId="g-example-4" />

      <div className="button-group">
        <button onClick={handleCreateThread}>Post Root Comment</button>
        <button onClick={handleViewThread}>View Full Thread</button>
        <button onClick={() => handleVoteOnComment('comment-1')}>Vote on Comment</button>
        <button onClick={() => handleEditComment('comment-1')}>Edit Comment</button>
        <button onClick={() => handleDeleteComment('comment-1')}>Delete Comment</button>
      </div>
    </div>
  )
}

function printThread(thread: any[], depth = 0) {
  thread.forEach((comment) => {
    console.log(
      `${'  '.repeat(depth)}└─ ${comment.author}: "${comment.text}" (score: ${comment.score})`,
    )
    if (comment.replies && comment.replies.length > 0) {
      printThread(comment.replies, depth + 1)
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Example 5: Friend Statistics Dashboard
// ─────────────────────────────────────────────────────────────────────────────

export function FriendStatsExample() {
  const handleTrackReading = () => {
    // Simulate user reading an article for 5 minutes
    trackArticleRead('ich', 'article-1', 300) // 300 seconds = 5 minutes
    trackArticleRead('Vice_Fan99', 'article-1', 450) // 7.5 minutes
    trackArticleRead('LeonaMiami', 'article-1', 600) // 10 minutes

    console.log('Reading tracked')
  }

  const handleGetReaders = () => {
    // See who read your article
    const readers = getArticleReaders('article-1')
    console.log('Article readers:', readers)
    // Returns: [
    //   {
    //     friendId: 'Vice_Fan99',
    //     username: 'Vice_Fan99',
    //     stats: { articlesRead: 42, totalTimeSpentSeconds: 14400, ... },
    //     followersCount: 234,
    //     ...
    //   },
    //   ...
    // ]
  }

  const handleGetMyStats = () => {
    // Get current user's reading statistics
    const stats = getUserReadStats('ich')
    console.log('My reading stats:', stats)
    // Returns: {
    //   userId: 'ich',
    //   articlesRead: 47,
    //   totalTimeSpentSeconds: 28800,
    //   readStreak: 12,
    //   recentArticles: ['article-1', 'article-2', ...],
    //   ...
    // }
  }

  const handleAddFriends = () => {
    // Build friend network
    addFriend('Vice_Fan99')
    addFriend('LeonaMiami')
    addFriend('RockstarWatcher')

    const friends = getFriends()
    console.log('My friends:', friends)
  }

  const handleFollowUser = () => {
    // Follow a user's reading activity
    followUser('Vice_Fan99')
    console.log('Now following Vice_Fan99')

    // Get their stats
    const stats = getSocialStatsForFriend('Vice_Fan99')
    console.log('Vice_Fan99 stats:', stats)
  }

  const articles = [
    { id: 'article-1', title: 'GTA VI Leak Analysis' },
    { id: 'article-2', title: 'Vice City Map Breakdown' },
    { id: 'article-3', title: 'Character Deep Dive' },
  ]

  return (
    <div className="example-section">
      <h2>Example 5: Friend Statistics Dashboard</h2>

      {/* Use the actual component */}
      <FriendStatsDashboard articles={articles} selectedArticleId="article-1" />

      <div className="button-group">
        <button onClick={handleTrackReading}>Track Article Reads</button>
        <button onClick={handleGetReaders}>Get Article Readers</button>
        <button onClick={handleGetMyStats}>Get My Reading Stats</button>
        <button onClick={handleAddFriends}>Add Friends</button>
        <button onClick={handleFollowUser}>Follow User</button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Integration Page
// ─────────────────────────────────────────────────────────────────────────────

export function CommunityFeaturesDemo() {
  const [activeTab, setActiveTab] = React.useState<
    'moderation' | 'private' | 'pinned' | 'threading' | 'stats'
  >('moderation')

  return (
    <div className="community-demo">
      <h1>Community Features Demo</h1>
      <p>
        Comprehensive examples of all 5 new community features for the GTA6 News Hub
      </p>

      {/* Tab Navigation */}
      <div className="demo-tabs">
        <button
          className={activeTab === 'moderation' ? 'active' : ''}
          onClick={() => setActiveTab('moderation')}
        >
          👥 Moderation Roles
        </button>
        <button
          className={activeTab === 'private' ? 'active' : ''}
          onClick={() => setActiveTab('private')}
        >
          🔒 Private Groups
        </button>
        <button
          className={activeTab === 'pinned' ? 'active' : ''}
          onClick={() => setActiveTab('pinned')}
        >
          📌 Pinned Messages
        </button>
        <button
          className={activeTab === 'threading' ? 'active' : ''}
          onClick={() => setActiveTab('threading')}
        >
          💬 Comment Threading
        </button>
        <button
          className={activeTab === 'stats' ? 'active' : ''}
          onClick={() => setActiveTab('stats')}
        >
          📊 Friend Stats
        </button>
      </div>

      {/* Tab Content */}
      <div className="demo-content">
        {activeTab === 'moderation' && <GroupModerationExample />}
        {activeTab === 'private' && <PrivateGroupsExample />}
        {activeTab === 'pinned' && <PinnedMessagesExample />}
        {activeTab === 'threading' && <CommentThreadingExample />}
        {activeTab === 'stats' && <FriendStatsExample />}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper styles (would go in CSS file)
// ─────────────────────────────────────────────────────────────────────────────

const styles = `
  .community-demo {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    background: #0f0f0f;
    color: #e0e0e0;
  }

  .demo-tabs {
    display: flex;
    gap: 0.5rem;
    margin: 2rem 0;
    border-bottom: 1px solid #333;
    flex-wrap: wrap;
  }

  .demo-tabs button {
    padding: 0.75rem 1.5rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: #999;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  .demo-tabs button:hover {
    color: #e0e0e0;
  }

  .demo-tabs button.active {
    color: #667eea;
    border-bottom-color: #667eea;
  }

  .example-section {
    margin: 2rem 0;
    padding: 1.5rem;
    background: rgba(102, 126, 234, 0.05);
    border: 1px solid rgba(102, 126, 234, 0.2);
    border-radius: 8px;
  }

  .button-group {
    display: flex;
    gap: 0.75rem;
    margin: 1rem 0;
    flex-wrap: wrap;
  }

  .button-group button {
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  .button-group button:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  }

  .button-group button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .pinned-display {
    margin: 1rem 0;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 6px;
  }

  .pinned-item {
    padding: 0.75rem;
    background: rgba(102, 126, 234, 0.1);
    border-left: 3px solid #667eea;
    border-radius: 4px;
    margin: 0.5rem 0;
  }
`
