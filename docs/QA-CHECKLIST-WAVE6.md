# Wave 6 QA Testing Checklist

Comprehensive manual and automated testing checklist for all 15 Wave 6 features.

**Last Updated:** 2026-06-28  
**Version:** 1.0  
**Status:** Ready for Testing

---

## Table of Contents

1. [Search & Discovery Features](#search--discovery-features)
2. [Personalization Features](#personalization-features)
3. [Community Features](#community-features)
4. [Edge Cases & Error Handling](#edge-cases--error-handling)
5. [Performance Benchmarks](#performance-benchmarks)
6. [Accessibility Compliance](#accessibility-compliance)
7. [Cross-Browser & Device Testing](#cross-browser--device-testing)

---

## Search & Discovery Features

### Feature 1: Search History

**Location:** Settings > Search History or inline history dropdown

- [ ] **Functionality Tests**
  - [ ] User can view recent searches
  - [ ] Searches are listed in reverse chronological order (most recent first)
  - [ ] Each search shows timestamp
  - [ ] Each search shows result count
  - [ ] User can click on history item to repeat search
  - [ ] User can delete individual history items
  - [ ] User can clear all history with confirmation dialog
  - [ ] History persists across browser sessions (in localstorage/DB)
  - [ ] History is user-specific (logged in users only)
  - [ ] Maximum 100 items retained (oldest removed when exceeded)

- [ ] **Edge Cases**
  - [ ] Empty history shows appropriate message
  - [ ] Very long search queries display correctly (truncation/overflow)
  - [ ] Unicode characters in queries are handled properly
  - [ ] Special characters (quotes, operators) are stored correctly
  - [ ] History works when offline (cached)
  - [ ] History sync when going online after offline session

- [ ] **UI/UX Tests**
  - [ ] Clear button shows confirmation dialog
  - [ ] Delete button shows visual feedback
  - [ ] History is accessible from main search bar
  - [ ] Mobile: History items don't overflow on small screens
  - [ ] Dark mode: History items are readable

---

### Feature 2: Search Trends

**Location:** Discover > Trending Searches or Trends tab

- [ ] **Functionality Tests**
  - [ ] Trending searches are displayed with correct data
  - [ ] Trend scores range from 0-10 (visual representation)
  - [ ] Growth rates show percentage increase/decrease
  - [ ] Categories filter works (leaks, gameplay, story, etc.)
  - [ ] Related queries are shown when expanded
  - [ ] Peak time is displayed and formatted correctly
  - [ ] Trend data updates at least hourly
  - [ ] Top 10 trends are visible by default
  - [ ] User can see more trends by scrolling/pagination
  - [ ] Clicking trend performs search automatically

- [ ] **Edge Cases**
  - [ ] No trends available: Show appropriate message
  - [ ] Tie in trend scores: Order deterministically
  - [ ] Trends with no growth: Display correctly (0%)
  - [ ] Very new trends (< 1 hour old): Handle gracefully
  - [ ] Duplicate trends: Don't show duplicates
  - [ ] Extreme growth rates (1000%+): Display with warnings

- [ ] **Data Accuracy**
  - [ ] Trend scores match backend calculations
  - [ ] Growth rates calculated correctly
  - [ ] Related queries are actually related
  - [ ] Peak times are accurate within 5 minute margin
  - [ ] Categories are correctly assigned

---

### Feature 3: Video Search

**Location:** Search > Videos tab or /videos route

- [ ] **Functionality Tests**
  - [ ] Search box accepts video queries
  - [ ] Results load within 3 seconds
  - [ ] Supports YouTube, Twitch, and internal videos
  - [ ] View counts display in millions (50M not 50000000)
  - [ ] Duration displays in HH:MM:SS format
  - [ ] Thumbnail images load and display correctly
  - [ ] Click video opens player/detail page
  - [ ] Source badge shows correct platform (YouTube/Twitch)
  - [ ] Video URL is correct and clickable
  - [ ] Published date displays relative time (e.g., "2 days ago")

- [ ] **Edge Cases**
  - [ ] No results: Show appropriate message
  - [ ] Loading fails: Show retry button
  - [ ] Missing thumbnails: Show placeholder image
  - [ ] Very long titles: Truncate with ellipsis
  - [ ] Very old videos (5+ years): Handle date formatting
  - [ ] Videos with 0 views: Display correctly
  - [ ] Private videos: Handle gracefully (if applicable)

- [ ] **Search Quality**
  - [ ] Relevant results are returned first
  - [ ] Spelling errors in search don't break results
  - [ ] Special characters in search work
  - [ ] Empty search shows trending videos
  - [ ] Search with 100+ results paginates correctly

---

## Personalization Features

### Feature 4: Time-Based Recommendations

**Location:** Dashboard > Recommended or /personalization/time-based

- [ ] **Functionality Tests**
  - [ ] Recommendations show current time period content
  - [ ] Three time periods work: morning, afternoon, evening
  - [ ] Can filter by specific time period
  - [ ] Confidence scores range 0-100%
  - [ ] Priority levels determine display order
  - [ ] Recommendations update when user changes time preferences
  - [ ] At least 3 recommendations per time period
  - [ ] Reason for recommendation is shown
  - [ ] User can dismiss recommendation
  - [ ] Dismissals are remembered

- [ ] **Time Logic**
  - [ ] Morning: 6 AM - 12 PM
  - [ ] Afternoon: 12 PM - 6 PM
  - [ ] Evening: 6 PM - 6 AM
  - [ ] Transitions between periods work correctly
  - [ ] Timezone handling is correct

- [ ] **Edge Cases**
  - [ ] No articles available for time period: Show fallback
  - [ ] User is in unusual timezone: Handle correctly
  - [ ] User changes time zone: Recommendations update
  - [ ] Very new user (no history): Show default recommendations
  - [ ] User with no article interactions: Show balanced mix

---

### Feature 5: Emotion-Based Recommendations

**Location:** Dashboard > For You or /personalization/emotional

- [ ] **Functionality Tests**
  - [ ] Emotions are detected from user reading history
  - [ ] At least 5 emotions are tracked (excitement, curiosity, etc.)
  - [ ] Recommendations match detected emotions
  - [ ] Emotion tags display as visual badges
  - [ ] Engagement prediction shows as percentage
  - [ ] Sentiment scores range -1 to +1
  - [ ] Filter by specific emotion works
  - [ ] "Mood" selector allows quick filtering
  - [ ] Recommendations update when mood changes
  - [ ] At least 5 recommendations shown

- [ ] **Emotion Detection**
  - [ ] Excitement emotion detected from action-heavy articles
  - [ ] Curiosity emotion detected from mystery/leak articles
  - [ ] Nostalgia emotion detected from classic game references
  - [ ] Intrigue emotion detected from analysis pieces
  - [ ] Joy emotion detected from positive news

- [ ] **Edge Cases**
  - [ ] New user with no read history: Show base recommendations
  - [ ] User with conflicting emotions: Blend appropriately
  - [ ] Neutral sentiment articles: Place correctly
  - [ ] No articles match emotion: Show related emotions
  - [ ] Very polarized user (only one emotion): Diversity is maintained

---

### Feature 6: Sentiment Analysis

**Location:** Profile > Insights or /analytics/sentiment

- [ ] **Functionality Tests**
  - [ ] Overall sentiment displays as number (-1 to +1)
  - [ ] Sentiment is color-coded (red = negative, yellow = neutral, green = positive)
  - [ ] Emotion distribution shows as chart or list
  - [ ] Sentiment trend over time is displayed
  - [ ] Time range selector (last 7 days, 30 days, all time)
  - [ ] User can export sentiment data
  - [ ] Most frequent emotion is highlighted
  - [ ] Trend arrow shows if sentiment is improving/declining
  - [ ] Comparison to average user is shown
  - [ ] Detailed breakdown by emotion is available

- [ ] **Data Accuracy**
  - [ ] Sentiment scores calculated correctly from articles read
  - [ ] Emotions sum to 100% or clearly show distribution
  - [ ] Trend calculation uses correct time windows
  - [ ] Average user sentiment is from representative sample
  - [ ] Updates within 1 hour of new interaction

- [ ] **Edge Cases**
  - [ ] New user (< 10 articles read): Show limited data
  - [ ] User reads extreme content: Sentiment bounded correctly
  - [ ] No data for selected period: Show message
  - [ ] Single article read: Show realistic sentiment
  - [ ] Multiple readings same article: Count appropriately

---

## Community Features

### Feature 7: Community Groups

**Location:** Community > Groups or /community/groups

- [ ] **Functionality Tests**
  - [ ] List of all public groups displays
  - [ ] Search groups by name/description works
  - [ ] Filter groups by category works
  - [ ] Show member count for each group
  - [ ] Show group description on hover/modal
  - [ ] Private groups show "Private" badge
  - [ ] User can join public groups
  - [ ] Join requires confirmation
  - [ ] Member count updates after join
  - [ ] User can see list of joined groups
  - [ ] User can leave groups
  - [ ] Leave requires confirmation
  - [ ] Moderators are shown (at least first 3)
  - [ ] "More" link shows all moderators
  - [ ] Creation date is shown in relative format

- [ ] **Group Moderation (Mod-only)**
  - [ ] Moderators can edit group description
  - [ ] Moderators can change category
  - [ ] Moderators can view member list
  - [ ] Moderators can remove members
  - [ ] Moderators can add new moderators
  - [ ] Moderators can make group private

- [ ] **Edge Cases**
  - [ ] 0 members: Still shows group
  - [ ] 1000000+ members: Displays correctly (formatted)
  - [ ] Very long description: Shows truncated with ellipsis
  - [ ] Group with no moderators: Handles gracefully
  - [ ] User tries to join while already member: Shows message
  - [ ] Admin deletes group while user is in it: Handles gracefully

---

### Feature 8: Community Threads

**Location:** Community > Groups > [Group Name] or /community/threads

- [ ] **Functionality Tests**
  - [ ] List of threads in group displays
  - [ ] Sort by: recent, popular, trending works
  - [ ] Each thread shows: title, author, timestamp, reply count, upvote count
  - [ ] Pinned threads appear at top
  - [ ] Thread preview/excerpt shows
  - [ ] Click thread opens detail page
  - [ ] Author avatar displays (or initial placeholder)
  - [ ] Author name is clickable (to profile)
  - [ ] Time stamp is relative ("2 hours ago")
  - [ ] Reply count is accurate
  - [ ] Upvote count is accurate

- [ ] **Thread Creation**
  - [ ] "New Thread" button visible in group
  - [ ] Title field is required
  - [ ] Content field is required
  - [ ] Content supports basic Markdown
  - [ ] Preview before posting works
  - [ ] Character limits enforced (title, content)
  - [ ] Cancel returns to list without saving
  - [ ] Submit creates thread and shows confirmation
  - [ ] User is taken to new thread detail

- [ ] **Thread Interaction**
  - [ ] User can upvote thread (logged in)
  - [ ] Upvote button shows current state (filled/unfilled)
  - [ ] Upvote count updates immediately
  - [ ] User can remove upvote
  - [ ] Moderators can pin/unpin threads
  - [ ] Pinned indicator shows at top
  - [ ] Thread deletion works (author or mod)
  - [ ] Deletion shows confirmation dialog
  - [ ] Deleted threads disappear from list

- [ ] **Edge Cases**
  - [ ] Empty group (0 threads): Show message
  - [ ] Thread with 0 replies: Still displays
  - [ ] Thread with 10000+ upvotes: Formats correctly
  - [ ] Very long title: Truncates appropriately
  - [ ] Very old thread: Date format is correct
  - [ ] Thread by deleted user: Shows "[Deleted User]"
  - [ ] Thread with many moderators: Still responsive

---

### Feature 9: Thread Replies

**Location:** Community > Threads > [Thread] or /community/threads/:id

- [ ] **Functionality Tests**
  - [ ] List of replies displays in chronological order
  - [ ] Reply count is accurate
  - [ ] Each reply shows: content, author, timestamp, upvotes
  - [ ] Pagination or "Load More" works for 50+ replies
  - [ ] Click "Reply" button opens reply form
  - [ ] Reply text field is visible and functional
  - [ ] Submit button is enabled when content exists
  - [ ] Cancel button discards unsaved reply
  - [ ] Submitted reply appears in list immediately
  - [ ] Reply is attributed to current user

- [ ] **Reply Interaction**
  - [ ] User can upvote replies
  - [ ] Upvote state shows (filled/unfilled)
  - [ ] Upvote count updates immediately
  - [ ] User can remove upvote
  - [ ] Nested replies work (replies to replies)
  - [ ] Nesting is visually indicated (indentation)
  - [ ] Author can delete their own reply
  - [ ] Moderators can delete any reply
  - [ ] Deletion shows confirmation

- [ ] **Editing**
  - [ ] Author can edit own reply
  - [ ] Edit button opens edit form with original content
  - [ ] "Edited" indicator shows with timestamp
  - [ ] Edit history not visible (only indicator)

- [ ] **Edge Cases**
  - [ ] First reply to thread: Shows correctly
  - [ ] Reply with only whitespace: Validation prevents
  - [ ] Reply with 10000+ characters: Handled correctly
  - [ ] Reply with URLs: Links are clickable
  - [ ] Reply with code blocks: Formatting preserved
  - [ ] Reply from deleted user: Shows "[Deleted User]"
  - [ ] 1000+ replies: Pagination works smoothly

---

### Feature 10: Moderation Queue

**Location:** Admin > Moderation or /admin/moderation (mod-only)

- [ ] **Functionality Tests**
  - [ ] Only moderators can access
  - [ ] Shows pending actions (reports, flags)
  - [ ] Each item shows: target, reason, reporter, timestamp
  - [ ] Click item shows details
  - [ ] Details show: content preview, full reason, user history
  - [ ] Moderator can approve action
  - [ ] Moderator can reject action
  - [ ] Moderator can assign to another moderator
  - [ ] Action status updates immediately
  - [ ] Cleared items are removed from queue
  - [ ] Filter by: pending, approved, rejected
  - [ ] Sort by: newest, oldest, severity

- [ ] **Actions**
  - [ ] Hide/Show content: toggles visibility
  - [ ] Delete content: removes permanently
  - [ ] Warn user: user receives notification
  - [ ] Suspend user: user can't post/comment
  - [ ] Ban user: user completely blocked
  - [ ] Each action is reversible (admin only)

- [ ] **Edge Cases**
  - [ ] Empty queue: Shows "No pending actions"
  - [ ] Item already actioned: Shows status
  - [ ] Multiple reports for same content: Deduplicate
  - [ ] Reporter is the target: Handle appropriately
  - [ ] Content already deleted: Show message
  - [ ] User already suspended: Show message

---

## Edge Cases & Error Handling

### Feature 11: Error Handling & Recovery

- [ ] **Network Errors**
  - [ ] Network timeout: Shows "Connection timeout" message
  - [ ] Retry button is provided
  - [ ] Retry button is functional
  - [ ] Partial data loads: Shows what's available
  - [ ] Offline detection: Shows offline mode
  - [ ] Cached data shows when offline
  - [ ] Sync when connection restored
  - [ ] Multiple retries work (backoff)

- [ ] **API Errors**
  - [ ] 400 Bad Request: User-friendly message
  - [ ] 401 Unauthorized: Redirects to login
  - [ ] 403 Forbidden: Shows "Access denied"
  - [ ] 404 Not Found: Shows "Item not found"
  - [ ] 429 Rate Limit: Shows "Too many requests"
  - [ ] 500 Server Error: Shows "Something went wrong"
  - [ ] Error messages are actionable

- [ ] **Data Validation**
  - [ ] Empty input prevented
  - [ ] Input length limits enforced
  - [ ] Special characters handled
  - [ ] XSS prevention working
  - [ ] SQL injection prevented
  - [ ] Clear validation messages shown

---

### Feature 12: Accessibility Compliance

- [ ] **WCAG 2.1 Level AA**
  - [ ] All text has sufficient color contrast (4.5:1)
  - [ ] All interactive elements are keyboard accessible
  - [ ] Tab order is logical
  - [ ] Focus indicators are visible
  - [ ] All buttons have accessible names
  - [ ] All form fields have labels
  - [ ] Error messages are announced
  - [ ] Page language is set
  - [ ] Headings follow logical hierarchy (h1 > h2 > h3)

- [ ] **Screen Reader Support**
  - [ ] All images have alt text
  - [ ] Decorative images marked as such
  - [ ] Landmarks are properly marked (nav, main, aside)
  - [ ] Form fields announce errors
  - [ ] Dynamic content announced (aria-live)
  - [ ] Modals trap focus properly

- [ ] **Motor/Physical Accessibility**
  - [ ] All buttons are minimum 44x44px
  - [ ] Touch targets have minimum spacing
  - [ ] Typing is not required for core features (unless essential)
  - [ ] Time limits can be extended
  - [ ] Flashing/flickering doesn't occur (< 3 Hz)

---

## Performance Benchmarks

### Feature 13: Performance Standards

- [ ] **Load Performance**
  - [ ] Search History loads in < 500ms
  - [ ] Trends page loads in < 1s
  - [ ] Video search results load in < 3s
  - [ ] Recommendations load in < 2s
  - [ ] Group list loads in < 1s
  - [ ] Thread list loads in < 1s

- [ ] **Interaction Performance**
  - [ ] Joining group: < 500ms feedback
  - [ ] Creating thread: < 1s feedback
  - [ ] Posting reply: < 1s feedback
  - [ ] Upvoting: < 200ms feedback
  - [ ] Deleting: < 500ms feedback

- [ ] **Memory Usage**
  - [ ] Page doesn't grow beyond 100MB RAM
  - [ ] Long scroll lists don't cause slowdown (virtualization works)
  - [ ] 1000+ items load smoothly
  - [ ] Memory returns to baseline after navigation

- [ ] **Bundle Size**
  - [ ] Wave 6 features add < 150KB gzipped
  - [ ] Lazy loading works for non-critical features
  - [ ] No performance regressions from baseline

---

### Feature 14: Caching Strategy

- [ ] **Browser Cache**
  - [ ] Trends data cached for 1 hour
  - [ ] User preferences cached locally
  - [ ] Search history stored in localStorage
  - [ ] Cache invalidation works correctly
  - [ ] Offline mode works with cached data

- [ ] **API Cache**
  - [ ] Public endpoints cached (CDN)
  - [ ] User-specific data not cached
  - [ ] Cache headers set correctly
  - [ ] Cache-busting works on deploy

---

## Cross-Browser & Device Testing

### Feature 15: Browser Compatibility

- [ ] **Desktop Browsers**
  - [ ] Chrome (latest 2 versions)
    - [ ] All features work
    - [ ] Performance acceptable
    - [ ] No console errors
  - [ ] Firefox (latest 2 versions)
    - [ ] All features work
    - [ ] Performance acceptable
    - [ ] No console errors
  - [ ] Safari (latest 2 versions)
    - [ ] All features work
    - [ ] Performance acceptable
    - [ ] No console errors
  - [ ] Edge (latest 2 versions)
    - [ ] All features work
    - [ ] Performance acceptable
    - [ ] No console errors

- [ ] **Mobile Browsers**
  - [ ] Mobile Safari (iOS 15+)
    - [ ] Touch interactions work
    - [ ] Layout is responsive
    - [ ] Performance acceptable
  - [ ] Mobile Chrome (Android 12+)
    - [ ] Touch interactions work
    - [ ] Layout is responsive
    - [ ] Performance acceptable

- [ ] **Devices**
  - [ ] iPhone 14/15 (375px width)
  - [ ] iPad (768px width)
  - [ ] Android phones (375-480px width)
  - [ ] Tablets (768px width)
  - [ ] Desktop (1920x1080)
  - [ ] Large desktop (2560x1440)

---

## Testing Checklist Summary

### Pre-Release Validation

- [ ] All 15 features tested manually
- [ ] Edge cases tested and passing
- [ ] Performance benchmarks met
- [ ] Accessibility compliance verified
- [ ] Cross-browser testing completed
- [ ] Error handling verified
- [ ] No critical bugs remaining
- [ ] No P0 security issues
- [ ] QA sign-off obtained
- [ ] Product owner approval obtained

### Sign-Off

**QA Lead:** _____________________ **Date:** _______

**Product Owner:** _____________________ **Date:** _______

**Release Manager:** _____________________ **Date:** _______

---

## Notes & Issues Log

Use this section to document any issues found during testing:

| Issue ID | Feature | Severity | Status | Notes |
|----------|---------|----------|--------|-------|
|          |         |          |        |       |
|          |         |          |        |       |

---

**Related Documents:**
- [TEST-COVERAGE-TARGETS.md](./TEST-COVERAGE-TARGETS.md)
- [Wave 6 Feature Specification](./WAVE6-FEATURES.md)
- [CI/CD Pipeline Config](./.github/workflows/test-wave6.yml)
