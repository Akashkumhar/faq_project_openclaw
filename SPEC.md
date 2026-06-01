# User Support & FAQ Management System — SPEC.md

## 1. Concept & Vision

A polished, enterprise-grade User Support portal built on the MERN stack — designed to feel like something a real university would use. It's calm, focused, and trustworthy: clean surfaces, readable typography, and zero clutter. The system empowers users to self-serve through a rich FAQ knowledge base, while support staff manage everything through a protected admin dashboard with real-time stats, query tracking, and one-click FAQ publishing.

**Personality:** Professional, calm, accessible — like a well-organized university help desk.

---

## 2. Design Language

### Color Palette

**Light Mode:**
| Role | Hex | Usage |
|---|---|---|
| Background | `#F1F5F9` | Page background |
| Surface | `#FFFFFF` | Cards, panels |
| Surface Secondary | `#F8FAFC` | Sidebar, subtle areas |
| Primary | `#4F46E5` | Buttons, active states, links |
| Primary Dark | `#4338CA` | Hover |
| Primary Light | `#EEF2FF` | Subtle backgrounds |
| Accent | `#10B981` | Success, solved, badges |
| Warning | `#F59E0B` | Pending states |
| Danger | `#EF4444` | Errors, reject |
| Text Primary | `#0F172A` | Headings, body |
| Text Secondary | `#64748B` | Labels, captions |
| Border | `#E2E8F0` | Dividers, card borders |

**Dark Mode:**
| Role | Hex |
|---|---|
| Background | `#0F172A` |
| Surface | `#1E293B` |
| Surface Secondary | `#1E293B` |
| Primary Light | `#312E81` |
| Primary | `#6366F1` |
| Primary Dark | `#818CF8` |
| Accent | `#34D399` |
| Text Primary | `#F1F5F9` |
| Text Secondary | `#94A3B8` |
| Border | `#334155` |

### Typography
- **Font:** Inter (Google Fonts) — clean, modern, highly readable
- **Headings:** 700 weight, tight letter-spacing
- **Body:** 400 weight, 1.6 line-height
- **Scale:** 12 / 14 / 16 / 18 / 24 / 32 / 48px

### Spatial System
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64px
- Card padding: 24px
- Sidebar width: 260px (collapsed: 72px)
- Header height: 64px
- Border radius: 8px (cards), 6px (buttons), 12px (modals)

### Motion
- Transitions: 150ms ease for micro-interactions, 250ms ease-out for panels
- Sidebar collapse: 200ms cubic-bezier(0.4, 0, 0.2, 1)
- Page transitions: fade 200ms
- Staggered list animations: 50ms between items

---

## 3. Architecture

### Tech Stack
- **Frontend:** React 18 + Vite + React Router v6
- **Backend:** Node.js + Express.js
- **Database:** MongoDB + Mongoose ODM
- **Auth:** JWT (access + refresh tokens) with HTTP-only cookie option
- **Styling:** Plain CSS with CSS custom properties (no Tailwind)

### Project Structure
```
E:\faq_project\
├── SPEC.md
├── .env
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   ├── auth.js          — JWT verification
│   │   ├── roleGuard.js     — Admin/user role check
│   │   ├── errorHandler.js  — Global error handler
│   │   └── validate.js      — Request validation
│   ├── models/
│   │   ├── User.js
│   │   ├── FAQ.js
│   │   ├── Query.js
│   │   └── Announcement.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── faqController.js
│   │   ├── queryController.js
│   │   └── dashboardController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── faqRoutes.js
│   │   ├── queryRoutes.js
│   │   └── dashboardRoutes.js
│   └── utils/
│       ├── ApiError.js
│       ├── asyncHandler.js
│       └── roles.js
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── api/
│       │   └── apiClient.js
│       ├── contexts/
│       │   ├── AuthContext.jsx
│       │   └── ThemeContext.jsx
│       ├── hooks/
│       │   ├── useAuth.js
│       │   └── useTheme.js
│       ├── layouts/
│       │   ├── DashboardLayout.jsx
│       │   └── AuthLayout.jsx
│       ├── components/
│       │   ├── common/
│       │   │   ├── Sidebar.jsx
│       │   │   ├── Header.jsx
│       │   │   ├── ProtectedRoute.jsx
│       │   │   ├── LoadingSpinner.jsx
│       │   │   ├── Modal.jsx
│       │   │   ├── Badge.jsx
│       │   │   ├── EmptyState.jsx
│       │   │   └── Toast.jsx
│       │   ├── dashboard/
│       │   │   ├── StatCard.jsx
│       │   │   ├── QueryTable.jsx
│       │   │   └── FAQItem.jsx
│       │   └── faq/
│       │       ├── FAQCard.jsx
│       │       ├── FAQSearch.jsx
│       │       └── CategoryFilter.jsx
│       └── pages/
│           ├── auth/
│           │   ├── LoginPage.jsx
│           │   └── RegisterPage.jsx
│           ├── user/
│           │   ├── UserDashboardPage.jsx
│           │   ├── FAQBrowsePage.jsx
│           │   ├── RaiseQueryPage.jsx
│           │   └── MyQueriesPage.jsx
│           └── admin/
│               ├── AdminDashboardPage.jsx
│               ├── FAQManagementPage.jsx
│               ├── QueryReviewPage.jsx
│               ├── UserManagementPage.jsx
│               └── AnnouncementsPage.jsx
```

---

## 4. Database Schema

### User
```javascript
{
  _id: ObjectId,
  name: String (required, 2-50 chars),
  email: String (required, unique, lowercase),
  password: String (required, hashed, min 8),
  role: Enum ['user', 'support_staff', 'admin'] (default: 'user'),
  avatar: String (URL, optional),
  department: String (optional),
  isActive: Boolean (default: true),
  lastLogin: Date,
  refreshToken: String,
  createdAt: Date,
  updatedAt: Date
}
```

