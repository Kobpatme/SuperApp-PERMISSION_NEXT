import { boolean, check, index, integer, jsonb, numeric, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), employeeCode: text("employee_code"), email: text("email").notNull(),
  displayName: text("display_name"), positionId: uuid("position_id"), status: text("status").notNull().default("active"), ...timestamps,
}, (t) => [uniqueIndex("profiles_employee_code_idx").on(t.employeeCode), check("profiles_status_check", sql`${t.status} in ('active', 'inactive')`)]);

export const localCredentials = pgTable("local_credentials", {
  userId: uuid("user_id").primaryKey().references(() => profiles.id, { onDelete: "cascade" }),
  passwordHash: text("password_hash").notNull(), failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }), passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }).defaultNow().notNull(),
  mustChangePassword: boolean("must_change_password").notNull().default(false), ...timestamps,
}, (t) => [check("local_credentials_failed_attempts_check", sql`${t.failedAttempts} >= 0`)]);

export const authSessions = pgTable("auth_sessions", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(), ipAddress: text("ip_address"), userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("auth_sessions_token_hash_idx").on(t.tokenHash), index("auth_sessions_user_idx").on(t.userId, t.expiresAt)]);

export const authRateLimits = pgTable("auth_rate_limits", {
  id: uuid("id").defaultRandom().primaryKey(), subjectType: text("subject_type").notNull(), subjectKey: text("subject_key").notNull(),
  windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull(), attempts: integer("attempts").notNull().default(0),
  blockedUntil: timestamp("blocked_until", { withTimezone: true }), updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("auth_rate_limits_subject_idx").on(t.subjectType, t.subjectKey), check("auth_rate_limits_type_check", sql`${t.subjectType} in ('email', 'ip')`), check("auth_rate_limits_attempts_check", sql`${t.attempts} >= 0`)]);

export const positions = pgTable("positions", {
  id: uuid("id").defaultRandom().primaryKey(), code: text("code").notNull(), name: text("name").notNull(),
  roleId: uuid("role_id").notNull(), scopeType: text("scope_type").notNull().default("OWN"), isActive: boolean("is_active").notNull().default(true), ...timestamps,
}, (t) => [uniqueIndex("positions_code_idx").on(t.code), check("positions_scope_check", sql`${t.scopeType} in ('OWN','TEAM','ALL')`)]);

export const teams = pgTable("teams", {
  id: uuid("id").defaultRandom().primaryKey(), code: text("code").notNull(), name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true), ...timestamps,
}, (t) => [uniqueIndex("teams_code_idx").on(t.code)]);

export const userTeams = pgTable("user_teams", {
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").notNull().default(false), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [primaryKey({ columns: [t.userId, t.teamId] })]);

export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(), code: text("code").notNull(), name: text("name").notNull(),
  description: text("description"), isSystem: boolean("is_system").notNull().default(false), ...timestamps,
}, (t) => [uniqueIndex("roles_code_idx").on(t.code)]);

export const permissions = pgTable("permissions", {
  code: text("code").primaryKey(), moduleId: text("module_id").notNull(), resource: text("resource").notNull(),
  action: text("action").notNull(), description: text("description"), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("permissions_parts_idx").on(t.moduleId, t.resource, t.action)]);

export const rolePermissions = pgTable("role_permissions", {
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionCode: text("permission_code").notNull().references(() => permissions.code, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [primaryKey({ columns: [t.roleId, t.permissionCode] })]);

export const userRoleAssignments = pgTable("user_role_assignments", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
  validFrom: timestamp("valid_from", { withTimezone: true }).defaultNow().notNull(), validUntil: timestamp("valid_until", { withTimezone: true }),
  createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("user_role_assignments_user_idx").on(t.userId)]);

export const dataScopeGrants = pgTable("data_scope_grants", {
  id: uuid("id").defaultRandom().primaryKey(), assignmentId: uuid("assignment_id").notNull().references(() => userRoleAssignments.id, { onDelete: "cascade" }),
  permissionCode: text("permission_code").references(() => permissions.code, { onDelete: "cascade" }), scopeType: text("scope_type").notNull(),
  selectedTeamId: uuid("selected_team_id").references(() => teams.id, { onDelete: "cascade" }), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("data_scope_grants_assignment_idx").on(t.assignmentId), check("data_scope_grants_type_check", sql`${t.scopeType} in ('OWN', 'TEAM', 'SELECTED_TEAMS', 'ALL')`), check("data_scope_grants_selected_team_check", sql`(${t.scopeType} = 'SELECTED_TEAMS') = (${t.selectedTeamId} is not null)`)]);

// Temporary read compatibility for the original shell. New grants use normalized RBAC above.
export const userRoles = pgTable("user_roles", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").notNull(), moduleId: text("module_id").notNull(),
  role: text("role").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("user_roles_user_module_idx").on(t.userId, t.moduleId)]);

