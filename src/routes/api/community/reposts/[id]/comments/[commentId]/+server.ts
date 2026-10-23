import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireCommunityUser } from '$lib/server/community';
import { likeQuoteComment } from '$lib/server/quote-social';
import type { RequestHandler } from './$types';
export const POST: RequestHandler = async (event) => {
	const user = requireCommunityUser(event);
	const data = z.object({ liked: z.boolean() }).safeParse(await event.request.json().catch(() => null));
	if (!data.success || !z.uuid().safeParse(event.params.id).success || !z.uuid().safeParse(event.params.commentId).success) error(400, 'Choose a valid comment.');
	return json(await likeQuoteComment(event.params.id, event.params.commentId, user.id, data.data.liked));
};
