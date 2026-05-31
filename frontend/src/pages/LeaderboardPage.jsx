import { useState, useEffect } from 'react';

function getToken() {
  return localStorage.getItem('faq_access_token');
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('faq_user') || 'null'); } catch { return null; }
}

function Medal({ rank }) {
  if (rank === 1) return <span style={{ fontSize: '1.3rem' }}>🥇</span>;
  if (rank === 2) return <span style={{ fontSize: '1.3rem' }}>🥈</span>;
  if (rank === 3) return <span style={{ fontSize: '1.3rem' }}>🥉</span>;
  return <span style={{ fontWeight: 700, color: 'var(--text-muted)', width: '1.5rem', display: 'inline-block', textAlign: 'center' }}>{rank}</span>;
}

function BadgeChip({ badge, size = 'sm' }) {
  return (
    <span
      title={badge.description}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '3px',
        background: badge.earned ? badge.color : '#e2e8f0',
        color: badge.earned ? '#0f172a' : '#94a3b8',
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        borderRadius: '20px',
        fontSize: size === 'sm' ? '0.72rem' : '0.85rem',
        fontWeight: badge.earned ? 600 : 400,
        opacity: badge.earned ? 1 : 0.5,
        cursor: 'default',
      }}
    >
      {badge.icon} {badge.name}
    </span>
  );
}

function UserRow({ user, currentUserId }) {
  const [expanded, setExpanded] = useState(false);
  const isMe = user._id === currentUserId;

  return (
    <div
      className="card"
      style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        padding: '0.85rem 1.25rem',
        border: isMe ? '2px solid var(--primary)' : '1px solid var(--border)',
        cursor: 'pointer',
      }}
      onClick={() => setExpanded(v => !v)}
      role="button"
      aria-expanded={expanded}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && setExpanded(v => !v)}
    >
      <Medal rank={user.rank} />
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
        {user.name?.[0]?.toUpperCase()}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>
          {user.name}
          {isMe && <span style={{ marginLeft: '0.4rem', fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 700 }}>You</span>}
        </div>
        {user.department && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{user.department}</div>}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>
          {user.stats?.reputationPoints || 0} pts
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {user.stats?.solutionsApproved || 0} solutions approved
        </div>
      </div>
      {expanded && (
        <div style={{ width: '100%', gridColumn: '1 / -1', marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}
          onClick={e => e.stopPropagation()}>
          {user.badges?.map(b => <BadgeChip key={b.id} badge={b} size="sm" />)}
          {!user.badges?.length && <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>No badges earned yet</span>}
          <div style={{ width: '100%', display: 'flex', gap: '2rem', marginTop: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <span>📝 {user.stats?.queriesAsked || 0} queries raised</span>
            <span>💡 {user.stats?.solutionsSubmitted || 0} solutions submitted</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = getUser();

  useEffect(() => {
    const token = getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    Promise.all([
      fetch('/api/reputation/leaderboard', { headers }).then(r => r.json()),
      fetch('/api/reputation/me', { headers }).then(r => r.json()),
    ]).then(([lb, me]) => {
      if (lb.success) setLeaderboard(lb.data || []);
      if (me.success) setMyStats(me.data);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1>🏆 Leaderboard</h1>
        <p>Top contributors in the community — ranked by reputation points</p>
      </div>

      {/* My stats banner */}
      {myStats && (
        <div style={{
          padding: '1rem 1.5rem', background: 'var(--primary-light)', borderRadius: '12px',
          marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Rank</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>#{myStats.rank}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reputation</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{myStats.stats?.reputationPoints || 0} pts</div>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
            {myStats.earnedBadges?.map(b => <BadgeChip key={b.id} badge={b} />)}
            {!myStats.earnedBadges?.length && <span style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>Earn badges to show them here!</span>}
          </div>
        </div>
      )}

      {/* All badges legend */}
      {myStats?.allBadges && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>All Badges</h3>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {myStats.allBadges.map(b => <BadgeChip key={b.id} badge={b} />)}
          </div>
        </div>
      )}

      {/* Leaderboard table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {loading ? (
          <div className="empty-state"><div className="icon">⏳</div><p>Loading leaderboard...</p></div>
        ) : leaderboard.length === 0 ? (
          <div className="empty-state"><div className="icon">🏆</div><p>No leaderboard data yet.</p></div>
        ) : leaderboard.map(user => (
          <UserRow key={user._id} user={user} currentUserId={currentUser?._id} />
        ))}
      </div>
    </div>
  );
}