import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../api/apiClient';
import { toast } from '../../components/common/Toast';

const CATEGORIES = ['academics', 'admission', 'fees', 'placement', 'facilities', 'other'];
const CATEGORY_ICONS = { academics: '📚', admission: '🎓', fees: '💰', placement: '💼', facilities: '🏢', other: '📁' };

function groupByCategory(queries) {
  const groups = {};
  CATEGORIES.forEach(c => { groups[c] = []; });
  queries.forEach(q => {
    const cat = CATEGORIES.includes(q.category) ? q.category : 'other';
    groups[cat].push(q);
  });
  return groups;
}

export default function QueryReviewPage() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [faqTags, setFaqTags] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => { loadQueries(); }, []);

  const loadQueries = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/queries');
      setQueries(data.filter(q => ['pending_approval', 'open', 'assigned', 'resolved', 'rejected'].includes(q.status)));
    } catch { toast('Failed to load queries', 'error'); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id, addToFAQ = false, finalAnswer = '') => {
    try {
      await api.put(`/queries/${id}/approve`, { addToFAQ, faqTags: addToFAQ ? faqTags : '', adminNote, finalAnswer });
      toast(addToFAQ ? '✅ Approved and added to FAQ!' : '✅ Approved', 'success');
      setApprovingId(null); setFaqTags(''); setAdminNote('');
      loadQueries();
    } catch (err) { toast(err?.response?.data?.message || err.message, 'error'); }
  };

  const handleAddToFAQ = async (q) => {
    const tags = prompt('FAQ tags (comma-separated, optional):', q.category) || '';
    if (tags === null) return;
    try {
      const payload = {
        addToFAQ: true,
        faqTags: tags,
        finalAnswer: q.communitySolution || q.finalAnswer || q.description || q.question,
        adminNote: 'Added to FAQ from query review',
      };
      await api.put(`/queries/${q._id}/approve`, payload);
      toast('✅ Added to FAQ!', 'success');
      loadQueries();
    } catch (err) { toast(err?.response?.data?.message || err.message, 'error'); }
  };

  const handleReject = async (id) => {
    const note = prompt('Reason for rejection (optional):') || '';
    try {
      await api.put(`/queries/${id}/reject`, { adminNote: note });
      toast('↩️ Solution rejected', 'info');
      loadQueries();
    } catch (err) { toast(err.message, 'error'); }
  };

  const pending = queries.filter(q => q.status === 'pending_approval');
  const others = queries.filter(q => q.status !== 'pending_approval');
  const pendingByCategory = groupByCategory(pending);
  const othersByCategory = groupByCategory(others);
  const filteredPending = categoryFilter === 'all' ? pending : pending.filter(q => q.category === categoryFilter);
  const filteredOthers = categoryFilter === 'all' ? others : others.filter(q => q.category === categoryFilter);

  const pendingCountByCategory = useMemo(() => {
    const counts = {};
    CATEGORIES.forEach(c => { counts[c] = pendingByCategory[c].length; });
    return counts;
  }, [pendingByCategory]);

  const renderQueryCard = (q, showActions = true) => (
    <div key={q._id} className="card" style={{ border: q.status === 'pending_approval' ? '1.5px solid #bfdbfe' : '1px solid var(--border)', background: q.status === 'pending_approval' ? '#f0f9ff' : undefined }}>
      <div className="flex-between mb-8 flex-wrap gap-8">
        <div style={{ fontWeight: 600, flex: 1 }}>{q.question}</div>
        <span className={`badge badge-${q.status}`}>{q.status.replace('_', ' ')}</span>
      </div>
      {q.description && <div className="text-secondary text-sm mb-8">{q.description}</div>}
      <div className="flex gap-8 text-sm text-secondary mb-12" style={{ fontSize: '.8rem', flexWrap: 'wrap' }}>
        <span>👤 {typeof q.raisedBy === 'object' ? q.raisedBy?.name : '—'}</span>
        <span>{CATEGORY_ICONS[q.category] || '📁'} {q.category}</span>
        {q.communitySolution && <span>💬 Solution by {typeof q.solutionBy === 'object' ? q.solutionBy?.name : 'Someone'}</span>}
      </div>

      {q.communitySolution && (
        <div style={{ padding: '14px', background: '#dbeafe', borderRadius: '8px', borderLeft: '3px solid var(--primary)', marginBottom: '12px' }}>
          <div style={{ fontWeight: 600, fontSize: '.82rem', color: '#1e40af', marginBottom: '6px' }}>💬 Community Solution</div>
          <div style={{ fontSize: '.9rem', lineHeight: 1.6 }}>{q.communitySolution}</div>
        </div>
      )}

      {showActions && (
        approvingId === q._id ? (
          <div>
            <div className="form-group">
              <label className="form-label">FAQ Tags (optional)</label>
              <input className="form-input" value={faqTags} onChange={e => setFaqTags(e.target.value)} placeholder="account, password, login" />
            </div>
            <div className="form-group">
              <label className="form-label">Admin Note (optional)</label>
              <input className="form-input" value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Internal note..." />
            </div>
            <div className="flex gap-8 flex-wrap">
              <button className="btn btn-accent" onClick={() => handleApprove(q._id, true)}>✅ Approve + Add to FAQ</button>
              <button className="btn btn-primary" onClick={() => handleApprove(q._id, false)}>✅ Approve Only</button>
              <button className="btn btn-ghost" onClick={() => { setApprovingId(null); setFaqTags(''); setAdminNote(''); }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex gap-8 flex-wrap">
            {q.status === 'pending_approval' && (
              <>
                <button className="btn btn-accent btn-sm" onClick={() => setApprovingId(q._id)}>✅ Approve</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleReject(q._id)}>❌ Reject</button>
              </>
            )}
            {q.status !== 'resolved' && (
              <button className="btn btn-primary btn-sm" onClick={() => handleAddToFAQ(q)}>📖 Add to FAQ</button>
            )}
          </div>
        )
      )}
    </div>
  );

  return (
    <DashboardLayout pageTitle="Query Review" pageSubtitle="Review and manage queries by category">
      {/* Category Filter */}
      <div className="card" style={{ marginBottom: '24px', padding: '12px 16px' }}>
        <div className="flex flex-between flex-wrap flex-gap" style={{ alignItems: 'center' }}>
          <div className="flex gap-8 flex-wrap">
            <button
              className={`btn btn-sm ${categoryFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setCategoryFilter('all')}
            >
              📋 All ({pending.length + others.length})
            </button>
            {CATEGORIES.map(cat => {
              const count = pendingCountByCategory[cat] || 0;
              return (
                <button
                  key={cat}
                  className={`btn btn-sm ${categoryFilter === cat ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setCategoryFilter(cat)}
                  title={`${count} pending`}
                >
                  {CATEGORY_ICONS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)} {count > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: '10px', padding: '0 6px', fontSize: '0.68rem', fontWeight: 700 }}>{count}</span>}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {categoryFilter !== 'all' ? `${filteredPending.length} pending, ${filteredOthers.length} other in ${categoryFilter}` : `${pending.length} pending · ${others.length} other`}
          </div>
        </div>
      </div>

      {/* Pending Review Section — by category */}
      <div style={{ marginBottom: '32px' }}>
        <div className="card-title mb-16">🔵 Solutions Pending Review ({filteredPending.length})</div>
        {filteredPending.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">✅</div><div className="empty-desc">All caught up! No solutions pending review{categoryFilter !== 'all' ? ` in ${categoryFilter}` : ''}.</div></div>
        ) : (
          categoryFilter !== 'all' ? (
            <div className="faq-list">{filteredPending.map(q => renderQueryCard(q))}</div>
          ) : (
            Object.entries(pendingByCategory).filter(([, qs]) => qs.length > 0).map(([cat, catQueries]) => (
              <div key={cat} style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {CATEGORY_ICONS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)} ({catQueries.length})
                </div>
                <div className="faq-list">{catQueries.map(q => renderQueryCard(q))}</div>
              </div>
            ))
          )
        )}
      </div>

      {/* All Other Queries — by category */}
      <div>
        <div className="card-title mb-16">📋 Other Queries ({filteredOthers.length})</div>
        {filteredOthers.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📭</div><div className="empty-desc">No other queries{categoryFilter !== 'all' ? ` in ${categoryFilter}` : ''}.</div></div>
        ) : (
          categoryFilter !== 'all' ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Question</th><th>Raised By</th><th>Status</th><th>Added to FAQ</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredOthers.slice(0, 30).map(q => (
                    <tr key={q._id}>
                      <td style={{ fontWeight: 500, maxWidth: '250px' }}><div className="truncate">{q.question}</div></td>
                      <td>{typeof q.raisedBy === 'object' ? q.raisedBy?.name : '—'}</td>
                      <td><span className={`badge badge-${q.status}`}>{q.status.replace('_', ' ')}</span></td>
                      <td>{q.addedToFAQ ? '✅' : '❌'}</td>
                      <td>
                        {q.status !== 'resolved' && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleAddToFAQ(q)}>📖 Add to FAQ</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            Object.entries(othersByCategory).filter(([, qs]) => qs.length > 0).map(([cat, catQueries]) => (
              <div key={cat} style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {CATEGORY_ICONS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)} ({catQueries.length})
                </div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Question</th><th>Raised By</th><th>Status</th><th>Added to FAQ</th><th>Actions</th></tr></thead>
                    <tbody>
                      {catQueries.slice(0, 20).map(q => (
                        <tr key={q._id}>
                          <td style={{ fontWeight: 500, maxWidth: '250px' }}><div className="truncate">{q.question}</div></td>
                          <td>{typeof q.raisedBy === 'object' ? q.raisedBy?.name : '—'}</td>
                          <td><span className={`badge badge-${q.status}`}>{q.status.replace('_', ' ')}</span></td>
                          <td>{q.addedToFAQ ? '✅' : '❌'}</td>
                          <td>
                            {q.status !== 'resolved' && (
                              <button className="btn btn-primary btn-sm" onClick={() => handleAddToFAQ(q)}>📖 Add to FAQ</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </DashboardLayout>
  );
}

  return (
    <DashboardLayout pageTitle="Query Review" pageSubtitle="Review community-submitted solutions and manage queries">
      <div style={{ marginBottom: '24px' }}>
        <div className="card-title mb-16">🔵 Solutions Pending Review ({pending.length})</div>
        {pending.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">✅</div><div className="empty-desc">All caught up! No solutions pending review.</div></div>
        ) : (
          <div className="faq-list">
            {pending.map(q => (
              <div key={q._id} className="card" style={{ border: '1.5px solid #bfdbfe', background: '#f0f9ff' }}>
                <div className="flex-between mb-8">
                  <div style={{ fontWeight: 600 }}>{q.question}</div>
                  <span className="badge badge-pending_approval">Under Review</span>
                </div>
                {q.description && <div className="text-secondary text-sm mb-16">{q.description}</div>}
                <div className="flex gap-8 text-sm text-secondary mb-16" style={{ fontSize: '.8rem' }}>
                  <span>👤 {typeof q.raisedBy === 'object' ? q.raisedBy?.name : 'User'}</span>
                  <span>💬 Solution by {typeof q.solutionBy === 'object' ? q.solutionBy?.name : 'Someone'}</span>
                </div>

                {q.communitySolution && (
                  <div style={{ padding: '14px', background: '#dbeafe', borderRadius: '8px', borderLeft: '3px solid var(--primary)', marginBottom: '16px' }}>
                    <div style={{ fontWeight: 600, fontSize: '.82rem', color: '#1e40af', marginBottom: '6px' }}>💬 Community Solution</div>
                    <div style={{ fontSize: '.9rem', lineHeight: 1.6 }}>{q.communitySolution}</div>
                  </div>
                )}

                {approvingId === q._id ? (
                  <div>
                    <div className="form-group">
                      <label className="form-label">FAQ Tags (optional)</label>
                      <input className="form-input" value={faqTags} onChange={e => setFaqTags(e.target.value)} placeholder="account, password, login" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Admin Note (optional)</label>
                      <input className="form-input" value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Internal note..." />
                    </div>
                    <div className="flex gap-8 flex-wrap">
                      <button className="btn btn-accent" onClick={() => handleApprove(q._id, true)}>✅ Approve + Add to FAQ</button>
                      <button className="btn btn-primary" onClick={() => handleApprove(q._id, false)}>✅ Approve Only</button>
                      <button className="btn btn-ghost" onClick={() => { setApprovingId(null); setFaqTags(''); setAdminNote(''); }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-8">
                    <button className="btn btn-accent btn-sm" onClick={() => setApprovingId(q._id)}>✅ Approve</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleReject(q._id)}>❌ Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="card-title mb-16">📋 All Other Queries ({others.length})</div>
        {others.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Question</th><th>Raised By</th><th>Category</th><th>Status</th><th>Added to FAQ</th></tr>
              </thead>
              <tbody>
                {others.slice(0, 20).map(q => (
                  <tr key={q._id}>
                    <td style={{ fontWeight: 500, maxWidth: '250px' }}><div className="truncate">{q.question}</div></td>
                    <td>{typeof q.raisedBy === 'object' ? q.raisedBy?.name : '—'}</td>
                    <td><span className="badge badge-draft">{q.category}</span></td>
                    <td><span className={`badge badge-${q.status}`}>{q.status.replace('_', ' ')}</span></td>
                    <td>{q.addedToFAQ ? '✅' : '❌'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}