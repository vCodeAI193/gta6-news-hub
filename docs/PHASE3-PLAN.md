# 🚀 Wave 6 Phase 3 Implementation Plan (Features 51-70)

**Estimated Duration:** 4-6 weeks | **Target:** Completion of 20 high-impact features across 5 groups

> **Context:** This plan covers the next tier of features after Wave 6 Phase 1 (top 50 features completed). Phase 3 focuses on consolidating gains, adding premium capabilities, and deepening user engagement across CMS, notifications, accounts, performance, and media domains.

---

## Executive Summary

**Total Features:** 20  
**Total Estimated Effort:** 85-105 person-days (12-15 weeks for 1 engineer)  
**Risk Level:** Medium (depends on third-party integrations)  
**Critical Path:** Performance & PWA group blocks offline/advanced caching features  

**Rollout Strategy:**
- **Alpha:** Week 1-2 (internal team + power users)
- **Beta:** Week 3-4 (50% user base)
- **GA:** Week 5-6 (full rollout with monitoring)

---

## Group A: CMS & Editorial (Features 51-53) 

### Overview
Advanced editorial capabilities enabling real-time team collaboration, content scheduling at scale, and integrated SEO analysis directly in the editor.

### Features

#### 1. **Collaborative Editing Advanced — Cursor Positions Visible** 
*Feature 51*

**Description:**  
Extend the existing real-time co-editing to show other editor's cursor positions, selection highlights, and typing indicators. When multiple editors are in the same draft, each cursor is color-coded with user name/avatar visible.

**Effort:** Medium (4-5 days)  
**Dependencies:** 
- Existing CRDT co-editing system (already deployed)
- WebSocket infrastructure (Redis Pub/Sub ready)
- User presence tracking (partial implementation exists)

**Implementation Order:**
1. Extend CRDT model to include cursor position objects
2. Add cursor broadcast/sync via WebSocket
3. Build cursor rendering in editor UI (color-coded overlays)
4. Add selection highlighting for remote users
5. Handle cursor cleanup on disconnect

**Technical Considerations:**
- Cursor sync must be high-frequency (~100ms) but lightweight
- Test with 5+ simultaneous editors
- Mobile: show cursor indicators but not full position (UX)

**Testing Plan:**
- Unit: CRDT cursor operations
- Integration: Multi-user editing scenarios
- Performance: Concurrent cursor updates @ 10 Hz

**Success Criteria:**
- Cursors visible within 200ms of movement
- No noticeable latency with 5+ editors
- Selection highlighting works across content types

---

#### 2. **Scheduling Hub — Central Calendar of All Planned Content**
*Feature 52*

**Description:**  
Create a unified editorial calendar showing all scheduled articles, videos, announcements across all channels (web, newsletter, social). Drag-drop to reschedule, color-coded by content type/priority, with capacity planning (articles per day).

**Effort:** Medium-Large (6-7 days)  
**Dependencies:**
- Existing scheduling system (`/api/articles/schedule`)
- Calendar UI library (integrate React Big Calendar or Fullcalendar)
- Multi-channel content tracking (needs schema expansion)

**Implementation Order:**
1. Extend schema: add channel + content-type to scheduled articles
2. Build calendar backend query (`/api/editorial/schedule?range=month`)
3. Create calendar UI with day/week/month views
4. Add drag-drop reschedule with conflict detection
5. Implement capacity warnings (e.g., "5 articles already scheduled for Friday")
6. Add filter/search by author/category/channel

**Technical Considerations:**
- Timezone awareness (editors in different regions)
- Capacity limits configurable per channel
- Publish-time optimization suggestions (historical engagement data)

**Testing Plan:**
- Unit: Scheduling conflict detection
- Integration: Multi-channel scenario (web + newsletter + social)
- UX: Drag-drop performance with 200+ scheduled items

**Success Criteria:**
- Calendar loads with <1s delay for 6-month range
- Reschedule reflected in real-time for all editors
- Capacity warnings accurate within 5-min window

---

#### 3. **SEO Analysis — Integrated Keyword/Readability in Editor**
*Feature 53*

**Description:**  
Real-time SEO score in the editor sidebar showing keyword density, readability (Flesch-Kincaid), meta-tag preview, internal link suggestions, and heading structure. Highlight suggestions in-editor (e.g., "Title too short for Google preview").

**Effort:** Medium (5-6 days)  
**Dependencies:**
- Existing readability analyzer (`/lib/readability.ts`)
- SEO metadata model (partially exists)
- NLP library for keyword extraction (use existing or add `compromise` lib)

**Implementation Order:**
1. Build SEO scoring engine: keyword density (2-3%), readability, structure
2. Create editor sidebar panel showing live metrics
3. Implement keyword suggestions based on article topic
4. Add internal linking recommendations (similar articles)
5. Build meta-tag preview (Google + social)
6. Highlight low-scoring elements in editor

**Technical Considerations:**
- Update scores as user types (debounce to 500ms)
- Keyword analysis needs entity recognition (leverage existing AI tags)
- Social preview: OpenGraph + Twitter Card generation

**Testing Plan:**
- Unit: SEO scoring algorithms (compare against Yoast baseline)
- Integration: Keyword extraction vs. manual analysis
- UX: Sidebar responsiveness during editing

**Success Criteria:**
- SEO score updates within 500ms of text change
- Keyword suggestions match 80%+ accuracy vs. manual review
- Meta preview renders correctly for all platforms (Google, Twitter, FB)

---

### Group A Summary Table

| Feature | Effort | Priority | Owner | Status |
|---------|--------|----------|-------|--------|
| Cursor Positions | Medium | High | Backend + Frontend | Planned |
| Scheduling Hub | Med-Large | High | Frontend + Data | Planned |
| SEO Analysis | Medium | High | Backend + Frontend | Planned |

**Group A Totals:**  
- **Effort:** 15-18 days  
- **Dependencies:** Mostly additive; no blocking issues  
- **Rollout Risk:** Low (isolated to editorial team)  

