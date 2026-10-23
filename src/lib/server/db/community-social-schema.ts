import { sql } from 'drizzle-orm';
import { check, index, jsonb, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { communityComments, communityPosts, users } from './schema';
import type { PostMedia } from '$lib/types/community';

// Social shares are deliberately separate from hazard evidence/observations.
export const communityReposts = pgTable('community_reposts', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	postId: uuid('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
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