### FAQ
```javascript
{
  _id: ObjectId,
  question: String (required, max 500),
  answer: String (required),
  category: String (enum: academics|admission|fees|placement|facilities|other, default: other),
  tags: [String],
  status: Enum ['draft', 'published', 'archived'] (default: published),
  viewCount: Number (default: 0),
  helpful: Number (default: 0)       // thumbs up
  notHelpful: Number (default: 0)    // thumbs down
  createdBy: ObjectId (ref: User),
  reviewedBy: ObjectId (ref: User),
  publishedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Query
```javascript
{
  _id: ObjectId,
  question: String (required, max 500),
  description: String,
  category: String (same as FAQ categories),
  priority: Enum ['low', 'medium', 'high', 'urgent'] (default: medium),
  status: Enum [
    'open',           // just raised
    'assigned',       // assigned to support staff
    'pending_approval', // solution submitted, awaiting review
    'resolved',       // admin approved
    'rejected',       // solution rejected
    'closed'          // closed by user or admin
  ] (default: open),
  raisedBy: ObjectId (ref: User),
  assignedTo: ObjectId (ref: User, optional),
  communitySolution: String (optional),
  solutionBy: ObjectId (ref: User, optional),
  solutionSubmittedAt: Date,
  finalAnswer: String (admin-approved answer),
  approvedBy: ObjectId (ref: User),
  approvedAt: Date,
  adminNote: String,
  addedToFAQ: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

### Announcement
```javascript
{
  _id: ObjectId,
  title: String (required),
  content: String (required),
  priority: Enum ['info', 'warning', 'urgent'] (default: info),
  isActive: Boolean (default: true),
  expiresAt: Date (optional),
  createdBy: ObjectId (ref: User),
  createdAt: Date
}
```

---

## 5. API Design

### Base URL: `/api`

### Auth
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/login` | Login | Public |
| POST | `/auth/register` | Register (users only) | Public |
| POST | `/auth/logout` | Logout | Auth |
| POST | `/auth/refresh` | Refresh access token | Public |
| GET | `/auth/me` | Get current user | Auth |

### FAQs
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/faqs` | List published FAQs (public) | Public |
| GET | `/faqs/:id` | Get single FAQ | Public |
| GET | `/faqs/all` | List all FAQs | Support+ |
| POST | `/faqs` | Create FAQ | Support+ |
| PUT | `/faqs/:id` | Update FAQ | Support+ |
| DELETE | `/faqs/:id` | Archive FAQ | Support+ |
| POST | `/faqs/:id/helpful` | Mark FAQ helpful | Auth |

### Queries
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/queries` | List queries (filtered by role) | Auth |
| GET | `/queries/:id` | Get single query | Auth |
| POST | `/queries` | Raise a new query | Auth |
| PUT | `/queries/:id/solution` | Submit solution | Auth |
| PUT | `/queries/:id/assign` | Assign query | Staff+ |
| PUT | `/queries/:id/approve` | Approve solution | Staff+ |
| PUT | `/queries/:id/reject` | Reject solution | Staff+ |
| PUT | `/queries/:id/close` | Close query | Owner/Staff+ |
| DELETE | `/queries/:id` | Delete query | Admin |

### Dashboard
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/dashboard/stats` | Aggregated stats | Auth |
| GET | `/dashboard/recent-queries` | Recent 10 queries | Auth |
| GET | `/dashboard/faq-stats` | FAQ categories & views | Auth |

### Users (Admin)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/users` | List all users | Admin |
| PUT | `/users/:id/role` | Change user role | Admin |
| PUT | `/users/:id/toggle-active` | Enable/disable user | Admin |

### Announcements (Admin)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/announcements` | List active | Auth |
| POST | `/announcements` | Create | Staff+ |
| DELETE | `/announcements/:id` | Delete | Admin |

---

## 6. Pages & Features

### User Pages
- **Dashboard:** Greeting, quick stats (my open queries, resolved this week), recent announcements, popular FAQs
- **FAQ Browse:** Searchable, filterable by category, expandable accordion, helpful/not helpful voting
- **Raise Query:** Form with question, description, category, priority — submitted instantly
- **My Queries:** Table of all queries raised by the user with status tracking

### Admin/Staff Pages
- **Admin Dashboard:** Live stats (total queries, open, resolved today, FAQ count), recent activity feed, charts placeholder
- **FAQ Management:** Table of all FAQs with inline edit, publish/unpublish toggle, category management
- **Query Review Queue:** Filtered view of pending_approval queries, inline approve/reject with option to add to FAQ
- **User Management:** User table with role badges, activate/deactivate, change role (admin only)
- **Announcements:** Create and manage system-wide announcements

### Auth Pages
- **Login:** Email + password, role indicator, error handling
- **Register:** Name + email + password + department (users only)

---

## 7. Component Inventory

### Sidebar
- Collapsible (260px ↔ 72px)
- Logo + app name at top
- Navigation items with icons and labels
- Active state highlight
- Role-based menu items
- Collapse toggle at bottom
- User avatar + name at bottom

### Header
- Page title (dynamic)
- Breadcrumb
- Search bar (global FAQ search)
- Theme toggle (sun/moon)
- Notification bell
- User dropdown (profile, logout)

### StatCard
- Icon, label, value, trend indicator
- Hover: subtle lift shadow

### QueryTable
- Sortable columns: date, status, priority, category
- Row actions: view, assign, resolve
- Status badge chips
- Empty state

### FAQCard
- Question (truncated), category tag, view count, helpful count
- Expandable answer with smooth animation
- Helpful/Not Helpful voting buttons

### Modal
- Overlay with backdrop blur
- Header, body, footer actions
- Close on ESC and backdrop click

### Toast
- Success/error/info/warning variants
- Auto-dismiss (4s)
- Stack multiple

---

## 8. Security & Standards

- Passwords hashed with bcrypt (12 rounds)
- JWT access tokens (15min expiry) + refresh tokens (7 day)
- HTTP-only cookie for refresh tokens in production
- Role-based access control on every protected route
- Input validation (express-validator) on all POST/PUT routes
- Rate limiting on auth routes
- CORS configured for frontend origin
- Global error handler middleware
- Request logging (morgan)
- No secrets in code — all in `.env`

---

## 9. Enhanced Features — Implementation Plan

This section details the step-by-step plan for implementing all advanced features on top of the base system. Each subsection maps feature requirements to specific backend models, API endpoints, frontend components, and implementation steps.

---

### 9.1 FAQ Voting System (Helpful / Not Helpful)

**Goal:** Allow authenticated users to vote on FAQs as helpful or not helpful — once per FAQ per user — with live vote counts displayed.

#### Schema Changes
- **FAQ model** already has `helpful` and `notHelpful` number fields.
- Add a new `FAQVote` model (or embed in FAQ) to track per-user votes and prevent duplicate voting:

```javascript
// models/FAQVote.js
{
  _id: ObjectId,
  faqId: ObjectId (ref: FAQ, required),
  userId: ObjectId (ref: User, required),
  vote: Enum ['helpful', 'not_helpful'] (required),
  createdAt: Date
}
// Compound index: { faqId: 1, userId: 1 } — unique
```

#### API
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/faqs/:id/vote` | Cast or change vote (`{ vote: 'helpful' \| 'not_helpful' }`) | Auth |
| DELETE | `/faqs/:id/vote` | Remove vote | Auth |
| GET | `/faqs/:id/my-vote` | Get current user's vote on a FAQ | Auth |

#### Backend Steps
1. Create `FAQVote` model with compound unique index on `{faqId, userId}`.
2. In `faqController.js`, add `voteFAQ` handler:
   - Find existing vote for user+FAQ.
   - If switching: decrement old counter, increment new counter, update vote doc.
   - If new: increment counter, create vote doc.
   - Return updated `helpful` and `notHelpful` counts.
3. Add `removeVote` handler to reverse vote count.
4. Register routes in `faqRoutes.js`.

#### Frontend Steps
1. In `FAQCard.jsx` and `FAQBrowsePage.jsx`, wire up thumbs-up / thumbs-down buttons.
2. Fetch `my-vote` on FAQ load to pre-highlight the user's current vote.
3. On vote, call the API, update local state optimistically, show toast on error.
4. Animate vote count change with a brief scale transition (150ms).
5. Disable buttons if the user is not authenticated (show tooltip "Login to vote").

---

### 9.2 Duplicate Query Detection

**Goal:** Before a user submits a new query, detect semantically similar existing FAQs or open queries and suggest them to reduce duplicates.

#### Strategy
Use **keyword + category matching** on the server side (no external ML dependency) with a relevance score, optionally augmented with a simple trigram similarity function.

#### API
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/queries/similar?q=<text>&category=<cat>` | Return top-5 similar FAQs + queries | Auth |

#### Backend Steps
1. In `queryController.js`, add `getSimilarQueries` handler:
   - Tokenise the query string (strip stopwords, lowercase).
   - Run a MongoDB `$text` search on FAQ `question` and Query `question` fields (requires text indexes).
   - Add text indexes: `db.faqs.createIndex({ question: 'text', tags: 'text' })` and `db.queries.createIndex({ question: 'text' })`.
   - Score and sort results; return top 5.
2. Register `GET /queries/similar` in `queryRoutes.js`.
3. Add `utils/similarity.js` with a basic trigram scorer as a fallback for short queries.

#### Frontend Steps
1. In `RaiseQueryPage.jsx`, add a debounced (400ms) call to `/queries/similar` triggered after the user types ≥ 20 characters in the question field.
2. Render a dismissible "Similar questions found" banner below the input with links to matching FAQs/queries.
3. If a highly similar FAQ is found (score > 0.8), show a soft warning: _"This might already be answered — review before submitting."_
4. Allow the user to proceed anyway with a single click.

---

### 9.3 Smart Query Classification

**Goal:** Automatically detect and pre-fill the `category` field of a new query based on keywords in the question text.

#### Strategy
Rule-based keyword mapping (no ML required) defined in a configuration file.

#### Backend Steps
1. Create `utils/classifier.js`:
   ```javascript
   const CATEGORY_KEYWORDS = {
     academics:  ['exam', 'grade', 'course', 'lecture', 'syllabus', 'assignment', 'marks'],
     admission:  ['admission', 'apply', 'eligibility', 'deadline', 'document', 'form'],
     fees:       ['fee', 'payment', 'scholarship', 'refund', 'challan', 'tuition'],
     placement:  ['placement', 'internship', 'company', 'interview', 'offer', 'job', 'recruit'],
     facilities: ['hostel', 'library', 'wifi', 'transport', 'mess', 'gym', 'sports'],
   };
   export function classifyQuery(text) { /* tokenise + score */ }
   ```
2. Add `POST /queries/classify` endpoint (or include classification logic inside `createQuery`).
3. Auto-set `category` in the query document if confidence ≥ 0.6; otherwise default to `'other'`.

#### Frontend Steps
1. In `RaiseQueryPage.jsx`, call `/queries/classify` on text change (debounced 500ms).
2. Auto-select the detected category in the Category dropdown; show a small "auto-detected" chip next to it.
3. The chip is clickable to clear and let the user override manually.

---

### 9.4 Query Validation & Spam Filtering

**Goal:** Prevent low-quality, meaningless, or abusive query submissions on both client and server sides.

#### Validation Rules
| Rule | Threshold |
|---|---|
| Minimum question length | 20 characters |
| Maximum question length | 500 characters |
| Minimum description length (if provided) | 10 characters |
| Must contain at least 3 meaningful words | NLP-free word count |
| No all-caps text | regex `/^[A-Z\s!?.]+$/` reject |
| No repeated characters (e.g., "helloooooo") | regex `/(.)\1{4,}/` |
| Spam phrase blacklist | configurable array |
| Rate limit: max 5 queries per user per 24h | Redis or DB counter |

#### Meaningless Message Filter (9.5)
Block submissions that consist only of common filler phrases:

```javascript
// utils/spamFilter.js
const BLOCKED_PHRASES = [
  'yes', 'no', 'ok', 'okay', 'thanks', 'thank you', 'hi', 'hello',
  'bye', 'good', 'fine', 'sure', 'yep', 'nope', 'cool', 'great',
  'awesome', 'nice', 'got it', 'noted', 'understood', 'hmm', 'lol'
];
export function isSpam(text) {
  const normalised = text.trim().toLowerCase().replace(/[^a-z\s]/g, '');
  return BLOCKED_PHRASES.includes(normalised) || normalised.split(' ').length < 3;
}
```

#### Backend Steps
1. Create `utils/spamFilter.js` with `isSpam()` and `isLowQuality()` helpers.
2. Add `middleware/queryValidation.js` using `express-validator` + custom validators:
   - Min length check.
   - Spam phrase check via `isSpam()`.
   - All-caps and repeated-chars regex.
   - Per-user rate limit: query DB for queries created in last 24h; reject if ≥ 5.
3. Apply `queryValidation` middleware on `POST /queries`.
4. Return structured error messages (`{ field, message }`) for each violation.

#### Frontend Steps
1. In `RaiseQueryPage.jsx`, add real-time inline validation:
   - Character counter with colour coding (green/yellow/red).
   - Immediate error if the text matches spam patterns (client-side copy of BLOCKED_PHRASES).
   - Disable submit button and show inline message for invalid inputs.
2. Show server-side validation errors returned from API inline below each field.
3. After a rejected submission, don't clear the form — allow the user to correct.

---

### 9.5 Prevent Meaningless Messages

> Covered above in **9.4** (`isSpam` utility and frontend guard). Additionally:

#### Extra Steps
1. Apply the same spam filter to **community discussion** posts (Section 9.8).
2. Apply to FAQ helpful/not-helpful vote comments if comment field is added in future.
3. Log blocked attempts server-side (with userId, timestamp, text) to a `BlockedAttempt` collection for admin review.
4. Surface blocked attempt counts in the Admin Analytics Dashboard (Section 9.11).

---

### 9.6 Personalized User Dashboard

**Goal:** Give each user a dynamic, data-rich personal dashboard tailored to their activity.

#### New API Endpoints
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/dashboard/my-stats` | User's personal stats | Auth (User) |
| GET | `/dashboard/my-activity` | Timeline of user's actions | Auth (User) |
| GET | `/dashboard/recommended-faqs` | FAQs relevant to user's department + past queries | Auth (User) |

#### Backend Steps
1. In `dashboardController.js`, add `getMyStats`:
   - Count queries by status (open, resolved, closed).
   - Count FAQs voted on.
   - Count community solutions contributed.
   - Streak: consecutive days with activity.
2. Add `getMyActivity` returning last 20 events (query raised, vote cast, solution submitted, badge earned) in reverse-chronological order.
3. Add `getRecommendedFAQs`:
   - Pull FAQs from the user's `department` category + most-viewed FAQs not yet seen by this user.
   - Return top 6.

#### Frontend Steps
1. Redesign `UserDashboardPage.jsx` (user view) with:
   - **Welcome banner** with user name, avatar, department, and current streak.
   - **Stats row:** Open Queries · Resolved · FAQs Voted · Reputation Points.
   - **Activity timeline** — scrollable, icon-coded event list.
   - **Recommended FAQs** — horizontal scroll card row.
   - **Quick actions** — "Raise a Query", "Browse FAQs", "My Queries" shortcut cards.
2. Fetch all three new endpoints in parallel with `Promise.all`.
3. Show skeleton loaders while data loads.

---

### 9.7 Admin Dashboard for FAQ & Ticket Management

**Goal:** Give admins a powerful, data-rich control center for managing FAQs and support tickets.

#### New / Enhanced API Endpoints
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/admin/overview` | High-level KPI summary | Admin |
| GET | `/admin/pending-tickets` | Paginated list of pending queries | Admin/Staff |
| PUT | `/admin/tickets/:id/bulk-action` | Bulk approve/reject/close | Admin |
| GET | `/admin/faqs/analytics` | Per-FAQ vote, view, and search-hit stats | Admin |
| POST | `/admin/faqs/bulk-publish` | Publish multiple draft FAQs at once | Admin |

#### Backend Steps
1. Create `adminController.js` (or extend `dashboardController.js`) with the above handlers.
2. Add bulk-action support: accept an array of ticket IDs and an action string; validate and apply atomically.
3. FAQ analytics: aggregate `viewCount`, `helpful`, `notHelpful` per FAQ; return sorted by helpfulness ratio.

#### Frontend Steps
1. Redesign `AdminDashboardPage.jsx`:
   - **KPI cards row:** Total Users · Open Tickets · Avg. Resolution Time · FAQ Hit Rate.
   - **Pending ticket queue** with priority badges, sortable columns, inline approve/reject buttons.
   - **Bulk action toolbar** — select multiple rows → apply action.
   - **Top FAQs panel** — sorted by helpfulness ratio with mini bar charts.
   - **Recent activity feed** — live-feeling list of latest events.
2. `FAQManagementPage.jsx` enhancements:
   - Add/edit FAQ in a modal (no page navigation).
   - Inline category, status, and tag editing.
   - Bulk publish selected drafts.
   - Sort by helpful ratio, view count, date.
3. `QueryReviewPage.jsx` enhancements:
   - Filter panel: by category, priority, staff assignee, date range.
   - One-click "Add to FAQ" from approved query solution.
   - Rejection reason picker (dropdown + free text).

---

### 9.8 Community Discussion Section

**Goal:** Allow users to collaboratively discuss queries, share unofficial tips, and upvote helpful community responses.

#### New Models

```javascript
// models/Discussion.js
{
  _id: ObjectId,
  queryId: ObjectId (ref: Query, required),  // discussion tied to a query
  author: ObjectId (ref: User, required),
  content: String (required, min 10, max 2000),
  upvotes: [ObjectId] (ref: User),
  isVerified: Boolean (default: false),   // admin/staff verified
  parentId: ObjectId (ref: Discussion, optional),  // threaded replies
  isSpam: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

#### API
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/queries/:id/discussions` | List discussion threads for a query | Auth |
| POST | `/queries/:id/discussions` | Post a discussion comment | Auth |
| PUT | `/discussions/:id/upvote` | Toggle upvote | Auth |
| DELETE | `/discussions/:id` | Delete own comment or Admin | Auth |
| PUT | `/discussions/:id/verify` | Mark as verified solution | Staff+ |

#### Backend Steps
1. Create `Discussion` model.
2. Create `discussionController.js` with CRUD handlers.
3. Apply `spamFilter.isSpam()` on `content` in `createDiscussion`.
4. Compute `upvoteCount` virtuals on the model.
5. Add discussion routes in `discussionRoutes.js`.

#### Frontend Steps
1. Create `DiscussionThread.jsx` component:
   - Nested reply indentation (max 2 levels).
   - Upvote button with animated count.
   - Verified badge for staff-verified posts.
   - Relative timestamps ("2 hours ago").
2. Create `DiscussionInput.jsx` with real-time spam check, character counter, submit button.
3. Add discussion thread below query detail view.
4. Paginate: load 10 comments, "Load more" button.

---

### 9.9 Verified Solutions & Reputation System

**Goal:** Build trust by marking expert-verified answers, and reward active contributors with reputation points.

#### Schema Changes

```javascript
// Add to User model:
{
  reputationPoints: Number (default: 0),
  badges: [{ name: String, awardedAt: Date }]
}
```

#### Reputation Point Rules
| Action | Points |
|---|---|
| Query resolved (as solver) | +10 |
| Community post upvoted | +2 per upvote |
| FAQ vote marked helpful | +1 |
| Solution verified by staff | +15 |
| Query submitted (capped at 5/day) | +1 |
| Spam attempt blocked | −5 |

#### Backend Steps
1. Add `reputationPoints` and `badges` to `User` model.
2. Create `utils/reputation.js` with `addPoints(userId, delta, reason)` helper — updates user doc and logs to a `ReputationLog` collection.
3. Hook `addPoints` into:
   - `approveQuery` → +10 to solver.
   - `upvoteDiscussion` → +2 to author.
   - `verifyDiscussion` → +15 to author.
4. Create `GET /users/:id/reputation` endpoint for reputation history.

#### Frontend Steps
1. Display reputation score in user's Header dropdown and Profile page.
2. On Discussion posts, show author's reputation next to their name.
3. Verified posts get a green "✓ Verified Solution" chip.
4. Reputation history page (accessible from user dashboard) with a point log timeline.

---

### 9.10 Leaderboard & Badges

**Goal:** Gamify participation with a public leaderboard and milestone-based badge awards.

#### Badge Definitions
| Badge | Trigger |
|---|---|
| 🌟 First Answer | First community solution submitted |
| 🔥 Top Helper | Top 3 on leaderboard this month |
| 💯 Century | 100 reputation points earned |
| 🏆 Expert | 500 reputation points earned |
| 📚 FAQ Star | FAQ they contributed added to knowledge base |
| 🎯 Streak Master | 7-day consecutive activity streak |

#### New API Endpoints
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/leaderboard` | Top-50 users by reputation | Public |
| GET | `/leaderboard/monthly` | Monthly leaderboard reset | Public |
| GET | `/users/:id/badges` | User badge collection | Auth |

#### Backend Steps
1. Create `utils/badgeEngine.js` — evaluates badge conditions after every point-earning event.
2. Award badges atomically with a `$addToSet` on the User document (prevents duplicates).
3. Leaderboard query: aggregate and sort users by `reputationPoints` descending; paginate at 50.
4. Monthly leaderboard: add `monthlyPoints` field to User, reset via a cron job (or on-demand recalculation).

#### Frontend Steps
1. Create `LeaderboardPage.jsx`:
   - Top-3 podium with gold/silver/bronze styling.
   - Ranked list below with avatar, name, department, reputation, badge icons.
   - Toggle: All-Time / This Month.
2. In user dashboard, show the user's current rank and points to next badge.
3. Badge showcase on profile page — earned badges solid, unearned badges greyed out with progress hint.
4. Animate badge unlock with a confetti burst (canvas-confetti or pure CSS keyframes).

---

### 9.11 Analytics Dashboard

**Goal:** Provide admins with data-driven insights into system usage, FAQ performance, and support ticket trends.

#### New API Endpoints
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/analytics/queries` | Query volume over time (daily/weekly/monthly) | Admin |
| GET | `/analytics/faqs` | FAQ views, votes, search-hit rates | Admin |
| GET | `/analytics/users` | New user registrations over time | Admin |
| GET | `/analytics/resolution` | Avg. resolution time by category | Admin |
| GET | `/analytics/spam` | Blocked spam attempts over time | Admin |

#### Backend Steps
1. Create `analyticsController.js` with each aggregation pipeline.
2. Use MongoDB `$group` by date bucket (`$dateToString` with format `%Y-%m-%d`).
3. Cache expensive aggregations with a 5-minute in-memory TTL (Map + timestamp check) — no Redis dependency.
4. Create `analyticsRoutes.js` and mount at `/api/analytics`.

#### Frontend Steps
1. Create `AnalyticsDashboardPage.jsx` (admin only):
   - **Time range filter:** Last 7 / 30 / 90 days.
   - **Query Trends chart** — line chart using SVG path (pure CSS + JS, no chart library required; alternatively use `Chart.js` via CDN import).
   - **FAQ Performance table** — sortable by views, helpful ratio, search hits.
   - **User Growth chart** — area chart.
   - **Resolution Time heatmap** — coloured table by category × week.
   - **Spam Attempts counter** with daily bar chart.
2. All charts responsive, dark-mode aware (CSS variable–driven colours).
3. Export buttons: "Download CSV" for each dataset (client-side CSV generation from API data).

---

### 9.12 Accessibility-Friendly Interface

**Goal:** Ensure the entire application meets **WCAG 2.1 AA** accessibility standards.

#### Checklist & Implementation Steps

**Semantic HTML**
- [ ] Use `<nav>`, `<main>`, `<aside>`, `<article>`, `<section>`, `<header>`, `<footer>` throughout.
- [ ] Every form field has an associated `<label>` (via `for` / `htmlFor` or `aria-label`).
- [ ] Use `<button>` for interactive controls (never `<div onClick>`).

**Keyboard Navigation**
- [ ] All interactive elements reachable and operable by keyboard alone.
- [ ] Visible focus rings on all focusable elements (`outline: 2px solid var(--primary)`).
- [ ] Modal traps focus inside itself; restores focus to trigger on close.
- [ ] Sidebar navigation items fully keyboard navigable.
- [ ] Skip-to-main-content link at top of every page.

**ARIA**
- [ ] `aria-label` on icon-only buttons (e.g., collapse sidebar, close modal).
- [ ] `aria-expanded` on accordion FAQ items and sidebar.
- [ ] `aria-live="polite"` region for Toast notifications.
- [ ] `aria-current="page"` on active sidebar/nav links.
- [ ] `role="alert"` on error messages.
- [ ] `aria-invalid` + `aria-describedby` on invalid form fields.

**Colour & Contrast**
- [ ] Verify all text/background combos meet 4.5:1 ratio (normal text) and 3:1 (large text).
- [ ] Never rely on colour alone to convey information (always add icon or text label).
- [ ] Status badges: combine colour + text label + icon.

**Images & Media**
- [ ] All `<img>` elements have descriptive `alt` text.
- [ ] Decorative images use `alt=""`.
- [ ] Charts include a textual summary / data table as alternative.

**Motion & Animation**
- [ ] Wrap all non-essential animations in `@media (prefers-reduced-motion: reduce)` to disable them.
- [ ] No content that flashes more than 3 times per second.

**Dark Mode**
- [ ] All custom properties defined for both `:root` and `[data-theme="dark"]`.
- [ ] `prefers-color-scheme` media query respected for system default.
- [ ] Theme toggle button labelled: "Switch to dark mode" / "Switch to light mode".

**Testing**
- [ ] Run [axe-core](https://github.com/dequelabs/axe-core) browser extension audit on every page.
- [ ] Manual keyboard-only walkthrough of all critical flows.
- [ ] Screen reader (NVDA or browser built-in) test on Login, Dashboard, and FAQ pages.

---

### 9.13 Implementation Sequence (Recommended Build Order)

Execute features in dependency order to avoid rework:

```
Phase 1 — Core Quality (Week 1–2)
  ├── 9.4 Query Validation & Spam Filtering     ← blocks everything that creates content
  ├── 9.5 Prevent Meaningless Messages          ← part of 9.4
  └── 9.3 Smart Query Classification            ← enhances query creation

Phase 2 — Engagement (Week 2–3)
  ├── 9.1 FAQ Voting System                     ← requires FAQVote model
  ├── 9.2 Duplicate Query Detection             ← requires text indexes
  └── 9.8 Community Discussion Section          ← requires Discussion model + spam filter

Phase 3 — Reputation & Gamification (Week 3–4)
  ├── 9.9 Verified Solutions & Reputation       ← requires Discussion + Query approval hooks
  ├── 9.10 Leaderboard & Badges                 ← requires Reputation system
  └── 9.6 Personalized User Dashboard           ← requires stats from Reputation + Activity

Phase 4 — Admin & Insights (Week 4–5)
  ├── 9.7 Admin Dashboard Enhancements          ← requires all content features live
  └── 9.11 Analytics Dashboard                  ← requires sufficient data volume

Phase 5 — Polish (Week 5–6)
  └── 9.12 Accessibility Audit & Fixes          ← final pass across all pages
```

---

### 9.14 New Files to Create

#### Backend
| File | Purpose |
|---|---|
| `models/FAQVote.js` | Per-user FAQ vote tracking |
| `models/Discussion.js` | Community discussion threads |
| `models/ReputationLog.js` | Audit trail for reputation changes |
| `models/BlockedAttempt.js` | Spam attempt logging |
| `controllers/discussionController.js` | Discussion CRUD |
| `controllers/adminController.js` | Admin bulk actions, KPI overview |
| `controllers/analyticsController.js` | Analytics aggregation pipelines |
| `controllers/leaderboardController.js` | Leaderboard & badge endpoints |
| `routes/discussionRoutes.js` | `/queries/:id/discussions/*` |
| `routes/adminRoutes.js` | `/admin/*` |
| `routes/analyticsRoutes.js` | `/analytics/*` |
| `routes/leaderboardRoutes.js` | `/leaderboard/*` |
| `utils/classifier.js` | Keyword-based query classifier |
| `utils/spamFilter.js` | Spam/meaningless message detection |
| `utils/reputation.js` | Point award helper |
| `utils/badgeEngine.js` | Badge condition evaluator |
| `utils/similarity.js` | Trigram text similarity scorer |
| `middleware/queryValidation.js` | Query-specific validation middleware |

#### Frontend (new pages)
| File | Purpose |
|---|---|
| `pages/user/LeaderboardPage.jsx` | Public leaderboard |
| `pages/user/ProfilePage.jsx` | User profile, badges, reputation history |
| `pages/admin/AnalyticsDashboardPage.jsx` | Analytics charts & tables |
| `components/discussion/DiscussionThread.jsx` | Nested discussion viewer |
| `components/discussion/DiscussionInput.jsx` | Discussion post form |
| `components/leaderboard/Podium.jsx` | Top-3 podium display |
| `components/leaderboard/RankRow.jsx` | Single leaderboard row |
| `components/analytics/LineChart.jsx` | SVG line chart |
| `components/analytics/BarChart.jsx` | SVG bar chart |
| `components/common/BadgeChip.jsx` | Badge display pill |
| `components/common/ReputationBadge.jsx` | Inline reputation score |
| `components/common/SkeletonLoader.jsx` | Loading placeholder |
| `components/common/SkipLink.jsx` | Accessibility skip-to-main link |

---

## 10. Semantic Search — Intent-Aware FAQ & Query Search

### 10.1 Overview & Goal

**Goal:** Replace simple keyword matching with a search layer that understands what the user *means*, not just what they *typed*. A user asking _"I can't pay my dues this month"_ should surface FAQs about fee deadlines, payment extensions, and scholarship options — even though none of those words appear in the query.

**Scope:** Applies to:
- The global FAQ search bar (Header component)
- The FAQ Browse page search
- The Raise Query page duplicate detection (§9.2)
- Admin FAQ Management search

**Approach:** Two-tier hybrid search — **embedding-based vector similarity** (semantic layer) + **BM25 / MongoDB `$text`** (keyword layer) — blended with a configurable weight. This keeps the system self-hosted with no mandatory paid API dependency.

---

### 10.2 How Semantic Search Works (Concept)

```
User Query
    │
    ▼
┌─────────────────────────────┐
│  Text Embedding Model        │  Converts text → dense float vector
│  (e.g. all-MiniLM-L6-v2)   │  e.g. "can't pay fee" → [0.23, -0.71, ...]
└────────────┬────────────────┘
             │  query vector
             ▼
┌─────────────────────────────┐
│  Vector Similarity Search    │  Cosine similarity against stored FAQ vectors
│  (MongoDB Atlas Vector Search│  Returns top-K by semantic closeness
│   or local pgvector/hnswlib) │
└────────────┬────────────────┘
             │  semantic results (scored 0–1)
             ▼
┌─────────────────────────────┐
│  BM25 Keyword Results        │  MongoDB $text search (existing)
│                              │  Returns keyword-match results
└────────────┬────────────────┘
             │  keyword results (BM25 score)
             ▼
┌─────────────────────────────┐
│  Reciprocal Rank Fusion      │  Merge & re-rank both result lists
│  (RRF blend, k=60)           │  Final unified ranked list
└────────────┬────────────────┘
             │
             ▼
         Top-N Results  →  returned to client
```

---

### 10.3 Embedding Model Strategy

Two deployment options — choose based on infrastructure:

#### Option A — Local Embedding via ONNX (Recommended, zero cost)
Run a quantised ONNX version of `all-MiniLM-L6-v2` directly inside the Node.js backend using `@xenova/transformers`. No Python, no external API.

| Property | Value |
|---|---|
| Model | `Xenova/all-MiniLM-L6-v2` (ONNX quantised) |
| Vector dimensions | 384 |
| Avg. inference time | ~15–40ms on CPU |
| Package | `@xenova/transformers` (npm) |
| Disk size | ~23MB (quantised) |

#### Option B — OpenAI `text-embedding-3-small` (Optional, paid)
Drop-in replacement if higher quality is needed or a key is available. 1536-dimensional vectors. Requires `OPENAI_API_KEY` in `.env`.

**The codebase will always use Option A by default.** Option B is switchable via `EMBEDDING_PROVIDER=openai` in `.env`.

---

### 10.4 Vector Storage Strategy

#### Option A — MongoDB Atlas Vector Search (Cloud)
Requires Atlas M10+ cluster. Enables `$vectorSearch` aggregation stage.

```javascript
// Atlas search index definition (JSON)
{
  "fields": [{
    "type": "vector",
    "path": "embedding",
    "numDimensions": 384,
    "similarity": "cosine"
  }]
}
```

#### Option B — In-Process HNSW Index (Self-hosted / Local Dev)
Use the `hnswlib-node` npm package to build an in-memory approximate nearest-neighbour index loaded from a persisted file. Suitable for development and self-hosted deployments.

```
backend/data/faq_vectors.bin   ← persisted HNSW index file
```

**Both options are abstracted behind a `VectorStore` interface so the implementation is swappable:**

```javascript
// utils/vectorStore.js
export class VectorStore {
  async search(queryVector, topK) { /* ... */ }
  async upsert(id, vector)        { /* ... */ }
  async delete(id)                { /* ... */ }
}
// Implementations: AtlasVectorStore, HnswVectorStore
```

---

### 10.5 Schema Changes

#### FAQ Model — Add Embedding Field
```javascript
// models/FAQ.js — new field
{
  embedding: [Number],    // 384-dim float array (all-MiniLM-L6-v2)
                          // NOT returned to client (select: false)
  embeddingUpdatedAt: Date
}
```

#### New: SearchLog Model
Track every search query for analytics and future relevance tuning.
```javascript
// models/SearchLog.js
{
  _id: ObjectId,
  userId: ObjectId (ref: User, optional),   // null for public searches
  rawQuery: String (required),
  cleanedQuery: String,
  topResultIds: [ObjectId],                 // first 3 results returned
  resultCount: Number,
  durationMs: Number,
  clickedResultId: ObjectId (optional),     // which result the user opened
  createdAt: Date
}
```

---

### 10.6 New Backend Files

| File | Purpose |
|---|---|
| `utils/embedder.js` | Loads ONNX model, exposes `embed(text): Float32Array` |
| `utils/vectorStore.js` | Abstract `VectorStore` class + two concrete implementations |
| `utils/searchPipeline.js` | Orchestrates embed → vector search → BM25 → RRF fusion |
| `utils/rrfMerge.js` | Reciprocal Rank Fusion algorithm |
| `utils/textCleaner.js` | Normalise + strip stopwords before embedding |
| `models/SearchLog.js` | Search event logging |
| `controllers/searchController.js` | Handles `GET /search` and `POST /search/feedback` |
| `routes/searchRoutes.js` | Mounts search endpoints |
| `scripts/buildEmbeddings.js` | One-off script: embed all existing FAQs and store vectors |
| `scripts/rebuildIndex.js` | Rebuild HNSW index from stored embeddings |

---

### 10.7 API Design

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/search?q=<text>&limit=10&mode=semantic\|keyword\|hybrid` | Unified search | Public |
| POST | `/search/feedback` | Log which result the user clicked | Auth |
| POST | `/admin/search/reindex` | Re-embed all FAQs (after bulk edit) | Admin |
| GET | `/admin/search/logs` | Paginated search log with click-through rates | Admin |

#### Response Shape (`GET /search`)
```json
{
  "query": "can't pay fee this month",
  "mode": "hybrid",
  "durationMs": 62,
  "results": [
    {
      "id": "...",
      "type": "faq",
      "question": "What are the options if I miss the fee payment deadline?",
      "answer": "Students may apply for a payment extension...",
      "category": "fees",
      "score": 0.94,
      "matchType": "semantic",
      "tags": ["fees", "deadline", "extension"]
    }
  ]
}
```

---

### 10.8 Backend Implementation Steps

#### Step 1 — Install Dependencies
```bash
# In /backend
npm install @xenova/transformers hnswlib-node
```

#### Step 2 — Build `embedder.js`
```javascript
// utils/embedder.js
import { pipeline } from '@xenova/transformers';

let model = null;

export async function getEmbedder() {
  if (!model) {
    model = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return model;
}

export async function embed(text) {
  const embedder = await getEmbedder();
  const cleaned = cleanText(text);           // via textCleaner.js
  const output  = await embedder(cleaned, { pooling: 'mean', normalize: true });
  return Array.from(output.data);            // 384-element float array
}
```
- **Lazy-load** the model on first use; cache in module scope.
- **Warm up** on server start by calling `embed('warmup')` in `server.js`.

#### Step 3 — Build `vectorStore.js` (HNSW implementation)
```javascript
// utils/vectorStore.js  — HnswVectorStore
import HnswLib from 'hnswlib-node';
import path from 'path';

const INDEX_PATH = path.resolve('data/faq_vectors.bin');
const DIM = 384;

export class HnswVectorStore {
  constructor() { this.index = new HnswLib.HierarchicalNSW('cosine', DIM); }

  async load() {
    // load from disk if file exists, else init
  }
  async search(queryVec, topK = 10) {
    return this.index.searchKnn(queryVec, topK);  // { neighbors, distances }
  }
  async upsert(internalId, vector) { this.index.addPoint(vector, internalId); }
  async save() { this.index.writeIndex(INDEX_PATH); }
}
```
- Map MongoDB `_id` to sequential integer labels required by HNSW via a `Map<string, number>` stored in a JSON sidecar file.
- `upsert` is called automatically after any FAQ create/update.

#### Step 4 — Build `rrfMerge.js`
```javascript
// utils/rrfMerge.js
export function reciprocalRankFusion(lists, k = 60) {
  // lists: Array<Array<{ id, score }>>
  const scores = new Map();
  for (const list of lists) {
    list.forEach(({ id }, rank) => {
      scores.set(id, (scores.get(id) ?? 0) + 1 / (k + rank + 1));
    });
  }
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, score]) => ({ id, score }));
}
```

#### Step 5 — Build `searchPipeline.js`
```javascript
export async function semanticSearch(rawQuery, { limit = 10, mode = 'hybrid' }) {
  const cleaned     = cleanText(rawQuery);
  const queryVec    = await embed(cleaned);

  // Branch by mode
  const [vecResults, kwResults] = await Promise.all([
    mode !== 'keyword' ? vectorStore.search(queryVec, limit * 2) : [],
    mode !== 'semantic' ? mongoTextSearch(cleaned, limit * 2) : [],
  ]);

  const merged = mode === 'hybrid'
    ? reciprocalRankFusion([vecResults, kwResults])
    : (mode === 'semantic' ? vecResults : kwResults);

  const topIds = merged.slice(0, limit).map(r => r.id);
  const faqs   = await FAQ.find({ _id: { $in: topIds }, status: 'published' })
                          .select('-embedding');   // never expose raw vectors

  // Reorder by merged rank
  return topIds.map(id => faqs.find(f => f._id.toString() === id)).filter(Boolean);
}
```

#### Step 6 — Hook Into FAQ Lifecycle
In `faqController.js`:
- **After `createFAQ`:** call `embed(faq.question + ' ' + faq.answer)`, save to `faq.embedding`, call `vectorStore.upsert`.
- **After `updateFAQ`:** re-embed and upsert only when `question` or `answer` changed.
- **After `deleteFAQ`:** call `vectorStore.delete(faq._id)`.

#### Step 7 — Run Backfill Script
```bash
node backend/scripts/buildEmbeddings.js
```
- Iterates all published FAQs.
- Embeds each (batched, 10 at a time).
- Updates `embedding` field and `embeddingUpdatedAt`.
- Rebuilds HNSW index and saves to disk.
- Prints progress: `Embedded 45/120 FAQs…`

#### Step 8 — Register Search Routes
```javascript
// server.js
import searchRoutes from './routes/searchRoutes.js';
app.use('/api/search', searchRoutes);
```

---

### 10.9 Frontend Implementation Steps

#### Step 1 — Upgrade `FAQSearch.jsx`
- Replace simple text filter with a debounced (300ms) API call to `GET /api/search?q=<input>&mode=hybrid`.
- Show a loading spinner inside the search box during fetch.
- Render results in real-time as a dropdown suggestion panel *and* update the main FAQ list below.

#### Step 2 — Upgrade Header Global Search
- In `Header.jsx`, wire the global search bar to the same `/api/search` endpoint.
- Show a floating dropdown with top-5 results as the user types.
- Each result shows the FAQ question snippet, category badge, and a "→" open link.
- Press **Enter** or click "See all results" to navigate to `FAQBrowsePage` with the query pre-filled.

#### Step 3 — Create `SearchResultCard.jsx`
```jsx
// components/faq/SearchResultCard.jsx
// Props: { question, answer, category, score, matchType }
// Shows:
//   - Question (bold)
//   - Answer snippet (first 120 chars, "..." truncated)
//   - Category badge
//   - "Semantic match" or "Keyword match" label (subtle, small)
//   - Score as a thin coloured confidence bar (optional, dev mode only)
```

#### Step 4 — Search Mode Toggle (FAQ Browse Page)
Add a segmented control above the FAQ list:
```
[ 🔍 Hybrid ]  [ 📖 Keyword ]  [ 🧠 Semantic ]
```
- Default: Hybrid.
- Persist user's preference in `localStorage`.
- Keyword mode falls back to the existing `$text` search (zero latency).

#### Step 5 — Empty State for No Results
When semantic search returns 0 results:
- Show a friendly empty state: _"No FAQs found for your query."_
- Below it, suggest: _"Can't find what you need? [Raise a query →]"_

#### Step 6 — Log Click-Through
When a user opens a search result, call `POST /api/search/feedback`:
```json
{ "queryText": "can't pay fee", "clickedFaqId": "..." }
```
This populates `SearchLog.clickedResultId` for future relevance analysis.

#### Step 7 — Highlight Matched Terms
In `SearchResultCard.jsx`, highlight the user's search terms within the displayed text using a `<mark>` tag styled to match the design system (yellow-tinted, dark-mode aware).

---

### 10.10 Admin: Semantic Search Management

#### Reindex Trigger (Admin UI)
In `FAQManagementPage.jsx`, add a **"Rebuild Search Index"** button in the page header:
- Calls `POST /api/admin/search/reindex`.
- Shows a progress toast: _"Indexing 45/120 FAQs…"_ (streamed via SSE or polled every 2s).
- Displays last indexed timestamp.

#### Search Analytics Panel (Admin)
Add a new tab in `AnalyticsDashboardPage.jsx`:
- **Top 20 search queries** (most frequent in `SearchLog`).
- **Zero-result queries** — searches that returned nothing (high-priority FAQ gaps to fill).
- **Click-through rate** per FAQ (how often a search result was actually opened).
- **Avg. search latency** over time.

---

### 10.11 Performance & Scalability Notes

| Concern | Mitigation |
|---|---|
| Embedding latency on search | Pre-warm model at server start; typical p50 < 30ms |
| HNSW index memory | ~384 × 4 bytes × N FAQs; 10,000 FAQs ≈ 15MB RAM — negligible |
| Cold start (ONNX load) | Load model once at startup; takes ~2–4s; doesn't block HTTP server |
| Index drift after many edits | Nightly `rebuildIndex.js` cron or admin-triggered reindex |
| Atlas not available | HNSW in-process is the default; Atlas is opt-in via `VECTOR_STORE=atlas` env var |
| High FAQ volume (100k+) | Switch to Atlas Vector Search; HNSW scales to ~1M vectors on modest RAM |
| Embedding cost (Option B) | `text-embedding-3-small` costs ~$0.00002 / 1k tokens — negligible at university scale |

---

### 10.12 Environment Variables

Add to `.env`:
```
# Semantic Search
EMBEDDING_PROVIDER=local          # 'local' (ONNX) | 'openai'
OPENAI_API_KEY=                   # only needed if EMBEDDING_PROVIDER=openai
VECTOR_STORE=hnsw                 # 'hnsw' (local) | 'atlas'
ATLAS_VECTOR_INDEX_NAME=faq_semantic  # only needed if VECTOR_STORE=atlas
SEARCH_DEFAULT_MODE=hybrid        # 'hybrid' | 'semantic' | 'keyword'
SEARCH_TOP_K=10                   # number of results to return
RRF_K=60                          # RRF constant (default 60)
```

---

### 10.13 Build Order & Integration with Phase Plan

Insert into **Phase 2** of the §9.13 build sequence, after Duplicate Query Detection:

```
Phase 2 — Engagement (Week 2–3)  [UPDATED]
  ├── 9.1  FAQ Voting System
  ├── 9.2  Duplicate Query Detection        ← now powered by semantic search
  ├── 10.  Semantic Search                  ← NEW — prerequisite for smart dup detection
  └── 9.8  Community Discussion Section
