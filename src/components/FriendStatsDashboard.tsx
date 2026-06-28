/**
 * Friend Statistics Dashboard
 * Track which friends read your articles and their reading statistics
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  getArticleReaders,
  getUserReadStats,
  getSocialStatsForFriend,
  getFriends,
  addFriend,
  followUser,
  unfollowUser,
  type SocialStats,
  type FriendStats,
} from '../services/groupPermissionsService'
import './FriendStatsDashboard.css'

interface Article {
  id: string
  title: string
}

interface FriendStatsDashboardProps {
  articles?: Article[]
  selectedArticleId?: string
}

export function FriendStatsDashboard({
  articles = [],
  selectedArticleId,
}: FriendStatsDashboardProps) {
  const [currentUserStats, setCurrentUserStats] = useState<FriendStats | null>(null)
  const [friendsList, setFriendsList] = useState<string[]>([])
  const [articleReaders, setArticleReaders] = useState<SocialStats[]>([])
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [statsTab, setStatsTab] = useState<'my-stats' | 'who-read' | 'friends'>('my-stats')
  const [sortBy, setSortBy] = useState<'reads' | 'time' | 'recent'>('reads')
  const [newFriendInput, setNewFriendInput] = useState('')

  const loadStats = useCallback(() => {
    const stats = getUserReadStats('ich')
    setCurrentUserStats(stats)

    const friends = getFriends()
    setFriendsList(friends)

    if (selectedArticleId) {
      const readers = getArticleReaders(selectedArticleId)
      setArticleReaders(readers)
    }
  }, [selectedArticleId])

  useEffect(() => {
    loadStats()
    if (selectedArticleId && articles.length > 0) {
      const article = articles.find((a) => a.id === selectedArticleId)
      setSelectedArticle(article ?? null)
    }
  }, [selectedArticleId, articles, loadStats])

  const handleAddFriend = () => {
    if (newFriendInput.trim()) {
      addFriend(newFriendInput.trim())
      setNewFriendInput('')
      loadStats()
    }
  }

  const handleFollowUser = (userId: string) => {
    followUser(userId)
    loadStats()
  }

  const handleUnfollowUser = (userId: string) => {
    unfollowUser(userId)
    loadStats()
  }

  // Sort article readers
  const sortedReaders = useMemo(() => {
    const readers = [...articleReaders]
    switch (sortBy) {
      case 'reads':
        return readers.sort((a, b) => b.stats.articlesRead - a.stats.articlesRead)
      case 'time':
        return readers.sort(
          (a, b) => b.stats.totalTimeSpentSeconds - a.stats.totalTimeSpentSeconds,
        )
      case 'recent':
        return readers.sort((a, b) => b.stats.lastReadAt - a.stats.lastReadAt)
      default:
        return readers
    }
  }, [articleReaders, sortBy])

  return (
    <div className="friend-stats-dashboard">
      {/* Header */}
      <div className="stats-header">
        <h2>📊 Community Reading Stats</h2>
        <p>Track article reach and friend engagement</p>
      </div>

      {/* Tab Navigation */}
      <div className="stats-tabs">
        <button
          className={`tab-btn ${statsTab === 'my-stats' ? 'active' : ''}`}
          onClick={() => setStatsTab('my-stats')}
        >
          📈 My Reading Stats
        </button>
        <button
          className={`tab-btn ${statsTab === 'who-read' ? 'active' : ''}`}
          onClick={() => setStatsTab('who-read')}
        >
          👥 Who Read This
        </button>
        <button
          className={`tab-btn ${statsTab === 'friends' ? 'active' : ''}`}
          onClick={() => setStatsTab('friends')}
        >
          👫 Friends Network
        </button>
      </div>

      {/* Tab Content */}
      <div className="stats-content">
        {/* My Stats Tab */}
        {statsTab === 'my-stats' && currentUserStats && (
          <div className="stats-tab-pane">
            <div className="stats-overview">
              <div className="stat-card large">
                <div className="stat-icon">📚</div>
                <div className="stat-info">
                  <div className="stat-label">Total Articles Read</div>
                  <div className="stat-value">{currentUserStats.articlesRead}</div>
                </div>
              </div>

              <div className="stat-card large">
                <div className="stat-icon">⏱️</div>
                <div className="stat-info">
                  <div className="stat-label">Time Spent Reading</div>
                  <div className="stat-value">
                    {(currentUserStats.totalTimeSpentSeconds / 3600).toFixed(1)} hrs
                  </div>
                </div>
              </div>

              <div className="stat-card large">
                <div className="stat-icon">🔥</div>
                <div className="stat-info">
                  <div className="stat-label">Reading Streak</div>
                  <div className="stat-value">{currentUserStats.readStreak} days</div>
                </div>
              </div>

              <div className="stat-card large">
                <div className="stat-icon">📅</div>
                <div className="stat-info">
                  <div className="stat-label">Last Read</div>
                  <div className="stat-value">
                    {currentUserStats.lastReadAt > 0
                      ? new Date(currentUserStats.lastReadAt).toLocaleDateString()
                      : 'Never'}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent articles */}
            {currentUserStats.recentArticles.length > 0 && (
              <div className="recent-articles">
                <h3>Recent Reading</h3>
                <div className="articles-list">
                  {currentUserStats.recentArticles.slice(0, 10).map((articleId) => (
                    <div key={articleId} className="article-item">
                      <span className="article-id">{articleId}</span>
                      <span className="article-badge">✓ Read</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Who Read This Tab */}
        {statsTab === 'who-read' && (
          <div className="stats-tab-pane">
            {/* Article selector */}
            {articles.length > 0 && (
              <div className="article-selector">
                <label htmlFor="article-select">Select Article:</label>
                <select
                  id="article-select"
                  value={selectedArticleId ?? ''}
                  onChange={(e) => {
                    const article = articles.find((a) => a.id === e.target.value)
                    if (article) {
                      setSelectedArticle(article)
                      const readers = getArticleReaders(article.id)
                      setArticleReaders(readers)
                    }
                  }}
                  className="article-select"
                >
                  <option value="">-- Choose an article --</option>
                  {articles.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedArticle && (
              <>
                <div className="article-info">
                  <h3>{selectedArticle.title}</h3>
                  <div className="article-stats">
                    <span className="reader-count">
                      👥 {articleReaders.length} {articleReaders.length === 1 ? 'reader' : 'readers'}
                    </span>
                  </div>
                </div>

                {/* Sort options */}
                <div className="sort-controls">
                  <label htmlFor="sort-select">Sort by:</label>
                  <div className="sort-buttons" id="sort-select">
                    <button
                      className={`sort-btn ${sortBy === 'reads' ? 'active' : ''}`}
                      onClick={() => setSortBy('reads')}
                    >
                      📚 Articles Read
                    </button>
                    <button
                      className={`sort-btn ${sortBy === 'time' ? 'active' : ''}`}
                      onClick={() => setSortBy('time')}
                    >
                      ⏱️ Time Spent
                    </button>
                    <button
                      className={`sort-btn ${sortBy === 'recent' ? 'active' : ''}`}
                      onClick={() => setSortBy('recent')}
                    >
                      📅 Most Recent
                    </button>
                  </div>
                </div>

                {/* Readers list */}
                {sortedReaders.length === 0 ? (
                  <div className="empty-state">No one has read this article yet</div>
                ) : (
                  <div className="readers-list">
                    {sortedReaders.map((reader) => (
                      <div key={reader.friendId} className="reader-card">
                        <div className="reader-header">
                          <span className="reader-name">{reader.username}</span>
                          <div className="reader-badges">
                            {reader.stats.readStreak > 0 && (
                              <span className="badge streak-badge" title="Reading streak">
                                🔥 {reader.stats.readStreak}d
                              </span>
                            )}
                            {reader.reciprocalFriends.length > 0 && (
                              <span className="badge friend-badge">👫 Mutual</span>
                            )}
                          </div>
                        </div>

                        <div className="reader-stats">
                          <div className="reader-stat">
                            <span className="stat-icon">📚</span>
                            <span className="stat-text">
                              {reader.stats.articlesRead} articles
                            </span>
                          </div>
                          <div className="reader-stat">
                            <span className="stat-icon">⏱️</span>
                            <span className="stat-text">
                              {(reader.stats.totalTimeSpentSeconds / 60).toFixed(0)} min
                            </span>
                          </div>
                        </div>

                        <div className="reader-footer">
                          <button
                            className="follow-btn"
                            onClick={() => handleFollowUser(reader.friendId)}
                          >
                            👁️ Follow
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Friends Network Tab */}
        {statsTab === 'friends' && (
          <div className="stats-tab-pane">
            {/* Add friend form */}
            <div className="add-friend-form">
              <h3>Add Friend</h3>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="username or email"
                  value={newFriendInput}
                  onChange={(e) => setNewFriendInput(e.target.value)}
                  className="friend-input"
                />
                <button onClick={handleAddFriend} className="add-friend-btn">
                  ➕ Add
                </button>
              </div>
            </div>

            {/* Friends list */}
            {friendsList.length === 0 ? (
              <div className="empty-state">No friends added yet. Add one to see their stats!</div>
            ) : (
              <div className="friends-list">
                <h3>Your Friends ({friendsList.length})</h3>
                {friendsList.map((friendId) => {
                  const friendStats = getSocialStatsForFriend(friendId)
                  return (
                    <div key={friendId} className="friend-card">
                      <div className="friend-header">
                        <div className="friend-info">
                          <h4>{friendStats?.username ?? friendId}</h4>
                          <p className="friend-stats-line">
                            {friendStats?.stats.articlesRead ?? 0} articles •{' '}
                            {(((friendStats?.stats.totalTimeSpentSeconds ?? 0) / 3600).toFixed(1))} hrs
                          </p>
                        </div>
                        <div className="friend-actions">
                          <button
                            className="unfollow-btn"
                            onClick={() => handleUnfollowUser(friendId)}
                            title="Unfollow"
                          >
                            👁️✕
                          </button>
                        </div>
                      </div>

                      {friendStats && (
                        <div className="friend-detail-stats">
                          <div className="detail-stat">
                            <span className="detail-label">Followers</span>
                            <span className="detail-value">{friendStats.followersCount}</span>
                          </div>
                          <div className="detail-stat">
                            <span className="detail-label">Mutual Friends</span>
                            <span className="detail-value">
                              {friendStats.reciprocalFriends.length}
                            </span>
                          </div>
                          <div className="detail-stat">
                            <span className="detail-label">Reading Streak</span>
                            <span className="detail-value">🔥 {friendStats.stats.readStreak}d</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
