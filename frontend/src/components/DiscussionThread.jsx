import { useState, useEffect } from 'react';

function getToken() {
  return localStorage.getItem('faq_access_token');
}

function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(date).toLocaleDateString();
}

function UpvoteButton({ discussionId, upvotes, onToggle }) {
  const [upvoted, setUpvoted] = useState(false);
  const [count, setCount] = useState(upvotes?.length || 0);

  useEffect(() => { setCount(upvotes?.length || 0); }, [upvotes]);
  useEffect(() => {
    const token = getToken();
    if (token && upvotes?.some) {
      // We need the current user ID — check from localStorage or assume logged-in
      setUpvoted(false); // will be updated after fetch
    }
  }, []);

  const handleUpvote = async () => {
    const token = getToken();
    if (!token) return;
    // Optimistic
    const newUpvoted = !upvoted;
    setUpvoted(newUpvoted);
    setCount(c => newUpvoted ? c + 1 : c - 1);
    try {
      const res = await fetch(`/api/discussions/${discussionId}/upvote`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCount(data.data.upvoteCount);
        setUpvoted(data.data.upvoted);
      } else {
        // revert
        setUpvoted(!newUpvoted);
        setCount(c => newUpvoted ? c - 1 : c + 1);
      }
    } catch {
      setUpvoted(!newUpvoted);
      setCount(c => newUpvoted ? c - 1 : c + 1);
    }
  };

  return (
    <button
      onClick={handleUpvote}
      title={upvoted ? 'Remove upvote' : 'Upvote this comment'}
      aria-pressed={upvoted}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '4px',
        color: upvoted ? 'var(--primary)' : 'var(--text-muted)',
        fontSize: '0.82rem', padding: '2px 4px',
        transition: 'color 0.15s',
      }}
    >
      <span>{upvoted ? '▲' : '△'}</span>
      <span>{count}</span>
    </button>
  );
}

function DiscussionItem({ discussion, onReply, onDelete, isStaff, isOwner }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim() || replyText.trim().length < 10) return;
    setSubmitting(true);
    await onReply(discussion._id, replyText);
    setReplyText('');
    setShowReplyForm(false);
    setSubmitting(false);
  };

  return (
    <div style={{
      padding: '0.75rem',
      background: discussion.isVerified ? '#f0fdf4' : 'transparent',
      border: discussion.isVerified ? '1px solid #bbf7d0' : '1px solid var(--border)',
      borderRadius: '8px',
      marginBottom: '0.5rem',
    }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'var(--primary-light)', color: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
        }}>
          {discussion.author?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <strong style={{ fontSize: '0.88rem' }}>{discussion.author?.name || 'Anonymous'}</strong>
            {discussion.isVerified && (
              <span title="Verified by staff" style={{ fontSize: '0.7rem', background: '#d1fae5', color: '#065f46', padding: '1px 6px', borderRadius: '10px' }}>
                ✓ Verified
              </span>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{timeAgo(discussion.createdAt)}</span>
          </div>
          <div style={{ fontSize: '0.9rem', lineHeight: 1.6, marginTop: '0.25rem' }}>
            {discussion.content}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem', alignItems: 'center' }}>
            <UpvoteButton discussionId={discussion._id} upvotes={discussion.upvotes} />
            {discussion.parentId === null && (
              <button
                onClick={() => setShowReplyForm(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)' }}
              >
                💬 Reply
              </button>
            )}
            {(isOwner || isStaff) && (
              <button
                onClick={() => onDelete(discussion._id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#ef4444' }}
                title="Delete comment"
              >
                🗑
              </button>
            )}
          </div>

          {showReplyForm && (
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.4rem', alignItems: 'flex-end' }}>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Write a reply... (min 10 characters)"
                style={{ flex: 1, minHeight: '60px', fontSize: '0.85rem', padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border)' }}
                minLength={10}
                maxLength={2000}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleReply}
                  disabled={replyText.trim().length < 10 || submitting}
                >
                  {submitting ? '...' : 'Post'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setShowReplyForm(false); setReplyText(''); }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {discussion.replies && discussion.replies.length > 0 && (
        <div style={{ marginTop: '0.5rem', marginLeft: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {discussion.replies.map(reply => (
            <div key={reply._id} style={{ padding: '0.6rem', background: 'var(--surface-secondary)', borderRadius: '6px', borderLeft: '3px solid var(--primary-light)' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: 'var(--primary-light)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.75rem', flexShrink: 0,
                }}>
                  {reply.author?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.82rem' }}>{reply.author?.name || 'Anonymous'}</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{timeAgo(reply.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: '0.87rem', lineHeight: 1.5 }}>{reply.content}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', alignItems: 'center' }}>
                    <UpvoteButton discussionId={reply._id} upvotes={reply.upvotes} />
                    {(isOwner || isStaff) && (
                      <button onClick={() => onDelete(reply._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: '#ef4444' }}>🗑</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DiscussionThread({ queryId, currentUserRole, currentUserId }) {
  const [discussions, setDiscussions] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const isStaff = ['admin', 'support_staff'].includes(currentUserRole);

  const fetchDiscussions = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/queries/${queryId}/discussions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok) setDiscussions(data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDiscussions(); }, [queryId]);

  const handlePost = async () => {
    if (newComment.trim().length < 10) return;
    setSubmitting(true);
    const token = getToken();
    try {
      const res = await fetch(`/api/queries/${queryId}/discussions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: newComment }),
      });
      if (res.ok) {
        setNewComment('');
        fetchDiscussions();
      }
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  };

  const handleReply = async (parentId, content) => {
    const token = getToken();
    await fetch(`/api/queries/${queryId}/discussions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ content, parentId }),
    });
    fetchDiscussions();
  };

  const handleDelete = async (discussionId) => {
    if (!confirm('Delete this comment?')) return;
    const token = getToken();
    await fetch(`/api/discussions/${discussionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchDiscussions();
  };

  return (
    <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          💬 Discussion
          <span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--text-muted)' }}>
            ({discussions.length} thread{discussions.length !== 1 ? 's' : ''})
          </span>
        </h3>
        <button onClick={fetchDiscussions} className="btn btn-ghost btn-sm">🔄 Refresh</button>
      </div>

      {/* Comment input */}
      {currentUserRole && (
        <div style={{ marginBottom: '1.25rem' }}>
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Add to the discussion... (min 10 characters)"
            style={{ minHeight: '70px', fontSize: '0.9rem', marginBottom: '0.5rem' }}
            maxLength={2000}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {newComment.length}/2000 · min 10
            </span>
            <button
              className="btn btn-primary btn-sm"
              onClick={handlePost}
              disabled={newComment.trim().length < 10 || submitting}
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
      )}

      {/* Discussion threads */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Loading discussion...</p>
      ) : discussions.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontStyle: 'italic' }}>
          No discussion yet. Be the first to comment!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {discussions.map(d => (
            <DiscussionItem
              key={d._id}
              discussion={d}
              onReply={handleReply}
              onDelete={handleDelete}
              isStaff={isStaff}
              isOwner={d.author?._id === currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}