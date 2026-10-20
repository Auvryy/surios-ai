import { pgTable, text, integer, numeric, timestamp, jsonb, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	email: text('email').notNull().unique(),
	name: text('name').notNull(),
	passwordHash: text('password_hash').notNull(),
	role: text('role').notNull().default('CITIZEN'), // 'CITIZEN' | 'OFFICER' | 'ENGINEER' | 'ADMIN'
	department: text('department'),
	badgeNumber: text('badge_number'),
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
