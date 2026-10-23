import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireCommunityUser } from '$lib/server/community';
import { setCommentLike } from '$lib/server/community-social';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const user = requireCommunityUser(event);
	const parsed = z.object({ liked: z.boolean() }).safeParse(await event.request.json().catch(() => null));
	if (!z.uuid().safeParse(event.params.id).success || !parsed.success) error(400, 'Choose a comment and whether to like it.');
	return json(await setCommentLike(event.params.id, user.id, parsed.data.liked));
};
