/**
 * FAQSearchPage.jsx
 * Full search results page with hybrid / semantic / keyword mode toggle.
 *
 * Route: /search?q=<query>&mode=hybrid|semantic|keyword
 */
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SearchResultCard from '../components/faq/SearchResultCard';

const MODES = [
  { value: 'hybrid', label: '🔗 Hybrid' },
  { value: 'semantic', label: '🧠 Semantic' },
  { value: 'keyword', label: '📖 Keyword' },
];

function getToken() {
  return localStorage.getItem('faq_access_token');
}

export default function FAQSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') || '';
  const initialMode = searchParams.get('mode') || 'hybrid';

  const [query, setQuery] = useState(q);
  const [mode, setMode] = useState(initialMode);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [durationMs, setDurationMs] = useState(0);

  const doSearch = useCallback(async (searchQuery, searchMode) => {
    if (!searchQuery || searchQuery.trim().length < 2) return;
    setLoading(true);
    setSearched(false);
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&mode=${searchMode}&limit=20`,
        { headers }
      );
      const data = await res.json();
      if (data.success) {
        setResults(data.data.results || []);
        setDurationMs(data.data.durationMs || 0);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, []);

  // Search when component loads with query params
  useEffect(() => {
    if (q) {
      setQuery(q);
      doSearch(q, mode);
    }
  }, [q, mode, doSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ q: query, mode });
    doSearch(query, mode);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (q) {
      setSearchParams({ q, mode: newMode });
      doSearch(q, newMode);
    }
  };

  const handleResultClick = async (faqId) => {
    navigate(`/faq/${faqId}`);
    // Fire-and-forget click feedback
    const token = getToken();
    if (token) {
      try {
        await fetch('/api/search/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ queryText: q, clickedFaqId: faqId }),
        });
      } catch { /* silent */ }
    }
  };

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1>🔍 Search FAQs</h1>
        <p>Intelligent semantic search across all published FAQs</p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', maxWidth: '680px' }}>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search questions, topics, keywords…"
            style={{ flex: 1, fontSize: '1rem', padding: '0.65rem 0.9rem' }}
            aria-label="Search FAQs"
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </div>
      </form>

      {/* Mode toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>Search mode:</span>
        {MODES.map(m => (
          <button
            key={m.value}
            onClick={() => handleModeChange(m.value)}
            className={`btn btn-sm ${mode === m.value ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8rem' }}
            aria-pressed={mode === m.value}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
          <p>Searching…</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
          <h3 style={{ marginBottom: '0.5rem' }}>No FAQs found</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            No results for <strong>"{q}"</strong> in {mode} mode.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/raise')}>
            Raise a Query →
          </button>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {results.length} result{results.length !== 1 ? 's' : ''} for <strong>"{q}"</strong>
              {durationMs > 0 && <span> · {durationMs}ms</span>}
            </span>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {results.map((r, i) => (
              <SearchResultCard
                key={r.id}
                question={r.question}
                answer={r.answer}
                category={r.category}
                tags={r.tags}
                score={r.score}
                matchType={r.matchType}
                searchQuery={q}
                onClick={() => handleResultClick(r.id)}
                style={{ borderBottom: i < results.length - 1 ? undefined : 'none' }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}