import { json } from '@sveltejs/kit';
import { requireCommunityUser } from '$lib/server/community';
import { interactWithQuote } from '$lib/server/quote-social';
import type { RequestHandler } from './$types';
export const POST: RequestHandler = async (event) => {
	const user = requireCommunityUser(event);
	return json(await interactWithQuote(event.params.id, user.id, await event.request.json().catch(() => null)));
};
