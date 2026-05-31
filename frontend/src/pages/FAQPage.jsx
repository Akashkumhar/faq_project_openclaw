import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopFAQsWidget from '../components/faq/TopFAQsWidget';

const API = '/api/faqs';
const CAT_API = '/api/categories';

function getToken() {
  return localStorage.getItem('faq_access_token');
}

function VoteButtons({ faqId, helpful, notHelpful, myVote, onVote }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
      <button
        className={`btn btn-ghost btn-sm ${myVote === 'helpful' ? 'voted-helpful' : ''}`}
        onClick={e => { e.stopPropagation(); onVote(faqId, 'helpful'); }}
        title={myVote === 'helpful' ? 'Remove helpful vote' : 'Mark as helpful'}
        aria-pressed={myVote === 'helpful'}
        aria-label={`Helpful (${helpful} votes)`}
      >
        👍 Helpful <span className="vote-count" style={{ transition: 'transform 0.15s', display: 'inline-block' }}>{helpful}</span>
      </button>
      <button
        className={`btn btn-ghost btn-sm ${myVote === 'not_helpful' ? 'voted-not-helpful' : ''}`}
        onClick={e => { e.stopPropagation(); onVote(faqId, 'not_helpful'); }}
        title={myVote === 'not_helpful' ? 'Remove vote' : 'Mark as not helpful'}
        aria-pressed={myVote === 'not_helpful'}
        aria-label={`Not helpful (${notHelpful} votes)`}
      >
        👎 Not Helpful <span style={{ transition: 'transform 0.15s', display: 'inline-block' }}>{notHelpful}</span>
      </button>
    </div>
  );
}

function FAQCard({ faq, isExpanded, onToggle, onVote, userVote }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isExpanded === faq._id) setIsOpen(true);
    else setIsOpen(false);
  }, [isExpanded, faq._id]);

  return (
    <div
      className="card faq-card"
      style={{ cursor: 'pointer', padding: 0, overflow: 'hidden', transition: 'box-shadow 0.2s' }}
      onClick={() => onToggle(faq._id)}
      role="button"
      aria-expanded={isOpen}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onToggle(faq._id)}
    >
      {isOpen && (
        <>
          <div style={{ padding: '1rem 1.1rem 0' }}>
            <div className="faq-question">
              <span className="q-icon">Q</span>
              <span>{faq.question}</span>
            </div>
            {faq.category && faq.category !== 'other' && (
              <div style={{ marginBottom: '0.5rem', marginLeft: '1.7rem' }}>
                <span className="tag">{faq.category}</span>
              </div>
            )}
            <div style={{
              marginLeft: '1.7rem',
              padding: '0.75rem 0.9rem',
              background: 'var(--surface-secondary)',
              borderRadius: '8px',
              borderLeft: '3px solid var(--primary)',
              fontSize: '0.92rem',
              lineHeight: 1.6,
              color: 'var(--text)',
              marginBottom: '0.75rem',
            }}>
              {faq.answer}
            </div>
            <div className="faq-tags">
              {(faq.tags || []).map(t => <span key={t} className="tag">{t}</span>)}
              <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                👁 {faq.viewCount || 0}
              </span>
            </div>
            <VoteButtons
              faqId={faq._id}
              helpful={faq.helpful || 0}
              notHelpful={faq.notHelpful || 0}
              myVote={userVote || null}
              onVote={onVote}
            />
          </div>
          <div style={{ padding: '0 1rem 0.75rem', marginTop: '0.25rem', textAlign: 'right' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={e => { e.stopPropagation(); onToggle(faq._id); }}
              aria-label="Collapse FAQ"
            >
              ▲ Collapse
            </button>
          </div>
        </>
      )}
      {!isOpen && (
        <div style={{ padding: '0.9rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.92rem', lineHeight: 1.4, display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 800, flexShrink: 0 }}>Q</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{faq.question}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem', alignItems: 'center' }}>
              {faq.category && faq.category !== 'other' && <span className="tag" style={{ fontSize: '0.7rem' }}>{faq.category}</span>}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>👍 {faq.helpful || 0}</span>
            </div>
          </div>
          <span style={{ color: 'var(--text-muted)', flexShrink: 0, fontSize: '1rem' }}>▼</span>
        </div>
      )}
    </div>
  );
}

const SORT_OPTIONS = [
  { value: 'newest', label: '🕐 Newest' },
  { value: 'helpful', label: '👍 Most Helpful' },
  { value: 'views', label: '👁 Most Viewed' },
  { value: 'oldest', label: '🕘 Oldest' },
];

