/**
 * Database migrations for moderation features
 */

export const MODERATION_MIGRATIONS = [
  // Escalation Bot tables
  `CREATE TABLE IF NOT EXISTS escalations (
    id TEXT PRIMARY KEY,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    severity_score REAL NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    priority TEXT NOT NULL,
    assigned_to TEXT,
    assigned_at TEXT,
    moderator_notes TEXT,
    scoring_factors TEXT,
    resolution_action TEXT,
    resolution_reason TEXT,
    resolved_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(status)`,
  `CREATE INDEX IF NOT EXISTS idx_escalations_priority ON escalations(priority)`,
  `CREATE INDEX IF NOT EXISTS idx_escalations_target ON escalations(target_type, target_id)`,

  // Escalation Timeline
  `CREATE TABLE IF NOT EXISTS escalation_timeline (
    id TEXT PRIMARY KEY,
    escalation_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    details TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (escalation_id) REFERENCES escalations(id) ON DELETE CASCADE
  )`,

  `CREATE INDEX IF NOT EXISTS idx_escalation_timeline ON escalation_timeline(escalation_id)`,

  // Moderation Workflow tables
  `CREATE TABLE IF NOT EXISTS moderation_workflow (
    id TEXT PRIMARY KEY,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    current_tier TEXT NOT NULL,
    status TEXT NOT NULL,
    auto_result TEXT,
    human_result TEXT,
    appeal_result TEXT,
    assigned_moderator TEXT,
    assigned_at TEXT,
    sla_deadline TEXT,
    priority TEXT DEFAULT 'normal',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS idx_workflow_status ON moderation_workflow(status)`,
  `CREATE INDEX IF NOT EXISTS idx_workflow_tier ON moderation_workflow(current_tier)`,
  `CREATE INDEX IF NOT EXISTS idx_workflow_target ON moderation_workflow(target_type, target_id)`,

  // Moderation Appeals
  `CREATE TABLE IF NOT EXISTS moderation_appeals (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    reason TEXT,
    status TEXT NOT NULL,
    sla_deadline TEXT,
    reviewer_id TEXT,
    resolution_reason TEXT,
    resolved_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (workflow_id) REFERENCES moderation_workflow(id) ON DELETE CASCADE
  )`,

  `CREATE INDEX IF NOT EXISTS idx_appeals_workflow ON moderation_appeals(workflow_id)`,
  `CREATE INDEX IF NOT EXISTS idx_appeals_status ON moderation_appeals(status)`,

  // Moderation Timeline
  `CREATE TABLE IF NOT EXISTS moderation_timeline (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    details TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (workflow_id) REFERENCES moderation_workflow(id) ON DELETE CASCADE
  )`,

  `CREATE INDEX IF NOT EXISTS idx_moderation_timeline ON moderation_timeline(workflow_id)`,

  // Suspicious Activity Tracking
  `CREATE TABLE IF NOT EXISTS user_activities (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    details TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,

  `CREATE INDEX IF NOT EXISTS idx_user_activities_user ON user_activities(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type)`,
  `CREATE INDEX IF NOT EXISTS idx_user_activities_ip ON user_activities(ip_address)`,

  // Anomaly Detection
  `CREATE TABLE IF NOT EXISTS anomalies (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    anomaly_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    risk_level TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'detected',
    investigated_at TEXT,
    investigator_id TEXT,
    findings TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,

  `CREATE INDEX IF NOT EXISTS idx_anomalies_user ON anomalies(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_anomalies_status ON anomalies(status)`,
  `CREATE INDEX IF NOT EXISTS idx_anomalies_risk ON anomalies(risk_level)`,

  // Image Hash Blocklist
  `CREATE TABLE IF NOT EXISTS image_hash_blocklist (
    id TEXT PRIMARY KEY,
    simhash TEXT NOT NULL,
    dhash TEXT NOT NULL,
    reason TEXT,
    severity TEXT,
    metadata TEXT,
    added_by TEXT,
    reported_count INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT
  )`,

  `CREATE INDEX IF NOT EXISTS idx_image_hash_simhash ON image_hash_blocklist(simhash)`,
  `CREATE INDEX IF NOT EXISTS idx_image_hash_dhash ON image_hash_blocklist(dhash)`,
  `CREATE INDEX IF NOT EXISTS idx_image_hash_active ON image_hash_blocklist(active)`,

  // Image Hash Cache
  `CREATE TABLE IF NOT EXISTS image_hash_cache (
    id TEXT PRIMARY KEY,
    image_hash TEXT NOT NULL,
    result TEXT NOT NULL,
    hit INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS idx_image_hash_cache ON image_hash_cache(image_hash)`,

  // Video Analysis
  `CREATE TABLE IF NOT EXISTS video_analysis (
    id TEXT PRIMARY KEY,
    video_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    severity TEXT,
    frames_analyzed INTEGER DEFAULT 0,
    violations_found INTEGER DEFAULT 0,
    flagged_for_review INTEGER DEFAULT 0,
    review_reason TEXT,
    metadata TEXT,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT
  )`,

  `CREATE INDEX IF NOT EXISTS idx_video_analysis_status ON video_analysis(status)`,
  `CREATE INDEX IF NOT EXISTS idx_video_analysis_severity ON video_analysis(severity)`,

  // Video Frames
  `CREATE TABLE IF NOT EXISTS video_frames (
    id TEXT PRIMARY KEY,
    analysis_id TEXT NOT NULL,
    frame_number INTEGER NOT NULL,
    nsfw_score REAL,
    violation_scores TEXT,
    violations_detected INTEGER DEFAULT 0,
    processed_at TEXT NOT NULL,
    FOREIGN KEY (analysis_id) REFERENCES video_analysis(id) ON DELETE CASCADE
  )`,

  `CREATE INDEX IF NOT EXISTS idx_video_frames_analysis ON video_frames(analysis_id)`,
  `CREATE INDEX IF NOT EXISTS idx_video_frames_number ON video_frames(analysis_id, frame_number)`,

  // Video Violations
  `CREATE TABLE IF NOT EXISTS video_violations (
    id TEXT PRIMARY KEY,
    analysis_id TEXT NOT NULL,
    frame_id TEXT,
    frame_number INTEGER NOT NULL,
    violation_type TEXT NOT NULL,
    confidence REAL,
    metadata TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (analysis_id) REFERENCES video_analysis(id) ON DELETE CASCADE
  )`,

  `CREATE INDEX IF NOT EXISTS idx_video_violations_analysis ON video_violations(analysis_id)`,
  `CREATE INDEX IF NOT EXISTS idx_video_violations_type ON video_violations(violation_type)`,
]

/**
 * Execute all migrations
 */
export function executeModerationMigrations(db) {
  for (const migration of MODERATION_MIGRATIONS) {
    db.exec(migration)
  }
}
