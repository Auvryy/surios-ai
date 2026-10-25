import { sql } from 'drizzle-orm';
import { type AnyPgColumn, check, index, jsonb, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { communityComments, communityPosts, users } from './schema';
import type { GovernmentUpdate, PostMedia } from '$lib/types/community';

// Social shares are deliberately separate from hazard evidence/observations.
export const communityReposts = pgTable('community_reposts', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	postId: uuid('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
	quotedRepostId: uuid('quoted_repost_id').references((): AnyPgColumn => communityReposts.id, { onDelete: 'set null' }),
	governmentUpdate: jsonb('government_update').$type<GovernmentUpdate>(),
	body: text('body').notNull().default(''),
	media: jsonb('media').$type<PostMedia[]>().notNull().default([]),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [
	index('community_reposts_created_idx').on(table.createdAt),
	index('community_reposts_post_idx').on(table.postId),
	index('community_reposts_user_idx').on(table.userId),
	check('community_reposts_one_photo', sql`jsonb_typeof(${table.media}) = 'array' and jsonb_array_length(${table.media}) <= 1 and (jsonb_array_length(${table.media}) = 0 or coalesce(${table.media}->0->>'kind', '') = 'photo')`)
]);

export const communityCommentLikes = pgTable('community_comment_likes', {
	commentId: uuid('comment_id').notNull().references(() => communityComments.id, { onDelete: 'cascade' }),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [primaryKey({ columns: [table.commentId, table.userId] })]);


export const quoteLikes = pgTable('community_quote_likes', {
	repostId: uuid('repost_id').notNull().references(() => communityReposts.id, { onDelete: 'cascade' }),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [primaryKey({ columns: [table.repostId, table.userId] })]);

export const quoteComments = pgTable('community_quote_comments', {
	id: uuid('id').defaultRandom().primaryKey(),
	repostId: uuid('repost_id').notNull().references(() => communityReposts.id, { onDelete: 'cascade' }),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	parentId: uuid('parent_id').references((): AnyPgColumn => quoteComments.id, { onDelete: 'cascade' }),
	body: text('body').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [index('community_quote_comments_repost_idx').on(table.repostId)]);

export const quoteCommentLikes = pgTable('community_quote_comment_likes', {
	commentId: uuid('comment_id').notNull().references(() => quoteComments.id, { onDelete: 'cascade' }),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [primaryKey({ columns: [table.commentId, table.userId] })]);

export const governmentMedia = pgTable('government_media', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	media: jsonb('media').$type<import('$lib/types/community').GovernmentAttachment>().notNull(),
	claimedBy: uuid('claimed_by').references(() => communityReposts.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [index('government_media_expiry_idx').on(table.expiresAt)]);

// Saved inbox events are independent of email delivery and hazard severity.
export const notifications = pgTable('notifications', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
	kind: text('kind').notNull().$type<'REPORT_PROGRESS' | 'REPORT_RESOLVED' | 'COMMENT' | 'REPLY'>(),
	eventKey: text('event_key').notNull().unique(),
	postId: uuid('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
	repostId: uuid('repost_id').references(() => communityReposts.id, { onDelete: 'cascade' }),
	commentId: uuid('comment_id').references(() => communityComments.id, { onDelete: 'cascade' }),
	quoteCommentId: uuid('quote_comment_id').references(() => quoteComments.id, { onDelete: 'cascade' }),
	readAt: timestamp('read_at', { withTimezone: true, precision: 3 }),
	createdAt: timestamp('created_at', { withTimezone: true, precision: 3 }).default(sql`clock_timestamp()`).notNull()
}, (table) => [
	index('notifications_user_created_idx').on(table.userId, table.createdAt, table.id),
	index('notifications_user_unread_idx').on(table.userId).where(sql`${table.readAt} is null`),
	check('notifications_kind_check', sql`${table.kind} in ('REPORT_PROGRESS', 'REPORT_RESOLVED', 'COMMENT', 'REPLY')`)
]);