```

The `buildEmbeddings.js` backfill script must be run **once** immediately after FAQ data is seeded, before the search feature is enabled for users.

---

### 10.14 New Files Summary (Section 10)

#### Backend
| File | Purpose |
|---|---|
| `utils/embedder.js` | ONNX model loader + `embed(text)` function |
| `utils/vectorStore.js` | Abstract store + `HnswVectorStore` + `AtlasVectorStore` |
| `utils/searchPipeline.js` | Main search orchestrator (embed → search → fuse) |
| `utils/rrfMerge.js` | Reciprocal Rank Fusion algorithm |
| `utils/textCleaner.js` | Query normalisation + stopword removal |
| `models/SearchLog.js` | Search event + click-through logging |
| `controllers/searchController.js` | `GET /search`, `POST /search/feedback` |
| `routes/searchRoutes.js` | Search route mounting |
| `scripts/buildEmbeddings.js` | Batch backfill script for existing FAQs |
| `scripts/rebuildIndex.js` | Rebuild HNSW index from stored vectors |
| `data/faq_vectors.bin` | Persisted HNSW binary index file (gitignored) |
| `data/faq_id_map.json` | HNSW integer-label ↔ MongoDB `_id` mapping |

#### Frontend
| File | Purpose |
|---|---|
| `components/faq/SearchResultCard.jsx` | Individual semantic search result card |
| `components/faq/SearchDropdown.jsx` | Floating suggestion dropdown in Header |
| `components/faq/SearchModeToggle.jsx` | Hybrid / Keyword / Semantic segmented control |
| `components/admin/ReindexPanel.jsx` | Admin reindex trigger + progress display |

---

## 11. Most Helpful FAQs Section

### 11.1 Overview & Goal

**Goal:** Display a ranked list of the **top 10 most helpful FAQs** — sorted by their `helpful` vote count descending — as a dedicated, always-visible section on the user dashboard and FAQ Browse page. This gives users instant access to the community's most trusted answers without searching.

**Appears on:**
- User `UserDashboardPage.jsx` — as a "Most Helpful FAQs" widget panel
- `FAQBrowsePage.jsx` — as a sticky sidebar or top-pinned section (above the full FAQ list)
- Admin `FAQManagementPage.jsx` — as a read-only reference column showing the live top-10 ranking

---

### 11.2 Ranking Logic

| Field | Role |
|---|---|
| `helpful` | Primary sort key (descending) |
| `notHelpful` | Used to compute **helpfulness ratio** as a tiebreaker |
| `viewCount` | Secondary tiebreaker when votes are equal |
| `status` | Only `'published'` FAQs are eligible |

**Helpfulness ratio formula (for tiebreaker):**
```
ratio = helpful / (helpful + notHelpful + 1)   // +1 avoids division by zero
```

FAQs are ranked by `helpful` count first; ties are broken by ratio, then by `viewCount`.

**Hard cap:** Always exactly **10 results** — no pagination on this section.

---

### 11.3 Schema — No Changes Required

The existing `FAQ` model already has all required fields:
- `helpful: Number` — thumbs-up count (from §9.1)
- `notHelpful: Number` — thumbs-down count
- `viewCount: Number` — total views
- `status: Enum` — filter to `'published'` only

No schema migration needed.

---

### 11.4 API

#### New Endpoint

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/faqs/top` | Return top 10 FAQs by helpful votes | Public |

