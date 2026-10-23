import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireCommunityUser } from '$lib/server/community';
import { isGovernment } from '$lib/types/community';
import { stageGovernmentMedia, discardGovernmentMedia } from '$lib/server/government-media';
import type { RequestHandler } from './$types';
export const POST: RequestHandler = async (event) => {
	const user = requireCommunityUser(event);
	if (!isGovernment(user.role)) error(403, 'Government access required.');
	return json(await stageGovernmentMedia(event.request, user.id), { status: 201 });
};
export const DELETE: RequestHandler = async (event) => {
	const user = requireCommunityUser(event);
	const id = event.url.searchParams.get('id');
	if (!isGovernment(user.role)) error(403, 'Government access required.');
	if (!z.uuid().safeParse(id).success) error(400, 'Invalid attachment.');
	await discardGovernmentMedia(id!, user.id);
	return json({ removed: true });
};
