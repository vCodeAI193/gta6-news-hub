# Moderation & Security Features

## Overview

This document describes the 5 comprehensive moderation and security features implemented for the GTA 6 News Hub platform:

1. **Escalation Bot** - Automated severity scoring and escalation
2. **Moderation Workflows** - Three-tier review system
3. **Suspicious Activity Dashboard** - Real-time anomaly detection
4. **Image Hash Database** - Blocklist for known illegal content
5. **Video Content Moderation** - Frame-by-frame analysis

---

## 1. Escalation Bot

### Overview
Automatically analyzes content for policy violations and assigns severity scores to route escalations efficiently.

### Features

#### Severity Scoring (1-10 scale)
- Analyzes text for banned keywords, links, patterns
- Metadata factors: report count, account age, rapid posting
- Returns normalized score (0-10) with detailed factors

#### Content Classification
- **Spam**: viagra, casino, "free money", excessive URLs
- **Harassment**: violent language, personal attacks
- **Misinformation**: conspiracy keywords
- **NSFW**: adult content indicators
- **Hate Speech**: discriminatory language
- **Violence**: violent content
- **Copyright/Advertising**: IP violations

#### Automatic Routing
- **Critical (9-10)**: Immediate human review
- **High (7-8)**: Urgent queue
- **Medium (4-6)**: Standard queue
- **Low (1-3)**: Auto-approved or monitored

### API Endpoints

```bash
# Create escalation
POST /api/admin/escalations
Body: { targetType, targetId, content, metadata }

# Get pending escalations
GET /api/admin/escalations/pending?priority=high&limit=20

# Assign to moderator
POST /api/admin/escalations/:id/assign
Body: { moderatorId, notes }

# Resolve escalation
POST /api/admin/escalations/:id/resolve
Body: { action, reason }

# Get statistics
GET /api/admin/escalations/stats
```

### Database Schema

```sql
CREATE TABLE escalations (
  id TEXT PRIMARY KEY,
  target_type TEXT,           -- 'comment', 'article', 'user'
  target_id TEXT,
  severity_score REAL,        -- 1-10
  category TEXT,              -- spam, harassment, etc.
  status TEXT,                -- pending, assigned, resolved
  priority TEXT,              -- critical, high, medium, low
  assigned_to TEXT,           -- moderator ID
  scoring_factors TEXT,       -- JSON array of factors
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE escalation_timeline (
  id TEXT PRIMARY KEY,
  escalation_id TEXT,
  event_type TEXT,            -- assigned, resolved, appealed
  details TEXT,               -- JSON
  created_at TEXT
);
```

### Usage Example

```javascript
import { scoreContent, createEscalation } from './escalationBot.mjs'

// Score content
const scoring = scoreContent('BUY VIAGRA NOW!!! Click here: http://spam1.com http://spam2.com', {
  reportCount: 5,
  fromNewUser: true,
  rapidFire: true
})
// Returns: { severity: 8.5, category: 'spam', factors: [...], threshold: 'high' }

// Create escalation
const escalation = createEscalation(db, 'comment', 'comment-123', content, metadata)
// Auto-routes to human review
```

---

## 2. Moderation Workflows

### Overview
Three-tier moderation system: auto-filter → human review → appeals process with full audit trail.

### Workflow Tiers

#### Tier 1: Auto Moderation
- Content passes or fails automated checks
- Decision recorded with confidence scores
- Fast (target: 5 minutes)

#### Tier 2: Human Review
- Moderator assigned to review
- SLA: 24 hours for standard, 4 hours for high priority
- Can approve, reject, or escalate to appeal

#### Tier 3: Appeals
- User can appeal human decisions
- Second reviewer evaluates
- SLA: 48 hours
- Final decision is recorded

### Status Tracking

Each workflow entry tracks:
- Current tier (auto/human/appeal)
- Status (pending/approved/rejected/appealed/resolved)
- Auto decision with confidence
- Human decision with moderator ID
- Appeal details and outcome
- Timeline of all events
- SLA compliance

### API Endpoints

```bash
# Get pending human reviews
GET /api/admin/reviews/pending?moderatorId=mod-123&priority=high

# Get pending appeals
GET /api/admin/appeals/pending

# Resolve appeal
POST /api/admin/appeals/:id/resolve
Body: { decision, reason }

# Get workflow statistics
GET /api/admin/workflows/stats

# Get SLA violations
GET /api/admin/workflows/sla-violations

# Get moderator metrics
GET /api/admin/moderators/:id/metrics
```

### Database Schema