#### Query Parameters
| Param | Type | Default | Description |
|---|---|---|---|
| `limit` | Number | `10` | Hard-capped at 10 server-side |
| `category` | String | `all` | Optional filter by category |

#### Response Shape
```json
{
  "count": 10,
  "faqs": [
    {
      "_id": "...",
      "question": "How do I apply for a fee extension?",
      "answer": "Visit the finance office with your student ID...",
      "category": "fees",
      "tags": ["fees", "deadline"],
      "helpful": 142,
      "notHelpful": 4,
      "viewCount": 890,
      "helpfulRatio": 0.97,
      "rank": 1
    }
  ]
}
```

> `helpfulRatio` and `rank` are computed fields added by the controller — **not stored** in the DB.

#### Caching
- Response is cached **in-memory for 2 minutes** (simple `Map` + timestamp, same pattern as §9.11 analytics).
- Cache is **invalidated immediately** when any FAQ receives a new vote (call `topFaqsCache.clear()` inside the `voteFAQ` handler).

---

### 11.5 Backend Implementation Steps

#### Step 1 — Add `getTopFAQs` to `faqController.js`

```javascript
// controllers/faqController.js

const topFaqsCache = { data: null, updatedAt: 0 };
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export const getTopFAQs = asyncHandler(async (req, res) => {
  const now = Date.now();

  // Serve from cache if fresh
  if (topFaqsCache.data && now - topFaqsCache.updatedAt < CACHE_TTL_MS) {
    return res.json(topFaqsCache.data);
  }

  const limit    = Math.min(parseInt(req.query.limit) || 10, 10); // hard cap at 10
  const category = req.query.category;

  const filter = { status: 'published' };
  if (category && category !== 'all') filter.category = category;

  const faqs = await FAQ.find(filter)
    .select('question answer category tags helpful notHelpful viewCount')
    .sort({ helpful: -1, viewCount: -1 })   // primary: helpful, secondary: viewCount
    .limit(limit * 3)                        // fetch 30 so we can re-rank by ratio
    .lean();

  // Compute helpfulness ratio and final rank
  const ranked = faqs
    .map(f => ({
      ...f,
      helpfulRatio: f.helpful / (f.helpful + f.notHelpful + 1),
    }))
    .sort((a, b) =>
      b.helpful !== a.helpful
        ? b.helpful - a.helpful           // primary: helpful count
        : b.helpfulRatio - a.helpfulRatio // tiebreaker: ratio
    )
    .slice(0, limit)
    .map((f, i) => ({ ...f, rank: i + 1 }));

  const payload = { count: ranked.length, faqs: ranked };

  // Store in cache
  topFaqsCache.data      = payload;
  topFaqsCache.updatedAt = now;

  res.json(payload);
});
```

