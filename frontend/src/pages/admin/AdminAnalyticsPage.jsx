import { useState, useEffect } from 'react';

function getToken() {
  return localStorage.getItem('faq_access_token');
}

function apiFetch(path) {
  const token = getToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return fetch(path, { headers }).then(r => r.json());
}

// ── Reusable chart & card components ────────────────────────────────────────

function MetricCard({ icon, label, value, sub, color }) {
  return (
    <div className="card" style={{ padding: '1.1rem 1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1.6rem' }}>{icon}</span>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: color || 'var(--primary)', lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{sub}</div>}
    </div>
  );
}

function BarChart({ data, width = 600, height = 200, color = '#4f46e5' }) {
  if (!data || data.length === 0) return <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No data available</p>;
  const maxVal = Math.max(...data.map(d => d.raised), 1);
  const barW = Math.min(20, Math.floor((width - 40) / data.length) - 2);
  const step = (width - 40) / data.length;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={width} height={height} style={{ overflow: 'visible', minWidth: '300px' }}>
        <line x1="30" y1="10" x2="30" y2={height - 25} stroke="var(--border)" strokeWidth="1" />
        <line x1="30" y1={height - 25} x2={width - 10} y2={height - 25} stroke="var(--border)" strokeWidth="1" />
        {data.map((d, i) => {
          const barH = Math.max(2, (d.raised / maxVal) * (height - 50));
          const x = 35 + i * step;
          const y = height - 25 - barH;
          return (
            <g key={i} title={`${d._id}: ${d.raised} raised, ${d.resolved} resolved`}>
              <rect x={x} y={y} width={barW} height={barH} rx="3" fill={color} opacity="0.85" />
              {i % Math.ceil(data.length / 7) === 0 && (
                <text x={x + barW / 2} y={height - 8} textAnchor="middle" fontSize="9" fill="var(--text-muted)">
                  {d._id.slice(5)}
                </text>
              )}
            </g>
          );
        })}
        <text x="8" y={height / 2} textAnchor="middle" fontSize="9" fill="var(--text-muted)" transform={`rotate(-90, 8, ${height / 2})`}>queries</text>
      </svg>
    </div>
  );
}

