/**
 * Threaded Comments Component
 * Comment threading with nested replies, voting, and tree structure
 */
import { useState, useEffect, useCallback } from 'react'
import {
  getCommentThread,
  createThreadedComment,
  voteThreadedComment,
  deleteThreadedComment,
  editThreadedComment,
  type ThreadedComment,
} from '../services/groupPermissionsService'
import { timeAgo } from '../lib/filterArticles'
import './ThreadedComments.css'

interface ThreadedCommentsProps {
  articleId: string
  groupId?: string
}

interface CommentUIState {
  expandedReplies: Set<string>
  editingId: string | null
  editingText: string
  replyingTo: string | null
  replyText: string
}

export function ThreadedComments({ articleId, groupId = 'general' }: ThreadedCommentsProps) {
  const [comments, setComments] = useState<ThreadedComment[]>([])
  const [newCommentText, setNewCommentText] = useState('')
  const [uiState, setUiState] = useState<CommentUIState>({
    expandedReplies: new Set(),
    editingId: null,
    editingText: '',
    replyingTo: null,
    replyText: '',
  })

  const loadComments = useCallback(() => {
    const thread = getCommentThread(articleId, groupId)
    setComments(thread)
  }, [articleId, groupId])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const handleAddComment = () => {
    if (newCommentText.trim()) {
      createThreadedComment(groupId, articleId, newCommentText)
      setNewCommentText('')
      loadComments()
    }
  }

  const handleReply = () => {
    if (uiState.replyText.trim() && uiState.replyingTo) {
      createThreadedComment(groupId, articleId, uiState.replyText, uiState.replyingTo)
      setUiState({
        ...uiState,
        replyingTo: null,
        replyText: '',
      })
      loadComments()
    }
  }

  const handleEdit = (commentId: string, newText: string) => {
    if (newText.trim()) {
      editThreadedComment(commentId, newText)
      setUiState({
        ...uiState,
        editingId: null,
        editingText: '',
      })
      loadComments()
    }
  }

  const handleDelete = (commentId: string) => {
    if (deleteThreadedComment(commentId)) {
      loadComments()
    }
  }

  const handleVote = (commentId: string, direction: 1 | -1) => {
    voteThreadedComment(commentId, direction)
    loadComments()
  }

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(uiState.expandedReplies)
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId)
    } else {
      newExpanded.add(commentId)
    }
    setUiState({ ...uiState, expandedReplies: newExpanded })
  }

  const CommentNode = ({ comment, depth = 0 }: { comment: ThreadedComment; depth?: number }) => {
    const isEditing = uiState.editingId === comment.id
    const isReplying = uiState.replyingTo === comment.id
    const replies = comment.replies || []

    return (
      <div className="comment-node" style={{ marginLeft: `${depth * 2}rem` }}>
        <div className="comment-container">
          {/* Header with author and time */}
          <div className="comment-header">
            <div className="comment-meta">
              <span className="comment-author">{comment.author}</span>
              <span className="comment-depth-badge">L{depth}</span>
              <span className="comment-time">{timeAgo(new Date(comment.createdAt))}</span>
              {comment.updatedAt !== comment.createdAt && (
                <span className="comment-edited">(edited)</span>
              )}
            </div>
          </div>

          {/* Comment content */}
          {isEditing ? (
            <div className="comment-edit-form">
              <textarea
                value={uiState.editingText}
                onChange={(e) =>
                  setUiState({ ...uiState, editingText: e.target.value })
                }
                className="edit-textarea"
              />
              <div className="edit-actions">
                <button
                  className="edit-save"
                  onClick={() => handleEdit(comment.id, uiState.editingText)}
                >
                  Save
                </button>
                <button
                  className="edit-cancel"
                  onClick={() =>
                    setUiState({ ...uiState, editingId: null, editingText: '' })
                  }
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="comment-text">{comment.text}</p>
          )}

          {/* Actions */}
          <div className="comment-actions">
            <div className="vote-section">
              <button
                className="vote-btn vote-up"
                onClick={() => handleVote(comment.id, 1)}
                title="Upvote"
              >
                👍
              </button>
              <span className="vote-count">{comment.score}</span>
              <button
                className="vote-btn vote-down"
                onClick={() => handleVote(comment.id, -1)}
                title="Downvote"
              >
                👎
              </button>
            </div>

            <div className="action-buttons">
              <button
                className="action-btn reply-btn"
                onClick={() =>
                  setUiState({
                    ...uiState,
                    replyingTo: isReplying ? null : comment.id,
                    replyText: '',
                  })
                }
              >
                💬 Reply
              </button>
              <button
                className="action-btn edit-btn"
                onClick={() => {
                  setUiState({
                    ...uiState,
                    editingId: isEditing ? null : comment.id,
                    editingText: comment.text,
                  })
                }}
              >
                ✏️ Edit
              </button>
              <button
                className="action-btn delete-btn"
                onClick={() => handleDelete(comment.id)}
              >
                🗑️ Delete
              </button>
            </div>

            {replies.length > 0 && (
              <button
                className="toggle-replies-btn"
                onClick={() => toggleReplies(comment.id)}
              >
                {uiState.expandedReplies.has(comment.id) ? '▼' : '▶'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>

          {/* Reply form */}
          {isReplying && (
            <div className="reply-form">
              <textarea
                value={uiState.replyText}
                onChange={(e) =>
                  setUiState({ ...uiState, replyText: e.target.value })
                }
                placeholder="Write your reply..."
                className="reply-textarea"
              />
              <div className="reply-actions">
                <button className="reply-submit" onClick={handleReply}>
                  Post Reply
                </button>
                <button
                  className="reply-cancel"
                  onClick={() =>
                    setUiState({ ...uiState, replyingTo: null, replyText: '' })
                  }
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Nested replies */}
          {uiState.expandedReplies.has(comment.id) && replies.length > 0 && (
            <div className="replies-section">
              {replies.map((reply) => (
                <CommentNode key={reply.id} comment={reply} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="threaded-comments-container">
      <div className="comments-header">
        <h3>💬 Discussion ({comments.length})</h3>
      </div>

      {/* New comment form */}
      <div className="new-comment-form">
        <textarea
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Share your thoughts on this article..."
          className="new-comment-textarea"
        />
        <button className="submit-comment-btn" onClick={handleAddComment}>
          Post Comment
        </button>
      </div>

      {/* Comments thread */}
      <div className="comments-thread">
        {comments.length === 0 ? (
          <div className="empty-comments">
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentNode key={comment.id} comment={comment} depth={0} />
          ))
        )}
      </div>
    </div>
  )
}