```sql
CREATE TABLE moderation_workflow (
  id TEXT PRIMARY KEY,
  target_type TEXT,
  target_id TEXT,
  current_tier TEXT,         -- auto, human, appeal
  status TEXT,               -- pending, approved, rejected, appealed, resolved
  auto_result TEXT,          -- JSON: { decision, reason, confidence, timestamp }
  human_result TEXT,         -- JSON: { decision, reason, moderatorId, timestamp }
  appeal_result TEXT,        -- JSON: { decision, reason, reviewerId, timestamp }
  assigned_moderator TEXT,
  sla_deadline TEXT,
  priority TEXT,             -- normal, high, critical
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE moderation_appeals (
  id TEXT PRIMARY KEY,
  workflow_id TEXT,
  user_id TEXT,
  reason TEXT,
  status TEXT,               -- pending, upheld, overturned
  reviewer_id TEXT,
  resolved_at TEXT,
  created_at TEXT
);

CREATE TABLE moderation_timeline (
  id TEXT PRIMARY KEY,
  workflow_id TEXT,
  event_type TEXT,           -- created, assigned, reviewed, appealed, resolved
  details TEXT,              -- JSON
  created_at TEXT
);
```

### Usage Example

```javascript
import {
  createWorkflowEntry,
  recordAutoDecision,
  recordHumanDecision,
  createAppeal,
  resolveAppeal
} from './moderationWorkflow.mjs'

// Create workflow
const workflow = createWorkflowEntry(db, 'comment', 'comment-123')

// Record auto decision
recordAutoDecision(db, workflow.id, 'rejected', 'Spam content', 0.95)

// Assign to human moderator
assignToModerator(db, workflow.id, 'mod-456')

// Record human decision
recordHumanDecision(db, workflow.id, 'approved', 'False positive', 'mod-456')

// Or if appealed:
createAppeal(db, workflow.id, 'user-123', 'I disagree with this decision')
resolveAppeal(db, appealId, 'overturned', 'Evidence supports user', 'admin-1')
```

---

## 3. Suspicious Activity Dashboard

### Overview
Real-time detection and tracking of suspicious user behavior, anomalies, and repeat offenders.

### Key Features

#### Anomaly Detection
- Rapid posting (10+ comments in 5 minutes)
- Bulk reporting (5+ reports in 1 hour)
- Content violations from new accounts
- Network patterns (same IP, device)

#### Risk Scoring
- Violation count (0-30 points)
- Report frequency (0-25 points)
- Account age (0-20 points)
- Recent activity level (0-15 points)
- Banned status (automatic critical)

#### Risk Levels
- **Critical (80-100)**: Immediate action
- **High (50-79)**: Close monitoring
- **Medium (20-49)**: Standard monitoring
- **Low (0-19)**: No action needed

#### Trend Analysis
- 7-day violation counts
- Category breakdown
- Severity distribution
- Peak hours analysis

### Admin UI Components

#### ModerationDashboard
Main overview showing:
- Today's/24h escalations
- Pending reviews
- Critical incidents
- Category distribution
- Repeat offender count

#### SuspiciousActivityPanel
Three tabs:
1. **Repeat Offenders** - Users with 3+ violations in 30 days
2. **Anomalies** - Detected suspicious behavior patterns
3. **Trends** - 7-day trend analysis with visualization

### API Endpoints

```bash
# Get dashboard summary
GET /api/admin/moderation/dashboard

# Get repeat offenders
GET /api/admin/suspicious-activity/repeat-offenders?limit=50

# Get detected anomalies
GET /api/admin/suspicious-activity/anomalies

# Get trend analysis
GET /api/admin/suspicious-activity/trends?timeRange=7 days

# Get user risk profile
GET /api/admin/suspicious-activity/user/:userId/risk

# Get network analysis (IP/device clustering)
GET /api/admin/suspicious-activity/network

# Mark anomaly as investigated
POST /api/admin/anomalies/:id/investigate
Body: { findings }
```

### Database Schema

```sql
CREATE TABLE user_activities (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  activity_type TEXT,        -- comment, post, report, login, etc.
  ip_address TEXT,
  user_agent TEXT,
  details TEXT,              -- JSON
  created_at TEXT
);

CREATE TABLE anomalies (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  anomaly_type TEXT,         -- rapid_posting, bulk_reporting, etc.
  severity TEXT,             -- low, medium, high
  risk_level TEXT,           -- low, medium, high, critical
  details TEXT,              -- JSON
  status TEXT,               -- detected, investigated
  findings TEXT,
  investigator_id TEXT,
  created_at TEXT
);
```

---

## 4. Image Hash Database

### Overview
Perceptual hashing-based blocklist system for detecting and preventing known illegal content.

### How It Works

1. **Hash Calculation**
   - Simhash: Detects similar images
   - DHash: Difference-based hashing
   - Normalized for comparison