export const buildings = pgTable("buildings", {
  id: uuid("id").defaultRandom().primaryKey(), code: text("code").notNull(), nameTh: text("name_th").notNull(), nameEn: text("name_en"),
  status: text("status").notNull().default("active"), searchText: text("search_text").notNull(), ownerTeamId: uuid("owner_team_id").references(() => teams.id, { onDelete: "set null" }),
  version: integer("version").notNull().default(1), ...timestamps,
}, (t) => [uniqueIndex("buildings_code_idx").on(t.code), index("buildings_search_idx").on(t.searchText), check("buildings_status_check", sql`${t.status} in ('active', 'inactive', 'merged')`), check("buildings_version_check", sql`${t.version} > 0`)]);

export const buildingAliases = pgTable("building_aliases", {
  id: uuid("id").defaultRandom().primaryKey(), buildingId: uuid("building_id").notNull().references(() => buildings.id, { onDelete: "cascade" }),
  normalizedAlias: text("normalized_alias").notNull(), displayAlias: text("display_alias").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("building_aliases_normalized_idx").on(t.normalizedAlias)]);

export const buildingSourceMappings = pgTable("building_source_mappings", {
  id: uuid("id").defaultRandom().primaryKey(), buildingId: uuid("building_id").notNull().references(() => buildings.id, { onDelete: "restrict" }),
  sourceSystem: text("source_system").notNull(), sourceId: text("source_id").notNull(), rawName: text("raw_name"), verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verifiedBy: uuid("verified_by").references(() => profiles.id, { onDelete: "set null" }), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("building_source_mappings_source_idx").on(t.sourceSystem, t.sourceId)]);

export const buildingContacts = pgTable("building_contacts", {
  id: uuid("id").defaultRandom().primaryKey(), buildingId: uuid("building_id").notNull().references(() => buildings.id, { onDelete: "cascade" }),
  name: text("name").notNull(), contactType: text("contact_type").notNull(), value: text("value").notNull(), isPrimary: boolean("is_primary").notNull().default(false), ...timestamps,
}, (t) => [index("building_contacts_building_idx").on(t.buildingId)]);

export const buildingConditionVersions = pgTable("building_condition_versions", {
  id: uuid("id").defaultRandom().primaryKey(), buildingId: uuid("building_id").notNull().references(() => buildings.id, { onDelete: "restrict" }),
  version: integer("version").notNull(), effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(), effectiveUntil: timestamp("effective_until", { withTimezone: true }),
  conditions: jsonb("conditions").$type<Record<string, unknown>>().notNull(), reason: text("reason").notNull(), createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("building_condition_versions_idx").on(t.buildingId, t.version), check("building_condition_versions_positive_check", sql`${t.version} > 0`)]);

export const buildingConditionFees = pgTable("building_condition_fees", {
  id: uuid("id").defaultRandom().primaryKey(), conditionVersionId: uuid("condition_version_id").notNull().references(() => buildingConditionVersions.id, { onDelete: "cascade" }),
  sourceKey: text("source_key").notNull(), label: text("label").notNull(), category: text("category").notNull(), costType: text("cost_type").notNull(),
  calculationType: text("calculation_type").notNull().default("fixed"), amount: numeric("amount", { precision: 18, scale: 2 }),
  rate: numeric("rate", { precision: 18, scale: 4 }), unit: text("unit").notNull().default("ครั้ง"), revenuePeriod: text("revenue_period"),
  payable: boolean("payable").notNull().default(true), note: text("note"), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("building_condition_fees_source_idx").on(t.conditionVersionId, t.sourceKey),
  index("building_condition_fees_type_idx").on(t.costType, t.category),
  check("building_condition_fees_cost_type_check", sql`${t.costType} in ('CAPEX','OPEX','DEPOSIT','UNCLASSIFIED')`),
  check("building_condition_fees_calculation_check", sql`${t.calculationType} in ('fixed','revenue_share')`),
  check("building_condition_fees_nonnegative_check", sql`(${t.amount} is null or ${t.amount} >= 0) and (${t.rate} is null or ${t.rate} >= 0)`)]);

