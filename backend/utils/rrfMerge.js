/**
 * Reciprocal Rank Fusion (RRF) — merges ranked result lists from different
 * retrieval runs into a single unified ranking.
 *
 * @param {Array<Array<{id: string|ObjectId, score: number}>>} lists
 * @param {number} k  — RRF damping constant (default 60, from standard IR literature)
 * @returns {Array<{id: string|ObjectId, score: number}>}  fused, sorted descending
 */
function reciprocalRankFusion(lists, k = 60) {
  const scores = new Map();

  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    list.forEach(({ id, score }, rank) => {
      // id may be a mongoose ObjectId — cast to string for map key
      const key = id.toString();
      const rrfScore = (score || 0) * (1 / (k + rank + 1));
      scores.set(key, (scores.get(key) ?? 0) + rrfScore);
    });
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, score]) => ({ id, score }));
}

module.exports = { reciprocalRankFusion };