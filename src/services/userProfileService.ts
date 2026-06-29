/**
 * User Profile Service
 * Manages user profiles, avatars, bios, and public information
 */

export interface UserProfile {
  userId: string
  displayName: string
  bio?: string
  avatarUrl?: string
  coverImageUrl?: string
  location?: string
  website?: string
  socialLinks?: {
    twitter?: string
    github?: string
    linkedin?: string
  }
  isPublic: boolean
  followerCount: number
  followingCount: number
  joinedAt: number
  lastModified: number
}

export interface ProfileUpdate {
  displayName?: string
  bio?: string
  location?: string
  website?: string
  isPublic?: boolean
  socialLinks?: Partial<UserProfile['socialLinks']>
}

class UserProfileService {
  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    const response = await fetch(`/api/users/${userId}/profile`)
    if (!response.ok) return null
    return response.json()
  }

  /**
   * Get current user profile
   */
  async getCurrentProfile(): Promise<UserProfile | null> {
    const response = await fetch('/api/users/me/profile')
    if (!response.ok) return null
    return response.json()
  }

  /**
   * Update profile
   */
  async updateProfile(userId: string, updates: ProfileUpdate): Promise<UserProfile> {
    const response = await fetch(`/api/users/${userId}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    if (!response.ok) throw new Error('Failed to update profile')
    return response.json()
  }

  /**
   * Upload avatar
   */
  async uploadAvatar(userId: string, file: File): Promise<{ url: string; userId: string }> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`/api/users/${userId}/avatar`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) throw new Error('Failed to upload avatar')
    return response.json()
  }

  /**
   * Upload cover image
   */
  async uploadCoverImage(userId: string, file: File): Promise<{ url: string; userId: string }> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`/api/users/${userId}/cover-image`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) throw new Error('Failed to upload cover image')
    return response.json()
  }

  /**
   * Get user followers
   */
  async getFollowers(userId: string, limit = 20, offset = 0): Promise<UserProfile[]> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    const response = await fetch(`/api/users/${userId}/followers?${params}`)
    if (!response.ok) return []
    return response.json()
  }

  /**
   * Get user following
   */
  async getFollowing(userId: string, limit = 20, offset = 0): Promise<UserProfile[]> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    const response = await fetch(`/api/users/${userId}/following?${params}`)
    if (!response.ok) return []
    return response.json()
  }

  /**
   * Follow user
   */
  async followUser(targetUserId: string): Promise<{ following: boolean }> {
    const response = await fetch(`/api/users/${targetUserId}/follow`, {
      method: 'POST',
    })

    if (!response.ok) throw new Error('Failed to follow user')
    return response.json()
  }

  /**
   * Unfollow user
   */
  async unfollowUser(targetUserId: string): Promise<{ following: boolean }> {
    const response = await fetch(`/api/users/${targetUserId}/unfollow`, {
      method: 'POST',
    })

    if (!response.ok) throw new Error('Failed to unfollow user')
    return response.json()
  }

  /**
   * Check if following user
   */
  async isFollowing(targetUserId: string): Promise<boolean> {
    const response = await fetch(`/api/users/${targetUserId}/is-following`)
    if (!response.ok) return false
    const result = await response.json()
    return result.following ?? false
  }

  /**
   * Search users
   */
  async searchUsers(query: string, limit = 10): Promise<UserProfile[]> {
    const params = new URLSearchParams({ q: query, limit: String(limit) })
    const response = await fetch(`/api/users/search?${params}`)
    if (!response.ok) return []
    return response.json()
  }

  /**
   * Get user stats
   */
  async getUserStats(userId: string): Promise<{
    articlesCount: number
    commentsCount: number
    followersCount: number
    followingCount: number
  } | null> {
    const response = await fetch(`/api/users/${userId}/stats`)
    if (!response.ok) return null
    return response.json()
  }

  /**
   * Delete profile
   */
  async deleteProfile(userId: string): Promise<void> {
    const response = await fetch(`/api/users/${userId}/profile`, {
      method: 'DELETE',
    })

    if (!response.ok) throw new Error('Failed to delete profile')
  }

  /**
   * Validate username availability
   */
  async checkUsernameAvailable(displayName: string): Promise<boolean> {
    const params = new URLSearchParams({ name: displayName })
    const response = await fetch(`/api/users/check-name?${params}`)
    if (!response.ok) return false
    const result = await response.json()
    return result.available ?? false
  }
}

export const userProfileService = new UserProfileService()
