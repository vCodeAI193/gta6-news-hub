import { describe, it, expect, vi, beforeEach } from 'vitest'
import { playlistService, type Playlist, type PlaylistItem } from './playlistService'

global.fetch = vi.fn()

describe('PlaylistService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createPlaylist', () => {
    it('should create a playlist with required fields', async () => {
      const mockPlaylist: Playlist = {
        id: 'playlist-123',
        userId: 'user-1',
        name: 'My Videos',
        description: 'Favorite GTA6 clips',
        isPublic: false,
        items: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlaylist,
      } as Response)

      const result = await playlistService.createPlaylist('user-1', 'My Videos', 'Favorite GTA6 clips', false)
      expect(result.name).toBe('My Videos')
      expect(result.userId).toBe('user-1')
      expect(fetch).toHaveBeenCalledWith('/api/playlists', expect.any(Object))
    })

    it('should throw error on failed creation', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
      } as Response)

      await expect(
        playlistService.createPlaylist('user-1', 'My Videos')
      ).rejects.toThrow('Failed to create playlist')
    })
  })

  describe('getUserPlaylists', () => {
    it('should fetch user playlists', async () => {
      const mockPlaylists: Playlist[] = [
        {
          id: 'playlist-1',
          userId: 'user-1',
          name: 'Watch Later',
          isPublic: false,
          items: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlaylists,
      } as Response)

      const result = await playlistService.getUserPlaylists('user-1')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Watch Later')
    })

    it('should return empty array on fetch failure', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
      } as Response)

      const result = await playlistService.getUserPlaylists('user-1')
      expect(result).toEqual([])
    })
  })

  describe('getPlaylist', () => {
    it('should fetch a specific playlist', async () => {
      const mockPlaylist: Playlist = {
        id: 'playlist-1',
        userId: 'user-1',
        name: 'Favorites',
        isPublic: true,
        items: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlaylist,
      } as Response)

      const result = await playlistService.getPlaylist('playlist-1')
      expect(result?.name).toBe('Favorites')
    })

    it('should return null on fetch failure', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
      } as Response)

      const result = await playlistService.getPlaylist('playlist-1')
      expect(result).toBeNull()
    })
  })

  describe('addToPlaylist', () => {
    it('should add a video to playlist', async () => {
      const mockItem: PlaylistItem = {
        id: 'item-1',
        videoId: 'video-123',
        videoTitle: 'GTA6 Trailer',
        addedAt: Date.now(),
        position: 0,
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockItem,
      } as Response)

      const result = await playlistService.addToPlaylist('playlist-1', 'video-123', 'GTA6 Trailer')
      expect(result.videoTitle).toBe('GTA6 Trailer')
      expect(fetch).toHaveBeenCalledWith('/api/playlists/playlist-1/items', expect.any(Object))
    })

    it('should throw error on failed add', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
      } as Response)

      await expect(
        playlistService.addToPlaylist('playlist-1', 'video-123', 'Title')
      ).rejects.toThrow('Failed to add to playlist')
    })
  })

  describe('removeFromPlaylist', () => {
    it('should remove a video from playlist', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
      } as Response)

      await expect(
        playlistService.removeFromPlaylist('playlist-1', 'item-1')
      ).resolves.not.toThrow()

      expect(fetch).toHaveBeenCalledWith('/api/playlists/playlist-1/items/item-1', expect.any(Object))
    })

    it('should throw error on failed remove', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
      } as Response)

      await expect(
        playlistService.removeFromPlaylist('playlist-1', 'item-1')
      ).rejects.toThrow('Failed to remove from playlist')
    })
  })

  describe('reorderPlaylist', () => {
    it('should reorder playlist items', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
      } as Response)

      await expect(
        playlistService.reorderPlaylist('playlist-1', ['item-2', 'item-1', 'item-3'])
      ).resolves.not.toThrow()

      expect(fetch).toHaveBeenCalledWith(
        '/api/playlists/playlist-1/reorder',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })
  })

  describe('updatePlaylist', () => {
    it('should update playlist metadata', async () => {
      const updated: Playlist = {
        id: 'playlist-1',
        userId: 'user-1',
        name: 'Updated Name',
        isPublic: true,
        items: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => updated,
      } as Response)

      const result = await playlistService.updatePlaylist('playlist-1', { name: 'Updated Name' })
      expect(result.name).toBe('Updated Name')
    })
  })

  describe('deletePlaylist', () => {
    it('should delete a playlist', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
      } as Response)

      await expect(playlistService.deletePlaylist('playlist-1')).resolves.not.toThrow()
      expect(fetch).toHaveBeenCalledWith('/api/playlists/playlist-1', expect.any(Object))
    })
  })

  describe('sharePlaylist', () => {
    it('should share playlist with user', async () => {
      const mockShare = {
        id: 'share-1',
        playlistId: 'playlist-1',
        sharedWith: 'user-2',
        permission: 'view' as const,
        sharedAt: Date.now(),
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockShare,
      } as Response)

      const result = await playlistService.sharePlaylist('playlist-1', 'user-2', 'view')
      expect(result.sharedWith).toBe('user-2')
    })
  })

  describe('getSharedPlaylists', () => {
    it('should fetch playlists shared with user', async () => {
      const mockPlaylists: Playlist[] = []

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlaylists,
      } as Response)

      const result = await playlistService.getSharedPlaylists('user-1')
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('getPublicPlaylists', () => {
    it('should fetch public playlists with pagination', async () => {
      const mockResult = {
        playlists: [],
        total: 0,
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      } as Response)

      const result = await playlistService.getPublicPlaylists(20, 0)
      expect(result).toHaveProperty('playlists')
      expect(result).toHaveProperty('total')
    })
  })

  describe('likePlaylist', () => {
    it('should like a playlist', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likes: 5 }),
      } as Response)

      const result = await playlistService.likePlaylist('playlist-1')
      expect(result).toBe(5)
    })
  })

  describe('unlikePlaylist', () => {
    it('should unlike a playlist', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likes: 4 }),
      } as Response)

      const result = await playlistService.unlikePlaylist('playlist-1')
      expect(result).toBe(4)
    })
  })

  describe('duplicatePlaylist', () => {
    it('should duplicate a playlist', async () => {
      const duplicated: Playlist = {
        id: 'playlist-2',
        userId: 'user-1',
        name: 'Copy of Favorites',
        isPublic: false,
        items: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => duplicated,
      } as Response)

      const result = await playlistService.duplicatePlaylist('playlist-1', 'Copy of Favorites')
      expect(result.name).toBe('Copy of Favorites')
    })
  })
})