#### Step 2 — Invalidate Cache on Vote

In the `voteFAQ` handler (§9.1):
```javascript
// After updating helpful/notHelpful counts:
topFaqsCache.data = null;   // bust the cache
```

#### Step 3 — Register Route in `faqRoutes.js`

```javascript
// routes/faqRoutes.js
// IMPORTANT: register /top BEFORE /:id to avoid route conflict
router.get('/top', getTopFAQs);
router.get('/:id', getFAQ);
```

> **Route order matters** — `/top` must be declared before `/:id` or Express will treat `"top"` as an ID parameter.

#### Step 4 — Add MongoDB Index

```javascript
// In FAQ model or a migration script
db.faqs.createIndex({ status: 1, helpful: -1, viewCount: -1 });
```
This makes the `getTopFAQs` query an index-only scan — essentially free at any FAQ volume.

---

### 11.6 Frontend Implementation Steps

#### Step 1 — Create `TopFAQsWidget.jsx`

New reusable component consumed by both the dashboard and the browse page.

```
components/faq/TopFAQsWidget.jsx
```

**What it renders:**
```
┌─────────────────────────────────────────────┐
│  🏆  Most Helpful FAQs          [See all →] │
├─────────────────────────────────────────────┤
│  #1  How do I apply for fee extension?       │
│       👍 142   📖 890 views   [fees]         │
│  ─────────────────────────────────────────  │
│  #2  When does the semester exam schedule... │
│       👍 98    📖 670 views   [academics]    │
│  ...                                         │
└─────────────────────────────────────────────┘
```

