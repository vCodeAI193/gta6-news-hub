import { describe, it, expect, vi, beforeEach } from 'vitest'
import { userProfileService } from './userProfileService'

describe('UserProfileService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getProfile', () => {
    it('should get user profile', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          userId: 'user1',
          displayName: 'John Doe',
          bio: 'Developer',
          isPublic: true,
          followerCount: 100,
          followingCount: 50,
        }),
      })

      const profile = await userProfileService.getProfile('user1')
      expect(profile?.displayName).toBe('John Doe')
      expect(profile?.followerCount).toBe(100)
    })

    it('should return null on error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      const profile = await userProfileService.getProfile('user1')
      expect(profile).toBeNull()
    })
  })

  describe('updateProfile', () => {
    it('should update profile', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          userId: 'user1',
          displayName: 'Jane Doe',
          bio: 'Engineer',
        }),
      })

      const result = await userProfileService.updateProfile('user1', {
        displayName: 'Jane Doe',
        bio: 'Engineer',
      })

      expect(result.displayName).toBe('Jane Doe')
    })

    it('should throw on update failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      await expect(
        userProfileService.updateProfile('user1', { displayName: 'Jane' })
      ).rejects.toThrow('Failed to update profile')
    })
  })

  describe('uploadAvatar', () => {
    it('should upload avatar', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://example.com/avatar.jpg', userId: 'user1' }),
      })

      const file = new File([''], 'avatar.jpg', { type: 'image/jpeg' })
      const result = await userProfileService.uploadAvatar('user1', file)

      expect(result.url).toContain('avatar')
    })

    it('should throw on upload failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      const file = new File([''], 'avatar.jpg')
      await expect(userProfileService.uploadAvatar('user1', file)).rejects.toThrow('Failed to upload avatar')
    })
  })

  describe('uploadCoverImage', () => {
    it('should upload cover image', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://example.com/cover.jpg', userId: 'user1' }),
      })

      const file = new File([''], 'cover.jpg', { type: 'image/jpeg' })
      const result = await userProfileService.uploadCoverImage('user1', file)

      expect(result.url).toContain('cover')
    })
  })

  describe('getFollowers', () => {
    it('should get user followers', async () => {
      const followers = [
        { userId: 'user2', displayName: 'Alice', followerCount: 0, followingCount: 0, isPublic: true, joinedAt: 0, lastModified: 0 },
        { userId: 'user3', displayName: 'Bob', followerCount: 0, followingCount: 0, isPublic: true, joinedAt: 0, lastModified: 0 },
      ]

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => followers,
      })

      const result = await userProfileService.getFollowers('user1')
      expect(result).toHaveLength(2)
      expect(result[0].displayName).toBe('Alice')
    })

    it('should return empty array on error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      const result = await userProfileService.getFollowers('user1')
      expect(result).toEqual([])
    })
  })

  describe('getFollowing', () => {
    it('should get users being followed', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [{ userId: 'user2', displayName: 'Alice', followerCount: 0, followingCount: 0, isPublic: true, joinedAt: 0, lastModified: 0 }],
      })

      const result = await userProfileService.getFollowing('user1')
      expect(result).toHaveLength(1)
    })
  })

  describe('followUser', () => {
    it('should follow user', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ following: true }),
      })

      const result = await userProfileService.followUser('user2')
      expect(result.following).toBe(true)
    })

    it('should throw on follow failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      await expect(userProfileService.followUser('user2')).rejects.toThrow('Failed to follow user')
    })
  })

  describe('unfollowUser', () => {
    it('should unfollow user', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ following: false }),
      })

      const result = await userProfileService.unfollowUser('user2')
      expect(result.following).toBe(false)
    })
  })

  describe('isFollowing', () => {
    it('should check if following', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ following: true }),
      })

      const result = await userProfileService.isFollowing('user2')
      expect(result).toBe(true)
    })

    it('should return false on error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      const result = await userProfileService.isFollowing('user2')
      expect(result).toBe(false)
    })
  })

  describe('searchUsers', () => {
    it('should search users', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [{ userId: 'user2', displayName: 'John', followerCount: 0, followingCount: 0, isPublic: true, joinedAt: 0, lastModified: 0 }],
      })

      const result = await userProfileService.searchUsers('john')
      expect(result).toHaveLength(1)
      expect(result[0].displayName).toBe('John')
    })

    it('should return empty array on error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      const result = await userProfileService.searchUsers('test')
      expect(result).toEqual([])
    })
  })

  describe('getUserStats', () => {
    it('should get user statistics', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          articlesCount: 10,
          commentsCount: 50,
          followersCount: 100,
          followingCount: 50,
        }),
      })

      const stats = await userProfileService.getUserStats('user1')
      expect(stats?.articlesCount).toBe(10)
      expect(stats?.commentsCount).toBe(50)
    })

    it('should return null on error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      const stats = await userProfileService.getUserStats('user1')
      expect(stats).toBeNull()
    })
  })

  describe('deleteProfile', () => {
    it('should delete profile', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: true })

      await expect(userProfileService.deleteProfile('user1')).resolves.not.toThrow()
    })
  })

  describe('checkUsernameAvailable', () => {
    it('should check username availability', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ available: true }),
      })

      const available = await userProfileService.checkUsernameAvailable('newuser')
      expect(available).toBe(true)
    })

    it('should return false if taken', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ available: false }),
      })

      const available = await userProfileService.checkUsernameAvailable('existing')
      expect(available).toBe(false)
    })
  })
})