2. **Matching**
   - Hamming distance < 5 = likely match
   - Configurable threshold
   - Multiple hash comparison

3. **Blocking**
   - Automatic detection of similar images
   - Severity levels (critical, high, medium)
   - Audit trail of additions/removals

### Features

#### Blocklist Management
- Add images with reason and severity
- Remove from blocklist
- Update metadata
- Search and filter
- Import/export capabilities
- Cache management

#### Statistics
- Total hashes by reason
- Distribution by severity
- Most reported entries
- Recent additions

### Admin UI Component

#### ImageHashBlocklist
- View blocklist with filtering
- Add new hashes
- Remove entries
- Statistics and trends
- Search functionality

### API Endpoints

```bash
# Check if image matches blocklist
POST /api/admin/image-hash/check
Body: { imageBuffer: base64, threshold: 5 }

# Get blocklist
GET /api/admin/image-hash/blocklist?reason=illegal&severity=critical&limit=50

# Get blocklist statistics
GET /api/admin/image-hash/stats

# Add hash to blocklist
POST /api/admin/image-hash/add
Body: { imageBuffer, reason, severity }

# Remove hash
DELETE /api/admin/image-hash/:hashId

# Find similar images
POST /api/admin/image-hash/find-similar
Body: { imageBuffer, maxResults: 10 }
```

### Database Schema

```sql
CREATE TABLE image_hash_blocklist (
  id TEXT PRIMARY KEY,
  simhash TEXT NOT NULL,
  dhash TEXT NOT NULL,
  reason TEXT,               -- illegal_content, csam, etc.
  severity TEXT,             -- critical, high, medium
  metadata TEXT,             -- JSON
  added_by TEXT,
  reported_count INTEGER,
  active INTEGER DEFAULT 1,  -- Soft delete
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE image_hash_cache (
  id TEXT PRIMARY KEY,
  image_hash TEXT,
  result TEXT,               -- JSON of check result
  hit INTEGER,               -- Boolean
  created_at TEXT
);
```

---

## 5. Video Content Moderation

### Overview
Automated frame-by-frame analysis of video content for NSFW, policy violations, and quality issues.

### Analysis Pipeline

1. **Frame Extraction**
   - Extract every Nth frame (configurable)
   - Parallel processing for speed
   - Memory-efficient buffering

2. **Frame Analysis**
   - NSFW detection (0-1 confidence)
   - Violence detection
   - Hate speech indicators
   - Watermark presence
   - Audio quality issues

3. **Violation Tracking**
   - Record violations with timestamps
   - Frame numbers mapped to video timeline
   - Confidence scores for each detection

4. **Review Queue**
   - Automatic flagging of violations
   - Severity calculation
   - Priority assignment
   - Human review workflow

### Features

#### Video Analysis
- Batch processing capability
- Progress tracking
- Timeline visualization
- Export reports (JSON/CSV)

#### Violation Detection
- **NSFW**: Adult content
- **Violence**: Fighting, weapons, gore
- **Hate Speech**: Discriminatory content
- **Copyright**: Watermark missing
- **Audio**: Quality/loudness issues

#### Admin UI Component

#### VideoModerationPanel
- Analysis queue with filters
- Severity color-coding
- Timeline visualization
- Quick approve/reject actions
- Detailed analysis reports

### API Endpoints

```bash
# Get video review queue
GET /api/admin/video-moderation/queue?status=flagged&limit=20

# Get analysis detail
GET /api/admin/video-moderation/:analysisId

# Flag for manual review
POST /api/admin/video-moderation/:analysisId/flag
Body: { reason }

# Delete analysis
DELETE /api/admin/video-moderation/:analysisId

# Get statistics
GET /api/admin/video-moderation/stats
```

### Database Schema

```sql
CREATE TABLE video_analysis (
  id TEXT PRIMARY KEY,
  video_id TEXT,
  status TEXT,               -- pending, approved, flagged
  severity TEXT,             -- none, low, medium, high, critical
  frames_analyzed INTEGER,
  violations_found INTEGER,
  flagged_for_review INTEGER,
  review_reason TEXT,
  metadata TEXT,             -- JSON: duration, resolution, etc.
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT
);

CREATE TABLE video_frames (
  id TEXT PRIMARY KEY,
  analysis_id TEXT,
  frame_number INTEGER,
  nsfw_score REAL,           -- 0-1 confidence
  violation_scores TEXT,     -- JSON of detection scores
  violations_detected INTEGER,
  processed_at TEXT
);

CREATE TABLE video_violations (
  id TEXT PRIMARY KEY,
  analysis_id TEXT,
  frame_id TEXT,
  frame_number INTEGER,
  violation_type TEXT,       -- nsfw, violence, etc.
  confidence REAL,           -- 0-1
  metadata TEXT,             -- JSON with details
  created_at TEXT
);
```

