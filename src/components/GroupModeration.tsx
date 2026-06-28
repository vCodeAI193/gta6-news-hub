/**
 * Group Moderation & Permissions UI
 * Manage moderator roles, member permissions, and group settings
 */
import { useState } from 'react'
import {
  getExtendedGroup,
  getAllGroupMembers,
  hasPermission,
  promoteUserToModerator,
  muteUserInGroup,
  banUserFromGroup,
  inviteUserToGroup,
  type ExtendedGroup,
  type GroupMember,
  type ModeratorRole,
  type Permission,
  getPermissions,
} from '../services/groupPermissionsService'
import './GroupModeration.css'

interface GroupModerationProps {
  groupId: string
}

export function GroupModeration({ groupId }: GroupModerationProps) {
  const [group, setGroup] = useState<ExtendedGroup | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [permissions] = useState<Permission[]>(getPermissions())
  const [inviteEmail, setInviteEmail] = useState('')
  const [expanded, setExpanded] = useState(false)

  const loadGroup = () => {
    const g = getExtendedGroup(groupId)
    setGroup(g)
    if (g) {
      setMembers(getAllGroupMembers(groupId))
    }
  }

  const handlePromote = (userId: string) => {
    if (promoteUserToModerator(groupId, userId)) {
      loadGroup()
    }
  }

  const handleMute = (userId: string) => {
    if (muteUserInGroup(groupId, userId)) {
      loadGroup()
    }
  }

  const handleBan = (userId: string) => {
    if (banUserFromGroup(groupId, userId)) {
      loadGroup()
    }
  }

  const handleInvite = () => {
    if (inviteEmail.trim()) {
      if (inviteUserToGroup(groupId, inviteEmail)) {
        setInviteEmail('')
        loadGroup()
      }
    }
  }

  const getRoleColor = (role: ModeratorRole) => {
    const colors: Record<ModeratorRole, string> = {
      admin: '#ff6b6b',
      moderator: '#4ecdc4',
      member: '#95a5a6',
    }
    return colors[role]
  }

  const getMemberActions = (member: GroupMember) => {
    const actions: string[] = []
    if (hasPermission('ich', groupId, 'manage_members') && member.userId !== 'ich') {
      actions.push('promote')
      actions.push('mute')
      actions.push('ban')
    }
    return actions
  }

  if (!expanded) {
    return (
      <button
        className="group-moderation-toggle"
        onClick={() => {
          setExpanded(true)
          loadGroup()
        }}
      >
        ⚙️ Group Settings
      </button>
    )
  }

  if (!group) {
    return (
      <div className="group-moderation-panel">
        <p>Loading group...</p>
      </div>
    )
  }

  return (
    <div className="group-moderation-panel">
      <div className="moderation-header">
        <h3>Group: {group.name}</h3>
        <button className="close-btn" onClick={() => setExpanded(false)}>
          ✕
        </button>
      </div>

      {/* Members Section */}
      <div className="moderation-section">
        <h4>👥 Members ({members.length})</h4>
        <div className="members-list">
          {members.map((member) => (
            <div key={member.userId} className="member-row">
              <div className="member-info">
                <span className="member-name">{member.userId}</span>
                <span
                  className="member-role"
                  style={{ backgroundColor: getRoleColor(member.role) }}
                >
                  {member.role}
                </span>
              </div>
              <div className="member-actions">
                {getMemberActions(member).map((action) => (
                  <button
                    key={action}
                    className={`action-btn action-${action}`}
                    onClick={() => {
                      if (action === 'promote') handlePromote(member.userId)
                      if (action === 'mute') handleMute(member.userId)
                      if (action === 'ban') handleBan(member.userId)
                    }}
                  >
                    {action === 'promote' && '⬆️'}
                    {action === 'mute' && '🔇'}
                    {action === 'ban' && '🚫'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invitations Section */}
      {group.settings.isPrivate && hasPermission('ich', groupId, 'manage_members') && (
        <div className="moderation-section">
          <h4>📨 Invite Members (Private Group)</h4>
          <div className="invite-form">
            <input
              type="email"
              placeholder="user@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="invite-input"
            />
            <button onClick={handleInvite} className="invite-btn">
              Send Invite
            </button>
          </div>
          <div className="invited-users">
            <p>Invited users:</p>
            {group.settings.invitedUsers.length === 0 ? (
              <p className="empty-state">No invitations sent yet</p>
            ) : (
              group.settings.invitedUsers.map((user) => (
                <div key={user} className="invited-user">
                  {user}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Permissions Reference */}
      <div className="moderation-section">
        <h4>🔐 Permissions</h4>
        <div className="permissions-ref">
          {permissions.map((perm) => (
            <div key={perm.id} className="permission-row">
              <span className="perm-name">{perm.name}</span>
              <span className="perm-desc">{perm.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Moderation Stats */}
      <div className="moderation-section">
        <h4>📊 Moderation Stats</h4>
        <div className="stats-grid">
          <div className="stat">
            <span className="stat-label">Total Members</span>
            <span className="stat-value">{group.memberCount}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Moderators</span>
            <span className="stat-value">
              {members.filter((m) => m.role === 'moderator').length}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Muted</span>
            <span className="stat-value">{group.settings.mutedUsers.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Banned</span>
            <span className="stat-value">{group.settings.bannedUsers.length}</span>
          </div>
        </div>
      </div>

      {/* Group Settings */}
      <div className="moderation-section">
        <h4>⚙️ Group Settings</h4>
        <div className="settings-list">
          <div className="setting">
            <span>Private Group</span>
            <span className="badge-setting">{group.settings.isPrivate ? 'Yes' : 'No'}</span>
          </div>
          <div className="setting">
            <span>Requires Approval</span>
            <span className="badge-setting">{group.settings.requireApproval ? 'Yes' : 'No'}</span>
          </div>
          <div className="setting">
            <span>Created</span>
            <span className="badge-setting">{new Date(group.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
