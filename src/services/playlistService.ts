/**
 * Playlist Service
 * Manages user playlists with video organization and sharing
 */

export interface PlaylistItem {
  id: string
  videoId: string
  videoTitle: string
  thumbnailUrl?: string
  addedAt: number
  position: number
}

export interface Playlist {
  id: string
  userId: string
  name: string
  description?: string
  isPublic: boolean
  items: PlaylistItem[]
  createdAt: number
  updatedAt: number
  views?: number
  likes?: number
}

export interface PlaylistShare {
  id: string
  playlistId: string
  sharedWith: string
  permission: 'view' | 'edit'
  sharedAt: number
}

class PlaylistService {
  private static readonly MAX_PLAYLISTS_PER_USER = 50
  private static readonly MAX_ITEMS_PER_PLAYLIST = 500

  /**
   * Create a new playlist
   */
  async createPlaylist(
    userId: string,
    name: string,
    description?: string,
    isPublic: boolean = false
  ): Promise<Playlist> {
    const playlist: Playlist = {
      id: `playlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      name,
      description,
      isPublic,
      items: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    const response = await fetch('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playlist),
    })

    if (!response.ok) throw new Error('Failed to create playlist')
    return response.json()
  }

  /**
   * Get user's playlists
   */
  async getUserPlaylists(userId: string): Promise<Playlist[]> {
    try {
      const response = await fetch(`/api/users/${userId}/playlists`)
      if (!response.ok) return []
      return response.json()
    } catch {
      return []
    }
  }

  /**
   * Get a specific playlist
   */
  async getPlaylist(playlistId: string): Promise<Playlist | null> {
    try {
      const response = await fetch(`/api/playlists/${playlistId}`)
      if (!response.ok) return null
      return response.json()
    } catch {
      return null
    }
  }

  /**
   * Add video to playlist
   */
  async addToPlaylist(
    playlistId: string,
    videoId: string,
    videoTitle: string,
    thumbnailUrl?: string
  ): Promise<PlaylistItem> {
    const item: PlaylistItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      videoId,
      videoTitle,
      thumbnailUrl,
      addedAt: Date.now(),
      position: 0,
    }

    const response = await fetch(`/api/playlists/${playlistId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })

    if (!response.ok) throw new Error('Failed to add to playlist')
    return response.json()
  }

  /**
   * Remove video from playlist
   */
  async removeFromPlaylist(playlistId: string, itemId: string): Promise<void> {
    const response = await fetch(`/api/playlists/${playlistId}/items/${itemId}`, {
      method: 'DELETE',
    })

    if (!response.ok) throw new Error('Failed to remove from playlist')
  }

  /**
   * Reorder items in playlist (drag & drop)
   */
  async reorderPlaylist(playlistId: string, newOrder: string[]): Promise<void> {
    const response = await fetch(`/api/playlists/${playlistId}/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: newOrder }),
    })

    if (!response.ok) throw new Error('Failed to reorder playlist')
  }

  /**
   * Update playlist metadata
   */
  async updatePlaylist(
    playlistId: string,
    updates: Partial<Playlist>
  ): Promise<Playlist> {
    const response = await fetch(`/api/playlists/${playlistId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    if (!response.ok) throw new Error('Failed to update playlist')
    return response.json()
  }

  /**
   * Delete playlist
   */
  async deletePlaylist(playlistId: string): Promise<void> {
    const response = await fetch(`/api/playlists/${playlistId}`, {
      method: 'DELETE',
    })

    if (!response.ok) throw new Error('Failed to delete playlist')
  }

  /**
   * Share playlist with user
   */
  async sharePlaylist(
    playlistId: string,
    userId: string,
    permission: 'view' | 'edit' = 'view'
  ): Promise<PlaylistShare> {
    const share: PlaylistShare = {
      id: `share-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      playlistId,
      sharedWith: userId,
      permission,
      sharedAt: Date.now(),
    }

    const response = await fetch(`/api/playlists/${playlistId}/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(share),
    })

    if (!response.ok) throw new Error('Failed to share playlist')
    return response.json()
  }

  /**
   * Get playlists shared with user
   */
  async getSharedPlaylists(userId: string): Promise<Playlist[]> {
    try {
      const response = await fetch(`/api/users/${userId}/playlists/shared`)
      if (!response.ok) return []
      return response.json()
    } catch {
      return []
    }
  }

  /**
   * Get public playlists (for discovery)
   */
  async getPublicPlaylists(
    limit: number = 20,
    offset: number = 0
  ): Promise<{ playlists: Playlist[]; total: number }> {
    try {
      const response = await fetch(
        `/api/playlists/public?limit=${limit}&offset=${offset}`
      )
      if (!response.ok) return { playlists: [], total: 0 }
      return response.json()
    } catch {
      return { playlists: [], total: 0 }
    }
  }

  /**
   * Like a playlist
   */
  async likePlaylist(playlistId: string): Promise<number> {
    const response = await fetch(`/api/playlists/${playlistId}/like`, {
      method: 'POST',
    })

    if (!response.ok) throw new Error('Failed to like playlist')
    const data = await response.json()
    return data.likes
  }

  /**
   * Unlike a playlist
   */
  async unlikePlaylist(playlistId: string): Promise<number> {
    const response = await fetch(`/api/playlists/${playlistId}/like`, {
      method: 'DELETE',
    })

    if (!response.ok) throw new Error('Failed to unlike playlist')
    const data = await response.json()
    return data.likes
  }

  /**
   * Duplicate a playlist
   */
  async duplicatePlaylist(playlistId: string, newName: string): Promise<Playlist> {
    const response = await fetch(`/api/playlists/${playlistId}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    })

    if (!response.ok) throw new Error('Failed to duplicate playlist')
    return response.json()
  }
}

export const playlistService = new PlaylistService()