**Props:**
```jsx
<TopFAQsWidget
  limit={10}           // always 10
  category="all"       // optional filter pass-through
  compact={false}      // true = condensed list for sidebar
/>
```

**Component internals:**
- Fetches `GET /api/faqs/top` on mount.
- Shows `SkeletonLoader` (3 placeholder rows) while loading.
- Renders a numbered rank badge (`#1`, `#2`, ...) on the left of each row.
- Each row is clickable — expands the FAQ answer inline (accordion) or navigates to the FAQ detail.
- "See all →" button navigates to `FAQBrowsePage` sorted by most helpful.

#### Step 2 — Add Rank Badge Styling

In `index.css`, add rank badge tokens:
```css
.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-weight: 700;
  font-size: 12px;
}
.rank-badge--gold   { background: #F59E0B; color: #fff; }   /* #1 */
.rank-badge--silver { background: #94A3B8; color: #fff; }   /* #2 */
.rank-badge--bronze { background: #B45309; color: #fff; }   /* #3 */
.rank-badge--normal { background: var(--surface-secondary); color: var(--text-secondary); }
```

#### Step 3 — Place on User `UserDashboardPage.jsx`

Add `<TopFAQsWidget />` to the lower section of the user dashboard, below the stats row and above the activity timeline:

```
DashboardPage layout (updated):
  ┌──────────────────────────────────────────────┐
  │  Welcome Banner                               │
  ├──────────┬──────────┬──────────┬─────────────┤
  │ Open     │ Resolved │ Voted    │ Reputation   │  ← stats row
  ├──────────┴──────────┴──────────┴─────────────┤
  │  🏆 Most Helpful FAQs          [See all →]   │  ← NEW widget
  ├──────────────────────────────────────────────┤
  │  Activity Timeline                            │
  └──────────────────────────────────────────────┘
```