export const attachments = pgTable("attachments", {
  id: uuid("id").defaultRandom().primaryKey(), moduleId: text("module_id").notNull(), entityType: text("entity_type").notNull(), entityId: uuid("entity_id").notNull(),
  provider: text("provider").notNull(), storageKey: text("storage_key").notNull(), fileName: text("file_name").notNull(), mediaType: text("media_type").notNull(),
  sizeBytes: numeric("size_bytes", { precision: 20, scale: 0 }).notNull(), checksumSha256: text("checksum_sha256").notNull(), status: text("status").notNull().default("active"),
  uploadedBy: uuid("uploaded_by").references(() => profiles.id, { onDelete: "set null" }), ...timestamps,
}, (t) => [uniqueIndex("attachments_provider_key_idx").on(t.provider, t.storageKey), index("attachments_owner_idx").on(t.moduleId, t.entityType, t.entityId), check("attachments_provider_check", sql`${t.provider} in ('nas', 'sharepoint', 'local')`), check("attachments_status_check", sql`${t.status} in ('active', 'quarantined', 'deleted')`), check("attachments_size_check", sql`${t.sizeBytes} >= 0`)]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(), actorId: uuid("actor_id"), moduleId: text("module_id").notNull(), action: text("action").notNull(),
  entityType: text("entity_type").notNull(), entityId: text("entity_id"), requestId: text("request_id").notNull(),
  before: jsonb("before").$type<Record<string, unknown> | null>(), after: jsonb("after").$type<Record<string, unknown> | null>(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("audit_logs_entity_idx").on(t.entityType, t.entityId, t.createdAt)]);

export const pendingAuditLogs = pgTable("pending_audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(), actorId: uuid("actor_id"), moduleId: text("module_id").notNull(), action: text("action").notNull(),
  entityType: text("entity_type").notNull(), entityId: text("entity_id"), requestId: text("request_id").notNull(),
  before: jsonb("before").$type<Record<string, unknown> | null>(), after: jsonb("after").$type<Record<string, unknown> | null>(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}), lastError: text("last_error").notNull(),
  attemptCount: integer("attempt_count").notNull().default(0), availableAt: timestamp("available_at", { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("pending_audit_logs_pending_idx").on(t.resolvedAt, t.availableAt), index("pending_audit_logs_request_idx").on(t.requestId)]);

export const activityEvents = pgTable("activity_events", {
  id: uuid("id").defaultRandom().primaryKey(), eventType: text("event_type").notNull(), eventVersion: integer("event_version").notNull(), actorId: uuid("actor_id"), ownerId: uuid("owner_id"),
  teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }), moduleId: text("module_id").notNull(), entityType: text("entity_type").notNull(), entityId: uuid("entity_id").notNull(),
  buildingId: uuid("building_id").references(() => buildings.id, { onDelete: "set null" }), projectId: uuid("project_id"), correctionOfEventId: uuid("correction_of_event_id"),
  kpiEligible: boolean("kpi_eligible").notNull().default(false), occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  sourceSystem: text("source_system").notNull(), sourceEventId: text("source_event_id").notNull(), correlationId: text("correlation_id").notNull(), payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("activity_events_source_idx").on(t.sourceSystem, t.sourceEventId), index("activity_events_timeline_idx").on(t.occurredAt, t.id), index("activity_events_owner_idx").on(t.ownerId, t.occurredAt), check("activity_events_version_check", sql`${t.eventVersion} > 0`)]);

export const outboxMessages = pgTable("outbox_messages", {
  id: uuid("id").defaultRandom().primaryKey(), topic: text("topic").notNull(), idempotencyKey: text("idempotency_key").notNull(), aggregateType: text("aggregate_type").notNull(), aggregateId: uuid("aggregate_id").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(), availableAt: timestamp("available_at", { withTimezone: true }).defaultNow().notNull(), publishedAt: timestamp("published_at", { withTimezone: true }),
  attemptCount: integer("attempt_count").notNull().default(0), lastError: text("last_error"), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("outbox_messages_idempotency_idx").on(t.idempotencyKey), index("outbox_messages_pending_idx").on(t.publishedAt, t.availableAt), check("outbox_messages_attempt_count_check", sql`${t.attemptCount} >= 0`)]);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(), recipientId: uuid("recipient_id").notNull().references(() => profiles.id, { onDelete: "cascade" }), type: text("type").notNull(),
  title: text("title").notNull(), body: text("body"), href: text("href"), priority: text("priority").notNull().default("normal"), deduplicationKey: text("deduplication_key"),
  readAt: timestamp("read_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("notifications_dedupe_idx").on(t.recipientId, t.deduplicationKey), index("notifications_inbox_idx").on(t.recipientId, t.readAt, t.createdAt), check("notifications_priority_check", sql`${t.priority} in ('low', 'normal', 'high', 'urgent')`)]);

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(), code: text("code").notNull(), name: text("name").notNull(),
  buildingId: uuid("building_id").references(() => buildings.id, { onDelete: "set null" }), ownerTeamId: uuid("owner_team_id").references(() => teams.id, { onDelete: "set null" }),
  status: text("status").notNull().default("active"), ...timestamps,
}, (t) => [uniqueIndex("projects_code_idx").on(t.code), check("projects_status_check", sql`${t.status} in ('active', 'completed', 'cancelled')`)]);

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(), projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }), buildingId: uuid("building_id").references(() => buildings.id, { onDelete: "set null" }),
  ownerId: uuid("owner_id").notNull().references(() => profiles.id, { onDelete: "restrict" }), teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
  title: text("title").notNull(), description: text("description"), status: text("status").notNull().default("queued"), priority: text("priority").notNull().default("normal"),
  dueAt: timestamp("due_at", { withTimezone: true }), completedAt: timestamp("completed_at", { withTimezone: true }), version: integer("version").notNull().default(1), ...timestamps,
}, (t) => [index("tasks_my_work_idx").on(t.ownerId, t.status, t.dueAt), index("tasks_team_idx").on(t.teamId, t.status, t.dueAt), check("tasks_status_check", sql`${t.status} in ('queued', 'in_progress', 'blocked', 'completed', 'cancelled')`), check("tasks_priority_check", sql`${t.priority} in ('low', 'normal', 'high', 'urgent')`), check("tasks_version_check", sql`${t.version} > 0`)]);