**Success Criteria for Group:**
1. 100% of editorial team can see live cursor positions
2. Scheduling Hub used by 95%+ of editors for planning
3. SEO analysis triggers feedback for 80%+ of new articles

---

## Group B: Notifications (Features 54-55)

### Overview
Intelligent notification timing and segmentation for A/B testing, ensuring messages reach users at optimal times with personalized content variants.

### Features

#### 1. **Smart Push Timing — Intelligently Choose Delivery Window**
*Feature 54*

**Description:**  
Analyze user's historical activity patterns (login times, engagement peaks) and automatically schedule push notifications during their most active windows. System learns from engagement metrics (open rates, click-through) and adapts.

**Effort:** Medium-Large (6-7 days)  
**Dependencies:**
- Existing push infrastructure (VAPID already deployed)
- User activity tracking (`/api/users/activity`)
- ML/statistical models (can use simple heuristics initially)

**Implementation Order:**
1. Build activity pattern analyzer: extract peak hours per user (week/month)
2. Extend notification schema: add `optimal_send_time` field
3. Create scheduling queue that respects time windows
4. Implement feedback loop: track open rates by hour
5. Build admin UI to view/override optimal times
6. Add A/B testing framework (test optimal vs. scheduled time)

**Technical Considerations:**
- Timezone handling (critical for global audience)
- Pattern stability: smooth out outliers (use 4-week rolling window)
- Respect quiet hours: honor user's "Do Not Disturb" settings
- Cold-start for new users: fallback to cohort behavior

**Testing Plan:**
- Unit: Activity pattern detection (test with synthetic data)
- Integration: Time window calculation with timezone conversion
- Analytics: A/B test results (optimal vs. default timing)

**Success Criteria:**
- Push open rate increases 15-25% with smart timing
- 90%+ of notifications sent within user's optimal window
- A/B test shows statistical significance (p < 0.05)

---

#### 2. **Segmented Campaigns — A/B Testing for Notifications**
*Feature 55*

**Description:**  
Create A/B test variants for push notifications (different copy, images, CTAs) and automatically split audience into control/variant groups. Track performance metrics (impressions, clicks, conversions) and declare winners.

**Effort:** Medium (5-6 days)  
**Dependencies:**
- Push notification system
- Analytics backend (`/api/analytics/events`)
- User segmentation engine (already exists for personalization)

**Implementation Order:**
1. Extend notification schema: add variants, control_group_pct fields
2. Build campaign builder UI (select audience, create variants, set metrics)
3. Implement audience splitting logic (deterministic hash-based)
4. Create analytics event tracking for notification interactions
5. Build results dashboard (show winner after N days or min sample size)
6. Add auto-winner declaration logic with statistical significance check

**Technical Considerations:**
- Statistical rigor: use binomial test or chi-square (minimum 100 samples)
- Duration: campaigns run 3-7 days; auto-decide after min sample or time
- Carryover effects: track which users saw which variant
- Audience overlap: handle users in multiple simultaneous tests

**Testing Plan:**
- Unit: A/B test audience splitting (verify equal distribution)
- Integration: Campaign creation → variant assignment → result tracking
- Simulation: Run synthetic A/B tests with known effect sizes

**Success Criteria:**
- Statistical winner declared with p < 0.05 significance
- Variants reach 90%+ of assigned audience
- Results dashboard matches analytics event counts ±5%

---

### Group B Summary Table

| Feature | Effort | Priority | Owner | Status |
|---------|--------|----------|-------|--------|
| Smart Push Timing | Med-Large | High | Backend + Data Science | Planned |
| Segmented Campaigns | Medium | High | Backend + Frontend | Planned |

**Group B Totals:**  
- **Effort:** 11-13 days  
- **Dependencies:** Analytics framework required  
- **Rollout Risk:** Low (feature-flagged for campaigns)  

**Success Criteria for Group:**
1. Notification open rate increases 15%+ with smart timing
2. A/B test framework deployed to 100% of push campaigns
3. Winning variants show 10%+ higher CTR vs. control

---

## Group C: Accounts & Identity (Features 56-60)

### Overview
Advanced account security, recovery flows, and privacy controls for enterprise-grade identity management. Select 5 from the following options based on priority.

### Available Features

**Tier 1 (Enterprise/Security Critical):**
1. **Hardware Security Keys** — YubiKey/FIDO2 support for 2FA
2. **Session Geolocation Prüfung** — Warn if login from unusual location
3. **Password History** — Prevent reuse of recent passwords
4. **Account Recovery Flow** — Multi-factor account recovery process

**Tier 2 (Privacy/Enterprise):**
5. **Biometric Fallback** — Use password if biometric unavailable
6. **Account Linking Permissions** — Control which data syncs across linked accounts
7. **SCIM Provisioning** — Enterprise auto-sync for team SSO
8. **Privacy Controls Tour** — Guided onboarding for privacy settings
9. **Deactivation vs Deletion** — Distinguish temporary vs. permanent account removal
10. **Data Export Scheduling** — Regular auto-exports (GDPR)

### Recommended Selection for Phase 3

**Features 56-60 (Selected):**

#### 1. **Hardware Security Keys — YubiKey/FIDO2 Support**
*Feature 56*

**Description:**  
Add FIDO2 security key support (YubiKey, Google Titan, etc.) as 2FA method. Users register key once and tap for login (USB/NFC). Replaces password for maximum security.

**Effort:** Medium (5-6 days)  
**Dependencies:**
- WebAuthn API (browser native, modern browsers support)
- Existing 2FA infrastructure
- User auth schema extension

**Implementation Order:**
1. Extend user schema: add `security_keys` field (public_key, credential_id, etc.)
2. Build registration flow: detect key capability, guide user
3. Implement authentication: challenge-response via WebAuthn
4. Add key management UI: view/revoke keys
5. Test with physical keys (YubiKey 5, Titan)

**Technical Considerations:**
- Backup keys: user should register 2+ keys
- Browser support: fallback to passkey support for non-U2F browsers
- Hardware quirks: different key manufacturers may have edge cases

**Success Criteria:**
- Registration works with YubiKey 5, Google Titan, Titan Security Key
- Login with key works in Chrome, Firefox, Safari, Edge
- Revocation prevents compromised key access

