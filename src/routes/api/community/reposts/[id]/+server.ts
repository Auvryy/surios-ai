import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { communityReposts } from '$lib/server/db/community-social-schema';
import { loadCommunityPost, requireCommunityUser } from '$lib/server/community';
import { interactWithQuote } from '$lib/server/quote-social';
import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!z.uuid().safeParse(params.id).success) error(404, 'Repost not found.');
	const [row] = await db.select({ id: communityReposts.id, postId: communityReposts.postId }).from(communityReposts).where(eq(communityReposts.id, params.id));
	if (!row) error(404, 'Repost not found.');
	const thread = await loadCommunityPost(row.postId, locals.user?.id);
	const repost = thread.reposts.find((repost) => repost.id === row.id);
	if (!repost) error(404, 'Repost not found.');
	return json({ repost });
};
export const POST: RequestHandler = async (event) => {
	const user = requireCommunityUser(event);
	return json(await interactWithQuote(event.params.id, user.id, await event.request.json().catch(() => null)));
};