export const taskTransitions = pgTable("task_transitions", {
  id: uuid("id").defaultRandom().primaryKey(), taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "restrict" }),
  fromStatus: text("from_status").notNull(), toStatus: text("to_status").notNull(), reason: text("reason"), actorId: uuid("actor_id").notNull().references(() => profiles.id, { onDelete: "restrict" }),
  idempotencyKey: text("idempotency_key").notNull(), occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("task_transitions_idempotency_idx").on(t.idempotencyKey), index("task_transitions_task_idx").on(t.taskId, t.occurredAt)]);

export const manualWorkEntries = pgTable("manual_work_entries", {
  id: uuid("id").defaultRandom().primaryKey(), ownerId: uuid("owner_id").notNull().references(() => profiles.id, { onDelete: "restrict" }), teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
  buildingId: uuid("building_id").references(() => buildings.id, { onDelete: "set null" }), projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  title: text("title").notNull(), description: text("description").notNull(), reason: text("reason").notNull(), occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  idempotencyKey: text("idempotency_key").notNull(), status: text("status").notNull().default("recorded"), createdBy: uuid("created_by").notNull().references(() => profiles.id, { onDelete: "restrict" }),
  ...timestamps,
}, (t) => [uniqueIndex("manual_work_entries_idempotency_idx").on(t.idempotencyKey), index("manual_work_entries_owner_idx").on(t.ownerId, t.occurredAt), check("manual_work_entries_status_check", sql`${t.status} in ('recorded', 'voided')`)]);

export const kpiMetrics = pgTable("kpi_metrics", {
  id: uuid("id").defaultRandom().primaryKey(), code: text("code").notNull(), name: text("name").notNull(), unit: text("unit").notNull(),
  direction: text("direction").notNull().default("higher_is_better"), isActive: boolean("is_active").notNull().default(true), ...timestamps,
}, (t) => [uniqueIndex("kpi_metrics_code_idx").on(t.code), check("kpi_metrics_direction_check", sql`${t.direction} in ('higher_is_better', 'lower_is_better')`)]);

export const kpiRuleVersions = pgTable("kpi_rule_versions", {
  id: uuid("id").defaultRandom().primaryKey(), metricId: uuid("metric_id").notNull().references(() => kpiMetrics.id, { onDelete: "restrict" }), version: integer("version").notNull(),
  eventType: text("event_type").notNull(), status: text("status").notNull().default("draft"), effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(), effectiveUntil: timestamp("effective_until", { withTimezone: true }),
  calculationVersion: integer("calculation_version").notNull().default(1), rule: jsonb("rule").$type<Record<string, unknown>>().notNull(), createdBy: uuid("created_by").notNull().references(() => profiles.id, { onDelete: "restrict" }), ...timestamps,
}, (t) => [uniqueIndex("kpi_rule_versions_metric_version_idx").on(t.metricId, t.version), index("kpi_rule_versions_event_idx").on(t.eventType, t.status, t.effectiveFrom), check("kpi_rule_versions_status_check", sql`${t.status} in ('draft', 'active', 'retired')`), check("kpi_rule_versions_positive_check", sql`${t.version} > 0 and ${t.calculationVersion} > 0`)]);

export const kpiTargets = pgTable("kpi_targets", {
  id: uuid("id").defaultRandom().primaryKey(), metricId: uuid("metric_id").notNull().references(() => kpiMetrics.id, { onDelete: "restrict" }),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }), teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(), periodEnd: timestamp("period_end", { withTimezone: true }).notNull(), targetValue: numeric("target_value", { precision: 24, scale: 6 }).notNull(),
  createdBy: uuid("created_by").notNull().references(() => profiles.id, { onDelete: "restrict" }), ...timestamps,
}, (t) => [index("kpi_targets_period_idx").on(t.periodStart, t.periodEnd), check("kpi_targets_owner_check", sql`num_nonnulls(${t.userId}, ${t.teamId}) = 1`), check("kpi_targets_period_check", sql`${t.periodEnd} > ${t.periodStart}`)]);