---

#### 2. **Session Geolocation Prüfung — Warn on Unusual Location**
*Feature 57*

**Description:**  
Track user's login location (IP geolocation) and alert if login detected from new country/city. Show map of login locations, allow "trust this device" to suppress warnings.

**Effort:** Small-Medium (3-4 days)  
**Dependencies:**
- IP geolocation service (e.g., MaxMind GeoIP2)
- Notification system (email + in-app)
- Device fingerprinting (already partially deployed)

**Implementation Order:**
1. Add IP geolocation on login (call GeoIP API or local DB)
2. Track known locations per user (with confidence window)
3. Build comparison logic: is new location >100km from last known?
4. Trigger alert email + in-app notification for unusual logins
5. Add device trust UI: "Remember this device for 30 days"
6. Show location history dashboard in security center

**Technical Considerations:**
- Privacy: only store coarse geolocation (city-level)
- VPN/Proxy handling: use reverse DNS + heuristics to flag suspicious
- False positives: grace period for travelers (first 5 days of new location)

**Success Criteria:**
- Alert triggered for logins 1000+ km from baseline
- False positive rate < 5% for legitimate travelers
- Device trust works reliably (no extra 2FA for trusted device within 30d)

---

#### 3. **Password History — Prevent Reuse of Recent Passwords**
*Feature 58*

**Description:**  
Maintain history of last 5-12 password hashes and prevent user from reusing. Configurable policy (e.g., "cannot reuse password from last 12 months").

**Effort:** Small (2-3 days)  
**Dependencies:**
- Existing password system (hash-based, likely bcrypt)
- User auth schema

**Implementation Order:**
1. Add `password_history` field (array of hashes + date)
2. On password change: check new password against history
3. Reject with message "Cannot reuse password from last N months"
4. Keep last 5-12 in history (configurable per org)
5. Add policy enforcer (admin can set "must change every 90 days", etc.)

**Technical Considerations:**
- Never log plaintext passwords
- Use same hash function (bcrypt) for history checks
- Admin policy matrix: complexity + expiry + history

**Success Criteria:**
- User cannot set password that was used in last year
- Policy enforced without security regression
- Compliance with NIST guidelines

---

#### 4. **Account Recovery Flow — Multi-Factor Account Recovery**
*Feature 59*

**Description:**  
Sophisticated account recovery for users who lost access to 2FA device or primary email. Requires answering security questions + ownership verification + waiting period (24h) before access granted.

**Effort:** Medium-Large (6-7 days)  
**Dependencies:**
- Authentication system
- Email/SMS delivery
- Support ticket system (optional integration)

**Implementation Order:**
1. Build security questions capture: set 3-5 during onboarding
2. Create recovery request flow: email, answers, verification method
3. Implement verification options: email link, SMS code, backup codes
4. Add waiting period: 24h before account unlock (to prevent account takeover)
5. Build support escalation: if recovery fails, route to support team
6. Add recovery attempt logging (for security audit)

**Technical Considerations:**
- Security questions must be hard to guess/research (avoid "favorite pet" style)
- Waiting period: inform user via email during cooldown
- Rate limiting: max 3 recovery attempts per day per account
- Verify request came from known IP/device if possible

**Success Criteria:**
- Recovery succeeds 95%+ for legitimate users with correct info
- Zero successful recovery with incorrect security answers
- Cooldown period enforced (no bypass to waiting period)

---

#### 5. **Biometric Fallback — Password Backup for Biometric Auth**
*Feature 60*

**Description:**  
For users with biometric auth (fingerprint, face), allow fallback to password if biometric fails or device changes. Securely prompt for password only on failed biometric attempt.

**Effort:** Small-Medium (4 days)  
**Dependencies:**
- Existing passkey/WebAuthn system
- Biometric API (Web Authentication API)
- User credential management

**Implementation Order:**
1. Update auth flow: try biometric first
2. On biometric failure: offer password fallback
3. Add "password is required" flag to user's biometric auth record
4. Implement secure password entry on biometric failure
5. Test across devices/browsers (iOS Face ID, Android fingerprint, Windows Hello)

**Technical Considerations:**
- UX: clear messaging about why fallback is needed
- Security: ensure fallback password is typed fresh, not auto-filled
- Device-specific: handle timeouts and retry limits

**Success Criteria:**
- Biometric works 98%+ of time
- Fallback to password works seamlessly on failure
- No bypass of biometric check

---

### Group C Summary Table

| Feature | Effort | Priority | Owner | Status |
|---------|--------|----------|-------|--------|
| Hardware Security Keys | Medium | High | Backend | Planned |
| Geolocation Prüfung | Sm-Med | Medium | Backend + Data | Planned |
| Password History | Small | Medium | Backend | Planned |
| Account Recovery Flow | Med-Large | High | Backend + Frontend | Planned |
| Biometric Fallback | Sm-Med | Medium | Frontend + Backend | Planned |

**Group C Totals:**  
- **Effort:** 20-24 days  
- **Dependencies:** Third-party geolocation service, WebAuthn support  
- **Rollout Risk:** Medium (identity changes affect all users)  

**Success Criteria for Group:**
1. Hardware key adoption: 20%+ of users register security key
2. Zero false positives on geolocation warnings after tuning
3. All password policies enforced before user creation
4. Recovery success rate 95%+ without false rejects
5. Biometric fallback works on 100% of target devices

---

## Group D: Performance & PWA (Features 61-63)

### Overview
Production-ready offline support, advanced caching strategies, and service worker optimization for maximum performance and reliability.

### Features

#### 1. **Advanced Caching Strategies — Service Worker, Offline, Invalidation**
*Feature 61*

**Description:**  
Implement multi-layer caching: service worker for app shell, HTTP caching headers (Cache-Control), CDN edge caching, and granular cache invalidation (tag-based purges). Support offline mode for key pages.

**Effort:** Medium-Large (6-7 days)  
**Dependencies:**
- Service Worker infrastructure (partial implementation exists)
- Cache API (browser native)
- CDN with purge capability (Cloudflare, Fastly, etc.)
- Cache invalidation tagging system