export default function FAQPage() {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [userVotes, setUserVotes] = useState({});
  const [sort, setSort] = useState('newest');

  useEffect(() => { fetchFAQs(); fetchCategories(); }, []);
  useEffect(() => { fetchFAQs(activeCategory); }, [activeCategory]);

  const fetchFAQs = async (cat) => {
    try {
      const params = new URLSearchParams();
      if (cat && cat !== 'all') params.set('category', cat);
      params.set('sort', sort);
      const url = `${API}?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setFaqs(data.data || []);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(CAT_API);
      const data = await res.json();
      if (res.ok) setCategories(data.data || []);
    } catch { /* silent */ }
  };

  const open = (id) => setExpandedId(prev => prev === id ? null : id);

  const filtered = faqs.filter(f =>
    f.question.toLowerCase().includes(search.toLowerCase()) ||
    (f.answer || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  const fetchMyVote = async (faqId) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/${faqId}/my-vote`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.data?.myVote) {
        setUserVotes(prev => ({ ...prev, [faqId]: data.data.myVote }));
      }
    } catch { /* silent */ }
  };

  const handleVote = async (faqId, vote) => {
    const token = getToken();
    if (!token) return;

    const prev = userVotes[faqId] || null;
    setFaqs(prev => prev.map(f => {
      if (f._id !== faqId) return f;
      let { helpful, notHelpful } = f;
      if (prev === 'helpful') helpful = Math.max(0, helpful - 1);
      if (prev === 'not_helpful') notHelpful = Math.max(0, notHelpful - 1);
      if (vote === 'helpful') helpful += 1;
      if (vote === 'not_helpful') notHelpful += 1;
      return { ...f, helpful, notHelpful };
    }));

    let actualVote = null;
    if (prev === vote) actualVote = null;
    else actualVote = vote;

    try {
      if (actualVote) {
        const res = await fetch(`${API}/${faqId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ vote: actualVote }),
        });
        const data = await res.json();
        if (res.ok) {
          setFaqs(prev => prev.map(f => f._id === faqId ? { ...f, helpful: data.data.helpful, notHelpful: data.data.notHelpful } : f));
          setUserVotes(prev => ({ ...prev, [faqId]: data.data.myVote || actualVote }));
        }
      } else {
        await fetch(`${API}/${faqId}/vote`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        setUserVotes(prev => ({ ...prev, [faqId]: null }));
      }
    } catch {
      fetchFAQs(activeCategory);
      setUserVotes(prev => ({ ...prev, [faqId]: prev[faqId] || null }));
    }
  };

  const handleToggle = async (faqId) => {
    if (expandedId !== faqId) fetchMyVote(faqId);
    open(faqId);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>📖 Frequently Asked Questions</h1>
        <p>Find answers to the most common questions from the community</p>
      </div>

      {/* Top 10 Most Helpful FAQs — pinned above the full list */}
      <TopFAQsWidget limit={10} />

      {/* Search + Sort bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '200px' }}>
          <input
            type="search"
            placeholder="🔍 Filter FAQs by keyword…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Filter FAQs"
          />
        </div>

        {/* Sort control */}
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Sort:</span>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={`btn btn-sm ${sort === opt.value ? 'btn-primary' : 'btn-ghost'}`}
              aria-pressed={sort === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter tabs */}
      <nav aria-label="FAQ categories" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
        <button
          onClick={() => setActiveCategory('all')}
          className={`btn btn-sm ${activeCategory === 'all' ? 'btn-primary' : 'btn-ghost'}`}
          aria-pressed={activeCategory === 'all'}
        >
          📚 All
        </button>
        {categories.map(cat => (
          <button
            key={cat._id}
            onClick={() => setActiveCategory(cat.name)}
            className={`btn btn-sm ${activeCategory === cat.name ? 'btn-primary' : 'btn-ghost'}`}
            aria-pressed={activeCategory === cat.name}
          >
            {cat.icon} {cat.displayName}
            {cat.faqCount !== undefined && (
              <span style={{ marginLeft: '0.3rem', fontSize: '0.72rem', opacity: 0.75 }}>
                ({cat.faqCount})
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Section heading */}
      <section aria-label="All FAQs">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.1rem' }}>📋</span>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            {activeCategory !== 'all'
              ? `${categories.find(c => c.name === activeCategory)?.displayName || activeCategory} FAQs`
              : 'All FAQs'}
          </h2>
          {!loading && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
              ({filtered.length})
            </span>
          )}
        </div>

        {loading ? (
          <div className="empty-state"><div className="icon">⏳</div><p>Loading FAQs…</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🔎</div>
            <p>{search ? 'No FAQs match your search' : 'No FAQs in this category yet.'}</p>
          </div>
        ) : (
          <div className="card-grid">
            {filtered.map(faq => (
              <FAQCard
                key={faq._id}
                faq={faq}
                isExpanded={expandedId}
                onToggle={handleToggle}
                onVote={handleVote}
                userVote={userVotes[faq._id]}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