export const kpiFacts = pgTable("kpi_facts", {
  id: uuid("id").defaultRandom().primaryKey(), activityEventId: uuid("activity_event_id").notNull().references(() => activityEvents.id, { onDelete: "restrict" }),
  ruleVersionId: uuid("rule_version_id").notNull().references(() => kpiRuleVersions.id, { onDelete: "restrict" }), metricId: uuid("metric_id").notNull().references(() => kpiMetrics.id, { onDelete: "restrict" }),
  ownerId: uuid("owner_id").notNull().references(() => profiles.id, { onDelete: "restrict" }), teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
  value: numeric("value", { precision: 24, scale: 6 }).notNull(), calculationVersion: integer("calculation_version").notNull(), trace: jsonb("trace").$type<Record<string, unknown>>().notNull(),
  status: text("status").notNull().default("applied"), occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("kpi_facts_replay_idx").on(t.activityEventId, t.ruleVersionId, t.calculationVersion), index("kpi_facts_owner_period_idx").on(t.ownerId, t.occurredAt), check("kpi_facts_status_check", sql`${t.status} in ('applied', 'reversed')`)]);

export const kpiAdjustments = pgTable("kpi_adjustments", {
  id: uuid("id").defaultRandom().primaryKey(), factId: uuid("fact_id").notNull().references(() => kpiFacts.id, { onDelete: "restrict" }),
  requestedBy: uuid("requested_by").notNull().references(() => profiles.id, { onDelete: "restrict" }), approvedBy: uuid("approved_by").references(() => profiles.id, { onDelete: "restrict" }),
  reason: text("reason").notNull(), oldValue: numeric("old_value", { precision: 24, scale: 6 }).notNull(), newValue: numeric("new_value", { precision: 24, scale: 6 }).notNull(),
  status: text("status").notNull().default("pending"), decidedAt: timestamp("decided_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("kpi_adjustments_status_idx").on(t.status, t.createdAt), check("kpi_adjustments_status_check", sql`${t.status} in ('pending', 'approved', 'rejected')`), check("kpi_adjustments_separation_check", sql`${t.approvedBy} is null or ${t.approvedBy} <> ${t.requestedBy}`)]);

export const kpiCalculationRuns = pgTable("kpi_calculation_runs", {
  id: uuid("id").defaultRandom().primaryKey(), calculationVersion: integer("calculation_version").notNull(), startedAt: timestamp("started_at", { withTimezone: true }).notNull(), finishedAt: timestamp("finished_at", { withTimezone: true }),
  eventCount: integer("event_count").notNull().default(0), factCount: integer("fact_count").notNull().default(0), errorCount: integer("error_count").notNull().default(0), traceId: text("trace_id").notNull(), status: text("status").notNull().default("running"), errors: jsonb("errors").$type<Record<string, unknown>[]>().notNull().default([]),
}, (t) => [uniqueIndex("kpi_calculation_runs_trace_idx").on(t.traceId), check("kpi_calculation_runs_status_check", sql`${t.status} in ('running', 'completed', 'failed')`)]);

export const kpiScoreSnapshots = pgTable("kpi_score_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(), ownerId: uuid("owner_id").notNull().references(() => profiles.id, { onDelete: "restrict" }), teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
  metricId: uuid("metric_id").notNull().references(() => kpiMetrics.id, { onDelete: "restrict" }), periodStart: timestamp("period_start", { withTimezone: true }).notNull(), periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  score: numeric("score", { precision: 24, scale: 6 }).notNull(), factCount: integer("fact_count").notNull(), calculationVersion: integer("calculation_version").notNull(), calculatedAt: timestamp("calculated_at", { withTimezone: true }).notNull(),
}, (t) => [uniqueIndex("kpi_score_snapshots_version_idx").on(t.ownerId, t.metricId, t.periodStart, t.periodEnd, t.calculationVersion)]);

export const guaranteeCases = pgTable("guarantee_cases", {
  id: uuid("id").defaultRandom().primaryKey(), caseNumber: text("case_number").notNull(), buildingId: uuid("building_id").notNull().references(() => buildings.id, { onDelete: "restrict" }),
  ownerId: uuid("owner_id").notNull().references(() => profiles.id, { onDelete: "restrict" }), teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
  status: text("status").notNull().default("draft"), expectedDeposit: numeric("expected_deposit", { precision: 18, scale: 2 }).notNull().default("0"),
  version: integer("version").notNull().default(1), openedAt: timestamp("opened_at", { withTimezone: true }).defaultNow().notNull(), closedAt: timestamp("closed_at", { withTimezone: true }), ...timestamps,
}, (t) => [uniqueIndex("guarantee_cases_number_idx").on(t.caseNumber), index("guarantee_cases_queue_idx").on(t.teamId, t.status, t.updatedAt), check("guarantee_cases_status_check", sql`${t.status} in ('draft','evidence_pending','submitted','finance_review','transfer_pending','partially_refunded','refunded','cancelled')`), check("guarantee_cases_amount_check", sql`${t.expectedDeposit} >= 0`), check("guarantee_cases_version_check", sql`${t.version} > 0`)]);

export const guaranteeDeposits = pgTable("guarantee_deposits", {
  id: uuid("id").defaultRandom().primaryKey(), caseId: uuid("case_id").notNull().references(() => guaranteeCases.id, { onDelete: "restrict" }),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(), paidAt: timestamp("paid_at", { withTimezone: true }).notNull(), reference: text("reference").notNull(),
  recordedBy: uuid("recorded_by").notNull().references(() => profiles.id, { onDelete: "restrict" }), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("guarantee_deposits_reference_idx").on(t.reference), index("guarantee_deposits_case_idx").on(t.caseId), check("guarantee_deposits_amount_check", sql`${t.amount} > 0`)]);

export const guaranteeRefundRequests = pgTable("guarantee_refund_requests", {
  id: uuid("id").defaultRandom().primaryKey(), caseId: uuid("case_id").notNull().references(() => guaranteeCases.id, { onDelete: "restrict" }), amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), reason: text("reason").notNull(), requestedBy: uuid("requested_by").notNull().references(() => profiles.id, { onDelete: "restrict" }),
  approvedBy: uuid("approved_by").references(() => profiles.id, { onDelete: "restrict" }), decidedAt: timestamp("decided_at", { withTimezone: true }), idempotencyKey: text("idempotency_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("guarantee_refund_requests_idempotency_idx").on(t.idempotencyKey), index("guarantee_refund_requests_status_idx").on(t.status, t.createdAt), check("guarantee_refund_requests_amount_check", sql`${t.amount} > 0`), check("guarantee_refund_requests_status_check", sql`${t.status} in ('pending','approved','rejected','cancelled')`), check("guarantee_refund_requests_separation_check", sql`${t.approvedBy} is null or ${t.approvedBy} <> ${t.requestedBy}`)]);

export const guaranteeRefunds = pgTable("guarantee_refunds", {
  id: uuid("id").defaultRandom().primaryKey(), caseId: uuid("case_id").notNull().references(() => guaranteeCases.id, { onDelete: "restrict" }), refundRequestId: uuid("refund_request_id").notNull().references(() => guaranteeRefundRequests.id, { onDelete: "restrict" }),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(), receivedAt: timestamp("received_at", { withTimezone: true }).notNull(), reference: text("reference").notNull(),
  recordedBy: uuid("recorded_by").notNull().references(() => profiles.id, { onDelete: "restrict" }), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("guarantee_refunds_reference_idx").on(t.reference), index("guarantee_refunds_case_idx").on(t.caseId), check("guarantee_refunds_amount_check", sql`${t.amount} > 0`)]);

export const guaranteeTransitions = pgTable("guarantee_transitions", {
  id: uuid("id").defaultRandom().primaryKey(), caseId: uuid("case_id").notNull().references(() => guaranteeCases.id, { onDelete: "restrict" }), fromStatus: text("from_status").notNull(), toStatus: text("to_status").notNull(),
  reason: text("reason"), actorId: uuid("actor_id").notNull().references(() => profiles.id, { onDelete: "restrict" }), idempotencyKey: text("idempotency_key").notNull(), occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("guarantee_transitions_idempotency_idx").on(t.idempotencyKey), index("guarantee_transitions_case_idx").on(t.caseId, t.occurredAt)]);

/** Operational V2 workflow records. Source-specific fields are retained in data
 * while identity, scope, status and concurrency control remain relational. */
export const guaranteeWorkItems = pgTable("guarantee_work_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id").notNull().references(() => profiles.id, { onDelete: "restrict" }),
  teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
  tlAssigneeId: uuid("tl_assignee_id").references(() => profiles.id, { onDelete: "set null" }),
  status: text("status").notNull().default("new"),
  place: text("place").notNull(),
  area: text("area"),
  data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
  version: integer("version").notNull().default(1),
  ...timestamps,
}, (t) => [index("guarantee_work_items_queue_idx").on(t.teamId, t.status, t.updatedAt),
  index("guarantee_work_items_tl_idx").on(t.tlAssigneeId, t.status, t.updatedAt),
  index("guarantee_work_items_place_idx").on(t.place),
  check("guarantee_work_items_status_check", sql`${t.status} in ('new','fin','att','tl','On Process','ret','clo','done','Cancel')`),
  check("guarantee_work_items_version_check", sql`${t.version} > 0`)]);

export const guaranteeWorkEvents = pgTable("guarantee_work_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  itemId: uuid("item_id").notNull().references(() => guaranteeWorkItems.id, { onDelete: "restrict" }),
  actorId: uuid("actor_id").notNull().references(() => profiles.id, { onDelete: "restrict" }),
  action: text("action").notNull(),
  fromStatus: text("from_status"),
  toStatus: text("to_status"),
  reason: text("reason"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("guarantee_work_events_item_idx").on(t.itemId, t.occurredAt)]);

export const priceEstimates = pgTable("price_estimates", {
  id: uuid("id").defaultRandom().primaryKey(), estimateNumber: text("estimate_number").notNull(), buildingId: uuid("building_id").notNull().references(() => buildings.id, { onDelete: "restrict" }),
  ownerId: uuid("owner_id").notNull().references(() => profiles.id, { onDelete: "restrict" }), teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
  status: text("status").notNull().default("draft"), currentVersion: integer("current_version").notNull().default(1), ...timestamps,
}, (t) => [uniqueIndex("price_estimates_number_idx").on(t.estimateNumber), index("price_estimates_queue_idx").on(t.teamId, t.status, t.updatedAt), check("price_estimates_status_check", sql`${t.status} in ('draft','submitted','revision_requested','approved','cancelled')`), check("price_estimates_version_check", sql`${t.currentVersion} > 0`)]);

export const priceEstimateVersions = pgTable("price_estimate_versions", {
  id: uuid("id").defaultRandom().primaryKey(), estimateId: uuid("estimate_id").notNull().references(() => priceEstimates.id, { onDelete: "restrict" }), version: integer("version").notNull(),
  conditionVersionId: uuid("condition_version_id").notNull().references(() => buildingConditionVersions.id, { onDelete: "restrict" }), conditionSnapshot: jsonb("condition_snapshot").$type<Record<string, unknown>>().notNull(),
  subtotal: numeric("subtotal", { precision: 18, scale: 2 }).notNull(), tax: numeric("tax", { precision: 18, scale: 2 }).notNull(), total: numeric("total", { precision: 18, scale: 2 }).notNull(),
  status: text("status").notNull().default("draft"), notes: text("notes"), createdBy: uuid("created_by").notNull().references(() => profiles.id, { onDelete: "restrict" }), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("price_estimate_versions_idx").on(t.estimateId, t.version), check("price_estimate_versions_amount_check", sql`${t.subtotal} >= 0 and ${t.tax} >= 0 and ${t.total} = ${t.subtotal} + ${t.tax}`), check("price_estimate_versions_status_check", sql`${t.status} in ('draft','submitted','revision_requested','approved','superseded')`)]);

export const priceEstimateItems = pgTable("price_estimate_items", {
  id: uuid("id").defaultRandom().primaryKey(), estimateVersionId: uuid("estimate_version_id").notNull().references(() => priceEstimateVersions.id, { onDelete: "restrict" }),
  sequence: integer("sequence").notNull(), description: text("description").notNull(), quantity: numeric("quantity", { precision: 18, scale: 4 }).notNull(), unit: text("unit").notNull(),
  unitPrice: numeric("unit_price", { precision: 18, scale: 4 }).notNull(), amount: numeric("amount", { precision: 18, scale: 2 }).notNull(), metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
}, (t) => [uniqueIndex("price_estimate_items_sequence_idx").on(t.estimateVersionId, t.sequence), check("price_estimate_items_values_check", sql`${t.sequence} > 0 and ${t.quantity} > 0 and ${t.unitPrice} >= 0 and ${t.amount} >= 0`)]);

export const priceApprovals = pgTable("price_approvals", {
  id: uuid("id").defaultRandom().primaryKey(), estimateVersionId: uuid("estimate_version_id").notNull().references(() => priceEstimateVersions.id, { onDelete: "restrict" }),
  requestedBy: uuid("requested_by").notNull().references(() => profiles.id, { onDelete: "restrict" }), decidedBy: uuid("decided_by").notNull().references(() => profiles.id, { onDelete: "restrict" }),
  decision: text("decision").notNull(), reason: text("reason"), idempotencyKey: text("idempotency_key").notNull(), decidedAt: timestamp("decided_at", { withTimezone: true }).notNull(),
}, (t) => [uniqueIndex("price_approvals_idempotency_idx").on(t.idempotencyKey), index("price_approvals_version_idx").on(t.estimateVersionId, t.decidedAt), check("price_approvals_decision_check", sql`${t.decision} in ('approved','revision_requested')`), check("price_approvals_separation_check", sql`${t.decidedBy} <> ${t.requestedBy}`)]);

export const automationRules = pgTable("automation_rules", {
  id: uuid("id").defaultRandom().primaryKey(), name: text("name").notNull(), version: integer("version").notNull(), eventType: text("event_type").notNull(),
  status: text("status").notNull().default("draft"), conditions: jsonb("conditions").$type<Record<string, unknown>[]>().notNull().default([]), actions: jsonb("actions").$type<Record<string, unknown>[]>().notNull(),
  createdBy: uuid("created_by").notNull().references(() => profiles.id, { onDelete: "restrict" }), ...timestamps,
}, (t) => [uniqueIndex("automation_rules_name_version_idx").on(t.name, t.version), index("automation_rules_event_idx").on(t.eventType, t.status), check("automation_rules_status_check", sql`${t.status} in ('draft','active','paused','retired')`)]);

export const automationExecutions = pgTable("automation_executions", {
  id: uuid("id").defaultRandom().primaryKey(), ruleId: uuid("rule_id").notNull().references(() => automationRules.id, { onDelete: "restrict" }), activityEventId: uuid("activity_event_id").notNull().references(() => activityEvents.id, { onDelete: "restrict" }),
  status: text("status").notNull().default("pending"), idempotencyKey: text("idempotency_key").notNull(), attemptCount: integer("attempt_count").notNull().default(0), availableAt: timestamp("available_at", { withTimezone: true }).defaultNow().notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }), finishedAt: timestamp("finished_at", { withTimezone: true }), lastError: text("last_error"), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("automation_executions_idempotency_idx").on(t.idempotencyKey), index("automation_executions_pending_idx").on(t.status, t.availableAt), check("automation_executions_status_check", sql`${t.status} in ('pending','running','completed','failed','dead_letter')`), check("automation_executions_attempt_check", sql`${t.attemptCount} >= 0`)]);