#### Step 4 — Place on `FAQBrowsePage.jsx`

Add `<TopFAQsWidget compact={true} />` as a **right sidebar panel** (desktop) or a **collapsible top section** (mobile):

```
FAQBrowsePage layout (updated):
  ┌──────────────────────┬──────────────────────┐
  │  Search + Filters    │  🏆 Top 10 Helpful   │
  │  ─────────────────── │  (compact sidebar)   │
  │  Full FAQ list        │  #1 Fee extension…   │
  │  (accordion)          │  #2 Exam schedule…   │
  │                       │  ...                 │
  └──────────────────────┴──────────────────────┘
```

On mobile (< 768px): sidebar collapses into a horizontally scrollable chip row showing only FAQ titles.

#### Step 5 — Place on Admin `FAQManagementPage.jsx`

Add a read-only **"Live Top 10"** mini-panel in the page header area so admins can see the current ranking without leaving the management view. Each row shows rank, question title, helpful count, and a quick-link icon to edit that FAQ.

#### Step 6 — Sort Integration on FAQ Browse Page

Add a **"Most Helpful"** option to the existing sort control on `FAQBrowsePage.jsx`:

```
Sort by:  [ Newest ]  [ Most Viewed ]  [ Most Helpful ▼ ]  [ A–Z ]
```

