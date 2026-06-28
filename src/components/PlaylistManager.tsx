import { useState, useEffect, useCallback } from 'react'
import { playlistService, type Playlist } from '../services/playlistService'

interface Props {
  userId: string
  onPlaylistSelect?: (playlist: Playlist) => void
}

export function PlaylistManager({ userId, onPlaylistSelect }: Props) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)

  const loadPlaylists = useCallback(async () => {
    setIsLoading(true)
    try {
      const userPlaylists = await playlistService.getUserPlaylists(userId)
      setPlaylists(userPlaylists)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load playlists'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadPlaylists()
  }, [loadPlaylists])

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      setError('Playlist name is required')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const playlist = await playlistService.createPlaylist(
        userId,
        newPlaylistName,
        newPlaylistDescription,
        false
      )
      setPlaylists([...playlists, playlist])
      setNewPlaylistName('')
      setNewPlaylistDescription('')
      setShowCreateForm(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create playlist'
      setError(message)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeletePlaylist = async (playlistId: string) => {
    if (window.confirm('Delete this playlist?')) {
      try {
        await playlistService.deletePlaylist(playlistId)
        setPlaylists(playlists.filter(p => p.id !== playlistId))
        if (selectedPlaylist?.id === playlistId) {
          setSelectedPlaylist(null)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete playlist'
        setError(message)
      }
    }
  }

  const handleSelectPlaylist = (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
    onPlaylistSelect?.(playlist)
  }

  return (
    <div className="playlist-manager">
      <div className="playlist-manager__header">
        <h3 className="playlist-manager__title">My Playlists</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn--primary btn--sm"
        >
          {showCreateForm ? 'Cancel' : '+ New Playlist'}
        </button>
      </div>

      {showCreateForm && (
        <div className="playlist-manager__create-form">
          <input
            type="text"
            value={newPlaylistName}
            onChange={e => setNewPlaylistName(e.target.value)}
            placeholder="Playlist name"
            className="playlist-manager__input"
            disabled={isCreating}
          />
          <textarea
            value={newPlaylistDescription}
            onChange={e => setNewPlaylistDescription(e.target.value)}
            placeholder="Description (optional)"
            className="playlist-manager__textarea"
            rows={2}
            disabled={isCreating}
          />
          <button
            onClick={handleCreatePlaylist}
            disabled={isCreating}
            className="btn btn--primary"
          >
            {isCreating ? 'Creating...' : 'Create Playlist'}
          </button>
        </div>
      )}

      {error && <div className="playlist-manager__error">{error}</div>}

      {isLoading ? (
        <div className="playlist-manager__loading">Loading playlists...</div>
      ) : playlists.length === 0 ? (
        <p className="playlist-manager__empty">No playlists yet. Create one to organize your videos.</p>
      ) : (
        <div className="playlist-manager__list">
          {playlists.map(playlist => (
            <button
              key={playlist.id}
              className={`playlist-manager__item ${selectedPlaylist?.id === playlist.id ? 'active' : ''}`}
              onClick={() => handleSelectPlaylist(playlist)}
              type="button"
            >
              <div className="playlist-manager__item-info">
                <h4 className="playlist-manager__item-name">{playlist.name}</h4>
                <p className="playlist-manager__item-meta">
                  {playlist.items.length} video{playlist.items.length !== 1 ? 's' : ''}
                </p>
                {playlist.description && (
                  <p className="playlist-manager__item-description">{playlist.description}</p>
                )}
              </div>
              <div className="playlist-manager__item-actions">
                {playlist.isPublic && (
                  <span className="playlist-manager__badge">Public</span>
                )}
                <button
                  onClick={e => {
                    e.stopPropagation()
                    handleDeletePlaylist(playlist.id)
                  }}
                  className="btn btn--sm btn--ghost"
                  title="Delete playlist"
                >
                  ✕
                </button>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedPlaylist && (
        <div className="playlist-manager__viewer">
          <h4 className="playlist-manager__viewer-title">{selectedPlaylist.name}</h4>
          <div className="playlist-manager__items">
            {selectedPlaylist.items.length === 0 ? (
              <p className="playlist-manager__empty-items">No videos in this playlist</p>
            ) : (
              selectedPlaylist.items.map((item, idx) => (
                <div key={item.id} className="playlist-manager__video-item">
                  <span className="playlist-manager__video-index">{idx + 1}</span>
                  <div className="playlist-manager__video-info">
                    <p className="playlist-manager__video-title">{item.videoTitle}</p>
                    <p className="playlist-manager__video-id">ID: {item.videoId}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .playlist-manager {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          background: var(--surface);
          border-radius: 8px;
        }

        .playlist-manager__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .playlist-manager__title {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .playlist-manager__create-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;
          background: var(--background);
          border-radius: 6px;
        }

        .playlist-manager__input {
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          font-size: 1rem;
        }

        .playlist-manager__textarea {
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          font-size: 0.875rem;
          resize: vertical;
        }

        .playlist-manager__input:focus,
        .playlist-manager__textarea:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        .playlist-manager__error {
          padding: 0.75rem;
          background: #ffe0e0;
          border-left: 3px solid #ff4444;
          border-radius: 4px;
          color: #c00;
          font-size: 0.875rem;
        }

        .playlist-manager__loading {
          text-align: center;
          color: var(--text-muted);
          padding: 1rem 0;
        }

        .playlist-manager__empty {
          text-align: center;
          color: var(--text-muted);
          padding: 1rem 0;
          margin: 0;
        }

        .playlist-manager__list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .playlist-manager__item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: var(--background);
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
          border: none;
          width: 100%;
          text-align: left;
          font-size: 1rem;
        }

        .playlist-manager__item:hover {
          background: var(--background);
          opacity: 0.9;
        }

        .playlist-manager__item.active {
          border-left: 3px solid var(--primary-color);
          background: rgba(74, 144, 226, 0.05);
        }

        .playlist-manager__item-info {
          flex: 1;
        }

        .playlist-manager__item-name {
          margin: 0;
          font-size: 0.975rem;
          font-weight: 600;
        }

        .playlist-manager__item-meta {
          margin: 0.25rem 0 0;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .playlist-manager__item-description {
          margin: 0.25rem 0 0;
          font-size: 0.75rem;
          color: var(--text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .playlist-manager__item-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .playlist-manager__badge {
          padding: 0.25rem 0.5rem;
          background: var(--primary-color);
          color: white;
          border-radius: 3px;
          font-size: 0.65rem;
          font-weight: 600;
        }

        .playlist-manager__viewer {
          padding: 1rem;
          background: var(--background);
          border-radius: 6px;
          border-left: 3px solid var(--primary-color);
        }

        .playlist-manager__viewer-title {
          margin: 0 0 0.75rem;
          font-size: 0.975rem;
          font-weight: 600;
        }

        .playlist-manager__items {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 300px;
          overflow-y: auto;
        }

        .playlist-manager__empty-items {
          text-align: center;
          color: var(--text-muted);
          padding: 0.5rem 0;
          margin: 0;
          font-size: 0.875rem;
        }

        .playlist-manager__video-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.5rem;
          background: var(--surface);
          border-radius: 4px;
          font-size: 0.825rem;
        }

        .playlist-manager__video-index {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--primary-color);
          color: white;
          font-weight: 600;
          font-size: 0.7rem;
        }

        .playlist-manager__video-info {
          flex: 1;
        }

        .playlist-manager__video-title {
          margin: 0;
          font-weight: 500;
          line-height: 1.3;
        }

        .playlist-manager__video-id {
          margin: 0.25rem 0 0;
          color: var(--text-muted);
          font-size: 0.75rem;
          font-family: monospace;
        }
      `}</style>
    </div>
  )
}