function DonutChart({ data, size = 160 }) {
  if (!data || data.length === 0) return <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No data</p>;
  const total = data.reduce((s, d) => s + d.count, 0);
  const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  let startAngle = 0;
  const cx = size / 2, cy = size / 2;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        {data.map((d, i) => {
          const angle = (d.count / total) * 360;
          const endAngle = startAngle + angle;
          const r = size / 2 - 8;
          const toRad = a => (a * Math.PI) / 180;
          const x1 = cx + r * Math.cos(toRad(startAngle - 90));
          const y1 = cy + r * Math.sin(toRad(startAngle - 90));
          const x2 = cx + r * Math.cos(toRad(endAngle - 90));
          const y2 = cy + r * Math.sin(toRad(endAngle - 90));
          const large = angle > 180 ? 1 : 0;
          const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
          const color = colors[i % colors.length];
          startAngle = endAngle;
          return <path key={i} d={path} fill={color} style={{ cursor: 'pointer' }} title={`${d._id}: ${d.count}`} />;
        })}
        <circle cx={cx} cy={cy} r={size * 0.35} fill="var(--surface)" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--text)">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="var(--text-muted)">total</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: colors[i % colors.length], flexShrink: 0 }} />
            <span style={{ fontWeight: 500, color: 'var(--text)' }}>{d._id}</span>
            <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', paddingLeft: '0.5rem' }}>{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HBarList({ data, maxKey = 'count', labelKey = '_id', color = '#4f46e5' }) {
  if (!data || data.length === 0) return <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No data yet.</p>;
  const max = Math.max(...data.map(d => d[maxKey]), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {data.map((c, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '90px', fontSize: '0.82rem', color: 'var(--text)', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c[labelKey]}</span>
          <div style={{ flex: 1, height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.round((c[maxKey] / max) * 100)}%`, background: color, borderRadius: '4px', transition: 'width 0.4s ease' }} />
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', width: '28px', textAlign: 'right' }}>{c[maxKey]}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const [view, setView] = useState('queries');

  // Queries & FAQs tab state
  const [overview, setOverview]           = useState(null);
  const [volumeData, setVolumeData]       = useState([]);
  const [categoryData, setCategoryData]   = useState({ queryCategories: [], faqCategories: [] });
  const [statusData, setStatusData]       = useState([]);
  const [topContributors, setTopContributors] = useState([]);
  const [mainLoading, setMainLoading]     = useState(true);
  const [mainError, setMainError]         = useState(null);

  // Search tab state
  const [searchStats, setSearchStats]     = useState(null);
  const [searchLogs, setSearchLogs]       = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError]     = useState(null);

  // ── Fetch main analytics (queries & FAQs tab) ──
  useEffect(() => {
    setMainLoading(true);
    setMainError(null);
    Promise.all([
      apiFetch('/api/analytics/overview'),
      apiFetch('/api/analytics/query-volume?days=14'),
      apiFetch('/api/analytics/category-breakdown'),
      apiFetch('/api/analytics/status-breakdown'),
      apiFetch('/api/analytics/top-contributors'),
    ])
      .then(([ov, vol, cats, status, contributors]) => {
        if (ov.success)           setOverview(ov.data);
        else                      console.warn('[analytics/overview]', ov.message);
        if (vol.success)          setVolumeData(vol.data || []);
        if (cats.success)         setCategoryData(cats.data || { queryCategories: [], faqCategories: [] });
        if (status.success)       setStatusData(status.data || []);
        if (contributors.success) setTopContributors(contributors.data || []);
      })
      .catch(err => setMainError(err.message))
      .finally(() => setMainLoading(false));
  }, []);

  // ── Fetch search analytics (on demand when tab changes) ──
  useEffect(() => {
    if (view !== 'search') return;
    setSearchLoading(true);
    setSearchError(null);
    Promise.all([
      apiFetch('/api/search/stats'),
      apiFetch('/api/search/logs?limit=20'),
    ])
      .then(([stats, logs]) => {
        if (stats.success) setSearchStats(stats.data);
        else setSearchError(stats.message || 'Failed to load search stats');

        // logs returns { data: { logs, total, ... } } — extract the array
        const logArr = logs.success
          ? (Array.isArray(logs.data) ? logs.data : (logs.data?.logs || []))
          : [];
        setSearchLogs(logArr);
      })
      .catch(err => setSearchError(err.message))
      .finally(() => setSearchLoading(false));
  }, [view]);

  // ── Derived values ──
  const o = overview || {};
  const resolutionRate = o.queries?.total > 0
    ? Math.round((o.queries.resolved / o.queries.total) * 100) : 0;

  const TAB_BTNS = [
    { key: 'queries', label: '📋 Queries & FAQs' },
    { key: 'search',  label: '🔍 Search Analytics' },
  ];

  return (
    <div className="page" style={{ maxWidth: '1100px' }}>
      <div className="page-header">
        <h1>📊 Analytics Dashboard</h1>
        <p>Real-time overview of your FAQ system performance</p>
      </div>

      {/* Tab switcher */}
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        {TAB_BTNS.map(t => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            className={`tab-btn ${view === t.key ? 'active' : ''}`}
            aria-pressed={view === t.key}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── QUERIES & FAQs TAB ─────────────────────────────────────────────── */}
      {view === 'queries' && (
        <>
          {mainError && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              ⚠️ Failed to load analytics: {mainError}
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: '1rem' }} onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}

          {mainLoading ? (
            <div className="empty-state"><div className="icon">⏳</div><p>Loading analytics...</p></div>
          ) : (
            <>
              {/* KPI cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.75rem' }}>
                <MetricCard icon="👥" label="Total Users"    value={o.users?.total || 0}          sub={`+${o.users?.newThisWeek || 0} this week`}          color="#6366f1" />
                <MetricCard icon="📝" label="Total Queries"  value={o.queries?.total || 0}         sub={`+${o.queries?.thisWeek || 0} this week`}           color="#4f46e5" />
                <MetricCard icon="✅" label="Resolved"       value={o.queries?.resolved || 0}      sub={`${resolutionRate}% resolution rate`}               color="#10b981" />
                <MetricCard icon="⏳" label="Pending Review" value={o.queries?.pending || 0}       sub="awaiting approval"                                   color="#f59e0b" />
                <MetricCard icon="📖" label="Published FAQs" value={o.faqs?.published || 0}        sub={`${o.faqs?.total || 0} total`}                      color="#8b5cf6" />
                <MetricCard icon="💬" label="Discussions"    value={o.discussions?.total || 0}     sub="community posts"                                     color="#06b6d4" />
              </div>

              {/* Today strip */}
              <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Today</div>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  <div><span style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--primary)' }}>{o.users?.newToday || 0}</span><span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}> new users</span></div>
                  <div><span style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--primary)' }}>{o.queries?.today || 0}</span><span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}> new queries</span></div>
                  <div><span style={{ fontWeight: 800, fontSize: '1.3rem', color: '#10b981' }}>{o.queries?.resolvedToday || 0}</span><span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}> resolved today</span></div>
                </div>
              </div>

              {/* Charts row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card">
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>📈 Query Volume (14 days)</h3>
                  <BarChart data={volumeData} width={550} height={180} />
                </div>
                <div className="card">
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>📊 Queries by Status</h3>
                  <DonutChart data={statusData} size={140} />
                </div>
              </div>

              {/* Category breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card">
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>📂 Queries by Category</h3>
                  <HBarList data={categoryData.queryCategories} color="#4f46e5" />
                </div>
                <div className="card">
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>📚 FAQs by Category</h3>
                  <HBarList data={categoryData.faqCategories} color="#10b981" />
                </div>
              </div>

              {/* Top contributors */}
              <div className="card">
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>🏆 Top Contributors</h3>
                {topContributors.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No contributions yet.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.6rem' }}>
                    {topContributors.map((u, i) => (
                      <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.8rem', background: 'var(--surface-secondary)', borderRadius: '8px' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: i < 3 ? '#f59e0b' : 'var(--text-muted)', width: '1.5rem' }}>#{i + 1}</span>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', flexShrink: 0 }}>
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>{u.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {u.stats?.reputationPoints || 0} pts · {u.stats?.solutionsApproved || 0} approved
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ── SEARCH ANALYTICS TAB ──────────────────────────────────────────── */}
      {view === 'search' && (
        <>
          {searchError && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              ⚠️ {searchError}
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: '1rem' }} onClick={() => setView('queries') || setTimeout(() => setView('search'), 50)}>Retry</button>
            </div>
          )}

          {searchLoading ? (
            <div className="empty-state"><div className="icon">⏳</div><p>Loading search analytics…</p></div>
          ) : (
            <>
              {/* Search KPI cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <MetricCard icon="🔍" label="Total Searches"     value={searchStats?.totalSearches || 0}    sub={`${searchStats?.uniqueQueries || 0} unique queries`}      color="#4f46e5" />
                <MetricCard icon="👆" label="Clicked Results"    value={searchStats?.totalClicks || 0}      sub={`CTR ${searchStats?.ctr || 0}%`}                          color="#10b981" />
                <MetricCard icon="✅" label="Positive Feedback"  value={searchStats?.positiveFeedback || 0} sub={`${searchStats?.feedbackRate || 0}% feedback rate`}       color="#f59e0b" />
                <MetricCard icon="🧠" label="Vector Index Size"  value={searchStats?.indexedFaqs || 0}      sub="FAQs embedded"                                            color="#8b5cf6" />
                <MetricCard icon="🚫" label="Zero-Result Rate"   value={`${searchStats?.zeroResultRate || 0}%`} sub="of all searches"                                     color="#ef4444" />
                <MetricCard icon="⚡" label="Avg Latency"        value={searchStats?.avgLatencyMs ? `${searchStats.avgLatencyMs}ms` : '—'} sub="per search"              color="#06b6d4" />
              </div>

              {/* Zero-result + Recent searches */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card">
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>🔎 Top Zero-Result Queries</h3>
                  {(searchStats?.zeroResultQueries || []).length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No zero-result queries yet. 🎉</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {(searchStats?.zeroResultQueries || []).slice(0, 8).map((q, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text)', maxWidth: '75%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{q.query}"</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', flexShrink: 0 }}>{q.count}x</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="card">
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>🕐 Recent Searches</h3>
                  {searchLogs.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No searches logged yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '220px', overflowY: 'auto' }}>
                      {searchLogs.map((log, i) => (
                        <div key={log._id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                          <span style={{ color: 'var(--text)', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            "{log.rawQuery || log.queryText}"
                          </span>
                          <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexShrink: 0 }}>
                            {log.clickedResultId && <span style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>→ clicked</span>}
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--surface-secondary)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>{log.mode || 'hybrid'}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Mode distribution + top clicked FAQs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="card">
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>📊 Search Mode Usage</h3>
                  {(!searchStats?.modeBreakdown || searchStats.modeBreakdown.length === 0) ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No mode data yet.</p>
                  ) : (
                    <HBarList data={searchStats.modeBreakdown} maxKey="count" labelKey="_id" color="#4f46e5" />
                  )}
                </div>
                <div className="card">
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>🏆 Top Clicked FAQs</h3>
                  {(searchStats?.topClicked || []).length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No click data yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {(searchStats?.topClicked || []).slice(0, 7).map((c, i) => (
                        <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text)', maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.faq?.question || String(c._id)}
                          </span>
                          <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.82rem', flexShrink: 0 }}>{c.clicks} clicks</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Top search queries */}
              {(searchStats?.topQueries || []).length > 0 && (
                <div className="card" style={{ marginTop: '1rem' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>🔥 Top Search Queries</h3>
                  <HBarList data={searchStats.topQueries} maxKey="count" labelKey="query" color="#f59e0b" />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}