**Implementation Order:**
1. Design cache hierarchy:
   - Service Worker: app shell + critical routes (offline-first)
   - HTTP headers: long-term for static assets (1 year), short for content (5 min)
   - CDN: edge caching with stale-while-revalidate (SWR)
2. Build service worker cache manager:
   - Precache critical assets on install
   - Cache API for network responses
   - Smart eviction (LRU when quota exceeded)
3. Implement cache invalidation:
   - Tag-based purge API (`/api/purge?tags=articles,users`)
   - Automatic invalidation on content update
4. Add offline detection + fallback UI
5. Test with Chrome DevTools throttling (slow 4G)

**Technical Considerations:**
- Cache quota: browsers limit to 50% disk space (handle gracefully)
- Stale-while-revalidate: serve old + fetch new in background
- Versioning: service worker version increments on deploy
- Cross-origin: CORS headers must allow caching

**Testing Plan:**
- Unit: Cache key generation, eviction logic
- Integration: Offline mode with real app flows
- Performance: Page load times with/without caching
- Network throttling: Test on 4G/3G (Chrome DevTools)

**Success Criteria:**
- Offline pages load within 2s
- Cache hit rate 70%+ for repeat visits
- No stale content served without user consent
- Full-page offline experience for 10+ critical routes

---

#### 2. **Service Worker Optimization — Background Sync, Push, Precaching**
*Feature 62*

**Description:**  
Fine-tune service worker: implement background sync (queue actions offline, replay on reconnect), push notification handling (show toasts), and intelligent precaching (prefetch articles based on user interests).

**Effort:** Medium (5-6 days)  
**Dependencies:**
- Service Worker API
- Background Sync API
- Push API (already partially deployed)
- User interest data

**Implementation Order:**
1. Background Sync:
   - Create sync queue: store failed POST/PUT operations
   - Implement sync event listener: replay on network restore
   - Add UI feedback: "X pending actions" badge
2. Push Handling:
   - Implement `push` event handler: show rich notification
   - Add action handlers (e.g., "Open Article" button in notification)
   - Track notification engagement
3. Intelligent Precaching:
   - Analyze user's top 10 interests (categories/tags)
   - Precache trending articles in those categories
   - Update precache list weekly
4. Add monitoring: log sync failures, push errors

**Technical Considerations:**
- Background sync: periodic vs. event-driven (use event-driven for this phase)
- Push reliability: some browsers/OS may not support (test broadly)
- Precaching: balance storage quota with coverage
- Sync replay: idempotency critical (validate before replay)

**Testing Plan:**
- Unit: Sync queue serialization, push event handling
- Integration: Offline action → reconnect → auto-sync
- E2E: Simulate network loss scenarios
- Cross-browser: Test on Chrome, Firefox, Safari, Edge

**Success Criteria:**
- Queued actions synced 100% on network restore
- Push notifications show within 2s of server send
- Precached articles serve from cache 99%+ of time
- No data loss from offline operations

---

#### 3. **Offline Modes — Local-First Architecture, Sync Queue**
*Feature 63*

**Description:**  
Build true offline-first experience: cache full article content, comments, user data locally. Implement multi-way sync: local → server (on reconnect) and server → local (via sync events).

**Effort:** Medium-Large (6-8 days)  
**Dependencies:**
- IndexedDB for local storage
- Service Worker + Background Sync
- Offline detection
- Sync conflict resolution strategy

