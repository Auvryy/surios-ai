import { and, desc, eq, isNull, lt, or, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { z } from 'zod';
import { db, communityPosts, users } from './db';
import { notifications } from './db/community-social-schema';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Kind = typeof notifications.$inferInsert.kind;

export async function queueNotification(tx: Transaction, input: {
	recipients: string[]; actorId: string; kind: Kind; eventKey: string;
	postId: string; repostId?: string; commentId?: string; quoteCommentId?: string;
}) {
	const recipients = [...new Set(input.recipients)].filter((id) => id !== input.actorId);
	if (!recipients.length) return;
	await tx.insert(notifications).values(recipients.map((userId) => ({
		userId, actorId: input.actorId, kind: input.kind, eventKey: `${input.eventKey}:${userId}`,
		postId: input.postId, repostId: input.repostId, commentId: input.commentId, quoteCommentId: input.quoteCommentId
	}))).onConflictDoNothing();
}

/** A reply reaches its parent author once, and the post author if different. */
export async function notifyComment(tx: Transaction, input: {
	ownerId: string; parentUserId?: string; actorId: string; postId: string;
	repostId?: string; commentId?: string; quoteCommentId?: string;
}) {
	const eventKey = `comment:${input.commentId || input.quoteCommentId}`;
	if (input.ownerId !== input.parentUserId)
		await queueNotification(tx, { ...input, recipients: [input.ownerId], kind: 'COMMENT', eventKey });
	if (input.parentUserId)
		await queueNotification(tx, { ...input, recipients: [input.parentUserId], kind: 'REPLY', eventKey });
}

const cursorSchema = z.object({ at: z.iso.datetime(), id: z.uuid() }).strict();
function decodeCursor(value: string) {
	if (!/^[A-Za-z0-9_-]{1,300}$/.test(value)) error(400, 'Invalid notification cursor.');
	try { return cursorSchema.parse(JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))); }
	catch { error(400, 'Invalid notification cursor.'); }
}
const encodeCursor = (row: typeof notifications.$inferSelect) => Buffer.from(JSON.stringify({ at: row.createdAt.toISOString(), id: row.id })).toString('base64url');

export async function loadNotifications(userId: string, url: URL) {
	const limit = Number(url.searchParams.get('limit') || 20);
	if (!Number.isInteger(limit) || limit < 1 || limit > 50) error(400, 'Choose a notification limit between 1 and 50.');
	const filter = url.searchParams.get('filter') || 'all';
	if (!['all', 'unread'].includes(filter)) error(400, 'Choose all or unread notifications.');
	const cursor = url.searchParams.get('cursor');
	const position = cursor ? decodeCursor(cursor) : null;
	return db.transaction(async (tx) => {
		const [rows, [count]] = await Promise.all([
			tx.select({ notification: notifications, postTitle: communityPosts.title,
				actor: { id: users.id, name: users.name, avatarUrl: users.avatarUrl } })
				.from(notifications).innerJoin(communityPosts, eq(communityPosts.id, notifications.postId))
				.leftJoin(users, eq(users.id, notifications.actorId))
				.where(and(eq(notifications.userId, userId), filter === 'unread' ? isNull(notifications.readAt) : undefined,
					position ? or(lt(notifications.createdAt, new Date(position.at)), and(eq(notifications.createdAt, new Date(position.at)), lt(notifications.id, position.id))) : undefined))
				.orderBy(desc(notifications.createdAt), desc(notifications.id)).limit(limit + 1),
			tx.select({ total: sql<number>`count(*)::int` }).from(notifications).where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
		]);
		const hasMore = rows.length > limit;
		const page = rows.slice(0, limit);
		return {
			items: page.map(({ notification: n, actor, postTitle }) => ({
				id: n.id, kind: n.kind, postTitle, actor: actor?.id ? actor : null,
				postId: n.postId, repostId: n.repostId, commentId: n.commentId || n.quoteCommentId,
				createdAt: n.createdAt.toISOString(), readAt: n.readAt?.toISOString() || null
			})),
			unreadCount: count.total, hasMore, nextCursor: hasMore ? encodeCursor(page[page.length - 1].notification) : null
		};
	}, { isolationLevel: 'repeatable read', accessMode: 'read only' });
}

export const notificationReadSchema = z.discriminatedUnion('action', [
	z.object({ action: z.literal('read'), id: z.uuid() }).strict(),
	z.object({ action: z.literal('read-all') }).strict()
]);

export async function readNotifications(userId: string, input: z.infer<typeof notificationReadSchema>) {
	return db.transaction(async (tx) => {
		const now = new Date();
		let readAt = now;
		if (input.action === 'read') {
			const [owned] = await tx.select().from(notifications).where(and(eq(notifications.id, input.id), eq(notifications.userId, userId))).for('update');
			if (!owned) error(404, 'Notification not found.');
			readAt = owned.readAt || now;
			if (!owned.readAt) await tx.update(notifications).set({ readAt }).where(eq(notifications.id, owned.id));
		} else {
			await tx.update(notifications).set({ readAt }).where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
		}
		const [count] = await tx.select({ total: sql<number>`count(*)::int` }).from(notifications).where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
		return { success: true, unreadCount: count.total, readAt: readAt.toISOString() };
	});
}