export const automationActionResults = pgTable("automation_action_results", {
  id: uuid("id").defaultRandom().primaryKey(), executionId: uuid("execution_id").notNull().references(() => automationExecutions.id, { onDelete: "restrict" }), sequence: integer("sequence").notNull(), actionType: text("action_type").notNull(),
  status: text("status").notNull(), idempotencyKey: text("idempotency_key").notNull(), output: jsonb("output").$type<Record<string, unknown>>(), error: text("error"), startedAt: timestamp("started_at", { withTimezone: true }).notNull(), finishedAt: timestamp("finished_at", { withTimezone: true }),
}, (t) => [uniqueIndex("automation_action_results_idempotency_idx").on(t.idempotencyKey), uniqueIndex("automation_action_results_sequence_idx").on(t.executionId, t.sequence), check("automation_action_results_status_check", sql`${t.status} in ('running','completed','failed','skipped')`)]);

export const sourceImportRuns = pgTable("source_import_runs", {
  id: uuid("id").defaultRandom().primaryKey(), sourceSystem: text("source_system").notNull(), entityType: text("entity_type").notNull(), sourceSnapshot: text("source_snapshot").notNull(),
  status: text("status").notNull().default("pending"), sourceCount: integer("source_count").notNull().default(0), importedCount: integer("imported_count").notNull().default(0), anomalyCount: integer("anomaly_count").notNull().default(0),
  checksum: text("checksum").notNull(), startedAt: timestamp("started_at", { withTimezone: true }), finishedAt: timestamp("finished_at", { withTimezone: true }), approvedBy: uuid("approved_by").references(() => profiles.id, { onDelete: "restrict" }), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("source_import_runs_snapshot_idx").on(t.sourceSystem, t.entityType, t.sourceSnapshot), check("source_import_runs_status_check", sql`${t.status} in ('pending','running','reconciled','approved','failed','rolled_back')`), check("source_import_runs_counts_check", sql`${t.sourceCount} >= 0 and ${t.importedCount} >= 0 and ${t.anomalyCount} >= 0`)]);

export const sourceImportRows = pgTable("source_import_rows", {
  id: uuid("id").defaultRandom().primaryKey(), runId: uuid("run_id").notNull().references(() => sourceImportRuns.id, { onDelete: "restrict" }), sourceId: text("source_id").notNull(), sourceChecksum: text("source_checksum").notNull(),
  status: text("status").notNull(), targetEntityType: text("target_entity_type"), targetEntityId: uuid("target_entity_id"), rawPayload: jsonb("raw_payload").$type<Record<string, unknown>>().notNull(), anomalyCode: text("anomaly_code"), anomalyDetail: text("anomaly_detail"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("source_import_rows_source_idx").on(t.runId, t.sourceId), index("source_import_rows_status_idx").on(t.runId, t.status), check("source_import_rows_status_check", sql`${t.status} in ('pending','imported','skipped','anomaly','failed')`)]);
