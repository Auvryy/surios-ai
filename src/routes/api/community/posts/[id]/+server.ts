import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, communityComments, communityPosts } from '$lib/server/db';
import { requireCommunityUser, updateConfirmation } from '$lib/server/community';
import type { RequestHandler } from './$types';
export const POST: RequestHandler = async (event) => {
	const user = requireCommunityUser(event);
	if (!z.uuid().safeParse(event.params.id).success) error(400, 'Invalid post.');
	const input = await event.request.json().catch(() => null);
	if (input?.action === 'confirm' && typeof input.confirmed === 'boolean') return json(await updateConfirmation(event.params.id, user.id, input.confirmed));
	const parsed = z.object({ action: z.literal('comment'), body: z.string().trim().min(1).max(1000) }).safeParse(input);
	if (!parsed.success) error(400, 'Write a comment between 1 and 1,000 characters.');
	const [post] = await db.select({ id: communityPosts.id }).from(communityPosts).where(eq(communityPosts.id, event.params.id));
	if (!post) error(404, 'Post not found.');
	const [comment] = await db.insert(communityComments).values({ postId: post.id, userId: user.id, body: parsed.data.body }).returning();
	return json({ comment: { id: comment.id, body: comment.body, createdAt: comment.createdAt.toISOString(), author: { id: user.id, name: user.name } } }, { status: 201 });
};