---

## Integration Guide

### 1. Add to App.mjs

```javascript
import { executeModerationMigrations } from './migrations-moderation.mjs'
import { mountModerationRoutes } from './moderation-api.mjs'

// In createApp function:
export function createApp({ dbPath = ':memory:', hub = null } = {}) {
  const db = createDb(dbPath)
  const app = express()

  // Execute migrations
  executeModerationMigrations(db)

  // ... other setup ...

  // Mount moderation routes
  mountModerationRoutes(app, db)

  return { app, db }
}
```

### 2. Add Admin Routes

In your main routes, add moderation admin page:

```tsx
import { ModerationDashboard } from './components/ModerationDashboard'
import { EscalationQueue } from './components/EscalationQueue'
import { SuspiciousActivityPanel } from './components/SuspiciousActivityPanel'
import { ImageHashBlocklist } from './components/ImageHashBlocklist'
import { VideoModerationPanel } from './components/VideoModerationPanel'

// Create admin panel that includes these components:
export function AdminModerationPanel() {
  const [section, setSection] = useState('dashboard')

  return (
    <div>
      {/* Navigation */}
      {/* Content */}
      {section === 'dashboard' && <ModerationDashboard />}
      {section === 'escalations' && <EscalationQueue />}
      {section === 'anomalies' && <SuspiciousActivityPanel />}
      {section === 'images' && <ImageHashBlocklist />}
      {section === 'videos' && <VideoModerationPanel />}
    </div>
  )
}
```

### 3. Hook into Comment Creation

When a comment is created:

```javascript
import { classifyComment } from './moderation.mjs'
import { scoreContent, createEscalation } from './escalationBot.mjs'
import { createWorkflowEntry, recordAutoDecision } from './moderationWorkflow.mjs'

// In comment creation endpoint:
const classification = classifyComment(commentText)

// Create workflow
const workflow = createWorkflowEntry(db, 'comment', commentId)

// Record auto decision
if (classification.status === 'rejected') {
  recordAutoDecision(db, workflow.id, 'rejected', classification.reason, 0.95)
  // Comment stays invisible
} else if (classification.status === 'pending') {
  // Create escalation for human review
  const escalation = createEscalation(db, 'comment', commentId, commentText, {
    reportCount: 0,
    fromNewUser: isNewUser,
  })
  recordAutoDecision(db, workflow.id, 'pending', 'Requires human review', 0.7)
} else {
  recordAutoDecision(db, workflow.id, 'approved', 'Passes auto checks', 0.99)
}
```

---

## Testing

Run all tests:

```bash
npm run test server/moderation-services.test.mjs
```

Test coverage includes:
- Escalation bot severity scoring
- Content classification
- Workflow state transitions
- Anomaly detection
- Image hash calculations
- Video analysis pipeline
- API integration

---

## Performance Considerations

### Escalation Bot
- Processing time: ~10-50ms per content item
- Caches compiled regex patterns
- Batch processing for bulk operations

### Workflows
- Query indexes on: status, tier, target type
- SLA checking runs periodically (~5 min intervals)
- Archive old resolved workflows (>90 days)

### Anomaly Detection
- Real-time tracking of recent activities
- Daily aggregation of statistics
- Retention: 30 days rolling window

### Image Hashing
- Hash comparison: O(1) lookup
- Cache for recent checks
- Batch import/export for data sharing

### Video Moderation
- Parallel frame processing
- Memory-efficient buffer management
- Progressive reporting as frames are analyzed

---

## Security Considerations

1. **Admin Routes**: All moderation endpoints require admin auth
2. **Audit Trail**: All actions logged with timestamp and actor ID
3. **Data Retention**: Videos/images not stored, hashes only
4. **Rate Limiting**: Applied to escalation creation
5. **Validation**: All inputs sanitized and validated

---

## Monitoring & Alerting

Key metrics to monitor:
- Escalation count by category
- SLA violation rate
- False positive rate (appeals overturned)
- Anomaly detection accuracy
- Video analysis completion rate
- System latency by operation

Recommended alerts:
- SLA violations > 5%
- Critical escalations pending > 1 hour
- Repeat offender count increasing
- Unusual spike in anomalies

---

## Future Enhancements

1. **ML Integration**: Replace simulated scoring with real ML models
2. **Custom Rules**: Allow admins to define custom violation rules
3. **Bulk Operations**: Batch processing for exports/imports
4. **Analytics**: Advanced reporting and dashboards
5. **Integration**: Connect with external moderation services
6. **Appeals Process**: More granular appeal reasons and metrics
7. **Automation**: Automatic actions based on risk score thresholds
