import type { RoadSegment } from '$lib/types/roads';
import type { MatchDecision } from '$lib/types/hazards';
import type { GovernmentProfile, PostMedia } from '$lib/types/community';
import type { TriageAnalysis } from '$lib/types/triage';
import type { MaterialEstimate } from '$lib/types/work-orders';
import { type AnyPgColumn, pgTable, text, integer, numeric, timestamp, jsonb, uuid, primaryKey, index } from 'drizzle-orm/pg-core';

export interface UserSettings {
	theme?: 'dark' | 'light' | 'system';
	emailComments: boolean;
	emailConfirmations: boolean;
}

export const defaultUserSettings: UserSettings = {
	theme: 'light',
	emailComments: false,
	emailConfirmations: false
};

export const users = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	email: text('email').notNull().unique(),
	name: text('name').notNull(),
	avatarUrl: text('avatar_url'),
	coverUrl: text('cover_url'),
	passwordHash: text('password_hash').notNull(),
	role: text('role').notNull().default('CITIZEN'), // 'CITIZEN' | 'OFFICER' | 'ENGINEER' | 'ADMIN'
	department: text('department'),
	governmentProfile: jsonb('government_profile').$type<GovernmentProfile>(),
	badgeNumber: text('badge_number'),
	settings: jsonb('settings').$type<UserSettings>().default(defaultUserSettings),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const sessions = pgTable('sessions', {
	id: text('id').primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const reports = pgTable('reports', {
	id: uuid('id').defaultRandom().primaryKey(),
	imagePath: text('image_path').notNull(),
	latitude: numeric('latitude', { precision: 10, scale: 8 }).notNull(),
	longitude: numeric('longitude', { precision: 11, scale: 8 }).notNull(),
	
	// ASTM D6433 Distress Classification
	distressType: text('distress_type').notNull(),
	
	// Hybrid Deterministic Hazard Severity (1–10)
	hazardSeverity: integer('hazard_severity').notNull(),
	riskLevel: text('risk_level').notNull(), // 'LOW' | 'MODERATE' | 'CRITICAL'
	
	// Vulnerable Road User (VRU) Profiling
	vruLethality: text('vru_lethality').notNull(), // 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
	vruDetails: text('vru_details'),
	
	// Civil Maintenance & Repair Recommendations
	recommendedAction: text('recommended_action').notNull(),
	materialsChecklist: jsonb('materials_checklist').$type<string[]>().default([]),
	
	// Lifecycle Status & Community Consensuses
	status: text('status').notNull().default('REPORTED'), // 'REPORTED' | 'DISPATCHED' | 'RESOLVED'
	communityConfirmations: integer('community_confirmations').notNull().default(1),
	
	// Gemini "Proof of Patch" Verification
	resolvedImagePath: text('resolved_image_path'),
	
	// Full Gemini Vision Structured Metadata
	triagePayload: jsonb('triage_payload'),
	
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;

// Government operations extend the shared report; status and repair image remain
// on reports so citizen map/report views use the same lifecycle record.
export const workOrders = pgTable('work_orders', {
	reportId: uuid('report_id').primaryKey().references(() => reports.id, { onDelete: 'cascade' }),
	assignedCrew: text('assigned_crew'),
	repairNotes: text('repair_notes'),
	estimate: jsonb('estimate').$type<MaterialEstimate>(),
	submittedAt: timestamp('submitted_at', { withTimezone: true }),
	reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const workOrderEvents = pgTable('work_order_events', {
	id: uuid('id').defaultRandom().primaryKey(),
	reportId: uuid('report_id').notNull().references(() => reports.id, { onDelete: 'cascade' }),
	actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
	event: text('event').notNull(),
	description: text('description').notNull(),
	imagePath: text('image_path'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [index('work_order_events_report_idx').on(table.reportId, table.createdAt)]);


export const communityDrafts = pgTable('community_drafts', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	media: jsonb('media').$type<PostMedia[]>().notNull(),
	analysis: jsonb('analysis').$type<TriageAnalysis>().notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [index('community_drafts_user_idx').on(table.userId)]);

export const communityPosts = pgTable('community_posts', {
	roadSegment: jsonb('road_segment').$type<RoadSegment>(),
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id),
	draftId: uuid('draft_id').notNull().unique(),
	reportId: uuid('report_id').notNull().references(() => reports.id),
	title: text('title').notNull(),
	body: text('body').notNull(),
	locationName: text('location_name').notNull(),
	latitude: numeric('latitude', { precision: 10, scale: 8 }).notNull(),
	longitude: numeric('longitude', { precision: 11, scale: 8 }).notNull(),
	media: jsonb('media').$type<PostMedia[]>().notNull(),
	coverId: text('cover_id').notNull(),
	analysis: jsonb('analysis').$type<TriageAnalysis>().notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [index('community_posts_created_idx').on(table.createdAt), index('community_posts_user_idx').on(table.userId)]);

export const communityConfirmations = pgTable('community_confirmations', {
	postId: uuid('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [primaryKey({ columns: [table.postId, table.userId] })]);

export const communityComments = pgTable('community_comments', {
	id: uuid('id').defaultRandom().primaryKey(),
	parentId: uuid('parent_id').references((): AnyPgColumn => communityComments.id, { onDelete: 'cascade' }),
	postId: uuid('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
	userId: uuid('user_id').notNull().references(() => users.id),
	body: text('body').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [index('community_comments_post_idx').on(table.postId)]);


export const reportObservations = pgTable('report_observations', {
	id: uuid('id').defaultRandom().primaryKey(),
	reportId: uuid('report_id').notNull().references(() => reports.id, { onDelete: 'cascade' }),
	sourceId: uuid('source_id').notNull().unique(),
	userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
	observerKey: text('observer_key').notNull(),
	analysis: jsonb('analysis').$type<TriageAnalysis>().notNull(),
	media: jsonb('media').$type<PostMedia[]>().notNull(),
	fingerprints: jsonb('fingerprints').$type<string[]>().notNull(),
	match: jsonb('match').$type<MatchDecision>().notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [index('report_observations_report_idx').on(table.reportId)]);

export const passwordResets = pgTable('password_resets', {
	tokenHash: text('token_hash').primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	usedAt: timestamp('used_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [index('password_resets_user_idx').on(table.userId)]);

export const emailOutbox = pgTable('email_outbox', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	topic: text('topic').notNull(),
	eventKey: text('event_key').notNull().unique(),
	subject: text('subject').notNull(),
	body: text('body').notNull(),
	status: text('status').notNull().default('pending'),
	attempts: integer('attempts').notNull().default(0),
	nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }).defaultNow().notNull(),
	sentAt: timestamp('sent_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [index('email_outbox_due_idx').on(table.status, table.nextAttemptAt)]);
