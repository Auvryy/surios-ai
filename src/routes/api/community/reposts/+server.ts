import { error, json } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { requireCommunityUser } from '$lib/server/community';
import { saveRepost } from '$lib/server/community-social';
import { db } from '$lib/server/db';
import { communityReposts } from '$lib/server/db/community-social-schema';
import { removeMedia } from '$lib/server/community-media';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const user = requireCommunityUser(event);
	const repost = await saveRepost(event.request, user.id);
	return json({ id: repost.id, postId: repost.postId }, { status: 201 });
};

export const DELETE: RequestHandler = async (event) => {
	const user = requireCommunityUser(event);
	const id = event.url.searchParams.get('id');
	if (!z.uuid().safeParse(id).success) error(400, 'Invalid repost.');
	const [removed] = await db.delete(communityReposts).where(and(eq(communityReposts.id, id!), eq(communityReposts.userId, user.id), isNull(communityReposts.governmentUpdate))).returning();
	if (!removed) error(404, 'Repost not found. Official government updates are retained as a public record.');
	await removeMedia(removed.media);
	return json({ removed: true });
};
