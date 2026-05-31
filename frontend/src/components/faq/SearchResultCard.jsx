/**
 * SearchResultCard.jsx
 * Displayed inside the FAQ search dropdown and on the search results page.
 *
 * Props:
 *   question    string   — FAQ question text
 *   answer      string   — FAQ answer (truncated to 120 chars)
 *   category    string   — category badge
 *   tags        string[] — tag chips
 *   score       number   — relevance score (0–1)
 *   matchType   'semantic' | 'keyword' — how it was matched
 *   onClick     function — called when the card is clicked
 *   style       object   — extra inline styles (optional)
 */

const CATEGORY_LABELS = {
  academics: '📚 Academics',
  admission: '🎓 Admission',
  fees: '💰 Fees',
  placement: '💼 Placement',
  facilities: '🏢 Facilities',
  other: '📁 Other',
};

function highlightTerms(text, query) {
  if (!query || !text) return text;
  const words = query.trim().split(/\s+/).filter(w => w.length > 1);
  if (words.length === 0) return text;
  const regex = new RegExp(`(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} style={{ background: '#fef08a', color: 'inherit', borderRadius: '2px', padding: '0 1px' }}>{part}</mark>
      : part
  );
}

export default function SearchResultCard({ question, answer, category, tags = [], score, matchType, onClick, style, searchQuery }) {
  const truncated = answer && answer.length > 120 ? answer.slice(0, 120) + '…' : answer;
  const matchLabel = matchType === 'semantic' ? '🧠 Semantic' : '📖 Keyword';
  const matchColor = matchType === 'semantic' ? 'var(--primary)' : 'var(--text-muted)';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}
      style={{
        display: 'block',
        padding: '0.85rem 1rem',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        background: 'var(--surface)',
        transition: 'background 0.1s',
        ...style,
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-secondary)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
    >
      {/* Question */}
      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.3rem', lineHeight: 1.4 }}>
        {highlightTerms(question, searchQuery)}
      </div>

      {/* Answer snippet */}
      {truncated && (
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
          {highlightTerms(truncated, searchQuery)}
        </div>
      )}

      {/* Footer row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
        {category && category !== 'other' && (
          <span className="tag" style={{ fontSize: '0.7rem' }}>
            {CATEGORY_LABELS[category] || category}
          </span>
        )}
        {tags.slice(0, 3).map(t => (
          <span key={t} style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'var(--surface-secondary)', padding: '1px 6px', borderRadius: '4px' }}>#{t}</span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: matchColor, fontWeight: 500 }}>
          {matchLabel}
        </span>
      </div>
    </div>
  );
}