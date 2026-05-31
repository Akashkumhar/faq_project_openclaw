'use strict';

/**
 * Reputation points awarded per action.
 * Students earn points; staff/admin earn recognition badges.
 */
const POINTS = {
  // Asking
  QUERY_ASKED:            2,   // raised a query
  QUERY_CLOSED_SATISFIED:  5,   // closed own query after getting answer

  // Answering
  SOLUTION_SUBMITTED:     10,   // submitted a solution (approved by admin)
  SOLUTION_APPROVED:      20,   // admin approved the solution → added to FAQ
  REPLY_APPROVED:         5,    // reply on a discussion was marked verified

  // Helpfulness
  FAQ_HELPFUL_VOTE:       1,    // received a "helpful" vote on an FAQ
  FAQ_UPVOTE_RECEIVED:    1,    // received an upvote on a discussion
  ANSWER_ACCEPTED:        15,   // their answer was the final approved answer

  // Engagement
  DAILY_LOGIN:            1,
  FIRST_QUERY_WEEK:       10,   // first query of the week
  HELPED_SOMEONE:         5,    // any contribution that resolved a query
};

/**
 * Badge definitions.
 * Key = badge id, value = { name, icon, description, condition }
 */
const BADGES = {
  first_step: {
    name: 'First Step',
    icon: '🌱',
    description: 'Raised your first query',
    color: '#86efac',
    condition: u => (u.stats?.queriesAsked || 0) >= 1,
  },
  curious_mind: {
    name: 'Curious Mind',
    icon: '🤔',
    description: 'Raised 10 queries',
    color: '#93c5fd',
    condition: u => (u.stats?.queriesAsked || 0) >= 10,
  },
  helpful_hand: {
    name: 'Helpful Hand',
    icon: '🙋',
    description: 'Submitted 5 solutions',
    color: '#fcd34d',
    condition: u => (u.stats?.solutionsSubmitted || 0) >= 5,
  },
  solution_hero: {
    name: 'Solution Hero',
    icon: '🦸',
    description: 'Had 3 solutions approved and added to FAQ',
    color: '#f97316',
    condition: u => (u.stats?.solutionsApproved || 0) >= 3,
  },
  discussion_leader: {
    name: 'Discussion Leader',
    icon: '💬',
    description: 'Posted 20 discussion comments',
    color: '#c4b5fd',
    condition: u => (u.stats?.discussionsPosted || 0) >= 20,
  },
  top_contributor: {
    name: 'Top Contributor',
    icon: '⭐',
    description: 'Reached 200 reputation points',
    color: '#fcd34d',
    condition: u => (u.stats?.reputationPoints || 0) >= 200,
  },
  veteran: {
    name: 'Veteran',
    icon: '🎖️',
    description: 'Reached 500 reputation points',
    color: '#f97316',
    condition: u => (u.stats?.reputationPoints || 0) >= 500,
  },
  champion: {
    name: 'Champion',
    icon: '🏆',
    description: 'Reached 1000 reputation points',
    color: '#eab308',
    condition: u => (u.stats?.reputationPoints || 0) >= 1000,
  },
  verified_expert: {
    name: 'Verified Expert',
    icon: '✅',
    description: 'Had 5 discussion replies marked verified by staff',
    color: '#6ee7b7',
    condition: u => (u.stats?.repliesVerified || 0) >= 5,
  },
};

/**
 * Award points to a user document.
 * Mutates the user object and saves it.
 * @param {Object} user - Mongoose User document
 * @param {string} action - One of the POINTS keys
 * @param {Object} [context] - Extra context for logging
 */
async function awardPoints(user, action, context = {}) {
  const points = POINTS[action] || 0;
  if (points === 0 || !user) return 0;

  if (!user.stats) {
    user.stats = {
      reputationPoints: 0,
      queriesAsked: 0,
      solutionsSubmitted: 0,
      solutionsApproved: 0,
      discussionsPosted: 0,
      repliesVerified: 0,
    };
  }

  user.stats.reputationPoints = (user.stats.reputationPoints || 0) + points;

  // Increment action-specific counter
  switch (action) {
    case 'QUERY_ASKED':
    case 'QUERY_CLOSED_SATISFIED':
      user.stats.queriesAsked = (user.stats.queriesAsked || 0) + 1;
      break;
    case 'SOLUTION_SUBMITTED':
      user.stats.solutionsSubmitted = (user.stats.solutionsSubmitted || 0) + 1;
      break;
    case 'SOLUTION_APPROVED':
    case 'ANSWER_ACCEPTED':
      user.stats.solutionsApproved = (user.stats.solutionsApproved || 0) + 1;
      break;
    case 'REPLY_APPROVED':
      user.stats.repliesVerified = (user.stats.repliesVerified || 0) + 1;
      break;
    default:
      break;
  }

  await user.save();
  return points;
}

/**
 * Get all unlocked badges for a user.
 * @param {Object} user - Mongoose User document or plain object
 * @returns {Array} List of earned badge objects
 */
function getEarnedBadges(user) {
  return Object.entries(BADGES)
    .filter(([, def]) => def.condition(user))
    .map(([id, def]) => ({ id, ...def }));
}

/**
 * Get all available badges with earned status.
 * @param {Object} user - Mongoose User document or plain object
 * @returns {Array} List of all badge objects with `earned: boolean`
 */
function getAllBadges(user) {
  return Object.entries(BADGES).map(([id, def]) => ({
    id,
    earned: def.condition(user),
    ...def,
  }));
}

module.exports = { POINTS, BADGES, awardPoints, getEarnedBadges, getAllBadges };