**Implementation Order:**
1. Local data layer:
   - Use IndexedDB (50MB+ quota vs. localStorage's 5-10MB)
   - Store: articles (full HTML), comments, user bookmarks, search history
   - Keyed by content ID + version (for conflict detection)
2. Offline detection:
   - Listen to `online`/`offline` events
   - Add smart connectivity check (ping small endpoint)
   - Show persistent banner when offline
3. Sync queue:
   - Queue writes (likes, bookmarks, comments) when offline
   - Replay in order on reconnect
   - Conflict resolution: server wins for user data, merge for comments
4. Add UI affordances:
   - Show offline indicator
   - Gray-out write-only features
   - "Your changes will sync when online" notification
5. Data hygiene:
   - Expire cached articles older than 30 days
   - Warn user if local data exceeds quota

**Technical Considerations:**
- IndexedDB quota varies by browser (50MB-500MB typically)
- Sync conflicts: server-wins for auth data, local-wins for preferences
- Version tracking: use timestamps + logical clocks for ordering
- Test with simulated network failures (disable network in DevTools)

**Testing Plan:**
- Unit: Offline data store, sync queue operations
- Integration: Full offline flow (read offline, write offline, sync on reconnect)
- E2E: Network failure scenarios (sudden loss, slow restore)
- Data integrity: Verify no loss after reconnect

**Success Criteria:**
- 10+ articles fully readable offline
- Write operations queue and sync automatically
- Zero data loss after reconnect
- Offline UX doesn't feel like app broke

---

### Group D Summary Table

| Feature | Effort | Priority | Owner | Status |
|---------|--------|----------|-------|--------|
| Advanced Caching | Med-Large | High | Frontend + DevOps | Planned |
| SW Optimization | Medium | High | Frontend | Planned |
| Offline Modes | Med-Large | High | Frontend + Backend | Planned |

**Group D Totals:**  
- **Effort:** 17-21 days  
- **Dependencies:** Service Worker mature, IndexedDB support required  
- **Rollout Risk:** High (first time shipping real offline support)  
- **Critical Path:** This group enables many Phase 4+ features  

**Success Criteria for Group:**
1. 80%+ app features work offline (reading content only)
2. Background sync succeeds 99%+ of time
3. Offline usage increases 30% on mobile
4. Zero data loss reported in first 2 weeks
5. Offline session spans 24+ hours without reconnect

---

## Group E: Additional High-Impact Features (Features 64-70)

### Overview
Diverse features across media, search, and gamification. Selected based on high user impact and medium effort.

### Features

#### 1. **Video Chapter Auto-Generation (from AI/Transcripts)**
*Feature 64*

**Description:**  
Use video transcripts (generated via Whisper or existing captions) to automatically create chapter markers. Identify scene transitions, topic shifts in transcript, and suggest chapters with timecodes. Users can accept/edit.

**Effort:** Medium (5-6 days)  
**Dependencies:**
- Video transcript system (already deployed)
- NLP library for topic segmentation (use spaCy or simple heuristics)
- Video chapter metadata schema

**Implementation Order:**
1. Build transcript parser: split into sentences, timestamp mapping
2. Implement topic change detection:
   - Use simple cosine similarity between consecutive segments
   - Flag topic shifts (>0.3 similarity drop)
   - Create chapter boundaries at shifts
3. Generate chapter titles from transcript snippets (extract key phrases)
4. Build UI to preview auto-chapters, accept/reject/edit
5. Save chapters to video metadata
6. Add chapter UI to video player (jump to chapter)

**Technical Considerations:**
- Transcript quality varies; noisy transcripts need smoothing
- Chapter length: aim for 2-5 min chapters (configurable)
- User editing: allow drag-reorder chapters

**Success Criteria:**
- Auto-chapters generated for 100% of videos with transcripts
- 80%+ of auto-chapters accepted by editors without edit
- User can manually edit/reorder chapters in <2 minutes

---

#### 2. **Subtitle Editor — In-Browser Subtitle Creation/Editing**
*Feature 65*

**Description:**  
Web-based subtitle editor for VTT/SRT files. Import transcript, sync with video timeline, manually edit, and export. Handles multiple languages, timing adjustments, and styling (bold, color).

**Effort:** Medium (5-6 days)  
**Dependencies:**
- Video player with timeline scrubbing
- VTT/SRT parser library
- Subtitle rendering in video player

**Implementation Order:**
1. Build VTT parser/generator (parse existing, serialize back)
2. Create subtitle editor UI:
   - Timeline synchronized with video
   - Editable text fields for each subtitle
   - Timing adjustment (drag left/right)
3. Add editing features:
   - Bulk timing shift (e.g., "all +500ms")
   - Auto-sync from transcript (rough alignment)
   - Language selection (if multi-language)
4. Preview: live subtitle rendering on video
5. Export: VTT format download

**Technical Considerations:**
- Timing precision: subtitle should show at right moment (±100ms acceptable)
- Character limits: keep subtitles readable (40-60 chars per line)
- Multi-language: one VTT per language, linked in video element

**Success Criteria:**
- Editor creates valid VTT/SRT from scratch
- Timing adjustments audible/visible in preview
- Import/export round-trips without data loss

---

#### 3. **Search History Sync — Cross-Device Synchronization**
*Feature 66*

**Description:**  
Sync user's search history across devices (desktop, mobile, tablet). When logged in, searches are stored server-side. Accessible in search suggestions. User can view/clear history in settings.

**Effort:** Small-Medium (3-4 days)  
**Dependencies:**
- Existing search infrastructure
- User auth + profile system
- API for search history persistence

**Implementation Order:**
1. Add search history schema: `{ query, timestamp, results_count, user_id }`
2. Intercept search form submission: log query if user logged in
3. Build API:
   - `POST /api/users/search-history` (add)
   - `GET /api/users/search-history` (list, paginated)
   - `DELETE /api/users/search-history/:id` (remove one)
   - `DELETE /api/users/search-history` (clear all)
4. Update search suggestions: include top 5-10 recent searches
5. Add history UI in search dropdown + settings (Privacy section)
6. Add clear button: "Clear History"

**Technical Considerations:**
- Privacy: history tied to account, not device
- Limit storage: keep last 100 searches per user (configurable)
- De-duplication: don't log exact same query within 1 minute

**Success Criteria:**
- Search history syncs to server within 1s of search
- Suggestions include recent searches from all devices
- Clear history removes all entries instantly

---

#### 4. **Image Upscaling — Low-Res Screenshot Enhancement**
*Feature 67*

**Description:**  
Upscale low-resolution leak/screenshot images (e.g., 480p to 1440p) using client-side or server-side AI (ESRGAN, RealESRGAN). Improves readability of small details in game screenshots.

**Effort:** Medium-Large (6-7 days)  
**Dependencies:**
- ML model (ESRGAN or RealESRGAN; ~200MB)
- TensorFlow.js or ONNX Runtime for in-browser inference
- Alternative: server-side upscaling service

**Implementation Order:**
1. Option A (Client-side, no cost but slow):
   - Load TensorFlow.js + ESRGAN model (~5 min download first time)
   - Add "Upscale" button on image view
   - Run upscaling (5-30s depending on image size + device)
2. Option B (Server-side, costs compute):
   - Build `/api/images/:id/upscale` endpoint
   - Use Python service (OpenCV + RealESRGAN)
   - Queue long-running upscales, notify when ready
3. UI:
   - Show original + upscaled side-by-side
   - Allow toggling between versions
   - Download upscaled version
4. Caching: save upscaled results for reuse

**Technical Considerations:**
- Model size: ESRGAN ~200MB (lazy-load)
- Speed: 480p→1440p takes 10-30s on average device
- Quality: 4x upscaling is max useful; diminishing returns beyond
- Fallback: show original if upscaling fails or too slow

**Success Criteria:**
- Upscaled images 3-4x resolution of original
- Upscaling completes in <30s on average device
- Download option available for upscaled version
- No quality regression for already-high-res images

---

#### 5. **Map Heatmap — User Interest Click Density**
*Feature 68*

**Description:**  
Track clicks/taps on the interactive GTA map and visualize as heatmap showing where community is most interested. Hotspots appear as color gradients (cool=low, hot=high interest). Supports time filtering (today, week, month).

**Effort:** Small-Medium (4-5 days)  
**Dependencies:**
- Interactive map system (already deployed)
- Analytics event tracking
- Heatmap visualization library (e.g., heatmap.js, leaflet-heatmap)

**Implementation Order:**
1. Tracking: add click event to map markers
   - Log `{ lat, lng, timestamp, user_id (anonymous) }` to analytics
   - Client-side debounce (max once per 5s per user to avoid spam)
2. Backend aggregation:
   - Build heatmap data endpoint: `/api/map/heatmap?range=week`
   - Returns list of `{ lat, lng, intensity }` points
   - Aggregated by 1km grid cells or raw points with radius
3. Frontend visualization:
   - Render heatmap as overlay on map
   - Use color gradient (blue→green→yellow→red)
   - Add time range filter (today/week/month/all)
4. Add legend: explain intensity colors

**Technical Considerations:**
- Privacy: anonymize location data (don't track individual users)
- Performance: heatmap library must handle 1000+ points efficiently
- Grid size: 1km cells good balance between granularity + performance

**Success Criteria:**
- Heatmap updates hourly (data freshness)
- Hotspots match intuition (major cities, landmarks)
- Heatmap renders without lag on map

---

#### 6. **Multi-Modal Search — Text + Image Simultaneously**
*Feature 69*

**Description:**  
Search using both text query and image simultaneously. Upload screenshot + keywords to find similar content. Backend extracts visual features (CLIP embeddings) + text embeddings and combines for ranking.

**Effort:** Medium-Large (6-7 days)  
**Dependencies:**
- Image embedding model (CLIP or similar; requires inference)
- Semantic search (already deployed for text)
- Multi-modal ranking algorithm
- Model hosting (self-hosted or API call)

**Implementation Order:**
1. Build image encoder:
   - Use CLIP or open-source alternative (e.g., sentence-transformers)
   - Convert image to embedding vector (512-dim)
   - Cache embeddings for corpus of images
2. Search pipeline:
   - Accept text query + optional image
   - Generate text embedding (existing)
   - If image provided: generate image embedding
   - Combine embeddings: `combined = alpha * text_emb + (1-alpha) * img_emb`
   - Find top-k nearest neighbors in combined space
3. UI:
   - Add image upload to search
   - Show results ranked by combined similarity
   - Indicate if result matched on image/text/both
4. Index management: batch-encode new images nightly

**Technical Considerations:**
- Model inference: CLIP inference ~1s per image
- Caching: store embeddings in vector DB (Pinecone, Weaviate, etc.)
- Scaling: if many images, may need GPU
- Quality: tuning alpha (weight) is critical

**Success Criteria:**
- Combined search returns visually + textually similar results
- Image search quality subjectively good (internal review)
- Image encoding latency <2s per query

---

#### 7. **Playlist Management — User-Created Video Collections**
*Feature 70*

**Description:**  
Allow users to create custom playlists of videos/trailers. Organize by folder, share playlists with other users, add/remove videos. Playlists appear in user profile and can be sorted/filtered.

**Effort:** Small-Medium (4-5 days)  
**Dependencies:**
- Video content model
- User profile system
- Sharing/permission system (existing)

**Implementation Order:**
1. Schema:
   - `Playlist { id, name, description, user_id, videos[], visibility (private/unlisted/public), created_at }`
2. CRUD endpoints:
   - `POST /api/users/:id/playlists` (create)
   - `GET /api/users/:id/playlists` (list)
   - `GET /api/playlists/:id` (get single)
   - `PUT /api/playlists/:id` (edit name/desc)
   - `POST /api/playlists/:id/videos` (add video)
   - `DELETE /api/playlists/:id/videos/:video_id` (remove)
   - `DELETE /api/playlists/:id` (delete playlist)
3. UI:
   - Profile tab: "My Playlists"
   - Create playlist modal
   - Playlist detail page (list videos)
   - Drag-drop to reorder
   - Share button (copy link)
4. Player integration: "Add to Playlist" button on video

**Technical Considerations:**
- Privacy: respect visibility settings (private/public)
- Ordering: maintain user's preferred order (index field)
- Sharing: public playlists don't expose user data

**Success Criteria:**
- User can create/edit playlists easily
- Drag-drop reordering works smoothly
- Shared playlists accessible to others
- Playlist appears in user profile

---

### Group E Summary Table

| Feature | Effort | Priority | Owner | Status |
|---------|--------|----------|-------|--------|
| Video Chapters | Medium | High | Backend + Frontend | Planned |
| Subtitle Editor | Medium | Medium | Frontend | Planned |
| Search History Sync | Sm-Med | Medium | Backend | Planned |
| Image Upscaling | Med-Large | Medium | Backend + Frontend | Planned |
| Map Heatmap | Sm-Med | Medium | Frontend + Data | Planned |
| Multi-Modal Search | Med-Large | High | Backend + ML | Planned |
| Playlist Management | Sm-Med | High | Backend + Frontend | Planned |

**Group E Totals:**  
- **Effort:** 33-39 days  
- **Dependencies:** ML models for upscaling/multi-modal (can be phased)  
- **Rollout Risk:** Low-Medium (most independent features)  

**Success Criteria for Group:**
1. Video chapters auto-generated for 95%+ of videos
2. Subtitle editor usable for editing 10+ languages
3. Search history synced across 90%+ of user devices
4. Image upscaling delivers 3-4x resolution improvement
5. Map heatmap shows clear geographic clusters
6. Multi-modal search works for 80%+ of image+text queries
7. Playlist adoption reaches 15%+ of users

---

## Overall Phase 3 Summary

### Feature Count & Effort Allocation

| Group | Features | Est. Days | Pct. Effort |
|-------|----------|-----------|------------|
| **A: CMS & Editorial** | 3 | 15-18 | 15% |
| **B: Notifications** | 2 | 11-13 | 11% |
| **C: Accounts & Identity** | 5 | 20-24 | 20% |
| **D: Performance & PWA** | 3 | 17-21 | 18% |
| **E: Additional High-Impact** | 7 | 33-39 | 36% |
| **TOTAL** | **20** | **96-115** | **100%** |

**Calendar Estimate:**
- **1 Engineer:** 16-19 weeks
- **2 Engineers:** 8-10 weeks
- **3 Engineers:** 5-7 weeks (with dependencies managed)

---

### Risk Assessment

#### High Risk (monitor closely):
1. **Performance & PWA (Group D)** — Offline-first architecture is complex; first offline system shipping
   - Mitigation: Alpha test with 5% of users first; monitor data loss incidents
2. **Multi-Modal Search (Group E#6)** — Requires ML model inference; cost/latency tradeoffs
   - Mitigation: Start with server-side inference; batch-process images at night

#### Medium Risk:
1. **Hardware Security Keys (Group C#1)** — Physical hardware compatibility varies
   - Mitigation: Test with 3-4 popular key models before launch
2. **Video Chapters (Group E#1)** — Topic segmentation heuristics may be unreliable on noisy transcripts
   - Mitigation: Allow manual editing; accept auto-chapters as suggestions

#### Low Risk:
1. **CMS & Editorial (Group A)** — Extensions to existing systems; isolated changes
2. **Notifications (Group B)** — Feature-flagged; can toggle off if issues
3. **Search History Sync (Group E#3)** — Straightforward CRUD, low complexity

---

### Dependencies & Critical Path

**Critical Path (blocking other Phase 4 features):**
1. **Performance & PWA (Group D)** must complete before:
   - Offline-first gamification (Phase 4)
   - Offline analytics (Phase 5)
2. **Accounts & Identity (Group C)** must complete before:
   - Enterprise SSO (Phase 4)
   - Privacy compliance tooling (Phase 5)

**Recommended Parallel Execution:**
- **Week 1-2:** Groups A + B (CMS, Notifications) — minimal dependencies
- **Week 2-4:** Group C (Accounts) — depends on auth infrastructure only
- **Week 3-6:** Group D (Performance) — critical path, start early
- **Week 3-7:** Group E (Additional) — mostly parallel; can start any time

---

### Rollout Strategy (Detailed)

#### Alpha Phase (Week 1-2)
**Audience:** Internal team (10 people) + 50 power users (1%)  
**Features:** Deploy entire Phase 3 feature set  
**Success Metrics:**
- No critical bugs (P0 issues)
- Data loss incidents: 0
- User satisfaction: 80%+ would recommend
- Performance regression: <5% Core Web Vitals

**Monitoring:**
- Real-time error tracking (Sentry)
- Database query performance
- Offline sync success rate
- Push notification open rates

**Exit Criteria:**
- 0 critical bugs
- 95%+ test pass rate
- Performance baseline established

#### Beta Phase (Week 3-4)
**Audience:** 50% of active user base  
**Rollout Method:** Feature flag (`phase3_enabled`) toggled per user  
**Success Metrics:**
- 5% weekly active user increase
- Offline usage: 20%+ of sessions
- Notification opt-in rate: 70%+
- Playlist creation: 10%+ of users

**Monitoring:**
- A/B test analytics (feature flag cohort)
- Churn rate: should remain flat or decrease
- Support tickets: categorize by feature
- User feedback surveys (NPS)

**Exit Criteria:**
- No regression in key metrics
- 90%+ of beta users have feature flag enabled
- No critical bugs after 1 week in beta

#### General Availability (Week 5-6)
**Audience:** 100% of users  
**Rollout Method:** Gradual rollout (10% → 50% → 100% over 3 days)  
**Communications:**
- In-app announcement (banner)
- Email to all users
- Blog post highlighting top 3 features
- Social media (Twitter, Discord)

**Post-Launch Monitoring (30 days):**
- Weekly performance metrics
- Support ticket volume + trends
- User adoption by feature
- NPS tracking
- Churn rate baseline

---

### Success Criteria (Phase 3 Complete)

**Quantitative:**
1. **Feature Adoption:** 70%+ average adoption rate across top 10 features
2. **Performance:** No regression in Lighthouse score (maintain 85+)
3. **Reliability:** 99.5%+ uptime, <0.1% data loss
4. **User Satisfaction:** NPS increases by 10+ points vs. Phase 2
5. **Engagement:** Weekly active users increase 15%+ after Phase 3 rollout

**Qualitative:**
1. **Editorial Team:** 100% of editors using cursor positions + scheduling hub
2. **Community:** Positive sentiment on feature announcements (80%+ positive)
3. **Support Load:** No spike in support tickets; users self-service for Phase 3 features
4. **Developer Experience:** New contributors can understand offline architecture

---

### Testing Strategy

#### Unit Tests
- **Target Coverage:** 85%+ of new code
- **Focus:** Algorithms (caching, sync, recommendation)
- **Tools:** Jest, React Testing Library

#### Integration Tests
- **Scenarios:**
  - Offline write → reconnect → sync → verify consistency
  - Multi-user collaborative editing (concurrent cursors)
  - A/B test audience assignment + winner declaration
- **Tools:** Supertest (API), Playwright (E2E)

#### Performance Tests
- **Metrics:** First Paint, Largest Contentful Paint, Cumulative Layout Shift
- **Baselines:**
  - App shell: <1s with service worker cache
  - Image upscaling: <30s for 480p→1440p
  - Search with history: <200ms response
- **Tools:** Lighthouse CI, WebPageTest

#### Load Tests
- **Scenarios:**
  - 10,000 concurrent users with background sync
  - 1,000 playlist updates per second
  - Map heatmap generation for 50k click events
- **Tools:** k6, Artillery

#### Security Tests
- **Checklist:**
  - FIDO2 key validation (prevent replay attacks)
  - Password history: verify bcrypt comparison secure
  - Geolocation: no PII leaks in logs
  - Offline data: encryption at rest (optional)
- **Tools:** OWASP ZAP, manual penetration testing

---

### Deployment & DevOps

#### Infrastructure Changes
1. **Vector DB for Multi-Modal Search:** Pinecone or self-hosted Weaviate (±2GB storage initially)
2. **ML Model Hosting:** ESRGAN model (200MB) — cache on CDN
3. **Cache Layer Enhancement:** Increase Redis memory for service worker cache tags (+500MB)
4. **Geolocation DB:** MaxMind GeoIP2 subscription (update monthly)

#### Database Schema Changes
- Add fields: `search_history`, `password_history`, `security_keys`, `geolocation_logins`
- New tables: `playlists`, `playlist_videos`, `video_chapters`, `notification_campaigns`, `notification_ab_tests`
- Indices: on `user_id`, `timestamp`, `campaign_id`

#### Deployment Checklist
- [ ] Database migrations tested on staging
- [ ] Service Worker version incremented
- [ ] Feature flags for all major groups
- [ ] Monitoring alerts configured
- [ ] Runbook written for rollback scenarios
- [ ] Support team trained on Phase 3 features

---

### Post-Launch (Week 6+)

#### Iteration Plan (Based on feedback)
- **Week 2-3 post-launch:** Bug fixes + QoL improvements
- **Week 4+:** Phase 3+ features based on user feedback
  - If offline adoption low: investigate UX pain points
  - If playlist usage low: promote feature in app
  - If search history sync works great: expand to team settings

#### Feature-Specific Metrics to Track
| Feature | Metric | Target | Warning |
|---------|--------|--------|---------|
| Cursor Positions | Adoption among editors | 90%+ | <70% |
| Scheduling Hub | Articles planned via hub | 80%+ | <60% |
| Smart Push Timing | Open rate lift | +15% | <5% |
| A/B Testing | Campaigns using feature | 100% | <75% |
| Hardware Keys | Users registered | 10%+ | <5% |
| Offline Mode | Offline session time | 30+ min avg | <10 min |
| Video Chapters | Auto-chapters accepted | 80%+ | <60% |

---

## Appendix: Dependency Graph

```
Phase 3 Features Dependency Map:

┌─────────────────┐
│  Accounts (C)   │ (No deps)
│   - Keys        │
│   - Geo         │
│   - Pwd History │
│   - Recovery    │
│   - Biometric   │
└────────┬────────┘
         │
         v
    ┌────────────────────────────────┐
    │  Performance & PWA (D)          │ (Unblocks offline features)
    │  - Caching Strategies           │
    │  - Service Worker Optimization  │
    │  - Offline Modes                │
    └────────────────────────────────┘
         ^
         │
    ┌────┴──────────────────────────┐
    │                               │
    │  CMS & Editorial (A)    Notifications (B)
    │  - Cursor Positions     - Smart Timing
    │  - Scheduling Hub       - Segmented Campaigns
    │  - SEO Analysis         (No deps)
    │  (No deps)
    │
    │
    └──────────────────────────────────┐
                                        │
                 ┌──────────────────────┴──────┐
                 │                             │
          Additional Features (E)         (Mostly parallel)
          - Video Chapters               │ Multi-Modal Search
          - Subtitle Editor              │ needs embedding model
          - Search History Sync          │
          - Image Upscaling              │
          - Map Heatmap                  │
          - Playlist Management          │
                                        │
                                       v
                            (Can start week 3+)
```

---

## Appendix: Technology Stack

**New Dependencies (Phase 3):**
- `@webauthn/json` — WebAuthn serialization (already in node_modules if installed)
- `compromise` or `wink-nlp` — NLP for chapter generation (lightweight)
- `leaflet-heatmap` — Map heatmap visualization
- `clip-onnx` or `sentence-transformers` — Multi-modal embeddings (optional: can use API)
- `vtt.js` — VTT subtitle parsing

**Third-Party Services:**
- MaxMind GeoIP2 (for geolocation)
- Pinecone or Weaviate (for vector DB, if using self-hosted model)
- Stripe webhooks (already in use, no change needed)

---

## Appendix: File Structure Changes

**New API Routes:**
```
GET    /api/editorial/schedule           (scheduling hub data)
POST   /api/editorial/schedule/:id       (reschedule article)
GET    /api/seo-analysis                 (SEO scoring)
POST   /api/notifications/ab-test        (create A/B campaign)
GET    /api/notifications/ab-test/:id    (get results)
GET    /api/users/:id/search-history     (fetch search history)
POST   /api/users/:id/search-history     (log search)
POST   /api/security/hardware-keys       (register FIDO2 key)
GET    /api/security/sessions            (geolocation tracking)
GET    /api/map/heatmap                  (map click heatmap)
POST   /api/videos/:id/chapters/auto     (auto-generate chapters)
GET    /api/videos/:id/chapters          (get chapters)
POST   /api/images/:id/upscale           (upscale image)
GET    /api/search/multi-modal           (search with image)
POST   /api/users/:id/playlists          (create playlist)
GET    /api/users/:id/playlists          (list playlists)
```

**New React Components:**
```
src/components/
  ├── EditorCursors.tsx          (show remote cursors)
  ├── SchedulingHub.tsx          (editorial calendar)
  ├── SEOAnalysisPanel.tsx       (SEO sidebar)
  ├── CampaignBuilder.tsx        (A/B test UI)
  ├── SecurityKeyManager.tsx     (FIDO2 management)
  ├── OfflineIndicator.tsx       (offline badge)
  ├── MapHeatmap.tsx             (heatmap layer)
  ├── VideoChapterEditor.tsx     (chapter manager)
  ├── SubtitleEditor.tsx         (VTT editor)
  ├── MultiModalSearch.tsx       (image search)
  └── PlaylistManager.tsx        (playlist UI)
```

---

## Questions for Stakeholders

Before executing Phase 3, confirm:

1. **Accounts & Identity (Group C):** Which 5 features are highest priority? (Recommend all 5, but can deprioritize geolocation/password history if time-constrained)

2. **Performance & PWA (Group D):** How important is offline support? If critical, allocate more time/resources (currently Medium-Large effort).

3. **Group E Features:** Any additional features from the wider backlog that should be included instead of these 7? (e.g., community voting features, advanced analytics)

4. **Timeline:** Can Phase 3 run in parallel with Phase 2 tail-work, or must Phase 2 be 100% done first?

5. **Team Size:** What's the committed team size for Phase 3? (affects effort estimates + realistic timeline)

---

**Next Steps:**
1. Stakeholder review + prioritization confirmation
2. Kick-off meeting with engineering team
3. Spike on highest-risk features (offline sync, multi-modal search)
4. Finalize schema + API contracts
5. Begin implementation in order of critical path

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-28  
**Maintained By:** Engineering Team  
**Review Cycle:** Bi-weekly (update as implementation progresses)