When "Most Helpful" is selected:
- The full FAQ list is re-sorted client-side if all FAQs are already loaded.
- If paginated server-side, add `?sort=helpful` query param to the `GET /faqs` endpoint.

#### Step 7 — Micro-animations
- On mount, stagger-animate each FAQ row into view: `opacity 0→1` + `translateY 8px→0` with 50ms delay per item (items 1–10 animate in sequence).
- Wrap in `@media (prefers-reduced-motion: reduce)` guard (per §9.12 accessibility).
- When the vote count updates live (after the user casts a vote), animate the number with a brief scale pulse: `transform: scale(1.3) → scale(1)` over 200ms.

---

### 11.7 Category Filter Integration

The `TopFAQsWidget` supports a category prop so it can be scoped to a specific department:

```jsx
// On the user dashboard, auto-pass the user's department as the category
<TopFAQsWidget category={user.department} />

// On the FAQ Browse page, sync with the active category filter
<TopFAQsWidget category={activeCategory} />
```

When a category filter is active, the widget title updates to:
> **"Most Helpful in Academics"** (or whichever category)

When fewer than 10 FAQs exist in a category, show however many are available with a note:
> _"Showing 4 of 4 FAQs in this category"_

---

### 11.8 Empty & Edge Case Handling

| Scenario | Behaviour |
|---|---|
| No FAQs published yet | Show empty state: _"No FAQs available yet. Check back soon."_ |
| All FAQs have 0 helpful votes | Fall back to sort by `viewCount` descending; show a label "Sorted by popularity (no votes yet)" |
| Fewer than 10 published FAQs | Return however many exist; widget adjusts height gracefully |
| Category filter returns 0 results | Show empty state with "Try viewing all categories" button |
| API error | Show error banner with retry button; do not break the rest of the page |

---

### 11.9 Admin View: Helpfulness Insight Badges

In `FAQManagementPage.jsx`, augment each FAQ table row with:
- 🏆 **gold trophy** icon if the FAQ is in the current top 3
- 📈 **trending up** icon if `helpful` increased by ≥ 10 in the last 7 days
- 📉 **trending down** icon if `notHelpful` exceeds `helpful` (ratio < 0.5) — flag for review

These are computed client-side from the data already returned by `GET /faqs/all`.

---

### 11.10 Implementation Steps Summary (Ordered)

```
Step 1  Backend — Add getTopFAQs handler to faqController.js
Step 2  Backend — Add 2-min in-memory cache + cache invalidation on vote
Step 3  Backend — Register GET /faqs/top route (before /:id)
Step 4  Backend — Add compound DB index { status, helpful, viewCount }
Step 5  Frontend — Create TopFAQsWidget.jsx component
Step 6  Frontend — Add rank badge CSS tokens to index.css
Step 7  Frontend — Place widget on DashboardPage.jsx
Step 8  Frontend — Place compact widget on FAQBrowsePage.jsx sidebar
Step 9  Frontend — Add "Most Helpful" sort option to FAQ Browse sort control
Step 10 Frontend — Place read-only top-10 panel on FAQManagementPage.jsx
Step 11 Frontend — Wire category filter prop to widget on both pages
Step 12 Frontend — Add stagger + vote-count pulse animations
Step 13 Test — Verify route order (top before :id), cache TTL, rank tie-breaking
```

---

### 11.11 New Files

| File | Purpose |
|---|---|
| `components/faq/TopFAQsWidget.jsx` | Ranked top-10 FAQ list component (full + compact modes) |

**Modified files:**

| File | Change |
|---|---|
| `controllers/faqController.js` | Add `getTopFAQs` handler + in-memory cache |
| `routes/faqRoutes.js` | Register `GET /faqs/top` before `GET /faqs/:id` |
| `pages/user/UserDashboardPage.jsx` | Add `<TopFAQsWidget />` below stats row |
| `pages/user/FAQBrowsePage.jsx` | Add compact sidebar widget + "Most Helpful" sort option |
| `pages/admin/FAQManagementPage.jsx` | Add live top-10 mini-panel + helpfulness insight badges |
| `index.css` | Add `.rank-badge` variants (gold, silver, bronze, normal) |